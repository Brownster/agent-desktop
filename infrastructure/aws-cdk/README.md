# Configuration API Infrastructure

This directory contains AWS CDK infrastructure code for the Amazon Connect CCP Configuration API.

## Architecture

The Configuration API stack creates:

- **DynamoDB Table**: Stores customer and module configurations with global secondary index
- **Lambda Function**: Handles API requests for configuration CRUD operations
- **API Gateway**: Provides REST API endpoints with CORS support
- **IAM Roles**: Secure access policies for Lambda to DynamoDB
- **CloudWatch Logs**: Centralized logging for monitoring and debugging

## Prerequisites

- Node.js 18+ and pnpm
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

## Installation

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Bootstrap CDK (first time only)
pnpm run bootstrap
```

## Deployment

### Development Environment

```bash
# Deploy to development environment
pnpm run deploy:dev

# Or with explicit context
cdk deploy --context environment=development --context region=us-east-1
```

### Staging Environment

```bash
# Deploy to staging environment
pnpm run deploy:staging

# Or with explicit context
cdk deploy --context environment=staging --context region=us-east-1
```

### Production Environment

```bash
# Deploy to production environment (requires approval)
pnpm run deploy:prod

# Or with explicit context
cdk deploy --context environment=production --context region=us-east-1 --require-approval=always
```

## Environment Configuration

The stack supports multiple environments through CDK context:

- `environment`: Environment name (development, staging, production)
- `region`: AWS region (default: us-east-1)
- `account`: AWS account ID (optional, uses CDK_DEFAULT_ACCOUNT)
- `stage`: API Gateway stage name (default: matches environment)
- `logLevel`: Lambda function log level (default: info)

## API Endpoints

Once deployed, the following endpoints are available:

### Health Check
- `GET /health` - API health status

### Customer Configuration
- `GET /configs` - List all customer configurations
- `GET /configs/{customerId}` - Get customer configuration
- `PUT /configs/{customerId}` - Save customer configuration
- `DELETE /configs/{customerId}` - Delete customer configuration

### Module Configuration
- `GET /configs/{customerId}/modules/{moduleId}` - Get module configuration
- `PUT /configs/{customerId}/modules/{moduleId}` - Save module configuration
- `DELETE /configs/{customerId}/modules/{moduleId}` - Delete module configuration

## Security

- API Gateway includes CORS configuration
- Lambda function has minimal IAM permissions
- DynamoDB table uses AWS managed encryption
- API key authentication with usage plans and quotas
- Request/response logging for audit trails

## Monitoring

- CloudWatch logs for Lambda function execution
- API Gateway request/response logging
- X-Ray tracing enabled for performance monitoring
- CloudWatch metrics for API usage and performance

## Development Commands

```bash
# Synthesize CloudFormation template
pnpm run synth

# Compare deployed stack with current state
pnpm run diff

# Run linter
pnpm run lint

# Format code
pnpm run format

# Run tests
pnpm run test

# Watch for changes
pnpm run watch
```

## Outputs

After deployment, the stack provides these outputs:

- `ConfigTableName`: DynamoDB table name
- `ConfigApiUrl`: API Gateway base URL
- `ConfigApiFunctionName`: Lambda function name
- `ConfigApiKeyId`: API key ID for authentication
- `ConfigApiStage`: API Gateway deployment stage

## Cleanup

```bash
# Destroy the stack
pnpm run destroy

# Or with CDK CLI
cdk destroy
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure AWS CLI is configured with sufficient permissions
2. **Stack Already Exists**: Use `cdk diff` to see changes before deployment
3. **Lambda Deploy Fails**: Check that the Lambda code is built and available
4. **API Gateway 500 Errors**: Check CloudWatch logs for Lambda function errors

### Debugging

1. Check CloudWatch logs: `/aws/lambda/ccp-config-api`
2. View API Gateway logs in CloudWatch
3. Use X-Ray traces for performance analysis
4. Check DynamoDB metrics for throttling issues

## Cost Optimization

- DynamoDB uses on-demand billing mode
- Lambda function has reasonable memory allocation (256MB)
- CloudWatch logs have 1-month retention policy
- API Gateway has usage plans to control costs

## Security Best Practices

- Use environment-specific API keys
- Enable request/response logging for audit
- Monitor API usage patterns
- Regularly rotate API keys
- Use least privilege IAM policies