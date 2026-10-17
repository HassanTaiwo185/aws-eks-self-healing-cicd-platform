terraform {
  required_version =  "=1.12.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }

    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.0"
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

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
  
}

data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}

provider "helm" {
  kubernetes =  {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}