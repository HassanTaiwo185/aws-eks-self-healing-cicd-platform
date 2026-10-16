# ---------------- PostgreSQL (RDS) ----------------
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.database_subnet_ids
  tags       = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-postgres"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  # Storage: 20 GB gp2, the free-tier size
  allocated_storage     = 20
  max_allocated_storage = 0 # disable storage autoscaling so it can't grow
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  # RDS generates the password and stores it in Secrets Manager,
  # so it never appears in Terraform code or state
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.database_sg_id]
  publicly_accessible    = false
  multi_az               = false # Multi-AZ is not free

  backup_retention_period      = 1
  performance_insights_enabled = false
  auto_minor_version_upgrade   = true


  deletion_protection = false
  skip_final_snapshot = true

  tags = { Name = "${var.project_name}-postgres" }
}

# ---------------- Redis (ElastiCache) ----------------
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = var.database_subnet_ids
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project_name}-redis"
  description          = "Redis cache for ${var.project_name}"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  parameter_group_name = "default.redis7"
  port                 = 6379

  # One node only: no replicas
  num_cache_clusters         = 1
  automatic_failover_enabled = false
  multi_az_enabled           = false

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.redis_sg_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  snapshot_retention_limit = 0
  apply_immediately        = true

  tags = { Name = "${var.project_name}-redis" }
}