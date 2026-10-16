terraform {
  required_version =  "=1.12.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  cloud {
    
    organization = "HASSAN_HCP"

    workspaces {
      name = "aws-eks-self-healing-cicd-platform"
    }
  }
}

provider "aws" {

  region = "us-east-1"
  
}