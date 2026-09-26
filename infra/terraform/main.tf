# Lab 08 compute target: a Docker container acting as the provisioned
# host (replaces the AWS EC2 instance; LocalStack Community has no
# Docker-backed EC2/SSH path).
#
# SSH/sudo/package prerequisites are bootstrapped reproducibly via the
# container command below (everything is visible here - no hidden image
# layers): install openssh-server, sudo and python3, create the Ansible
# user with the Terraform-provided public key and passwordless sudo,
# then run sshd in the foreground. The runtime needs only `node`
# equivalents plus sshd; the application itself is deployed later by
# Ansible, not baked into this host image.
resource "docker_image" "taskflow_host" {
  name         = var.host_image
  keep_locally = true
}

resource "docker_container" "taskflow" {
  name     = "taskflow-lab08-host"
  image    = docker_image.taskflow_host.image_id
  hostname = "taskflow-lab08-host"

  # Privileged so the Docker daemon installed later by Ansible can run
  # inside this host (Docker-in-Docker), matching the playbook duty to
  # "enable/start Docker". The host Docker socket is NOT mounted here.
  privileged = true

  command = ["sh", "-c", <<-EOT
    set -eu
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server sudo python3
    useradd -m -s /bin/bash ubuntu
    mkdir -p /home/ubuntu/.ssh
    echo '${var.ssh_public_key}' > /home/ubuntu/.ssh/authorized_keys
    chmod 700 /home/ubuntu/.ssh
    chmod 600 /home/ubuntu/.ssh/authorized_keys
    chown -R ubuntu:ubuntu /home/ubuntu/.ssh
    echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/ubuntu
    chmod 440 /etc/sudoers.d/ubuntu
    mkdir -p /run/sshd
    exec /usr/sbin/sshd -D
  EOT
  ]

  networks_advanced {
    name = docker_network.taskflow_lab08.name
  }

  ports {
    internal = 22
    # No external publish: SSH stays inside the lab network only.
  }

  ports {
    internal = 8080
    # Host-side port is configurable because the daemon host may already
    # use 8080 itself (e.g. Jenkins); the application port stays 8080.
    external = var.host_port
  }

  restart = "unless-stopped"
}
