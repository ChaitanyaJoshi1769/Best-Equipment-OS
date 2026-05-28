variable "project_name" { type = string }
variable "environment" { type = string }
variable "kubernetes_version" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "control_plane_subnets" { type = list(string) }
variable "node_group_desired_size" { type = number }
variable "node_group_min_size" { type = number }
variable "node_group_max_size" { type = number }
variable "node_instance_types" { type = list(string) }
variable "tags" { type = map(string); default = {} }
