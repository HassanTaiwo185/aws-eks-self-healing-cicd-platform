locals {
  oidc_issuer   = replace(var.oidc_provider_url, "https://", "")
  lbc_namespace = "kube-system"
  lbc_sa_name   = "aws-load-balancer-controller"
}

# ---------------- AWS Load Balancer Controller: IAM (IRSA) ----------------
resource "aws_iam_policy" "lbc" {
  name   = "${var.project_name}-aws-lb-controller"
  policy = file("${path.module}/aws-lb-controller-iam-policy.json")
}

# Only the controller's service account in kube-system can assume this role
data "aws_iam_policy_document" "lbc_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:sub"
      values   = ["system:serviceaccount:${local.lbc_namespace}:${local.lbc_sa_name}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lbc" {
  name               = "${var.project_name}-aws-lb-controller"
  assume_role_policy = data.aws_iam_policy_document.lbc_assume.json
}

resource "aws_iam_role_policy_attachment" "lbc" {
  role       = aws_iam_role.lbc.name
  policy_arn = aws_iam_policy.lbc.arn
}

# ---------------- AWS Load Balancer Controller: Helm release ----------------
resource "helm_release" "lbc" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.lb_controller_chart_version
  namespace  = local.lbc_namespace

  values = [yamlencode({
    clusterName = var.cluster_name
    region      = var.region
    vpcId       = var.vpc_id 
    serviceAccount = {
      create = true
      name   = local.lbc_sa_name
      annotations = {
        "eks.amazonaws.com/role-arn" = aws_iam_role.lbc.arn
      }
    }
  })]

  depends_on = [aws_iam_role_policy_attachment.lbc]
}