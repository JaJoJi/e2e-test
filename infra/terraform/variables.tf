variable "aws_region" {
  description = "AWS region name used for LocalStack calls."
  type        = string
  default     = "us-east-1"
}

variable "localstack_endpoint" {
  description = "LocalStack endpoint URL reachable from the Terraform runner."
  type        = string
  default     = "http://localstack:4566"
}

variable "app_port" {
  description = "TCP port the taskflow-api application listens on."
  type        = number
  default     = 8080
}

variable "app_allowed_cidr" {
  description = "Restricted lab CIDR allowed to reach the application port. Never 0.0.0.0/0."
  type        = string
  default     = "10.0.0.0/8"
}

variable "ami_id" {
  description = "Mock AMI id accepted by LocalStack EC2 (no real image is launched in this lab)."
  type        = string
  default     = "ami-12345678"
}

variable "instance_type" {
  description = "EC2 instance type for the taskflow host."
  type        = string
  default     = "t3.micro"
}
