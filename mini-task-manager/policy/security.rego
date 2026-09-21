package security

# Simple OPA/Rego Policy Gate for the mini-task-manager Jenkins pipeline.
#
# Decision rules (in order):
#   1. Allow when there are zero CRITICAL vulnerabilities.
#   2. Deny  when there is at least one CRITICAL vulnerability.
#
# Severity levels below `critical` (high, moderate, low, info) do NOT block
# the pipeline. They are surfaced by the SCA stage as warnings only.
#
# Input contract (provided by Jenkinsfile, from `npm audit --json`):
#   input.metadata.vulnerabilities.critical  : number
#   input.metadata.vulnerabilities.high      : number  (advisory only)
#   input.metadata.vulnerabilities.moderate  : number  (advisory only)
#   input.metadata.vulnerabilities.low       : number  (advisory only)
#   input.metadata.vulnerabilities.info      : number  (advisory only)

default allow := false

# Allow when there are no CRITICAL vulnerabilities.
allow if {
    input.metadata.vulnerabilities.critical == 0
}

# Deny with a human-readable reason when at least one CRITICAL is present.
deny contains msg if {
    c := input.metadata.vulnerabilities.critical
    c > 0
    msg := sprintf("DENY: %d CRITICAL vulnerability/vulnerabilities found", [c])
}
