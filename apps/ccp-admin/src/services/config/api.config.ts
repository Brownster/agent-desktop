/**
 * @fileoverview API configuration and settings
 * @module services/config/api
 */

import type { APIConfig, QueryConfig } from '../types/api.types';

/**
 * API configuration settings
 * Centralizes all API-related configuration including URLs, timeouts, and retry policies
 */
export const apiConfig: APIConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.agent-desktop.aws',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10),
  websocketURL: import.meta.env.VITE_WS_ENDPOINT || 'wss://ws.agent-desktop.aws',
};

/**
 * React Query configuration settings
 * Defines caching behavior, retry logic, and stale time settings
 */
export const queryConfig: QueryConfig = {
  // Cache data for 5 minutes before considering it stale
  defaultStaleTime: 5 * 60 * 1000,
  
  // Keep unused data in cache for 10 minutes
  defaultGcTime: 10 * 60 * 1000,
  
  /**
   * Custom retry logic based on error type
   * - Retry server errors (5xx) up to 3 times
   * - Don't retry client errors (4xx)
   * - Don't retry network errors after 3 attempts
   */
  retry: (failureCount: number, error: unknown) => {
    // Import here to avoid circular dependency
    const isAPIError = (err: unknown): err is { status?: number } => {
      return typeof err === 'object' && err !== null && 'status' in err;
    };

    if (isAPIError(error)) {
      // Don't retry client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        return false;
      }
      
      // Retry server errors (5xx) up to 3 times
      if (error.status && error.status >= 500) {
        return failureCount < 3;
      }
    }

    // Retry network errors up to 3 times
    return failureCount < 3;
  },
};

/**
 * Environment-specific configuration
 */
export const environmentConfig = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  enableMocking: import.meta.env.VITE_ENABLE_MOCKING === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
} as const;

/**
 * Feature flags for API services
 */
export const featureFlags = {
  enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  enableOptimisticUpdates: import.meta.env.VITE_ENABLE_OPTIMISTIC_UPDATES !== 'false',
  enableBulkOperations: import.meta.env.VITE_ENABLE_BULK_OPERATIONS !== 'false',
  enableExportImport: import.meta.env.VITE_ENABLE_EXPORT_IMPORT !== 'false',
} as const;

/**
 * Cache keys for React Query
 * Centralized location for all query cache keys to avoid conflicts
 */
export const cacheKeys = {
  // Customer-related queries
  customers: ['customers'] as const,
  customer: (id: string) => ['customer', id] as const,
  customerModules: (id: string) => ['customer', id, 'modules'] as const,
  customerIntegrations: (id: string) => ['customer', id, 'integrations'] as const,
  customerMetrics: (id: string) => ['customer', id, 'metrics'] as const,
  customerUsage: (id: string) => ['customer', id, 'usage'] as const,
  customerActivity: (id: string) => ['customer', id, 'activity'] as const,

  // Module-related queries
  modules: ['modules'] as const,
  module: (id: string) => ['module', id] as const,
  moduleCategories: ['modules', 'categories'] as const,
  moduleDependencies: (id: string) => ['module', id, 'dependencies'] as const,

  // Analytics queries
  analytics: ['analytics'] as const,
  analyticsCharts: ['analytics', 'charts'] as const,
  systemMetrics: ['analytics', 'system'] as const,
  performanceMetrics: ['analytics', 'performance'] as const,
  vdiMetrics: ['analytics', 'vdi'] as const,

  // System queries
  systemStatus: ['system', 'status'] as const,
  systemHealth: ['system', 'health'] as const,
  auditLogs: ['system', 'audit'] as const,

  // Configuration queries
  config: (customerId: string) => ['config', customerId] as const,
  configValidation: (customerId: string) => ['config', customerId, 'validation'] as const,
} as const;

/**
 * Default pagination settings
 */
export const paginationDefaults = {
  pageSize: 25,
  maxPageSize: 100,
  defaultSortOrder: 'desc' as const,
} as const;

/**
 * WebSocket configuration
 */
export const websocketConfig = {
  url: apiConfig.websocketURL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  enableCompression: true,
  maxQueueSize: 100,
} as const;

/**
 * HTTP headers used across all API requests
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Version': environmentConfig.apiVersion,
  'X-Client': 'ccp-admin',
  'X-Client-Version': '1.0.0',
} as const;

/**
 * Request timeout configurations for different operation types
 */
export const timeoutConfig = {
  // Standard CRUD operations
  standard: 30000,
  
  // File upload/download operations
  fileOperations: 300000, // 5 minutes
  
  // Bulk operations
  bulkOperations: 600000, // 10 minutes
  
  // Analytics queries
  analytics: 60000, // 1 minute
  
  // Configuration validation
  validation: 10000,
  
  // Real-time operations
  realtime: 5000,
} as const;