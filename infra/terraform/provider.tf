# AWS provider wired to LocalStack (not real AWS).
#
# The endpoint hostname "localstack" resolves on the Jenkins Docker network.
# Override with -var="localstack_endpoint=..." when running elsewhere.
# access/secret "test" are LocalStack dummy credentials, not real secrets.
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    ec2 = var.localstack_endpoint
    s3  = var.localstack_endpoint
    iam = var.localstack_endpoint
    sts = var.localstack_endpoint
  }
}
