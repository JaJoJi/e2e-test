output "instance_id" {
  description = "ID of the taskflow EC2 instance."
  value       = aws_instance.taskflow.id
}

output "instance_public_ip" {
  description = "Public IP address of the taskflow EC2 instance."
  value       = aws_instance.taskflow.public_ip
}

output "security_group_id" {
  description = "ID of the taskflow security group."
  value       = aws_security_group.taskflow.id
}
