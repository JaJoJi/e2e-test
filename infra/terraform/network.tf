# Dedicated Docker network for Lab 08.
#
# Security-group equivalent: instead of AWS ingress rules, network
# isolation comes from this private bridge network plus explicit port
# exposure on the container. SSH (22) is exposed inside this network
# only (no host publish); the application port (8080) is published for
# operator access. No arbitrary ports are opened.
resource "docker_network" "taskflow_lab08" {
  name   = "taskflow-lab08"
  driver = "bridge"
}
