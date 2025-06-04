/**
 * @fileoverview React Query hooks for analytics-related API operations
 * @module services/queries/analytics
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AnalyticsAPIService } from '../api/analytics.api';
import { ErrorHandler } from '../errors';
import { cacheKeys, queryConfig } from '../config/api.config';
import type { TimeRange } from '../types';
import type {
  AnalyticsDashboardResponse,
  AnalyticsChart,
  SystemHealthResponse,
  AuditLogResponse,
} from '../types/responses.types';

/**
 * Analytics API service instance
 */
const analyticsAPI = new AnalyticsAPIService();

/**
 * Hook for fetching analytics dashboard data
 */
export function useAnalyticsDashboard(
  timeRange: TimeRange,
  options?: UseQueryOptions<AnalyticsDashboardResponse>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'dashboard', timeRange],
    queryFn: () => analyticsAPI.getAnalyticsDashboard(timeRange),
    staleTime: 60000, // Analytics data updates every minute
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 300000, // Refetch every 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching specific analytics chart
 */
export function useAnalyticsChart(
  chartId: string,
  timeRange: TimeRange,
  customParams?: Record<string, unknown>,
  options?: UseQueryOptions<AnalyticsChart>
) {
  return useQuery({
    queryKey: [...cacheKeys.analyticsCharts, chartId, timeRange, customParams],
    queryFn: () => analyticsAPI.getAnalyticsChart(chartId, timeRange, customParams),
    enabled: !!chartId,
    staleTime: 60000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 300000,
    ...options,
  });
}

/**
 * Hook for fetching system metrics
 */
export function useSystemMetrics(
  timeRange: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.systemMetrics, timeRange],
    queryFn: () => analyticsAPI.getSystemMetrics(timeRange),
    staleTime: 30000, // System metrics update more frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
}

/**
 * Hook for fetching performance metrics
 */
export function usePerformanceMetrics(
  timeRange: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.performanceMetrics, timeRange],
    queryFn: () => analyticsAPI.getPerformanceMetrics(timeRange),
    staleTime: 30000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 60000,
    ...options,
  });
}

/**
 * Hook for fetching VDI metrics
 */
export function useVDIMetrics(
  timeRange: TimeRange,
  platform?: string,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.vdiMetrics, timeRange, platform],
    queryFn: () => analyticsAPI.getVDIMetrics(timeRange, platform),
    staleTime: 60000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 300000,
    ...options,
  });
}

/**
 * Hook for fetching current system status
 */
export function useSystemStatus(
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: cacheKeys.systemStatus,
    queryFn: () => analyticsAPI.getCurrentSystemStatus(),
    staleTime: 15000, // System status changes rapidly
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Hook for fetching comprehensive system health
 */
export function useSystemHealth(
  options?: UseQueryOptions<SystemHealthResponse>
) {
  return useQuery({
    queryKey: cacheKeys.systemHealth,
    queryFn: () => analyticsAPI.getSystemHealth(),
    staleTime: 30000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 60000,
    ...options,
  });
}

/**
 * Hook for fetching connection metrics
 */
export function useConnectionMetrics(
  timeRange?: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.systemMetrics, 'connections', timeRange],
    queryFn: () => analyticsAPI.getConnectionMetrics(timeRange),
    staleTime: 30000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 60000,
    ...options,
  });
}

/**
 * Hook for fetching queue metrics
 */
export function useQueueMetrics(
  timeRange?: TimeRange,
  options?: UseQueryOptions<any>
) {
  return useQuery({
    queryKey: [...cacheKeys.systemMetrics, 'queues', timeRange],
    queryFn: () => analyticsAPI.getQueueMetrics(timeRange),
    staleTime: 30000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 60000,
    ...options,
  });
}

/**
 * Hook for fetching customer analytics trends
 */
export function useCustomerTrends(
  timeRange: TimeRange,
  options?: UseQueryOptions<{
    totalCustomers: readonly { date: Date; count: number }[];
    activeCustomers: readonly { date: Date; count: number }[];
    newCustomers: readonly { date: Date; count: number }[];
    churnedCustomers: readonly { date: Date; count: number }[];
    revenueByPlan: readonly { plan: string; revenue: number }[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'customers', 'trends', timeRange],
    queryFn: () => analyticsAPI.getCustomerTrends(timeRange),
    staleTime: 300000, // Customer trends change less frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 900000, // Refetch every 15 minutes
    ...options,
  });
}

/**
 * Hook for fetching module usage analytics
 */
export function useModuleUsageAnalytics(
  timeRange: TimeRange,
  options?: UseQueryOptions<{
    popularModules: readonly {
      moduleId: string;
      moduleName: string;
      installCount: number;
      activeUsers: number;
      avgRating: number;
    }[];
    categoryUsage: readonly {
      category: string;
      moduleCount: number;
      totalInstalls: number;
    }[];
    usageTrends: readonly {
      date: Date;
      totalInstalls: number;
      activeModules: number;
    }[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'modules', 'usage', timeRange],
    queryFn: () => analyticsAPI.getModuleUsageAnalytics(timeRange),
    staleTime: 300000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 900000,
    ...options,
  });
}

/**
 * Hook for fetching integration analytics
 */
