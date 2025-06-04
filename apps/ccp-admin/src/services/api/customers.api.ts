/**
 * @fileoverview Customer API service for CRUD operations and configuration management
 * @module services/api/customers
 */

import type {
  CustomerConfig,
  ModuleConfig,
  IntegrationConfig,
  ConfigValidationResult,
} from '@agent-desktop/types';
import { BaseAPIService } from './base.api';
import type {
  CustomerFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateIntegrationRequest,
  IntegrationTestResult,
  CustomerMetrics,
  UsageMetrics,
  ActivityMetrics,
  PaginatedResponse,
} from '../types';
import type {
  CustomersResponse,
  CustomerResponse,
  CustomerModulesResponse,
  ModuleDependencyCheck,
  ConfigValidationResponse,
  BulkOperationResponse,
  ExportResponse,
  ImportResponse,
} from '../types/responses.types';

/**
 * Customer API service for managing customer configurations, modules, and integrations
 * Provides comprehensive CRUD operations and specialized customer management features
 */
export class CustomerAPIService extends BaseAPIService {
  private readonly baseEndpoint = '/api/v1/customers';

  /**
   * Get paginated list of customers with filtering and sorting
   */
  async getCustomers(filters?: CustomerFilters): Promise<CustomersResponse> {
    this.logger.info('Fetching customers list', { filters });

    const params = this.buildCustomerFilters(filters);
    return this.getPaginated<CustomersResponse['items']>(this.baseEndpoint, params)
      .then(async (response) => {
        // Enhance response with summary information
        const summary = await this.getCustomersSummary();
        return {
          ...response,
          summary,
        } as CustomersResponse;
      });
  }

