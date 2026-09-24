terraform {
  # Remote state lives in LocalStack S3. State is NEVER stored in git
  # (.gitignore covers *.tfstate) and local backend is NOT the design.
  #
  # The bucket must be bootstrapped BEFORE 'terraform init' because a
  # backend bucket cannot be managed by the same configuration, e.g.:
  #   awslocal s3 mb s3://taskflow-terraform-state \
  #     --endpoint-url http://localstack:4566
  backend "s3" {
    bucket = "taskflow-terraform-state"
    key    = "lab08/terraform.tfstate"
    region = "us-east-1"

    endpoints = {
      s3 = "http://localstack:4566"
    }
    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    skip_region_validation      = true
  }
}
