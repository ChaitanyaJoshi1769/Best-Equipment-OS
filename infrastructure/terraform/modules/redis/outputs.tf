output "endpoint" { value = aws_elasticache_cluster.redis.cache_nodes[0].address }
output "port" { value = aws_elasticache_cluster.redis.port }
output "engine_version" { value = aws_elasticache_cluster.redis.engine_version_actual }
