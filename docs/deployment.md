# Deployment Guide

This document outlines how to deploy the CCP applications and infrastructure.

## Staging Deployment

Use the following command to build and deploy the client application to the staging environment:

```bash
pnpm nx deploy:staging ccp-client
```

This command runs the project build and uploads the static files to the `ccp-client-staging-<AWS_ACCOUNT_ID>` S3 bucket. The bucket will be created if it does not already exist.

## Production Deployment

To deploy to the production environment, run:

```bash
pnpm nx deploy:prod ccp-client
```

This performs a production build and syncs the files to the `ccp-client-production-<AWS_ACCOUNT_ID>` bucket. A CloudFront invalidation is triggered automatically when a distribution is detected.

## Infrastructure

Infrastructure resources for the configuration API are managed using AWS CDK inside the `infrastructure/aws-cdk` package. Deployment scripts are provided there for each environment:

```bash
pnpm run deploy:dev     # development
pnpm run deploy:staging # staging
pnpm run deploy:prod    # production
```

### Asset Storage

An S3 bucket named `ccp-assets-<AWS_ACCOUNT_ID>` is automatically provisioned
for storing uploaded branding assets such as company logos. The new
`ccp-assets-api` Lambda function handles uploads via the `/assets/upload`
endpoint. The bucket is created with versioning and server-side encryption
enabled.

To upload a logo, send a `multipart/form-data` request with a `file` field to
`POST /assets/upload`. The response includes the S3 URL of the stored object.
