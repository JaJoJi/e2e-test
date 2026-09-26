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
  description = "Public SSH key material for the taskflow key pair (public keys are not secret). Default is the lab test key; it must match the private key in the Jenkins credential taskflow-ssh-key-file. Override at runtime if the credential is rotated."
  type        = string
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHTy/KI5T0M7260eh4MzF7G2XVBB7H5aJX4BQKdz3/4B lab08-temp-test"
}
