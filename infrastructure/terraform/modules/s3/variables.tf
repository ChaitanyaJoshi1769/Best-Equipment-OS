variable "project_name" { type = string }
variable "environment" { type = string }
variable "buckets" { 
  type = map(object({
    name                 = string
    versioning_enabled   = bool
    lifecycle_days       = number
    enable_public_access = bool
  }))
}
variable "tags" { type = map(string); default = {} }
