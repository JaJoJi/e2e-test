variable "aws_region" {
  description = "Kept for compatibility; unused by the Docker compute target."
  type        = string
  default     = "ap-southeast-1"
}

variable "app_port" {
  description = "TCP port the taskflow-api application listens on."
  type        = number
  default     = 8080
}

variable "host_port" {
  description = "Host-side published port mapped to the application port (host 8080 is taken by Jenkins on the lab daemon)."
  type        = number
  default     = 18080
}

variable "host_image" {
  description = "Base Linux image for the provisioned compute container (pinned tag, never latest)."
  type        = string
  default     = "ubuntu:22.04"
}

variable "ssh_public_key" {
  description = "Public SSH key material installed for the Ansible user. No default: supply at runtime (e.g. from Jenkins credentials). The private half is never committed."
  type        = string
}
