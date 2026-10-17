variable "project_name" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_id" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_url" {
  type = string
}

variable "lb_controller_chart_version" {
  type    = string
  default = "1.14.0" # controller v2.14.1
}