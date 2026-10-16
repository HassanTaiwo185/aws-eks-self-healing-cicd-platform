variable "project_name" {
  description = "Prefix for resource names"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name, used for the subnet discovery tags"
  type        = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability Zones to spread subnets across (at least 2 for EKS)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Large ranges, because the EKS VPC CNI gives every pod its own VPC IP"
  type        = list(string)
  default     = ["10.0.16.0/20", "10.0.32.0/20"]
}

variable "database_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "single_nat_gateway" {
  description = "true = one shared NAT (cheaper), false = one NAT per AZ (highly available)"
  type        = bool
  default     = true
}

variable "db_port" {
  description = "5432 for PostgreSQL, 3306 for MySQL"
  type        = number
  default     = 5432
}