resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres-${var.environment}"

  # Database configuration
  engine               = "postgres"
  engine_version       = var.engine_version
  family               = "postgres${split(".", var.engine_version)[0]}"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  storage_type         = "gp3"
  iops                 = 3000
  storage_encrypted    = true
  kms_key_id          = aws_kms_key.rds.arn

  # Database and credentials
  db_name  = var.database_name
  username = var.database_user
  password = var.database_password

  # Backup configuration
  backup_retention_period = var.backup_retention_days
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = var.skip_final_snapshot

  # Network configuration
  publicly_accessible    = false
  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = var.db_subnet_group_name

  # High availability
  multi_az               = var.multi_az
  deletion_protection    = var.deletion_protection

  # Performance insights
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id = aws_kms_key.rds.arn

  # CloudWatch logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Parameter group
  parameter_group_name = aws_db_parameter_group.postgres.name

  tags = merge(var.tags, {
    Name = "${var.project_name}-postgres-${var.environment}"
  })

  depends_on = [aws_db_parameter_group.postgres]
}

# Parameter Group
resource "aws_db_parameter_group" "postgres" {
  family = "postgres${split(".", var.engine_version)[0]}"
  name   = "${var.project_name}-pg-params-${var.environment}"

  # Performance tuning
  parameter {
    name  = "max_connections"
    value = "500"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/16}"
  }

  parameter {
    name  = "work_mem"
    value = "4096"
  }

  # Logging
  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_duration"
    value = "true"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  # Security
  parameter {
    name  = "password_encryption"
    value = "scram-sha-256"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-pg-params-${var.environment}"
  })
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-rds-key-${var.environment}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-rds-${var.environment}"
  target_key_id = aws_kms_key.rds.key_id
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-rds-cpu-${var.environment}"
  alarm_description   = "RDS CPU utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project_name}-rds-storage-${var.environment}"
  alarm_description   = "RDS storage space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240"  # 10 GB

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

# Enhanced monitoring role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-rds-monitoring-${var.environment}"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
