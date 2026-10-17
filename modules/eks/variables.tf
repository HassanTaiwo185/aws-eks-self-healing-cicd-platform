variable "project_name" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "kubernetes_version" {
  type    = string
  default = "1.35"
}

variable "private_subnet_ids" {
  description = "Worker nodes and control-plane network interfaces go here"
  type        = list(string)
}

variable "public_access_cidrs" {
  description = "Who can reach the Kubernetes API endpoint from the internet"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_capacity_type" {
  description = "ON_DEMAND, or SPOT (about 70% cheaper, but nodes can be reclaimed)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 3
}

variable "cluster_addons" {
  type    = list(string)
  default = ["vpc-cni", "kube-proxy", "coredns", "eks-pod-identity-agent"]
}

variable "admin_principal_arns" {
  description = "Extra IAM users or roles to make cluster admins (do not include the Terraform user)"
  type        = list(string)
  default     = []
}