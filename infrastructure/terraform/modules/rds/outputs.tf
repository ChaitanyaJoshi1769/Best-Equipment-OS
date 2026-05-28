output "endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "address" {
  value = aws_db_instance.postgres.address
}

output "port" {
  value = aws_db_instance.postgres.port
}

output "name" {
  value = aws_db_instance.postgres.db_name
}

output "username" {
  value     = aws_db_instance.postgres.username
  sensitive = true
}

output "resource_id" {
  value = aws_db_instance.postgres.resource_id
}

output "arn" {
  value = aws_db_instance.postgres.arn
}
