resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-redis-${var.environment}"
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  port                 = 6379
  security_group_ids   = var.vpc_security_group_ids
  subnet_group_name    = var.subnet_group_name
  
  automatic_failover_enabled = var.num_cache_nodes > 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result
  
  maintenance_window = var.maintenance_window
  notification_topic_arn = aws_sns_topic.redis_notifications.arn
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
    enabled          = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-${var.environment}"
  })
}

resource "aws_elasticache_parameter_group" "redis" {
  family      = "redis7"
  name        = "${var.project_name}-redis-params-${var.environment}"
  description = "Redis parameter group"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "0"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-params-${var.environment}"
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${var.project_name}-redis-slowlog-${var.environment}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-slowlog-${var.environment}"
  })
}

resource "aws_sns_topic" "redis_notifications" {
  name = "${var.project_name}-redis-notifications-${var.environment}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-notifications-${var.environment}"
  })
}
