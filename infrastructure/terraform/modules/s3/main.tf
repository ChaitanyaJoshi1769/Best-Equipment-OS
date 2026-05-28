resource "aws_s3_bucket" "buckets" {
  for_each = var.buckets

  bucket = each.value.name

  tags = merge(var.tags, {
    Name = each.value.name
  })
}

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id
  versioning_configuration {
    status = each.value.versioning_enabled ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = each.value.enable_public_access ? false : true
  block_public_policy     = each.value.enable_public_access ? false : true
  ignore_public_acls      = each.value.enable_public_access ? false : true
  restrict_public_buckets = each.value.enable_public_access ? false : true
}

resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = each.value.lifecycle_days
    }
  }
}
