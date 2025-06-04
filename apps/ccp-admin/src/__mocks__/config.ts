// Mock API configuration for tests
export const apiConfig = {
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  websocketURL: 'ws://localhost:3000/ws',
};

export const queryConfig = {
  defaultStaleTime: 5 * 60 * 1000,
  defaultGcTime: 10 * 60 * 1000,
  retry: () => false, // Simplified for tests
};

export const environmentConfig = {
  isDevelopment: true,
  isProduction: false,
  apiVersion: 'v1',
  enableDevtools: false,
  enableMocking: true,
  logLevel: 'error',
} as const;

export const featureFlags = {
  enableRealtime: true,
  enableAnalytics: true,
  enableOptimisticUpdates: true,
  enableBulkOperations: true,
  enableExportImport: true,
} as const;

export const cacheKeys = {
  customers: ['customers'] as const,
  customer: (id: string) => ['customer', id] as const,
  customerModules: (id: string) => ['customer', id, 'modules'] as const,
  customerIntegrations: (id: string) => ['customer', id, 'integrations'] as const,
  customerMetrics: (id: string) => ['customer', id, 'metrics'] as const,
  customerUsage: (id: string) => ['customer', id, 'usage'] as const,
  customerActivity: (id: string) => ['customer', id, 'activity'] as const,
  modules: ['modules'] as const,
  module: (id: string) => ['module', id] as const,
  moduleCategories: ['modules', 'categories'] as const,
  moduleDependencies: (id: string) => ['module', id, 'dependencies'] as const,
  analytics: ['analytics'] as const,
  analyticsCharts: ['analytics', 'charts'] as const,
  systemMetrics: ['analytics', 'system'] as const,
  performanceMetrics: ['analytics', 'performance'] as const,
  vdiMetrics: ['analytics', 'vdi'] as const,
  systemStatus: ['system', 'status'] as const,
  systemHealth: ['system', 'health'] as const,
  auditLogs: ['system', 'audit'] as const,
  config: (customerId: string) => ['config', customerId] as const,
  configValidation: (customerId: string) => ['config', customerId, 'validation'] as const,
} as const;

export const paginationDefaults = {
  pageSize: 25,
  maxPageSize: 100,
  defaultSortOrder: 'desc' as const,
} as const;

export const websocketConfig = {
  url: apiConfig.websocketURL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  enableCompression: true,
  maxQueueSize: 100,
} as const;

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Version': environmentConfig.apiVersion,
  'X-Client': 'ccp-admin',
  'X-Client-Version': '1.0.0',
} as const;

export const timeoutConfig = {
  standard: 30000,
  fileOperations: 300000,
  bulkOperations: 600000,
  analytics: 60000,
  validation: 10000,
  realtime: 5000,
} as const;