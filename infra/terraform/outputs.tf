# Outputs for the Ansible stage. The SSH target is the container NAME,
# which Docker DNS resolves on the lab network (no hard-coded IPs).
# Concept mapping from the old AWS design:
#   instance_public_ip -> ssh_target (container name / address)
output "container_id" {
  description = "ID of the taskflow compute container."
  value       = docker_container.taskflow.id
}

output "container_name" {
  description = "Name of the taskflow compute container."
  value       = docker_container.taskflow.name
}

output "ssh_target" {
  description = "SSH target for Ansible (container name, resolved via Docker DNS on the lab network)."
  value       = docker_container.taskflow.name
}

output "app_port" {
  description = "Application port exposed for taskflow-api."
  value       = var.app_port
}

output "network_name" {
  description = "Name of the dedicated lab Docker network."
  value       = docker_network.taskflow_lab08.name
}