  /**
   * Get detailed customer information including modules and integrations
   */
  async getCustomer(customerId: string): Promise<CustomerResponse> {
    this.logger.info('Fetching customer details', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.get<CustomerResponse>(`${this.baseEndpoint}/${customerId}`);
  }

  /**
   * Create a new customer with initial configuration
   */
  async createCustomer(customer: CreateCustomerRequest): Promise<CustomerConfig> {
    this.logger.info('Creating new customer', { 
      name: customer.name,
      plan: customer.plan,
    });

    // Validate required fields
    this.validateCreateCustomerRequest(customer);

    return this.post<CustomerConfig, CreateCustomerRequest>(
      this.baseEndpoint,
      customer
    );
  }

  /**
   * Update existing customer configuration
   */
  async updateCustomer(
    customerId: string,
    updates: UpdateCustomerRequest
  ): Promise<CustomerConfig> {
    this.logger.info('Updating customer', { 
      customerId,
      fields: Object.keys(updates),
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.patch<CustomerConfig, UpdateCustomerRequest>(
      `${this.baseEndpoint}/${customerId}`,
      updates
    );
  }

  /**
   * Delete customer and all associated data
   */
  async deleteCustomer(customerId: string): Promise<void> {
    this.logger.warn('Deleting customer', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.delete<void>(`${this.baseEndpoint}/${customerId}`);
  }

  /**
   * Get customer configuration with validation
   */
  async getCustomerConfig(customerId: string): Promise<CustomerConfig> {
    this.logger.info('Fetching customer configuration', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.get<CustomerConfig>(`${this.baseEndpoint}/${customerId}/config`);
  }

  /**
   * Update customer configuration with validation
   */
  async updateCustomerConfig(
    customerId: string,
    config: Partial<CustomerConfig>
  ): Promise<CustomerConfig> {
    this.logger.info('Updating customer configuration', {
      customerId,
      configKeys: Object.keys(config),
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.put<CustomerConfig, Partial<CustomerConfig>>(
      `${this.baseEndpoint}/${customerId}/config`,
      config
    );
  }

  /**
   * Validate customer configuration
   */
  async validateCustomerConfig(
    customerId: string,
    config?: Partial<CustomerConfig>
  ): Promise<ConfigValidationResponse> {
    this.logger.info('Validating customer configuration', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const endpoint = `${this.baseEndpoint}/${customerId}/config/validate`;
    
    if (config) {
      return this.post<ConfigValidationResponse, Partial<CustomerConfig>>(
        endpoint,
        config
      );
    } else {
      return this.get<ConfigValidationResponse>(endpoint);
    }
  }

  /**
   * Get customer modules with installation status
   */
  async getCustomerModules(customerId: string): Promise<CustomerModulesResponse> {
    this.logger.info('Fetching customer modules', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.get<CustomerModulesResponse>(
      `${this.baseEndpoint}/${customerId}/modules`
    );
  }

  /**
   * Enable module for customer with optional configuration
   */
  async enableModule(
    customerId: string,
    moduleId: string,
    config?: Partial<ModuleConfig>
  ): Promise<ModuleConfig> {
    this.logger.info('Enabling module for customer', {
      customerId,
      moduleId,
      hasConfig: !!config,
    });

    if (!customerId || !moduleId) {
      throw new Error('Customer ID and Module ID are required');
    }

    return this.post<ModuleConfig, Partial<ModuleConfig> | undefined>(
      `${this.baseEndpoint}/${customerId}/modules/${moduleId}/enable`,
      config
    );
  }

  /**
   * Disable module for customer
   */
  async disableModule(customerId: string, moduleId: string): Promise<void> {
    this.logger.info('Disabling module for customer', {
      customerId,
      moduleId,
    });

    if (!customerId || !moduleId) {
      throw new Error('Customer ID and Module ID are required');
    }

    return this.post<void>(
      `${this.baseEndpoint}/${customerId}/modules/${moduleId}/disable`
    );
  }

  /**
   * Check module dependencies for customer
   */
  async checkModuleDependencies(
    customerId: string,
    moduleId: string
  ): Promise<readonly ModuleDependencyCheck[]> {
    this.logger.info('Checking module dependencies', {
      customerId,
      moduleId,
    });

    if (!customerId || !moduleId) {
      throw new Error('Customer ID and Module ID are required');
    }

    return this.get<readonly ModuleDependencyCheck[]>(
      `${this.baseEndpoint}/${customerId}/modules/${moduleId}/dependencies`
    );
  }

  /**
   * Get customer integrations
   */
  async getCustomerIntegrations(customerId: string): Promise<readonly IntegrationConfig[]> {
    this.logger.info('Fetching customer integrations', { customerId });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return this.get<readonly IntegrationConfig[]>(
      `${this.baseEndpoint}/${customerId}/integrations`
    );
  }

  /**
   * Create new integration for customer
   */
  async createIntegration(
    customerId: string,
    integration: CreateIntegrationRequest
  ): Promise<IntegrationConfig> {
    this.logger.info('Creating integration for customer', {
      customerId,
      integrationType: integration.type,
      integrationName: integration.name,
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    this.validateCreateIntegrationRequest(integration);

    return this.post<IntegrationConfig, CreateIntegrationRequest>(
      `${this.baseEndpoint}/${customerId}/integrations`,
      integration
    );
  }

  /**
   * Update existing integration
   */
  async updateIntegration(
    customerId: string,
    integrationId: string,
    updates: Partial<CreateIntegrationRequest>
  ): Promise<IntegrationConfig> {
    this.logger.info('Updating integration', {
      customerId,
      integrationId,
      fields: Object.keys(updates),
    });

    if (!customerId || !integrationId) {
      throw new Error('Customer ID and Integration ID are required');
    }

    return this.patch<IntegrationConfig, Partial<CreateIntegrationRequest>>(
      `${this.baseEndpoint}/${customerId}/integrations/${integrationId}`,
      updates
    );
  }

  /**
   * Delete integration
   */
  async deleteIntegration(customerId: string, integrationId: string): Promise<void> {
    this.logger.warn('Deleting integration', {
      customerId,
      integrationId,
    });

    if (!customerId || !integrationId) {
      throw new Error('Customer ID and Integration ID are required');
    }

    return this.delete<void>(
      `${this.baseEndpoint}/${customerId}/integrations/${integrationId}`
    );
  }

  /**
   * Test integration connectivity
   */
  async testIntegration(
    customerId: string,
    integrationId: string
  ): Promise<IntegrationTestResult> {
    this.logger.info('Testing integration connectivity', {
      customerId,
      integrationId,
    });

    if (!customerId || !integrationId) {
      throw new Error('Customer ID and Integration ID are required');
    }

    return this.post<IntegrationTestResult>(
      `${this.baseEndpoint}/${customerId}/integrations/${integrationId}/test`
    );
  }

  /**
   * Get customer metrics for analytics
   */
  async getCustomerMetrics(
    customerId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<CustomerMetrics> {
    this.logger.info('Fetching customer metrics', {
      customerId,
      timeRange,
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const params = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
    };

    return this.executeAnalytics<CustomerMetrics>(
      `${this.baseEndpoint}/${customerId}/metrics`,
      params
    );
  }

  /**
   * Get customer usage statistics
   */
  async getCustomerUsage(
    customerId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<UsageMetrics> {
    this.logger.info('Fetching customer usage', {
      customerId,
      timeRange,
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const params = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
    };

    return this.executeAnalytics<UsageMetrics>(
      `${this.baseEndpoint}/${customerId}/usage`,
      params
    );
  }

  /**
   * Get customer activity history
   */
  async getCustomerActivity(
    customerId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<ActivityMetrics> {
    this.logger.info('Fetching customer activity', {
      customerId,
      timeRange,
    });

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const params = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
    };

    return this.executeAnalytics<ActivityMetrics>(
      `${this.baseEndpoint}/${customerId}/activity`,
      params
    );
  }

  /**
   * Bulk operations on customers
   */
  async bulkUpdateCustomers(
    operations: Array<{
      customerId: string;
      operation: 'update' | 'delete' | 'activate' | 'deactivate';
      data?: UpdateCustomerRequest;
    }>
  ): Promise<BulkOperationResponse<CustomerConfig>> {
    this.logger.info('Executing bulk customer operations', {
      operationCount: operations.length,
    });

    return this.executeBulk<BulkOperationResponse<CustomerConfig>>(
      `${this.baseEndpoint}/bulk`,
      { operations }
    );
  }

  /**
   * Export customer data
   */
  async exportCustomers(
    filters?: CustomerFilters,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<ExportResponse> {
    this.logger.info('Exporting customer data', {
      format,
      hasFilters: !!filters,
    });

    const params = {
      format,
      ...this.buildCustomerFilters(filters),
    };

    return this.post<ExportResponse>(
      `${this.baseEndpoint}/export`,
      undefined,
      { params }
    );
  }

  /**
   * Import customer data
   */
  async importCustomers(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ImportResponse> {
    this.logger.info('Importing customer data', {
      filename: file.name,
      fileSize: file.size,
    });

    return this.uploadFile<ImportResponse>(
      `${this.baseEndpoint}/import`,
      file,
      onProgress
    );
  }

  /**
   * Build query parameters from customer filters
   */
  private buildCustomerFilters(filters?: CustomerFilters): Record<string, unknown> {
    if (!filters) return {};

    return {
      search: filters.search,
      status: filters.status,
      plan: filters.plan,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Get customers summary statistics
   */
  private async getCustomersSummary(): Promise<CustomersResponse['summary']> {
    try {
      return await this.get<CustomersResponse['summary']>(
        `${this.baseEndpoint}/summary`
      );
    } catch (error) {
      this.logger.warn('Failed to fetch customers summary', { error });
      
      // Return default summary if request fails
      return {
        totalActive: 0,
        totalInactive: 0,
        totalByPlan: {},
      };
    }
  }

  /**
   * Validate create customer request
   */
  private validateCreateCustomerRequest(customer: CreateCustomerRequest): void {
    if (!customer.name?.trim()) {
      throw new Error('Customer name is required');
    }

    if (!customer.plan) {
      throw new Error('Customer plan is required');
    }

    const validPlans = ['basic', 'professional', 'enterprise', 'custom'];
    if (!validPlans.includes(customer.plan)) {
      throw new Error(`Invalid plan. Must be one of: ${validPlans.join(', ')}`);
    }
  }

  /**
   * Validate create integration request
   */
  private validateCreateIntegrationRequest(integration: CreateIntegrationRequest): void {
    if (!integration.name?.trim()) {
      throw new Error('Integration name is required');
    }

    if (!integration.type) {
      throw new Error('Integration type is required');
    }

    if (!integration.authentication) {
      throw new Error('Integration authentication configuration is required');
    }

    if (!integration.endpoints) {
      throw new Error('Integration endpoints configuration is required');
    }

    if (!integration.endpoints.base_url?.trim()) {
      throw new Error('Integration base URL is required');
    }
  }
}