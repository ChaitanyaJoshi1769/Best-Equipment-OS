variable "project_name" { type = string }
variable "environment" { type = string }
variable "secrets" { type = map(string); sensitive = true }
variable "tags" { type = map(string); default = {} }
