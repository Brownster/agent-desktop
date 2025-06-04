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
 * DynamoDB configuration store
 */
export class DynamoDBConfigStore implements IConfigStore {
  private readonly tableName: string;
  private readonly logger: Logger;
  
  constructor(tableName: string, logger: Logger) {
    this.tableName = tableName;
    this.logger = logger.createChild('DynamoDBConfigStore');
  }

  /**
   * Get customer configuration from DynamoDB
   */
  async getCustomerConfig(customerId: string): Promise<Result<CustomerConfig, Error>> {
    this.logger.info('Getting customer configuration', { customerId });

    try {
      // Mock implementation - in real implementation, use AWS SDK
      const mockConfig = this.createMockCustomerConfig(customerId);
      
      this.logger.info('Customer configuration retrieved successfully', {
        customerId,
        moduleCount: mockConfig.modules.length,
      });

      return success(mockConfig);
    } catch (error) {
      this.logger.error('Failed to get customer configuration', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
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

    try {
      // Mock implementation - in real implementation, use AWS SDK
      // const dynamodb = new AWS.DynamoDB.DocumentClient();
      // const params = {
      //   TableName: this.tableName,
      //   Item: {
      //     PK: `CUSTOMER#${config.customer_id}`,
      //     SK: 'CONFIG',
      //     ...config,
      //     updatedAt: new Date().toISOString(),
      //   },
      // };
      // await dynamodb.put(params).promise();

      this.logger.info('Customer configuration saved successfully', {
        customerId: config.customer_id,
        version: config.version,
      });

      return success(undefined);
    } catch (error) {
      this.logger.error('Failed to save customer configuration', {
        customerId: config.customer_id,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Delete customer configuration from DynamoDB
   */
  async deleteCustomerConfig(customerId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting customer configuration', { customerId });

    try {
      // Mock implementation - in real implementation, use AWS SDK
      this.logger.info('Customer configuration deleted successfully', { customerId });
      return success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete customer configuration', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * List all customer configurations
   */
  async listCustomerConfigs(): Promise<Result<CustomerConfig[], Error>> {
    this.logger.info('Listing customer configurations');

    try {
      // Mock implementation - in real implementation, use AWS SDK
      const mockConfigs = [
        this.createMockCustomerConfig('customer-1'),
        this.createMockCustomerConfig('customer-2'),
      ];

      this.logger.info('Customer configurations listed successfully', {
        count: mockConfigs.length,
      });

      return success(mockConfigs);
    } catch (error) {
      this.logger.error('Failed to list customer configurations', {
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get module configuration
   */
  async getModuleConfig(customerId: string, moduleId: string): Promise<Result<ModuleConfig, Error>> {
    this.logger.info('Getting module configuration', { customerId, moduleId });

    try {
      const customerConfigResult = await this.getCustomerConfig(customerId);
      if (!customerConfigResult.success) {
        return customerConfigResult as Result<ModuleConfig, Error>;
      }

      const moduleConfig = customerConfigResult.data.modules.find(m => m.module_id === moduleId);
      if (!moduleConfig) {
        return failure(new Error(`Module configuration not found: ${moduleId}`));
      }

      this.logger.info('Module configuration retrieved successfully', {
        customerId,
        moduleId,
      });

      return success(moduleConfig);
    } catch (error) {
      this.logger.error('Failed to get module configuration', {
        customerId,
        moduleId,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
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

    try {
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

      customerConfig.updatedAt = new Date();
      return this.saveCustomerConfig(customerConfig);
    } catch (error) {
      this.logger.error('Failed to save module configuration', {
        customerId,
        moduleId: config.module_id,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Delete module configuration
   */
  async deleteModuleConfig(customerId: string, moduleId: string): Promise<Result<void, Error>> {
    this.logger.info('Deleting module configuration', { customerId, moduleId });

    try {
      const customerConfigResult = await this.getCustomerConfig(customerId);
      if (!customerConfigResult.success) {
        return customerConfigResult as Result<void, Error>;
      }

      const customerConfig = customerConfigResult.data;
      customerConfig.modules = customerConfig.modules.filter(m => m.module_id !== moduleId);
      customerConfig.updatedAt = new Date();

      return this.saveCustomerConfig(customerConfig);
    } catch (error) {
      this.logger.error('Failed to delete module configuration', {
        customerId,
        moduleId,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create mock customer configuration for testing
   */
  private createMockCustomerConfig(customerId: string): CustomerConfig {
    return {
      customer_id: customerId,
      name: `Customer ${customerId}`,
      version: '1.0.0',
      isActive: true,
      branding: {
        primary_color: '#1e40af',
        secondary_color: '#374151',
        font_family: 'Inter, sans-serif',
        theme: 'light',
        application_title: 'Contact Center',
        company_name: `Company ${customerId}`,
      },
      modules: [
        {
          module_id: 'ccp-core',
          enabled: true,
          position: 'sidebar',
          priority: 1,
          lazy: false,
          settings: {
            show_queue_stats: true,
            enable_recording_controls: true,
          },
          permissions: ['read', 'write'],
          dependencies: [],
        },
        {
          module_id: 'customer-info',
          enabled: true,
          position: 'main',
          priority: 2,
          lazy: true,
          settings: {
            data_sources: ['connect-profiles'],
            screen_pop_enabled: true,
          },
          permissions: ['read'],
          dependencies: ['ccp-core'],
        },
      ],
      features: {
        recording_controls: true,
        screen_sharing: false,
        file_uploads: true,
        chat_functionality: true,
        supervisor_monitoring: false,
        analytics_dashboard: true,
        custom_scripts: false,
        third_party_integrations: true,
        advanced_routing: false,
        real_time_reporting: true,
        voice_analytics: false,
        sentiment_analysis: false,
      },
      integrations: [],
      deployment: {
        domain: `${customerId}.connect.example.com`,
        cdn_distribution: `dist-${customerId}`,
        environment: 'production',
        region: 'us-east-1',
        ssl_certificate: `cert-${customerId}`,
        custom_domains: [],
        caching_strategy: {
          enabled: true,
          ttl: 3600,
          static_assets_ttl: 86400,
          api_cache_ttl: 300,
          invalidation_rules: [],
        },
        monitoring: {
          enabled: true,
          log_level: 'info',
          metrics_enabled: true,
          alerts_enabled: true,
          notification_channels: [],
        },
      },
      security: {
        content_security_policy: {
          enabled: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
          },
          report_only: false,
        },
        cors: {
          enabled: true,
          allowed_origins: [`https://${customerId}.connect.example.com`],
          allowed_methods: ['GET', 'POST'],
          allowed_headers: ['Content-Type'],
          exposed_headers: [],
          credentials: false,
          max_age: 86400,
        },
        session: {
          timeout_minutes: 60,
          sliding_expiration: true,
          secure_cookies: true,
          same_site_policy: 'strict',
          idle_timeout_minutes: 30,
        },
        encryption: {
          algorithm: 'AES-256-GCM',
          key_rotation_days: 90,
          data_at_rest: true,
          data_in_transit: true,
          pii_encryption: true,
        },
        audit: {
          enabled: true,
          log_all_requests: false,
          log_data_access: true,
          retention_days: 365,
          export_enabled: true,
          anonymize_pii: true,
        },
      },
      vdi: {
        platform: 'auto-detect',
        audio_optimization: true,
        video_optimization: false,
        bandwidth_optimization: true,
        local_storage_enabled: false,
        clipboard_enabled: true,
        file_transfer_enabled: false,
        print_redirection: false,
        performance_monitoring: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * In-memory configuration store for development
 */
export class MemoryConfigStore implements IConfigStore {
  private readonly configs = new Map<string, CustomerConfig>();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChild('MemoryConfigStore');
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