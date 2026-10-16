variable "project_name" {
  type = string
}

variable "database_subnet_ids" {
  description = "Isolated database subnets from the networking module"
  type        = list(string)
}

variable "database_sg_id" {
  type = string
}

variable "redis_sg_id" {
  type = string
}

variable "db_name" {
  type    = string
  default = "appdb"
}

variable "db_username" {
  type    = string
  default = "appadmin"
}

variable "db_instance_class" {
  description = "Free plan eligible: db.t3.micro or db.t4g.micro"
  type        = string
  default     = "db.t4g.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t3.micro"
}