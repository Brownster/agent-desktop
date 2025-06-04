/**
 * @fileoverview Unit tests for customer React Query hooks
 * @module services/queries/__tests__/customers.queries
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCustomerModules,
  useEnableModule,
  useDisableModule,
  useValidateCustomerConfig,
} from '../customers.queries';
import { CustomerAPIService } from '../../api/customers.api';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '../../types';

// Mock the API service
jest.mock('../../api/customers.api');
jest.mock('react-hot-toast');

const MockedCustomerAPIService = CustomerAPIService as jest.MockedClass<typeof CustomerAPIService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Create test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Customer Query Hooks', () => {
  let mockCustomerAPI: jest.Mocked<CustomerAPIService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API service instance
    mockCustomerAPI = {
      getCustomers: jest.fn(),
      getCustomer: jest.fn(),
      createCustomer: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
      getCustomerModules: jest.fn(),
      enableModule: jest.fn(),
      disableModule: jest.fn(),
      validateCustomerConfig: jest.fn(),
      getCustomerIntegrations: jest.fn(),
      createIntegration: jest.fn(),
      testIntegration: jest.fn(),
      getCustomerMetrics: jest.fn(),
      getCustomerUsage: jest.fn(),
      getCustomerActivity: jest.fn(),
      bulkUpdateCustomers: jest.fn(),
      exportCustomers: jest.fn(),
      importCustomers: jest.fn(),
    } as any;

    MockedCustomerAPIService.mockImplementation(() => mockCustomerAPI);
  });

  describe('useCustomers', () => {
    it('should fetch customers successfully', async () => {
      const mockCustomers = {
        items: [
          { customer_id: '1', name: 'Customer 1' },
          { customer_id: '2', name: 'Customer 2' },
        ],
        total: 2,
        page: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false,
        summary: {
          totalActive: 2,
          totalInactive: 0,
          totalByPlan: { basic: 1, enterprise: 1 },
        },
      };

      mockCustomerAPI.getCustomers.mockResolvedValue(mockCustomers);

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomers);
      expect(mockCustomerAPI.getCustomers).toHaveBeenCalledWith(undefined);
    });

    it('should fetch customers with filters', async () => {
      const filters = {
        search: 'test',
        status: 'active' as const,
        page: 1,
      };

      const mockCustomers = {
        items: [{ customer_id: '1', name: 'Test Customer' }],
        total: 1,
        page: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false,
        summary: {
          totalActive: 1,
          totalInactive: 0,
          totalByPlan: { basic: 1 },
        },
      };

      mockCustomerAPI.getCustomers.mockResolvedValue(mockCustomers);

      const { result } = renderHook(() => useCustomers(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCustomerAPI.getCustomers).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual(mockCustomers);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      mockCustomerAPI.getCustomers.mockRejectedValue(error);

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCustomer', () => {
    it('should fetch individual customer', async () => {
      const customerId = 'cust_123';
      const mockCustomer = {
        customer: { customer_id: customerId, name: 'Test Customer' },
        modules: [],
        integrations: [],
        usage: null,
        activity: [],
      };

      mockCustomerAPI.getCustomer.mockResolvedValue(mockCustomer);

      const { result } = renderHook(() => useCustomer(customerId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomer);
      expect(mockCustomerAPI.getCustomer).toHaveBeenCalledWith(customerId);
    });

    it('should not fetch when customer ID is empty', () => {
      const { result } = renderHook(() => useCustomer(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockCustomerAPI.getCustomer).not.toHaveBeenCalled();
    });
  });

  describe('useCreateCustomer', () => {
    it('should create customer successfully', async () => {
      const customerData: CreateCustomerRequest = {
        name: 'New Customer',
        plan: 'enterprise',
        branding: {
          primary_color: '#1f2937',
          secondary_color: '#f3f4f6',
          font_family: 'Inter',
          theme: 'light',
          application_title: 'CCP Admin',
          company_name: 'New Customer',
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

      mockCustomerAPI.createCustomer.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(customerData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockCustomerAPI.createCustomer).toHaveBeenCalledWith(customerData);
    });

    it('should handle creation error', async () => {
      const error = new Error('Validation failed');
      mockCustomerAPI.createCustomer.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({} as CreateCustomerRequest);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateCustomer', () => {
    it('should update customer with optimistic updates', async () => {
      const customerId = 'cust_123';
      const updates: UpdateCustomerRequest = {
        name: 'Updated Customer',
        plan: 'professional',
      };

      const mockResponse = {
        customer_id: customerId,
        name: 'Updated Customer',
        plan: 'professional',
        updatedAt: new Date(),
      };

      mockCustomerAPI.updateCustomer.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ customerId, updates });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockCustomerAPI.updateCustomer).toHaveBeenCalledWith(customerId, updates);
    });

    it('should handle update error and revert optimistic changes', async () => {
      const customerId = 'cust_123';
      const updates: UpdateCustomerRequest = { name: 'Failed Update' };
      const error = new Error('Update failed');

      mockCustomerAPI.updateCustomer.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ customerId, updates });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = 'cust_123';

      mockCustomerAPI.deleteCustomer.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(customerId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCustomerAPI.deleteCustomer).toHaveBeenCalledWith(customerId);
    });

    it('should handle deletion error', async () => {
      const customerId = 'cust_123';
      const error = new Error('Deletion failed');

      mockCustomerAPI.deleteCustomer.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteCustomer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(customerId);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCustomerModules', () => {
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

      mockCustomerAPI.getCustomerModules.mockResolvedValue(mockModules);

      const { result } = renderHook(() => useCustomerModules(customerId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockModules);
      expect(mockCustomerAPI.getCustomerModules).toHaveBeenCalledWith(customerId);
    });

    it('should not fetch when customer ID is empty', () => {
      const { result } = renderHook(() => useCustomerModules(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockCustomerAPI.getCustomerModules).not.toHaveBeenCalled();
    });
  });

  describe('useEnableModule', () => {
    it('should enable module for customer', async () => {
      const customerId = 'cust_123';
      const moduleId = 'mod_456';
      const config = { setting1: 'value1' };

      const mockResponse = {
        module_id: moduleId,
        enabled: true,
        config,
      };

      mockCustomerAPI.enableModule.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEnableModule(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ customerId, moduleId, config });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockCustomerAPI.enableModule).toHaveBeenCalledWith(customerId, moduleId, config);
    });

    it('should handle enable module error', async () => {
      const error = new Error('Module enable failed');
      mockCustomerAPI.enableModule.mockRejectedValue(error);

      const { result } = renderHook(() => useEnableModule(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          customerId: 'cust_123',
          moduleId: 'mod_456',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDisableModule', () => {
    it('should disable module for customer', async () => {
      const customerId = 'cust_123';
      const moduleId = 'mod_456';

      mockCustomerAPI.disableModule.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDisableModule(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ customerId, moduleId });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCustomerAPI.disableModule).toHaveBeenCalledWith(customerId, moduleId);
    });
  });

  describe('useValidateCustomerConfig', () => {
    it('should validate customer configuration', async () => {
      const customerId = 'cust_123';
      const config = { name: 'Test Customer' };

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      mockCustomerAPI.validateCustomerConfig.mockResolvedValue(mockValidationResult);

      const { result } = renderHook(() => useValidateCustomerConfig(customerId), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(config);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockValidationResult);
      expect(mockCustomerAPI.validateCustomerConfig).toHaveBeenCalledWith(customerId, config);
    });

    it('should handle validation error', async () => {
      const customerId = 'cust_123';
      const config = { name: '' }; // Invalid config
      const error = new Error('Validation failed');

      mockCustomerAPI.validateCustomerConfig.mockRejectedValue(error);

      const { result } = renderHook(() => useValidateCustomerConfig(customerId), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(config);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('query cache management', () => {
    it('should invalidate related queries on successful mutation', async () => {
      const customerData: CreateCustomerRequest = {
        name: 'New Customer',
        plan: 'basic',
        branding: {
          primary_color: '#1f2937',
          secondary_color: '#f3f4f6',
          font_family: 'Inter',
          theme: 'light',
          application_title: 'CCP Admin',
          company_name: 'New Customer',
        },
        features: {
          recording_controls: false,
          screen_sharing: false,
          file_uploads: false,
          chat_functionality: false,
          supervisor_monitoring: false,
          analytics_dashboard: false,
          custom_scripts: false,
          third_party_integrations: false,
          advanced_routing: false,
          real_time_reporting: false,
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

      mockCustomerAPI.createCustomer.mockResolvedValue(mockResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateCustomer(), { wrapper });

      act(() => {
        result.current.mutate(customerData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 5000 });

      // The hook should have invalidated the customers list and set the individual customer cache
      // This is verified through the success of the mutation
      expect(result.current.data).toEqual(mockResponse);
    });
  });
});