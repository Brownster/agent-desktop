/**
 * @fileoverview AWS CDK stack for Configuration API infrastructure
 * @module infrastructure/aws-cdk
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Configuration API Stack
 * 
 * Creates:
 * - DynamoDB table for configuration storage
 * - Lambda function for Configuration API
 * - API Gateway REST API
 * - IAM roles and policies
 * - CloudWatch log groups
 */
export class ConfigApiStack extends cdk.Stack {
  public readonly configTable: dynamodb.Table;
  public readonly configApiFunction: lambda.Function;
  public readonly assetsBucket: s3.Bucket;
  public readonly assetsFunction: lambda.Function;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for configuration storage
    this.configTable = new dynamodb.Table(this, 'ConfigTable', {
      tableName: 'ccp-config',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      tags: {
        Environment: this.node.tryGetContext('environment') || 'development',
        Service: 'ccp-config-api',
        Purpose: 'configuration-storage',
      },
    });

    // Add Global Secondary Index for querying by SK
    this.configTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create CloudWatch log group for Lambda function
    const logGroup = new logs.LogGroup(this, 'ConfigApiLogGroup', {
      logGroupName: '/aws/lambda/ccp-config-api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Bucket for uploaded assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `ccp-assets-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create Lambda function for Configuration API
    this.configApiFunction = new lambda.Function(this, 'ConfigApiFunction', {
      functionName: 'ccp-config-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/config-api'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: this.node.tryGetContext('environment') || 'development',
        CONFIG_TABLE_NAME: this.configTable.tableName,
        AWS_REGION: this.region,
        SERVICE_VERSION: '1.0.0',
        LOG_LEVEL: this.node.tryGetContext('logLevel') || 'info',
      },
      logGroup,
      description: 'Configuration API for Amazon Connect CCP',
      tags: {
        Environment: this.node.tryGetContext('environment') || 'development',
        Service: 'ccp-config-api',
        Purpose: 'configuration-management',
      },
    });

    // Lambda for asset uploads
    const assetsFunction = new lambda.Function(this, 'AssetsApiFunction', {
      functionName: 'ccp-assets-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/assets-api'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        AWS_REGION: this.region,
        ASSETS_BUCKET_NAME: assetsBucket.bucketName,
      },
      description: 'Asset upload API',
    });

    assetsBucket.grantPut(assetsFunction);

    this.assetsBucket = assetsBucket;
    this.assetsFunction = assetsFunction;

    // Grant Lambda permissions to read/write from DynamoDB table
    this.configTable.grantReadWriteData(this.configApiFunction);

    // Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'ConfigApi', {
      restApiName: 'CCP Configuration API',
      description: 'REST API for managing Amazon Connect CCP configurations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: this.node.tryGetContext('stage') || 'dev',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:SourceAccount': this.account,
              },
            },
          }),
        ],
      }),
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.configApiFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
      proxy: true,
    });

    const assetsIntegration = new apigateway.LambdaIntegration(assetsFunction, {
      proxy: true,
    });

    // Health check endpoint
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '503',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Asset upload endpoint
    const assetsResource = this.api.root.addResource('assets');
    const uploadResource = assetsResource.addResource('upload');
    uploadResource.addMethod('POST', assetsIntegration, {
      methodResponses: [{ statusCode: '200' }],
    });

    // Customer configurations endpoints
    const configsResource = this.api.root.addResource('configs');
    
    // GET /configs - List all customer configurations
    configsResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Customer-specific configuration endpoints
    const customerResource = configsResource.addResource('{customerId}');
    
    // GET /configs/{customerId} - Get customer configuration
    customerResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // PUT /configs/{customerId} - Save customer configuration
    customerResource.addMethod('PUT', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // DELETE /configs/{customerId} - Delete customer configuration
    customerResource.addMethod('DELETE', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Module configuration endpoints
    const moduleResource = customerResource.addResource('modules').addResource('{moduleId}');
    
    // GET /configs/{customerId}/modules/{moduleId} - Get module configuration
    moduleResource.addMethod('GET', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
        'method.request.path.moduleId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // PUT /configs/{customerId}/modules/{moduleId} - Save module configuration
    moduleResource.addMethod('PUT', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
        'method.request.path.moduleId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // DELETE /configs/{customerId}/modules/{moduleId} - Delete module configuration
    moduleResource.addMethod('DELETE', lambdaIntegration, {
      requestParameters: {
        'method.request.path.customerId': true,
        'method.request.path.moduleId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '404',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Create API usage plan and key
    const usagePlan = this.api.addUsagePlan('ConfigApiUsagePlan', {
      name: 'CCP Configuration API Usage Plan',
      description: 'Usage plan for CCP Configuration API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    const apiKey = this.api.addApiKey('ConfigApiKey', {
      apiKeyName: 'ccp-config-api-key',
      description: 'API key for CCP Configuration API',
    });

    usagePlan.addApiKey(apiKey);

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ConfigTableName', {
      value: this.configTable.tableName,
      description: 'DynamoDB table name for configuration storage',
      exportName: `${this.stackName}-ConfigTableName`,
    });

    new cdk.CfnOutput(this, 'ConfigApiUrl', {
      value: this.api.url,
      description: 'Configuration API Gateway URL',
      exportName: `${this.stackName}-ConfigApiUrl`,
    });

    new cdk.CfnOutput(this, 'ConfigApiFunctionName', {
      value: this.configApiFunction.functionName,
      description: 'Configuration API Lambda function name',
      exportName: `${this.stackName}-ConfigApiFunctionName`,
    });

    new cdk.CfnOutput(this, 'ConfigApiKeyId', {
      value: apiKey.keyId,
      description: 'Configuration API key ID',
      exportName: `${this.stackName}-ConfigApiKeyId`,
    });

    new cdk.CfnOutput(this, 'ConfigApiStage', {
      value: this.api.deploymentStage.stageName,
      description: 'Configuration API deployment stage',
      exportName: `${this.stackName}-ConfigApiStage`,
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 bucket for uploaded assets',
      exportName: `${this.stackName}-AssetsBucketName`,
    });
  }
}