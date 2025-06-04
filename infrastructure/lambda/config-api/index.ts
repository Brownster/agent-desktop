/**
 * @fileoverview AWS Lambda function for Configuration API
 * @module config-api
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { CustomerConfig, ModuleConfig } from '@agent-desktop/types';

/**
 * Initialize DynamoDB client
 */
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.CONFIG_TABLE_NAME || 'ccp-config';

/**
 * API response helper
 */
function createResponse(statusCode: number, body: unknown, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Error response helper
 */
function createErrorResponse(statusCode: number, message: string, details?: unknown): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error: {
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get customer configuration
 */
async function getCustomerConfig(customerId: string): Promise<APIGatewayProxyResult> {
  try {
    console.log('Getting customer configuration', { customerId });

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CUSTOMER#${customerId}`,
        SK: 'CONFIG',
      },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return createErrorResponse(404, `Customer configuration not found: ${customerId}`);
    }

    // Remove DynamoDB-specific fields
    const { PK, SK, ...config } = result.Item;

    console.log('Customer configuration retrieved successfully', {
      customerId,
      moduleCount: config.modules?.length || 0,
    });

    return createResponse(200, config);
  } catch (error) {
    console.error('Failed to get customer configuration', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to get customer configuration', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Create or update customer configuration
 */
async function saveCustomerConfig(config: CustomerConfig): Promise<APIGatewayProxyResult> {
  try {
    console.log('Saving customer configuration', {
      customerId: config.customer_id,
      version: config.version,
    });

    // Validate required fields
    if (!config.customer_id) {
      return createErrorResponse(400, 'customer_id is required');
    }

    const item = {
      PK: `CUSTOMER#${config.customer_id}`,
      SK: 'CONFIG',
      ...config,
      updatedAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);

    console.log('Customer configuration saved successfully', {
      customerId: config.customer_id,
      version: config.version,
    });

    return createResponse(200, {
      message: 'Configuration saved successfully',
      customerId: config.customer_id,
      version: config.version,
    });
  } catch (error) {
    console.error('Failed to save customer configuration', {
      customerId: config.customer_id,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to save customer configuration', {
      customerId: config.customer_id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete customer configuration
 */
async function deleteCustomerConfig(customerId: string): Promise<APIGatewayProxyResult> {
  try {
    console.log('Deleting customer configuration', { customerId });

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CUSTOMER#${customerId}`,
        SK: 'CONFIG',
      },
    });

    await docClient.send(command);

    console.log('Customer configuration deleted successfully', { customerId });

    return createResponse(200, {
      message: 'Configuration deleted successfully',
      customerId,
    });
  } catch (error) {
    console.error('Failed to delete customer configuration', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to delete customer configuration', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * List all customer configurations
 */
async function listCustomerConfigs(): Promise<APIGatewayProxyResult> {
  try {
    console.log('Listing customer configurations');

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'CONFIG',
      },
    });

    const result = await docClient.send(command);

    const configs = (result.Items || []).map(item => {
      const { PK, SK, ...config } = item;
      return config;
    });

    console.log('Customer configurations listed successfully', {
      count: configs.length,
    });

    return createResponse(200, {
      configs,
      count: configs.length,
    });
  } catch (error) {
    console.error('Failed to list customer configurations', {
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to list customer configurations', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get module configuration
 */
async function getModuleConfig(customerId: string, moduleId: string): Promise<APIGatewayProxyResult> {
  try {
    console.log('Getting module configuration', { customerId, moduleId });

    // First get the customer configuration
    const customerResult = await getCustomerConfig(customerId);
    if (customerResult.statusCode !== 200) {
      return customerResult;
    }

    const customerConfig = JSON.parse(customerResult.body) as CustomerConfig;
    const moduleConfig = customerConfig.modules.find(m => m.module_id === moduleId);

    if (!moduleConfig) {
      return createErrorResponse(404, `Module configuration not found: ${moduleId}`);
    }

    console.log('Module configuration retrieved successfully', {
      customerId,
      moduleId,
    });

    return createResponse(200, moduleConfig);
  } catch (error) {
    console.error('Failed to get module configuration', {
      customerId,
      moduleId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to get module configuration', {
      customerId,
      moduleId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Save module configuration
 */
async function saveModuleConfig(customerId: string, config: ModuleConfig): Promise<APIGatewayProxyResult> {
  try {
    console.log('Saving module configuration', {
      customerId,
      moduleId: config.module_id,
    });

    // Get existing customer configuration
    const getResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CUSTOMER#${customerId}`,
        SK: 'CONFIG',
      },
    }));

    if (!getResult.Item) {
      return createErrorResponse(404, `Customer configuration not found: ${customerId}`);
    }

    const { PK, SK, ...customerConfig } = getResult.Item as CustomerConfig & { PK: string; SK: string };

    // Update or add module configuration
    const moduleIndex = customerConfig.modules.findIndex(m => m.module_id === config.module_id);
    if (moduleIndex >= 0) {
      customerConfig.modules[moduleIndex] = config;
    } else {
      customerConfig.modules.push(config);
    }

    // Save updated configuration
    const saveResult = await saveCustomerConfig(customerConfig);
    
    if (saveResult.statusCode === 200) {
      return createResponse(200, {
        message: 'Module configuration saved successfully',
        customerId,
        moduleId: config.module_id,
      });
    }

    return saveResult;
  } catch (error) {
    console.error('Failed to save module configuration', {
      customerId,
      moduleId: config.module_id,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to save module configuration', {
      customerId,
      moduleId: config.module_id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete module configuration
 */
async function deleteModuleConfig(customerId: string, moduleId: string): Promise<APIGatewayProxyResult> {
  try {
    console.log('Deleting module configuration', { customerId, moduleId });

    // Get existing customer configuration
    const getResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CUSTOMER#${customerId}`,
        SK: 'CONFIG',
      },
    }));

    if (!getResult.Item) {
      return createErrorResponse(404, `Customer configuration not found: ${customerId}`);
    }

    const { PK, SK, ...customerConfig } = getResult.Item as CustomerConfig & { PK: string; SK: string };

    // Remove module configuration
    customerConfig.modules = customerConfig.modules.filter(m => m.module_id !== moduleId);

    // Save updated configuration
    const saveResult = await saveCustomerConfig(customerConfig);
    
    if (saveResult.statusCode === 200) {
      return createResponse(200, {
        message: 'Module configuration deleted successfully',
        customerId,
        moduleId,
      });
    }

    return saveResult;
  } catch (error) {
    console.error('Failed to delete module configuration', {
      customerId,
      moduleId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, 'Failed to delete module configuration', {
      customerId,
      moduleId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Health check endpoint
 */
async function healthCheck(): Promise<APIGatewayProxyResult> {
  try {
    // Test DynamoDB connection
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1,
    });

    await docClient.send(command);

    return createResponse(200, {
      status: 'healthy',
      service: 'config-api',
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION || '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(503, 'Service unhealthy', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('Processing request', {
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    requestId: context.awsRequestId,
  });

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    const { httpMethod, pathParameters } = event;
    const customerId = pathParameters?.customerId;
    const moduleId = pathParameters?.moduleId;

    // Route handling
    switch (true) {
      // Health check
      case httpMethod === 'GET' && event.path === '/health':
        return await healthCheck();

      // Customer configuration endpoints
      case httpMethod === 'GET' && event.path === '/configs':
        return await listCustomerConfigs();

      case httpMethod === 'GET' && customerId && !moduleId:
        return await getCustomerConfig(customerId);

      case httpMethod === 'PUT' && customerId && !moduleId:
        const customerConfig = JSON.parse(event.body || '{}') as CustomerConfig;
        return await saveCustomerConfig(customerConfig);

      case httpMethod === 'DELETE' && customerId && !moduleId:
        return await deleteCustomerConfig(customerId);

      // Module configuration endpoints
      case httpMethod === 'GET' && customerId && moduleId:
        return await getModuleConfig(customerId, moduleId);

      case httpMethod === 'PUT' && customerId && moduleId:
        const moduleConfig = JSON.parse(event.body || '{}') as ModuleConfig;
        return await saveModuleConfig(customerId, moduleConfig);

      case httpMethod === 'DELETE' && customerId && moduleId:
        return await deleteModuleConfig(customerId, moduleId);

      default:
        return createErrorResponse(404, 'Endpoint not found', {
          method: httpMethod,
          path: event.path,
        });
    }
  } catch (error) {
    console.error('Unhandled error in Lambda handler', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, 'Internal server error', {
      requestId: context.awsRequestId,
    });
  }
}