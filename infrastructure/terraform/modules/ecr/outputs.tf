output "registry_id" { value = data.aws_caller_identity.current.account_id }
output "repository_urls" { value = { for k, v in aws_ecr_repository.repositories : k => v.repository_url } }

data "aws_caller_identity" "current" {}
