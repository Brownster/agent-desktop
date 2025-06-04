/**
 * @fileoverview Configuration storage with DynamoDB backend
 * @module @agent-desktop/config
 */

import type {
  CustomerConfig,
  ModuleConfig,
  Result,
} from '@agent-desktop/types';
import { success, failure } from '@agent-desktop/types';
import type { Logger } from '@agent-desktop/logging';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";

/**
 * Configuration storage interface
 */
export interface IConfigStore {
  getCustomerConfig(customerId: string): Promise<Result<CustomerConfig, Error>>;
  saveCustomerConfig(config: CustomerConfig): Promise<Result<void, Error>>;
  deleteCustomerConfig(customerId: string): Promise<Result<void, Error>>;
  listCustomerConfigs(): Promise<Result<CustomerConfig[], Error>>;
  getModuleConfig(customerId: string, moduleId: string): Promise<Result<ModuleConfig, Error>>;
  saveModuleConfig(customerId: string, config: ModuleConfig): Promise<Result<void, Error>>;
  deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>>;
}

/**
 * DynamoDB configuration store using AWS SDK v3.
 *
 * All operations are performed against DynamoDB with retries enabled via the
 * SDK's built in retry strategy. Errors caused by missing IAM permissions are
 * detected and surfaced with helpful messages.
 */
export class DynamoDBConfigStore implements IConfigStore {
  private readonly tableName: string;
  private readonly logger: Logger;
  private readonly ddbDocClient: DynamoDBDocumentClient;
  