export function useIntegrationAnalytics(
  timeRange: TimeRange,
  options?: UseQueryOptions<{
    integrationsByType: readonly {
      type: string;
      count: number;
      successRate: number;
      avgResponseTime: number;
    }[];
    integrationHealth: readonly {
      integrationId: string;
      integrationName: string;
      status: 'healthy' | 'degraded' | 'failed';
      lastSync: Date;
      errorCount: number;
    }[];
    syncMetrics: readonly {
      date: Date;
      totalSyncs: number;
      successfulSyncs: number;
      failedSyncs: number;
      avgSyncTime: number;
    }[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'integrations', timeRange],
    queryFn: () => analyticsAPI.getIntegrationAnalytics(timeRange),
    staleTime: 300000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 900000,
    ...options,
  });
}

/**
 * Hook for fetching audit logs
 */
export function useAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  } = {},
  options?: UseQueryOptions<AuditLogResponse>
) {
  return useQuery({
    queryKey: [...cacheKeys.auditLogs, filters],
    queryFn: () => analyticsAPI.getAuditLogs(filters),
    staleTime: 60000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching error analytics
 */
export function useErrorAnalytics(
  timeRange: TimeRange,
  options?: UseQueryOptions<{
    errorsByType: readonly {
      type: string;
      count: number;
      percentage: number;
    }[];
    errorTrends: readonly {
      date: Date;
      totalErrors: number;
      criticalErrors: number;
      resolvedErrors: number;
    }[];
    topErrors: readonly {
      message: string;
      count: number;
      firstSeen: Date;
      lastSeen: Date;
      status: 'open' | 'investigating' | 'resolved';
    }[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'errors', timeRange],
    queryFn: () => analyticsAPI.getErrorAnalytics(timeRange),
    staleTime: 120000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    refetchInterval: 300000,
    ...options,
  });
}

/**
 * Hook for fetching custom reports
 */
export function useCustomReport(
  reportId: string,
  parameters: Record<string, unknown> = {},
  options?: UseQueryOptions<{
    reportId: string;
    title: string;
    description: string;
    generatedAt: Date;
    data: readonly Record<string, unknown>[];
    charts: readonly AnalyticsChart[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.analytics, 'reports', reportId, parameters],
    queryFn: () => analyticsAPI.getCustomReport(reportId, parameters),
    enabled: !!reportId,
    staleTime: 300000,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for exporting analytics data
 */
export function useExportAnalyticsData(
  options?: UseMutationOptions<
    { downloadUrl: string; expiresAt: Date },
    unknown,
    {
      type: 'dashboard' | 'metrics' | 'audit' | 'custom';
      parameters: Record<string, unknown>;
      format?: 'csv' | 'json' | 'xlsx';
    }
  >
) {
  return useMutation({
    mutationFn: ({ type, parameters, format = 'csv' }) => 
      analyticsAPI.exportAnalyticsData(type, parameters, format),
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to export analytics data:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for real-time analytics updates
 * Manages automatic refresh intervals based on data freshness requirements
 */
export function useRealtimeAnalytics(
  enabled = true
) {
  const queryClient = useQueryClient();

  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.analytics });
  }, [queryClient]);

  const refreshSystemMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.systemMetrics });
  }, [queryClient]);

  const refreshPerformanceMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.performanceMetrics });
  }, [queryClient]);

  const refreshSystemStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.systemStatus });
  }, [queryClient]);

  // Set up automatic refresh intervals
  useEffect(() => {
    if (!enabled) return;

    // Refresh system status every 15 seconds
    const statusInterval = setInterval(refreshSystemStatus, 15000);

    // Refresh system metrics every minute
    const metricsInterval = setInterval(refreshSystemMetrics, 60000);

    // Refresh performance metrics every minute
    const performanceInterval = setInterval(refreshPerformanceMetrics, 60000);

    // Refresh dashboard every 5 minutes
    const dashboardInterval = setInterval(refreshDashboard, 300000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(metricsInterval);
      clearInterval(performanceInterval);
      clearInterval(dashboardInterval);
    };
  }, [
    enabled,
    refreshDashboard,
    refreshSystemMetrics,
    refreshPerformanceMetrics,
    refreshSystemStatus,
  ]);

  return {
    refreshDashboard,
    refreshSystemMetrics,
    refreshPerformanceMetrics,
    refreshSystemStatus,
  };
}

/**
 * Hook for managing analytics preferences and settings
 */
export function useAnalyticsPreferences() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute default
  const [enableAlerts, setEnableAlerts] = useState(true);

  // Persist preferences to localStorage
  useEffect(() => {
    const preferences = localStorage.getItem('analytics-preferences');
    if (preferences) {
      try {
        const parsed = JSON.parse(preferences);
        setAutoRefresh(parsed.autoRefresh ?? true);
        setRefreshInterval(parsed.refreshInterval ?? 60000);
        setEnableAlerts(parsed.enableAlerts ?? true);
      } catch (error) {
        console.warn('Failed to parse analytics preferences from localStorage');
      }
    }
  }, []);

  const savePreferences = useCallback(() => {
    const preferences = {
      autoRefresh,
      refreshInterval,
      enableAlerts,
    };
    localStorage.setItem('analytics-preferences', JSON.stringify(preferences));
  }, [autoRefresh, refreshInterval, enableAlerts]);

  useEffect(() => {
    savePreferences();
  }, [savePreferences]);

  return {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    enableAlerts,
    setEnableAlerts,
  };
}