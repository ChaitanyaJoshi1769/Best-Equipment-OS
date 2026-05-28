variable "project_name" { type = string }
variable "environment" { type = string }
variable "engine_version" { type = string; default = "7.0" }
variable "node_type" { type = string }
variable "num_cache_nodes" { type = number }
variable "vpc_security_group_ids" { type = list(string) }
variable "subnet_group_name" { type = string }
variable "maintenance_window" { type = string; default = "sun:03:00-sun:04:00" }
variable "tags" { type = map(string); default = {} }