  constructor(tableName: string, logger?: Logger) {
    this.tableName = tableName;
    // Initialize logger (existing code)
    if (logger) {
      this.logger = logger.createChild('DynamoDBConfigStore');
    } else {
      // Fallback logger (existing code)
      this.logger = {
        debug: (message: string, context?: Record<string, unknown>) =>
          console.debug(`[DynamoDBConfigStore] ${message}`, context || ''),
        info: (message: string, context?: Record<string, unknown>) =>
          console.info(`[DynamoDBConfigStore] ${message}`, context || ''),
        warn: (message: string, context?: Record<string, unknown>) =>
          console.warn(`[DynamoDBConfigStore] ${message}`, context || ''),
        error: (message: string, context?: Record<string, unknown>) =>
          console.error(`[DynamoDBConfigStore] ${message}`, context || ''),
        createChild: () => this.logger, // Simplistic child creation
      } as unknown as Logger;
    }

    const client = new DynamoDBClient({
      region: process.env['AWS_REGION'] || 'us-east-1',
      maxAttempts: 3,
    });
    this.ddbDocClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  private formatDynamoError(action: string, error: unknown): Error {
    if (error && typeof error === 'object') {
      const name = (error as { name?: string }).name;
      if (
        name === 'AccessDeniedException' ||
        name === 'UnrecognizedClientException' ||
        name === 'MissingAuthenticationToken' ||
        name === 'CredentialsError'
      ) {
        return new Error(
          `Access denied while attempting to ${action}. Verify IAM permissions.`
        );
      }
    }
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Get customer configuration from DynamoDB
   */
  async getCustomerConfig(customerId: string): Promise<Result<CustomerConfig, Error>> {
    this.logger.info('Getting customer configuration', { customerId });

    const params = {
      TableName: this.tableName,
      Key: { PK: `CUSTOMER#${customerId}`, SK: 'CONFIG' },
    };

    try {
      this.logger.debug('Attempting to get item from DynamoDB', params);
      const { Item } = await this.ddbDocClient.send(new GetCommand(params));

      if (!Item) {
        this.logger.warn('Customer configuration not found', { customerId });
        return failure(new Error('Customer configuration not found'));
      }

      this.logger.info('Customer configuration retrieved successfully', {
        customerId,
        // It's good practice to not log the entire config item if it contains sensitive data.
        // Consider logging specific, non-sensitive fields if needed for debugging.
        // For example: version: Item.version
      });
      return success(Item as CustomerConfig);
    } catch (error) {
      const err = this.formatDynamoError('get customer configuration', error);
      this.logger.error('Failed to get customer configuration from DynamoDB', {
        customerId,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * Save customer configuration to DynamoDB
   */
  async saveCustomerConfig(config: CustomerConfig): Promise<Result<void, Error>> {
    this.logger.info('Saving customer configuration', {
      customerId: config.customer_id,
      version: config.version,
    });

    const item = {
      PK: `CUSTOMER#${config.customer_id}`,
      SK: 'CONFIG',
      ...config,
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: this.tableName,
      Item: item,
    };

    try {
      this.logger.debug('Attempting to put item into DynamoDB', params);
      await this.ddbDocClient.send(new PutCommand(params));
      this.logger.info('Customer configuration saved successfully', {
        customerId: config.customer_id,
        version: config.version,
      });
      return success(undefined);
    } catch (error) {
      const err = this.formatDynamoError('save customer configuration', error);
      this.logger.error('Failed to save customer configuration to DynamoDB', {
        customerId: config.customer_id,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * Delete customer configuration from DynamoDB
   */
  async deleteCustomerConfig(customerId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting customer configuration', { customerId });

    const params = {
      TableName: this.tableName,
      Key: { PK: `CUSTOMER#${customerId}`, SK: 'CONFIG' },
    };

    try {
      this.logger.debug('Attempting to delete item from DynamoDB', params);
      await this.ddbDocClient.send(new DeleteCommand(params));
      this.logger.info('Customer configuration deleted successfully', { customerId });
      return success(undefined);
    } catch (error) {
      const err = this.formatDynamoError('delete customer configuration', error);
      this.logger.error('Failed to delete customer configuration from DynamoDB', {
        customerId,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * List all customer configurations
   */
  async listCustomerConfigs(): Promise<Result<CustomerConfig[], Error>> {
    this.logger.info('Listing all customer configurations');

    const params = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'CONFIG',
      },
    };

    try {
      this.logger.debug('Querying customer configurations via GSI', params);
      const { Items } = await this.ddbDocClient.send(new QueryCommand(params));

      if (!Items) {
        // This case might not be typical for Scan if the table exists,
        // an empty array would be more common.
        this.logger.warn('No customer configurations found or error in scan operation that resulted in no Items array.');
        return success([]);
      }

      this.logger.info('Customer configurations listed successfully', {
        count: Items.length,
      });
      return success(Items as CustomerConfig[]);
    } catch (error) {
      const err = this.formatDynamoError('list customer configurations', error);
      this.logger.error('Failed to list customer configurations from DynamoDB', {
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * Get module configuration
   */
  async getModuleConfig(customerId: string, moduleId: string): Promise<Result<ModuleConfig, Error>> {
    this.logger.info('Getting module configuration', { customerId, moduleId });

    const params = {
      TableName: this.tableName,
      Key: { PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleId}` },
    };

    try {
      this.logger.debug('Attempting to get module from DynamoDB', params);
      const { Item } = await this.ddbDocClient.send(new GetCommand(params));

      if (!Item) {
        this.logger.warn('Module configuration not found for customer', { customerId, moduleId });
        return failure(new Error(`Module configuration not found: ${moduleId}`));
      }

      this.logger.info('Module configuration retrieved successfully', { customerId, moduleId });
      return success(Item as ModuleConfig);
    } catch (error) {
      const err = this.formatDynamoError('get module configuration', error);
      this.logger.error('Failed to get module configuration', {
        customerId,
        moduleId,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * Save module configuration
   */
  async saveModuleConfig(customerId: string, config: ModuleConfig): Promise<Result<void, Error>> {
    this.logger.info('Saving module configuration', {
      customerId,
      moduleId: config.module_id,
    });

    const item = {
      PK: `CUSTOMER#${customerId}`,
      SK: `MODULE#${config.module_id}`,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: this.tableName,
      Item: item,
    };

    try {
      this.logger.debug('Putting module item into DynamoDB', params);
      await this.ddbDocClient.send(new PutCommand(params));
      this.logger.info('Module configuration saved successfully', { customerId, moduleId: config.module_id });
      return success(undefined);
    } catch (error) {
      const err = this.formatDynamoError('save module configuration', error);
      this.logger.error('Failed to save module configuration', {
        customerId,
        moduleId: config.module_id,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }

  /**
   * Delete module configuration
   */
  async deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting module configuration', { customerId, moduleId });

    const params = {
      TableName: this.tableName,
      Key: { PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleId}` },
    };

    try {
      this.logger.debug('Deleting module item from DynamoDB', params);
      await this.ddbDocClient.send(new DeleteCommand(params));
      this.logger.info('Module configuration deleted successfully', { customerId, moduleId });
      return success(undefined);
    } catch (error) {
      const err = this.formatDynamoError('delete module configuration', error);
      this.logger.error('Failed to delete module configuration', {
        customerId,
        moduleId,
        error: err.message,
        stack: err.stack,
      });
      return failure(err);
    }
  }
}

/**
 * In-memory configuration store for development
 */
export class MemoryConfigStore implements IConfigStore {
  private readonly configs = new Map<string, CustomerConfig>();
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    if (logger) {
      this.logger = logger.createChild('MemoryConfigStore');
    } else {
      // Fallback logger
      this.logger = {
        debug: (message: string, context?: Record<string, unknown>) =>
          console.debug(`[MemoryConfigStore] ${message}`, context || ''),
        info: (message: string, context?: Record<string, unknown>) =>
          console.info(`[MemoryConfigStore] ${message}`, context || ''),
        warn: (message: string, context?: Record<string, unknown>) =>
          console.warn(`[MemoryConfigStore] ${message}`, context || ''),
        error: (message: string, context?: Record<string, unknown>) =>
          console.error(`[MemoryConfigStore] ${message}`, context || ''),
        createChild: () => this.logger, // Simplistic child creation
      } as unknown as Logger;
    }
  }

  async getCustomerConfig(customerId: string): Promise<Result<CustomerConfig, Error>> {
    this.logger.info('Getting customer configuration from memory', { customerId });

    const config = this.configs.get(customerId);
    if (!config) {
      return failure(new Error(`Customer configuration not found: ${customerId}`));
    }

    return success(config);
  }

  async saveCustomerConfig(config: CustomerConfig): Promise<Result<void, Error>> {
    this.logger.info('Saving customer configuration to memory', {
      customerId: config.customer_id,
    });

    this.configs.set(config.customer_id, {
      ...config,
      updatedAt: new Date(),
    });

    return success(undefined);
  }

  async deleteCustomerConfig(customerId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting customer configuration from memory', { customerId });

    const deleted = this.configs.delete(customerId);
    if (!deleted) {
      return failure(new Error(`Customer configuration not found: ${customerId}`));
    }

    return success(undefined);
  }

  async listCustomerConfigs(): Promise<Result<CustomerConfig[], Error>> {
    this.logger.info('Listing customer configurations from memory');

    const configs = Array.from(this.configs.values());
    return success(configs);
  }

  async getModuleConfig(customerId: string, moduleId: string): Promise<Result<ModuleConfig, Error>> {
    const customerConfigResult = await this.getCustomerConfig(customerId);
    if (!customerConfigResult.success) {
      return customerConfigResult as Result<ModuleConfig, Error>;
    }

    const moduleConfig = customerConfigResult.data.modules.find(m => m.module_id === moduleId);
    if (!moduleConfig) {
      return failure(new Error(`Module configuration not found: ${moduleId}`));
    }

    return success(moduleConfig);
  }

  async saveModuleConfig(customerId: string, config: ModuleConfig): Promise<Result<void, Error>> {
    const customerConfigResult = await this.getCustomerConfig(customerId);
    if (!customerConfigResult.success) {
      return customerConfigResult as Result<void, Error>;
    }

    const customerConfig = customerConfigResult.data;
    const modules = [...customerConfig.modules];
    const moduleIndex = modules.findIndex(m => m.module_id === config.module_id);

    if (moduleIndex >= 0) {
      modules[moduleIndex] = config;
    } else {
      modules.push(config);
    }

    return this.saveCustomerConfig({ ...customerConfig, modules });
  }

  async deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>> {
    const customerConfigResult = await this.getCustomerConfig(customerId);
    if (!customerConfigResult.success) {
      return customerConfigResult as Result<void, Error>;
    }

    const customerConfig = customerConfigResult.data;
    const modules = customerConfig.modules.filter(m => m.module_id !== moduleId);

    return this.saveCustomerConfig({ ...customerConfig, modules });
  }
}