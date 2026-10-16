locals {
  # Map each AZ to its CIDR, e.g. { "us-east-1a" = "10.0.1.0/24", "us-east-1b" = "10.0.2.0/24" }
  public_subnets   = zipmap(var.azs, var.public_subnet_cidrs)
  private_subnets  = zipmap(var.azs, var.private_subnet_cidrs)
  database_subnets = zipmap(var.azs, var.database_subnet_cidrs)

  # One NAT in the first AZ, or one per AZ
  nat_azs = var.single_nat_gateway ? toset([var.azs[0]]) : toset(var.azs)
}

# ---------------- VPC ----------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true # required for EKS nodes to join the cluster

  tags = { Name = "${var.project_name}-vpc" }
}

# ---------------- Internet Gateway ----------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

# ---------------- Subnets ----------------
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${var.project_name}-public-${each.key}"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = {
    Name                                        = "${var.project_name}-private-${each.key}"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "database" {
  for_each = local.database_subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = { Name = "${var.project_name}-database-${each.key}" }
}

# ---------------- NAT Gateway ----------------
resource "aws_eip" "nat" {
  for_each = local.nat_azs

  domain = "vpc"
  tags   = { Name = "${var.project_name}-nat-eip-${each.key}" }
}

resource "aws_nat_gateway" "main" {
  for_each = local.nat_azs

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags       = { Name = "${var.project_name}-nat-${each.key}" }
  depends_on = [aws_internet_gateway.main]
}

# ---------------- Route Tables ----------------
# Public: default route to the Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Private: default route to a NAT Gateway (outbound only)
resource "aws_route_table" "private" {
  for_each = local.private_subnets

  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    # Shared NAT lives in the first AZ; otherwise use the NAT in the same AZ
    nat_gateway_id = aws_nat_gateway.main[var.single_nat_gateway ? var.azs[0] : each.key].id
  }

  tags = { Name = "${var.project_name}-private-rt-${each.key}" }
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

# Database: local VPC traffic only, no internet route
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-database-rt" }
}

resource "aws_route_table_association" "database" {
  for_each = aws_subnet.database

  subnet_id      = each.value.id
  route_table_id = aws_route_table.database.id
}

# ---------------- Security Groups ----------------
resource "aws_security_group" "database" {
  name        = "${var.project_name}-database-sg"
  description = "Allow database traffic from EKS private subnets"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Database from EKS workloads"
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }

  tags = { Name = "${var.project_name}-database-sg" }
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Allow Redis traffic from EKS private subnets"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Redis from EKS workloads"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }

  tags = { Name = "${var.project_name}-redis-sg" }
}