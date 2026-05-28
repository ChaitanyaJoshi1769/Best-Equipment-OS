variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "security_group_ids" { type = list(string) }
variable "enable_https" { type = bool; default = false }
variable "certificate_arn" { type = string; default = "" }
variable "tags" { type = map(string); default = {} }
