/**
 * @fileoverview Unit tests for CustomerAPIService
 * @module services/api/__tests__/customers.api
 */

import { CustomerAPIService } from '../customers.api';
import { BaseAPIService } from '../base.api';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateIntegrationRequest,
  CustomerFilters,
} from '../../types';

// Mock the base API service
jest.mock('../base.api');

describe('CustomerAPIService', () => {
  let service: CustomerAPIService;
  let mockBaseService: jest.Mocked<BaseAPIService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    service = new CustomerAPIService();

    // Get mock methods from the base service
    mockBaseService = service as any;
    mockBaseService.get = jest.fn();
    mockBaseService.post = jest.fn();
    mockBaseService.put = jest.fn();
    mockBaseService.patch = jest.fn();
    mockBaseService.delete = jest.fn();
    mockBaseService.getPaginated = jest.fn();
    mockBaseService.uploadFile = jest.fn();
    mockBaseService.executeBulk = jest.fn();
    mockBaseService.executeAnalytics = jest.fn();
  });

  describe('getCustomers', () => {
    it('should fetch customers with filters', async () => {
      const filters: CustomerFilters = {
        search: 'acme',
        status: 'active',
        page: 1,
        pageSize: 25,
      };

      const mockResponse = {
        items: [
          { customer_id: '1', name: 'Acme Corp' },
          { customer_id: '2', name: 'Test Corp' },
        ],
        total: 2,
        page: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      const mockSummary = {
        totalActive: 10,
        totalInactive: 2,
        totalByPlan: { basic: 5, enterprise: 7 },
      };

      mockBaseService.getPaginated.mockResolvedValue(mockResponse);
      mockBaseService.get.mockResolvedValue(mockSummary);

      const result = await service.getCustomers(filters);

      expect(mockBaseService.getPaginated).toHaveBeenCalledWith(
        '/api/v1/customers',
        {
          search: 'acme',
          status: 'active',
          page: 1,
          pageSize: 25,
          sortBy: undefined,
          sortOrder: undefined,
          plan: undefined,
        }
      );

      expect(result).toEqual({
        ...mockResponse,
        summary: mockSummary,
      });
    });

    it('should fetch customers without filters', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockBaseService.getPaginated.mockResolvedValue(mockResponse);
      mockBaseService.get.mockResolvedValue({
        totalActive: 0,
        totalInactive: 0,
        totalByPlan: {},
      });

      const result = await service.getCustomers();

      expect(mockBaseService.getPaginated).toHaveBeenCalledWith('/api/v1/customers', {});
    });
  });

  describe('getCustomer', () => {
    it('should fetch customer by ID', async () => {
      const customerId = 'cust_123';
      const mockCustomer = {
        customer: { customer_id: customerId, name: 'Test Corp' },
        modules: [],
        integrations: [],
        usage: null,
        activity: [],
      };

      mockBaseService.get.mockResolvedValue(mockCustomer);

      const result = await service.getCustomer(customerId);

      expect(mockBaseService.get).toHaveBeenCalledWith('/api/v1/customers/cust_123');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw error for empty customer ID', async () => {
      await expect(service.getCustomer('')).rejects.toThrow('Customer ID is required');
      expect(mockBaseService.get).not.toHaveBeenCalled();
    });
  });

  describe('createCustomer', () => {
    it('should create customer with valid data', async () => {
      const customerData: CreateCustomerRequest = {
        name: 'New Corp',
        plan: 'enterprise',
        branding: {
          primary_color: '#1f2937',
          secondary_color: '#f3f4f6',
          font_family: 'Inter',
          theme: 'light',
          application_title: 'CCP Admin',
          company_name: 'New Corp',
        },
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
        security: {
          content_security_policy: {
            enabled: true,
            directives: {},
            report_only: false,
          },
          cors: {
            enabled: true,
            allowed_origins: [],
            allowed_methods: [],
            allowed_headers: [],
            exposed_headers: [],
            credentials: false,
            max_age: 3600,
          },
          session: {
            timeout_minutes: 60,
            sliding_expiration: true,
            secure_cookies: true,
            same_site_policy: 'strict',
            idle_timeout_minutes: 30,
          },
          encryption: {
            algorithm: 'AES-256',
            key_rotation_days: 30,
            data_at_rest: true,
            data_in_transit: true,
            pii_encryption: true,
          },
          audit: {
            enabled: true,
            log_all_requests: false,
            log_data_access: true,
            retention_days: 90,
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
      };

      const mockResponse = {
        customer_id: 'cust_456',
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        isActive: true,
        modules: [],
        integrations: [],
        deployment: {} as any,
      };

      mockBaseService.post.mockResolvedValue(mockResponse);

      const result = await service.createCustomer(customerData);

      expect(mockBaseService.post).toHaveBeenCalledWith('/api/v1/customers', customerData);
      expect(result).toEqual(mockResponse);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        plan: 'invalid' as any,
      } as CreateCustomerRequest;

      await expect(service.createCustomer(invalidData)).rejects.toThrow('Customer name is required');
      expect(mockBaseService.post).not.toHaveBeenCalled();
    });

    it('should validate plan field', async () => {
      const invalidData = {
        name: 'Test Corp',
        plan: 'invalid' as any,
      } as CreateCustomerRequest;

      await expect(service.createCustomer(invalidData)).rejects.toThrow('Invalid plan');
      expect(mockBaseService.post).not.toHaveBeenCalled();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer with valid data', async () => {
      const customerId = 'cust_123';
      const updates: UpdateCustomerRequest = {
        name: 'Updated Corp',
        plan: 'professional',
      };

      const mockResponse = {
        customer_id: customerId,
        name: 'Updated Corp',
        plan: 'professional',
        updatedAt: new Date(),
      };

      mockBaseService.patch.mockResolvedValue(mockResponse);

      const result = await service.updateCustomer(customerId, updates);

      expect(mockBaseService.patch).toHaveBeenCalledWith(
        '/api/v1/customers/cust_123',
        updates
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty customer ID', async () => {
      await expect(service.updateCustomer('', {})).rejects.toThrow('Customer ID is required');
      expect(mockBaseService.patch).not.toHaveBeenCalled();
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer by ID', async () => {
      const customerId = 'cust_123';

      mockBaseService.delete.mockResolvedValue(undefined);

      await service.deleteCustomer(customerId);

      expect(mockBaseService.delete).toHaveBeenCalledWith('/api/v1/customers/cust_123');
    });

    it('should throw error for empty customer ID', async () => {
      await expect(service.deleteCustomer('')).rejects.toThrow('Customer ID is required');
      expect(mockBaseService.delete).not.toHaveBeenCalled();
    });
  });

  describe('module management', () => {
    describe('getCustomerModules', () => {
      it('should fetch customer modules', async () => {
        const customerId = 'cust_123';
        const mockModules = {
          modules: [
            { module_id: 'mod_1', enabled: true },
            { module_id: 'mod_2', enabled: false },
          ],
          available: [],
          dependencies: [],
        };

        mockBaseService.get.mockResolvedValue(mockModules);

        const result = await service.getCustomerModules(customerId);

        expect(mockBaseService.get).toHaveBeenCalledWith('/api/v1/customers/cust_123/modules');
        expect(result).toEqual(mockModules);
      });
    });

    describe('enableModule', () => {
      it('should enable module for customer', async () => {
        const customerId = 'cust_123';
        const moduleId = 'mod_456';
        const config = { setting1: 'value1' };

        const mockResponse = {
          module_id: moduleId,
          enabled: true,
          config,
        };

        mockBaseService.post.mockResolvedValue(mockResponse);

        const result = await service.enableModule(customerId, moduleId, config);

        expect(mockBaseService.post).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/modules/mod_456/enable',
          config
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error for missing parameters', async () => {
        await expect(service.enableModule('', 'mod_123')).rejects.toThrow(
          'Customer ID and Module ID are required'
        );
        expect(mockBaseService.post).not.toHaveBeenCalled();
      });
    });

    describe('disableModule', () => {
      it('should disable module for customer', async () => {
        const customerId = 'cust_123';
        const moduleId = 'mod_456';

        mockBaseService.post.mockResolvedValue(undefined);

        await service.disableModule(customerId, moduleId);

        expect(mockBaseService.post).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/modules/mod_456/disable'
        );
      });
    });
  });

  describe('integration management', () => {
    describe('getCustomerIntegrations', () => {
      it('should fetch customer integrations', async () => {
        const customerId = 'cust_123';
        const mockIntegrations = [
          { type: 'salesforce', name: 'SF Integration', enabled: true },
          { type: 'zendesk', name: 'ZD Integration', enabled: false },
        ];

        mockBaseService.get.mockResolvedValue(mockIntegrations);

        const result = await service.getCustomerIntegrations(customerId);

        expect(mockBaseService.get).toHaveBeenCalledWith('/api/v1/customers/cust_123/integrations');
        expect(result).toEqual(mockIntegrations);
      });
    });

    describe('createIntegration', () => {
      it('should create integration with valid data', async () => {
        const customerId = 'cust_123';
        const integrationData: CreateIntegrationRequest = {
          type: 'salesforce',
          name: 'Salesforce CRM',
          config: {},
          authentication: {
            type: 'oauth2',
            credentials: { client_id: 'test', client_secret: 'secret' },
          },
          endpoints: {
            base_url: 'https://api.salesforce.com',
            timeout: 30000,
            retry_attempts: 3,
          },
          syncSettings: {
            enabled: true,
            direction: 'bidirectional',
            frequency: 'real_time',
            batch_size: 100,
            conflict_resolution: 'source_wins',
          },
          fieldMappings: [],
        };

        const mockResponse = {
          ...integrationData,
          integration_id: 'int_789',
          enabled: true,
        };

        mockBaseService.post.mockResolvedValue(mockResponse);

        const result = await service.createIntegration(customerId, integrationData);

        expect(mockBaseService.post).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/integrations',
          integrationData
        );
        expect(result).toEqual(mockResponse);
      });

      it('should validate integration data', async () => {
        const customerId = 'cust_123';
        const invalidData = {
          type: 'salesforce',
          name: '', // Invalid: empty name
        } as CreateIntegrationRequest;

        await expect(service.createIntegration(customerId, invalidData)).rejects.toThrow(
          'Integration name is required'
        );
        expect(mockBaseService.post).not.toHaveBeenCalled();
      });
    });

    describe('testIntegration', () => {
      it('should test integration connectivity', async () => {
        const customerId = 'cust_123';
        const integrationId = 'int_456';

        const mockTestResult = {
          success: true,
          latency: 150,
          message: 'Connection successful',
          timestamp: new Date(),
        };

        mockBaseService.post.mockResolvedValue(mockTestResult);

        const result = await service.testIntegration(customerId, integrationId);

        expect(mockBaseService.post).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/integrations/int_456/test'
        );
        expect(result).toEqual(mockTestResult);
      });
    });
  });

  describe('analytics methods', () => {
    describe('getCustomerMetrics', () => {
      it('should fetch customer metrics for time range', async () => {
        const customerId = 'cust_123';
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        };

        const mockMetrics = {
          customerId,
          activeAgents: 10,
          totalContacts: 500,
          avgHandleTime: 300,
          satisfactionScore: 4.5,
          moduleUsage: [],
          integrationStatus: [],
          timeRange,
        };

        mockBaseService.executeAnalytics.mockResolvedValue(mockMetrics);

        const result = await service.getCustomerMetrics(customerId, timeRange);

        expect(mockBaseService.executeAnalytics).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/metrics',
          {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString(),
          }
        );
        expect(result).toEqual(mockMetrics);
      });
    });

    describe('getCustomerUsage', () => {
      it('should fetch customer usage statistics', async () => {
        const customerId = 'cust_123';
        const timeRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        };

        const mockUsage = {
          customerId,
          storageUsed: 1024,
          bandwidthUsed: 5120,
          apiCalls: 10000,
          activeUsers: 25,
          peakConcurrency: 15,
          timeRange,
        };

        mockBaseService.executeAnalytics.mockResolvedValue(mockUsage);

        const result = await service.getCustomerUsage(customerId, timeRange);

        expect(mockBaseService.executeAnalytics).toHaveBeenCalledWith(
          '/api/v1/customers/cust_123/usage',
          {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString(),
          }
        );
        expect(result).toEqual(mockUsage);
      });
    });
  });

  describe('bulk operations', () => {
    describe('bulkUpdateCustomers', () => {
      it('should execute bulk customer operations', async () => {
        const operations = [
          {
            customerId: 'cust_1',
            operation: 'update' as const,
            data: { name: 'Updated Name 1' },
          },
          {
            customerId: 'cust_2',
            operation: 'delete' as const,
          },
        ];

        const mockResponse = {
          total: 2,
          successful: 2,
          failed: 0,
          results: [
            { id: 'cust_1', status: 'success' as const },
            { id: 'cust_2', status: 'success' as const },
          ],
          errors: [],
        };

        mockBaseService.executeBulk.mockResolvedValue(mockResponse);

        const result = await service.bulkUpdateCustomers(operations);

        expect(mockBaseService.executeBulk).toHaveBeenCalledWith('/api/v1/customers/bulk', {
          operations,
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('import/export', () => {
    describe('exportCustomers', () => {
      it('should export customers with filters', async () => {
        const filters: CustomerFilters = { status: 'active' };
        const format = 'csv';

        const mockExportResponse = {
          export_id: 'exp_123',
          status: 'pending' as const,
          format,
        };

        mockBaseService.post.mockResolvedValue(mockExportResponse);

        const result = await service.exportCustomers(filters, format);

        expect(mockBaseService.post).toHaveBeenCalledWith(
          '/api/v1/customers/export',
          undefined,
          {
            params: {
              format,
              status: 'active',
              search: undefined,
              plan: undefined,
              sortBy: undefined,
              sortOrder: undefined,
              page: undefined,
              pageSize: undefined,
            },
          }
        );
        expect(result).toEqual(mockExportResponse);
      });
    });

    describe('importCustomers', () => {
      it('should import customers from file', async () => {
        const file = new File(['csv,data'], 'customers.csv', { type: 'text/csv' });
        const progressCallback = jest.fn();

        const mockImportResponse = {
          import_id: 'imp_123',
          status: 'processing' as const,
          total_records: 100,
          processed_records: 0,
          successful_records: 0,
          failed_records: 0,
          errors: [],
          progress: 0,
        };

        mockBaseService.uploadFile.mockResolvedValue(mockImportResponse);

        const result = await service.importCustomers(file, progressCallback);

        expect(mockBaseService.uploadFile).toHaveBeenCalledWith(
          '/api/v1/customers/import',
          file,
          progressCallback
        );
        expect(result).toEqual(mockImportResponse);
      });
    });
  });
});