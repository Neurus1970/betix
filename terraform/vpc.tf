# ── VPC ───────────────────────────────────────────────────────────────────────

resource "aws_vpc" "betix" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "betix-${var.environment}" }
}

# ── Subnets públicas (Load Balancers / Ingress) ────────────────────────────────

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.betix.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "betix-public-${count.index + 1}"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/betix-${var.environment}" = "shared"
  }
}

# ── Subnets privadas (nodos EKS) ───────────────────────────────────────────────

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.betix.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                        = "betix-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/betix-${var.environment}" = "shared"
  }
}

# ── Internet Gateway ───────────────────────────────────────────────────────────

resource "aws_internet_gateway" "betix" {
  vpc_id = aws_vpc.betix.id

  tags = { Name = "betix-igw-${var.environment}" }
}

# ── NAT Gateway (single AZ — optimización de costos para demo) ────────────────

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "betix-nat-eip-${var.environment}" }
}

resource "aws_nat_gateway" "betix" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = { Name = "betix-nat-${var.environment}" }

  depends_on = [aws_internet_gateway.betix]
}

# ── Route Tables ───────────────────────────────────────────────────────────────

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.betix.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.betix.id
  }

  tags = { Name = "betix-public-rt-${var.environment}" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.betix.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.betix.id
  }

  tags = { Name = "betix-private-rt-${var.environment}" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
