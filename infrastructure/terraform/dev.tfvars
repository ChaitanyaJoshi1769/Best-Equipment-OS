environment            = "dev"
aws_region             = "us-east-1"
vpc_cidr               = "10.0.0.0/16"
db_instance_class      = "db.t3.micro"
db_allocated_storage   = 20
redis_node_type        = "cache.t3.micro"
redis_num_nodes        = 1
kubernetes_version     = "1.27"
eks_desired_node_count = 1
eks_min_node_count     = 1
eks_max_node_count     = 2
backup_retention_days  = 7
alert_email            = "dev-alerts@bestequipment.com"

tags = {
  Environment = "dev"
  CostCenter  = "engineering"
}
