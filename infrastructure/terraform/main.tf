terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration - configure S3 for state management
  # backend "s3" {
  #   bucket         = "best-equipment-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"

  project_name      = var.project_name
  environment       = var.environment
  cidr_block        = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names

  tags = var.tags
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"

  project_name              = var.project_name
  environment               = var.environment
  database_name             = var.database_name
  database_user             = var.database_user
  database_password         = random_password.db_password.result
  instance_class            = var.db_instance_class
  allocated_storage          = var.db_allocated_storage
  vpc_security_group_ids    = [module.vpc.database_security_group_id]
  db_subnet_group_name      = module.vpc.db_subnet_group_name

  tags = var.tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"

  project_name              = var.project_name
  environment               = var.environment
  node_type                 = var.redis_node_type
  num_cache_nodes           = var.redis_num_nodes
  engine_version            = "7.0"
  vpc_security_group_ids    = [module.vpc.redis_security_group_id]
  subnet_group_name         = module.vpc.elasticache_subnet_group_name

  tags = var.tags
}

# EKS Kubernetes Cluster
module "eks" {
  source = "./modules/eks"

  project_name           = var.project_name
  environment            = var.environment
  kubernetes_version     = var.kubernetes_version
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.private_subnet_ids
  control_plane_subnets  = module.vpc.private_subnet_ids

  # Node group configuration
  node_group_desired_size = var.eks_desired_node_count
  node_group_min_size     = var.eks_min_node_count
  node_group_max_size     = var.eks_max_node_count
  node_instance_types     = var.eks_node_instance_types

  tags = var.tags

  depends_on = [module.vpc]
}

# ECR Registry
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment

  repositories = [
    "api",
    "web",
    "worker",
    "ml-service"
  ]

  image_tag_mutability = "IMMUTABLE"
  scan_on_push         = true

  tags = var.tags
}

# S3 for uploads and backups
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment

  buckets = {
    uploads = {
      name                  = "${var.project_name}-uploads-${var.environment}"
      versioning_enabled    = true
      lifecycle_days        = 90
      enable_public_access  = false
    }
    backups = {
      name                  = "${var.project_name}-backups-${var.environment}"
      versioning_enabled    = true
      lifecycle_days        = 180
      enable_public_access  = false
    }
  }

  tags = var.tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [module.vpc.alb_security_group_id]

  enable_https = true
  certificate_arn = ""  # Add your certificate ARN

  tags = var.tags

  depends_on = [module.vpc]
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name = var.project_name
  environment  = var.environment

  origin_domain_name = module.alb.alb_dns_name
  origin_id          = "web-origin"

  tags = var.tags

  depends_on = [module.alb]
}

# RDS Backup Vault
module "backup" {
  source = "./modules/backup"

  project_name     = var.project_name
  environment      = var.environment
  backup_retention = var.backup_retention_days

  tags = var.tags
}

# CloudWatch & Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  # SNS topics for alerts
  alert_email = var.alert_email

  tags = var.tags
}

# Secrets Manager
module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment

  secrets = {
    database_password = random_password.db_password.result
    jwt_secret        = random_password.jwt_secret.result
    api_key           = random_password.api_key.result
  }

  tags = var.tags
}

# Generate random passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "api_key" {
  length  = 32
  special = false
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS PostgreSQL endpoint"
}

output "redis_endpoint" {
  value       = module.redis.endpoint
  description = "Redis endpoint"
}

output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS cluster endpoint"
}

output "ecr_registry_id" {
  value       = module.ecr.registry_id
  description = "ECR registry ID"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "ALB DNS name"
}

output "cloudfront_domain_name" {
  value       = module.cloudfront.cloudfront_domain_name
  description = "CloudFront distribution domain name"
}
