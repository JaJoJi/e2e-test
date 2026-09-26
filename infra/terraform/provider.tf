# Docker provider for the lab compute target.
#
# The provider talks to the Docker daemon through /var/run/docker.sock,
# which the Jenkins pipeline mounts into the ephemeral Terraform tool
# container (tooling access only - the provisioned host itself never
# receives the host socket). No cloud credentials are involved.
provider "docker" {}
