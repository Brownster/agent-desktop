/**
 * @fileoverview React Query hooks module exports
 * @module services/queries
 */

// Customer queries
export {
  useCustomers,
  useCustomer,
  useCustomerConfig,
  useCustomerModules,
  useCustomerIntegrations,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useUpdateCustomerConfig,
  useValidateCustomerConfig,
  useEnableModule,
  useDisableModule,
  useCreateIntegration,
  useTestIntegration,
  useCustomerMetrics,
  useCustomerUsage,
  useCustomerActivity,
  useBulkUpdateCustomers,
  useExportCustomers,
  useImportCustomers,
} from './customers.queries';

// Module queries
export {
  useModuleCatalog,
  useModule,
  useModuleCategories,
  useFeaturedModules,
  usePopularModules,
  useRecentModules,
  useSearchModules,
  useModulesByCategory,
  useModuleDependencies,
  useModuleDependents,
  useCheckDependencyResolution,
  useModuleStats,
  useModuleVersions,
  useModuleReviews,
  useModuleCompatibility,
  useSubmitModuleReview,
  useReportModuleIssue,
  useBulkModuleOperations,
  useInvalidateModuleQueries,
} from './modules.queries';

// Analytics queries
export {
  useAnalyticsDashboard,
  useAnalyticsChart,
  useSystemMetrics,
  usePerformanceMetrics,
  useVDIMetrics,
  useSystemStatus,
  useSystemHealth,
  useConnectionMetrics,
  useQueueMetrics,
  useCustomerTrends,
  useModuleUsageAnalytics,
  useIntegrationAnalytics,
  useAuditLogs,
  useErrorAnalytics,
  useCustomReport,
  useExportAnalyticsData,
  useRealtimeAnalytics,
  useAnalyticsPreferences,
} from './analytics.queries';