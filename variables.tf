variable "project_name" {
  description = "Prefix for all resource names. Must match the IAM policy prefix."
  type        = string
  default     = "cloudnative"

  validation {
    condition     = var.project_name == "cloudnative"
    error_message = "project_name must be \"cloudnative\" because the Terraform IAM policy only allows cloudnative-* resources."
  }
}