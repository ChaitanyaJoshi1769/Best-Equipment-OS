resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-vault-${var.environment}"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-vault-${var.environment}"
  })
}

resource "aws_kms_key" "backup" {
  description             = "KMS key for backup encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-backup-${var.environment}"
  target_key_id = aws_kms_key.backup.key_id
}
