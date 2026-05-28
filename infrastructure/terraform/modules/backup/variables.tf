variable "project_name" { type = string }
variable "environment" { type = string }
variable "backup_retention" { type = number; default = 30 }
variable "tags" { type = map(string); default = {} }
