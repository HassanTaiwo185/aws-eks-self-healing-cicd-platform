

locals {
  ecr_repos = toset(["backend", "frontend"])
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  for_each = local.ecr_repos

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECR Repository policy
resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the 30 most recent images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = { type = "expire" }
      }
    ]
  })
}


locals {
  cluster_name = "${var.project_name}-eks"
}

# Eks networking
module "networking" {
  source       = "./modules/networking"
  project_name = var.project_name
  cluster_name = local.cluster_name
}

# EKS statefulness data
module "data" {
  source              = "./modules/data"
  project_name        = var.project_name
  database_subnet_ids = module.networking.database_subnet_ids
  database_sg_id      = module.networking.database_sg_id
  redis_sg_id         = module.networking.redis_sg_id
}

# EKS configuration 
module "eks" {
  source              = "./modules/eks"
  project_name        = var.project_name
  cluster_name        = local.cluster_name
  private_subnet_ids  = module.networking.private_subnet_ids
  node_instance_types = ["m7i-flex.large"]
}