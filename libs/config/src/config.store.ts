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
  ScanCommand
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
 * DynamoDB configuration store.
 *
 * // TODO: AWS SDK INTEGRATION
 * // This is currently a MOCK implementation.
 * // Replace mock logic with actual AWS SDK calls for DynamoDB operations.
 * // Ensure appropriate error handling, retry mechanisms, and IAM permissions.
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
        debug: (message, context) => console.debug(`[DynamoDBConfigStore] ${message}`, context || ''),
        info: (message, context) => console.info(`[DynamoDBConfigStore] ${message}`, context || ''),
        warn: (message, context) => console.warn(`[DynamoDBConfigStore] ${message}`, context || ''),
        error: (message, context) => console.error(`[DynamoDBConfigStore] ${message}`, context || ''),
        createChild: () => this.logger, // Simplistic child creation
      } as Logger;
    }

    const client = new DynamoDBClient({}); // Basic client configuration, region can be configured via ENV variables or shared config
    this.ddbDocClient = DynamoDBDocumentClient.from(client);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get customer configuration from DynamoDB', {
        customerId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to save customer configuration to DynamoDB', {
        customerId: config.customer_id,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete customer configuration from DynamoDB', {
        customerId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * List all customer configurations
   */
  async listCustomerConfigs(): Promise<Result<CustomerConfig[], Error>> {
    this.logger.info('Listing all customer configurations');

    // TODO: Consider GSI for performance on large tables instead of Scan.
    // A GSI on a common attribute or on the SK (if SK='CONFIG' is sparse for other items)
    // could be more efficient. For now, using Scan with a filter.
    const params = {
      TableName: this.tableName,
      FilterExpression: "begins_with(PK, :pk_prefix) AND SK = :sk_value",
      ExpressionAttributeValues: {
        ":pk_prefix": "CUSTOMER#",
        ":sk_value": "CONFIG",
      },
    };

    try {
      this.logger.debug('Attempting to scan items from DynamoDB', params);
      // Note: Scan operations can be slow and costly on large tables.
      // Consider pagination if many config items are expected.
      const { Items } = await this.ddbDocClient.send(new ScanCommand(params));

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to list customer configurations from DynamoDB', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * Get module configuration
   */
  async getModuleConfig(customerId: string, moduleId: string): Promise<Result<ModuleConfig, Error>> {
    this.logger.info('Getting module configuration', { customerId, moduleId });

    // TODO: AWS SDK - Current mock relies on getCustomerConfig.
    // If modules were separate items, this would be a direct GetCommand similar to getCustomerConfig.

    try {
      const customerConfigResult = await this.getCustomerConfig(customerId);

      if (!customerConfigResult.success) {
        this.logger.warn('Failed to get customer configuration while trying to get module config', {
          customerId,
          moduleId,
          error: customerConfigResult.error.message,
        });
        // Propagate the error from getCustomerConfig
        return failure(new Error(`Failed to retrieve customer config for module fetching: ${customerConfigResult.error.message}`));
      }

      const customerConfig = customerConfigResult.data;
      const moduleConfig = customerConfig.modules?.find(m => m.module_id === moduleId);

      if (!moduleConfig) {
        this.logger.warn('Module configuration not found for customer', { customerId, moduleId });
        return failure(new Error(`Module configuration not found: ${moduleId}`));
      }

      this.logger.info('Module configuration retrieved successfully', {
        customerId,
        moduleId,
        // moduleVersion: moduleConfig.version // Example if module has a version
      });
      return success(moduleConfig);
    } catch (error) {
      // This catch block might be redundant if getCustomerConfig handles its errors thoroughly
      // and converts them to `Result` objects. However, it's a safeguard.
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get module configuration', {
        customerId,
        moduleId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * Save module configuration
   */
  async saveModuleConfig(customerId: string, config: ModuleConfig): Promise<Result<void, Error>> {
    this.logger.info('Saving module configuration', {
      customerId,
      moduleId: config.module_id,
      // moduleVersion: config.version // If applicable
    });

    // This method relies on a get-modify-put pattern for the entire customer configuration.
    // For high-concurrency environments or large config objects,
    // consider updating only the specific module using conditional updates if possible,
    // or storing modules as separate DynamoDB items.

    try {
      const customerConfigResult = await this.getCustomerConfig(customerId);

      if (!customerConfigResult.success) {
        this.logger.warn('Failed to get customer configuration while trying to save module config', {
          customerId,
          moduleId: config.module_id,
          error: customerConfigResult.error.message,
        });
        return failure(new Error(`Failed to retrieve customer config for module saving: ${customerConfigResult.error.message}`));
      }

      const customerConfig = customerConfigResult.data;
      
      // Ensure modules array exists
      if (!customerConfig.modules) {
          customerConfig.modules = [];
      }

      const moduleIndex = customerConfig.modules.findIndex(m => m.module_id === config.module_id);

      if (moduleIndex >= 0) {
        customerConfig.modules[moduleIndex] = config;
      } else {
        customerConfig.modules.push(config);
      }

      // Assuming CustomerConfig has an 'updatedAt' field that should be set by saveCustomerConfig.
      // If CustomerConfig type definition doesn't have 'updatedAt', this might be an issue,
      // but saveCustomerConfig itself adds 'updatedAt' before sending to DynamoDB.
      // No need to set customerConfig.updatedAt = new Date(); here as saveCustomerConfig handles it.

      this.logger.debug('Attempting to save updated customer configuration for module change', { customerId, moduleId: config.module_id });
      const saveResult = await this.saveCustomerConfig(customerConfig);

      if (!saveResult.success) {
        this.logger.error('Failed to save customer configuration after updating module', {
          customerId,
          moduleId: config.module_id,
          error: saveResult.error.message,
        });
        return failure(new Error(`Failed to save customer config after module update: ${saveResult.error.message}`));
      }

      this.logger.info('Module configuration saved successfully by updating customer config', {
        customerId,
        moduleId: config.module_id,
      });
      return success(undefined);
    } catch (error) {
      // This catch block is a general safeguard.
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to save module configuration', {
        customerId,
        moduleId: config.module_id,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * Delete module configuration
   */
  async deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting module configuration', { customerId, moduleId });

    // This method also relies on a get-modify-put pattern for the entire customer configuration.
    // Similar considerations as saveModuleConfig apply here regarding concurrency and large objects.

    try {
      const customerConfigResult = await this.getCustomerConfig(customerId);

      if (!customerConfigResult.success) {
        this.logger.warn('Failed to get customer configuration while trying to delete module config', {
          customerId,
          moduleId,
          error: customerConfigResult.error.message,
        });
        return failure(new Error(`Failed to retrieve customer config for module deletion: ${customerConfigResult.error.message}`));
      }

      const customerConfig = customerConfigResult.data;

      if (!customerConfig.modules) {
        // If modules array doesn't exist, the module to delete also doesn't exist.
        this.logger.warn('Modules array does not exist, cannot delete module', { customerId, moduleId });
        // Consider this a success as the module is effectively not there.
        // Or, return a specific error/warning if this state is unexpected.
        // For now, let's treat it as if the module is already deleted.
        return success(undefined);
      }

      const initialModuleCount = customerConfig.modules.length;
      customerConfig.modules = customerConfig.modules.filter(m => m.module_id !== moduleId);

      if (customerConfig.modules.length === initialModuleCount) {
        this.logger.warn('Module to delete was not found in customer configuration', { customerId, moduleId });
        // Module was not found, effectively it's already "deleted" or never existed.
        // Depending on desired strictness, this could be an error or a silent success.
        // Returning success for idempotency.
        return success(undefined);
      }

      // As with saveModuleConfig, saveCustomerConfig handles 'updatedAt'.
      this.logger.debug('Attempting to save updated customer configuration after module deletion', { customerId, moduleId });
      const saveResult = await this.saveCustomerConfig(customerConfig);

      if (!saveResult.success) {
        this.logger.error('Failed to save customer configuration after deleting module', {
          customerId,
          moduleId,
          error: saveResult.error.message,
        });
        return failure(new Error(`Failed to save customer config after module deletion: ${saveResult.error.message}`));
      }

      this.logger.info('Module configuration deleted successfully by updating customer config', {
        customerId,
        moduleId,
      });
      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete module configuration', {
        customerId,
        moduleId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return failure(error instanceof Error ? error : new Error(errorMessage));
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
        debug: (message, context) => console.debug(`[MemoryConfigStore] ${message}`, context || ''),
        info: (message, context) => console.info(`[MemoryConfigStore] ${message}`, context || ''),
        warn: (message, context) => console.warn(`[MemoryConfigStore] ${message}`, context || ''),
        error: (message, context) => console.error(`[MemoryConfigStore] ${message}`, context || ''),
        createChild: () => this.logger, // Simplistic child creation
      } as Logger;
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
    const moduleIndex = customerConfig.modules.findIndex(m => m.module_id === config.module_id);
    
    if (moduleIndex >= 0) {
      customerConfig.modules[moduleIndex] = config;
    } else {
      customerConfig.modules.push(config);
    }

    return this.saveCustomerConfig(customerConfig);
  }

  async deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>> {
    const customerConfigResult = await this.getCustomerConfig(customerId);
    if (!customerConfigResult.success) {
      return customerConfigResult as Result<void, Error>;
    }

    const customerConfig = customerConfigResult.data;
    customerConfig.modules = customerConfig.modules.filter(m => m.module_id !== moduleId);

    return this.saveCustomerConfig(customerConfig);
  }
}