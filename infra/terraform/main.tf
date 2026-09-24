# One compute instance behind one security group. The application port
# (8080) is intentionally open only to a restricted lab CIDR, never to
# 0.0.0.0/0.
#
# NOTE: metadata_options requires IMDSv2 (http_tokens = "required") and the
# root volume is encrypted; both were triaged from tfsec/Checkov findings.
resource "aws_security_group" "taskflow" {
  name        = "taskflow-sg"
  description = "Allow taskflow-api application traffic on port 8080"

  ingress {
    description = "taskflow-api application port"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = [var.app_allowed_cidr]
  }

  egress {
    description = "Allow outbound traffic within the lab network only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.app_allowed_cidr]
  }

  tags = {
    Name = "taskflow-sg"
  }
}

resource "aws_instance" "taskflow" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.taskflow.id]
  monitoring             = true
  ebs_optimized          = true
  iam_instance_profile   = aws_iam_instance_profile.taskflow.name

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    encrypted = true
  }

  tags = {
    Name = "taskflow-api"
  }
}

resource "aws_iam_role" "taskflow" {
  name = "taskflow-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      },
    ]
  })

  tags = {
    Name = "taskflow-ec2-role"
  }
}

resource "aws_iam_instance_profile" "taskflow" {
  name = "taskflow-ec2-profile"
  role = aws_iam_role.taskflow.name

  tags = {
    Name = "taskflow-ec2-profile"
  }
}
