resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets

  name = "${var.project_name}/${var.environment}/${each.key}"
  
  recovery_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.project_name}-${each.key}-${var.environment}"
  })
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each = var.secrets

  secret_id      = aws_secretsmanager_secret.secrets[each.key].id
  secret_string  = each.value
}
