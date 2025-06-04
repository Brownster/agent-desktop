#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=$1
APP_NAME=$2
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query "Account" --output text)}

BUCKET="${APP_NAME}-${ENVIRONMENT}-${AWS_ACCOUNT_ID}"

# Create bucket if it doesn't exist
aws s3 mb "s3://$BUCKET" --region "$AWS_REGION" || true

# Sync built artifacts
aws s3 sync "apps/$APP_NAME/dist" "s3://$BUCKET" --delete

# Configure static website hosting
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html

# Optional CloudFront invalidation
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='${BUCKET}.s3.amazonaws.com'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
fi
