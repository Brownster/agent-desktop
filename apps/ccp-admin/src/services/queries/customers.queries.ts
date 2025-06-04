/**
 * @fileoverview React Query hooks for customer-related API operations
 * @module services/queries/customers
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CustomerAPIService } from '../api/customers.api';
import { ErrorHandler } from '../errors';
import { cacheKeys, queryConfig } from '../config/api.config';
import type {
  CustomerFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateIntegrationRequest,
  TimeRange,
} from '../types';
import type {
  CustomersResponse,
  CustomerResponse,
  CustomerModulesResponse,
  ConfigValidationResponse,
  BulkOperationResponse,
  ExportResponse,
  ImportResponse,
} from '../types/responses.types';
import type {
  CustomerConfig,
  ModuleConfig,
  IntegrationConfig,
} from '@agent-desktop/types';

/**
 * Customer API service instance
 */
const customerAPI = new CustomerAPIService();

/**
 * Hook for fetching paginated customers list with filtering
 */
export function useCustomers(
  filters?: CustomerFilters,
  options?: UseQueryOptions<CustomersResponse>
) {
  return useQuery({
    queryKey: [...cacheKeys.customers, filters],
    queryFn: () => customerAPI.getCustomers(filters),
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching individual customer details
 */
export function useCustomer(
  customerId: string,
  options?: UseQueryOptions<CustomerResponse>
) {
  return useQuery({
    queryKey: cacheKeys.customer(customerId),
    queryFn: () => customerAPI.getCustomer(customerId),
    enabled: !!customerId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching customer configuration
 */
export function useCustomerConfig(
  customerId: string,
  options?: UseQueryOptions<CustomerConfig>
) {
  return useQuery({
    queryKey: cacheKeys.config(customerId),
    queryFn: () => customerAPI.getCustomerConfig(customerId),
    enabled: !!customerId,
    staleTime: queryConfig.defaultStaleTime * 0.5, // Config changes more frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching customer modules
 */
export function useCustomerModules(
  customerId: string,
  options?: UseQueryOptions<CustomerModulesResponse>
) {
  return useQuery({
    queryKey: cacheKeys.customerModules(customerId),
    queryFn: () => customerAPI.getCustomerModules(customerId),
    enabled: !!customerId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching customer integrations
 */
export function useCustomerIntegrations(
  customerId: string,
  options?: UseQueryOptions<readonly IntegrationConfig[]>
) {
  return useQuery({
    queryKey: cacheKeys.customerIntegrations(customerId),
    queryFn: () => customerAPI.getCustomerIntegrations(customerId),
    enabled: !!customerId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for creating a new customer
 */
export function useCreateCustomer(
  options?: UseMutationOptions<CustomerConfig, unknown, CreateCustomerRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerData: CreateCustomerRequest) => 
      customerAPI.createCustomer(customerData),
    onSuccess: (newCustomer) => {
      // Add to customers list cache
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
      
      // Set individual customer cache
      queryClient.setQueryData(cacheKeys.customer(newCustomer.customer_id), {
        customer: newCustomer,
        modules: [],
        integrations: [],
        usage: null,
        activity: [],
      });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to create customer:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for updating customer information
 */
export function useUpdateCustomer(
  options?: UseMutationOptions<
    CustomerConfig, 
    unknown, 
    { customerId: string; updates: UpdateCustomerRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, updates }) => 
      customerAPI.updateCustomer(customerId, updates),
    onMutate: async ({ customerId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheKeys.customer(customerId) });

      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData(cacheKeys.customer(customerId));

      // Optimistically update cache
      queryClient.setQueryData(cacheKeys.customer(customerId), (old: CustomerResponse) => {
        if (!old) return old;
        return {
          ...old,
          customer: {
            ...old.customer,
            ...updates,
            updatedAt: new Date(),
          },
        };
      });

      return { previousCustomer };
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          cacheKeys.customer(variables.customerId), 
          context.previousCustomer
        );
      }
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to update customer:', apiError);
    },
    onSettled: (data, error, variables) => {
      // Refresh customer data and customers list
      queryClient.invalidateQueries({ queryKey: cacheKeys.customer(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
    },
    ...options,
  });
}

/**
 * Hook for deleting a customer
 */
export function useDeleteCustomer(
  options?: UseMutationOptions<void, unknown, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => customerAPI.deleteCustomer(customerId),
    onSuccess: (_, customerId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: cacheKeys.customer(customerId) });
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to delete customer:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for updating customer configuration
 */
export function useUpdateCustomerConfig(
  options?: UseMutationOptions<
    CustomerConfig,
    unknown,
    { customerId: string; config: Partial<CustomerConfig> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, config }) => 
      customerAPI.updateCustomerConfig(customerId, config),
    onSuccess: (updatedConfig, { customerId }) => {
      // Update configuration cache
      queryClient.setQueryData(cacheKeys.config(customerId), updatedConfig);
      
      // Update customer cache
      queryClient.setQueryData(cacheKeys.customer(customerId), (old: CustomerResponse) => {
        if (!old) return old;
        return {
          ...old,
          customer: updatedConfig,
        };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to update customer configuration:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for validating customer configuration
 */
export function useValidateCustomerConfig(
  customerId: string,
  options?: UseMutationOptions<
    ConfigValidationResponse,
    unknown,
    Partial<CustomerConfig>
  >
) {
  return useMutation({
    mutationFn: (config?: Partial<CustomerConfig>) => 
      customerAPI.validateCustomerConfig(customerId, config),
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to validate customer configuration:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for enabling a module for a customer
 */
export function useEnableModule(
  options?: UseMutationOptions<
    ModuleConfig,
    unknown,
    { customerId: string; moduleId: string; config?: Partial<ModuleConfig> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, moduleId, config }) => 
      customerAPI.enableModule(customerId, moduleId, config),
    onSuccess: (_, { customerId }) => {
      // Invalidate customer modules
      queryClient.invalidateQueries({ queryKey: cacheKeys.customerModules(customerId) });
      queryClient.invalidateQueries({ queryKey: cacheKeys.customer(customerId) });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to enable module:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for disabling a module for a customer
 */
export function useDisableModule(
  options?: UseMutationOptions<
    void,
    unknown,
    { customerId: string; moduleId: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, moduleId }) => 
      customerAPI.disableModule(customerId, moduleId),
    onSuccess: (_, { customerId }) => {
      // Invalidate customer modules
      queryClient.invalidateQueries({ queryKey: cacheKeys.customerModules(customerId) });
      queryClient.invalidateQueries({ queryKey: cacheKeys.customer(customerId) });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to disable module:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for creating customer integration
 */
export function useCreateIntegration(
  options?: UseMutationOptions<
    IntegrationConfig,
    unknown,
    { customerId: string; integration: CreateIntegrationRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, integration }) => 
      customerAPI.createIntegration(customerId, integration),
    onSuccess: (_, { customerId }) => {
      // Invalidate customer integrations
      queryClient.invalidateQueries({ queryKey: cacheKeys.customerIntegrations(customerId) });
      queryClient.invalidateQueries({ queryKey: cacheKeys.customer(customerId) });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to create integration:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for testing integration connectivity
 */
export function useTestIntegration(
  options?: UseMutationOptions<
    { success: boolean; latency: number; message: string },
    unknown,
    { customerId: string; integrationId: string }
  >
) {
  return useMutation({
    mutationFn: ({ customerId, integrationId }) => 
      customerAPI.testIntegration(customerId, integrationId),
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to test integration:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for fetching customer metrics
 */
export function useCustomerMetrics(
  customerId: string,
  timeRange: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.customerMetrics(customerId), timeRange],
    queryFn: () => customerAPI.getCustomerMetrics(customerId, timeRange),
    enabled: !!customerId,
    staleTime: 30000, // Metrics change frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching customer usage statistics
 */
export function useCustomerUsage(
  customerId: string,
  timeRange: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.customerUsage(customerId), timeRange],
    queryFn: () => customerAPI.getCustomerUsage(customerId, timeRange),
    enabled: !!customerId,
    staleTime: 60000, // Usage updates less frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching customer activity
 */
export function useCustomerActivity(
  customerId: string,
  timeRange: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.customerActivity(customerId), timeRange],
    queryFn: () => customerAPI.getCustomerActivity(customerId, timeRange),
    enabled: !!customerId,
    staleTime: 30000, // Activity changes frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for bulk customer operations
 */
export function useBulkUpdateCustomers(
  options?: UseMutationOptions<
    BulkOperationResponse<CustomerConfig>,
    unknown,
    Array<{
      customerId: string;
      operation: 'update' | 'delete' | 'activate' | 'deactivate';
      data?: UpdateCustomerRequest;
    }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operations) => customerAPI.bulkUpdateCustomers(operations),
    onSuccess: () => {
      // Invalidate all customer-related queries
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to execute bulk operations:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for exporting customer data
 */
export function useExportCustomers(
  options?: UseMutationOptions<
    ExportResponse,
    unknown,
    { filters?: CustomerFilters; format?: 'csv' | 'json' | 'xlsx' }
  >
) {
  return useMutation({
    mutationFn: ({ filters, format }) => 
      customerAPI.exportCustomers(filters, format),
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to export customers:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for importing customer data
 */
export function useImportCustomers(
  options?: UseMutationOptions<
    ImportResponse,
    unknown,
    { file: File; onProgress?: (progress: number) => void }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }) => 
      customerAPI.importCustomers(file, onProgress),
    onSuccess: () => {
      // Invalidate customer queries after import
      queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to import customers:', apiError);
    },
    ...options,
  });
}