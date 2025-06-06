/**
 * @fileoverview Analytics API service for metrics, monitoring, and reporting
 * @module services/api/analytics
 */

import { BaseAPIService } from './base.api';
import type {
  TimeRange,
  SystemMetrics,
  PerformanceMetrics,
  VDIMetrics,
  SystemStatus,
  ConnectionMetrics,
  QueueMetrics,
} from '../types';
import type {
  AnalyticsDashboardResponse,
  AnalyticsChart,
  SystemHealthResponse,
  AuditLogResponse,
  AuditLogEntry,
} from '../types/responses.types';

/**
 * Analytics API service for system monitoring, metrics collection, and reporting
 * Provides comprehensive analytics and monitoring capabilities for the admin dashboard
 */
export class AnalyticsAPIService extends BaseAPIService {
  private readonly baseEndpoint = '/api/v1/analytics';

  /**
   * Get analytics dashboard with summary, charts, and alerts
   */
  async getAnalyticsDashboard(timeRange: TimeRange): Promise<AnalyticsDashboardResponse> {
    this.logger.info('Fetching analytics dashboard', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);
    
    return this.executeAnalytics<AnalyticsDashboardResponse>(
      `${this.baseEndpoint}/dashboard`,
      params
    );
  }

  /**
   * Get specific analytics chart data
   */
  async getAnalyticsChart(
    chartId: string,
    timeRange: TimeRange,
    customParams?: Record<string, unknown>
  ): Promise<AnalyticsChart> {
    this.logger.info('Fetching analytics chart', { chartId, timeRange });

    if (!chartId) {
      throw new Error('Chart ID is required');
    }

    const params = {
      ...this.buildTimeRangeParams(timeRange),
      ...customParams,
    };

    return this.executeAnalytics<AnalyticsChart>(
      `${this.baseEndpoint}/charts/${chartId}`,
      params
    );
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(timeRange: TimeRange): Promise<SystemMetrics> {
    this.logger.info('Fetching system metrics', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<SystemMetrics>(
      `${this.baseEndpoint}/system/metrics`,
      params
    );
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeRange: TimeRange): Promise<PerformanceMetrics> {
    this.logger.info('Fetching performance metrics', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<PerformanceMetrics>(
      `${this.baseEndpoint}/system/performance`,
      params
    );
  }

  /**
   * Get VDI-specific metrics
   */
  async getVDIMetrics(
    timeRange: TimeRange,
    platform?: string
  ): Promise<VDIMetrics> {
    this.logger.info('Fetching VDI metrics', { timeRange, platform });

    const params = {
      ...this.buildTimeRangeParams(timeRange),
      platform,
    };

    return this.executeAnalytics<VDIMetrics>(
      `${this.baseEndpoint}/vdi/metrics`,
      params
    );
  }

  /**
   * Get current system status
   */
  async getCurrentSystemStatus(): Promise<SystemStatus> {
    this.logger.info('Fetching current system status');

    return this.get<SystemStatus>(`${this.baseEndpoint}/system/status`);
  }

  /**
   * Get comprehensive system health information
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    this.logger.info('Fetching system health');

    return this.get<SystemHealthResponse>(`${this.baseEndpoint}/system/health`);
  }

  /**
   * Get active connection metrics
   */
  async getConnectionMetrics(timeRange?: TimeRange): Promise<ConnectionMetrics> {
    this.logger.info('Fetching connection metrics', { timeRange });

    const params = timeRange ? this.buildTimeRangeParams(timeRange) : {};

    return this.executeAnalytics<ConnectionMetrics>(
      `${this.baseEndpoint}/connections/metrics`,
      params
    );
  }

  /**
   * Get queue performance metrics
   */
  async getQueueMetrics(timeRange?: TimeRange): Promise<QueueMetrics> {
    this.logger.info('Fetching queue metrics', { timeRange });

    const params = timeRange ? this.buildTimeRangeParams(timeRange) : {};

    return this.executeAnalytics<QueueMetrics>(
      `${this.baseEndpoint}/queues/metrics`,
      params
    );
  }

  /**
   * Get customer analytics trends
   */
  async getCustomerTrends(timeRange: TimeRange): Promise<{
    totalCustomers: readonly { date: Date; count: number }[];
    activeCustomers: readonly { date: Date; count: number }[];
    newCustomers: readonly { date: Date; count: number }[];
    churnedCustomers: readonly { date: Date; count: number }[];
    revenueByPlan: readonly { plan: string; revenue: number }[];
  }> {
    this.logger.info('Fetching customer trends', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<{
      totalCustomers: readonly { date: Date; count: number }[];
      activeCustomers: readonly { date: Date; count: number }[];
      newCustomers: readonly { date: Date; count: number }[];
      churnedCustomers: readonly { date: Date; count: number }[];
      revenueByPlan: readonly { plan: string; revenue: number }[];
    }>(`${this.baseEndpoint}/customers/trends`, params);
  }

  /**
   * Get module usage analytics
   */
  async getModuleUsageAnalytics(timeRange: TimeRange): Promise<{
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
  }> {
    this.logger.info('Fetching module usage analytics', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<{
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
    }>(`${this.baseEndpoint}/modules/usage`, params);
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(timeRange: TimeRange): Promise<{
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
  }> {
    this.logger.info('Fetching integration analytics', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<{
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
    }>(`${this.baseEndpoint}/integrations/analytics`, params);
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<AuditLogResponse> {
    this.logger.info('Fetching audit logs', { filters });

    const params = this.buildAuditLogFilters(filters);

    const paginatedItemsResponse = await this.getPaginated<AuditLogEntry>(
      `${this.baseEndpoint}/audit/logs`,
      params
    );

    const summary = await this.getAuditLogSummary(filters);

    return {
      items: paginatedItemsResponse.items,
      total: paginatedItemsResponse.total,
      page: paginatedItemsResponse.page,
      pageSize: paginatedItemsResponse.pageSize,
      hasNextPage: paginatedItemsResponse.hasNextPage,
      hasPreviousPage: paginatedItemsResponse.hasPreviousPage,
      summary,
    };
  }

  /**
   * Get error analytics and trends
   */
  async getErrorAnalytics(timeRange: TimeRange): Promise<{
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
  }> {
    this.logger.info('Fetching error analytics', { timeRange });

    const params = this.buildTimeRangeParams(timeRange);

    return this.executeAnalytics<{
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
    }>(`${this.baseEndpoint}/errors/analytics`, params);
  }

  /**
   * Get custom report data
   */
  async getCustomReport(
    reportId: string,
    parameters: Record<string, unknown> = {}
  ): Promise<{
    reportId: string;
    title: string;
    description: string;
    generatedAt: Date;
    data: readonly Record<string, unknown>[];
    charts: readonly AnalyticsChart[];
  }> {
    this.logger.info('Fetching custom report', { reportId, parameters });

    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return this.executeAnalytics<{
      reportId: string;
      title: string;
      description: string;
      generatedAt: Date;
      data: readonly Record<string, unknown>[];
      charts: readonly AnalyticsChart[];
    }>(`${this.baseEndpoint}/reports/${reportId}`, parameters);
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(
    type: 'dashboard' | 'metrics' | 'audit' | 'custom',
    parameters: Record<string, unknown>,
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    this.logger.info('Exporting analytics data', { type, format, parameters });

    const validTypes = ['dashboard', 'metrics', 'audit', 'custom'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid export type. Must be one of: ${validTypes.join(', ')}`);
    }

    return this.post<{ downloadUrl: string; expiresAt: Date }>(
      `${this.baseEndpoint}/export`,
      {
        type,
        format,
        parameters,
      }
    );
  }

  /**
   * Build time range parameters for API requests
   */
  private buildTimeRangeParams(timeRange: TimeRange): Record<string, string> {
    return {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      granularity: timeRange.granularity || 'hour',
    };
  }

  /**
   * Build audit log filter parameters
   */
  private buildAuditLogFilters(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (filters.userId) params.userId = filters.userId;
    if (filters.action) params.action = filters.action;
    if (filters.resourceType) params.resourceType = filters.resourceType;
    if (filters.startDate) params.startDate = filters.startDate.toISOString();
    if (filters.endDate) params.endDate = filters.endDate.toISOString();
    if (filters.page) params.page = filters.page;
    if (filters.pageSize) params.pageSize = filters.pageSize;

    return params;
  }

  /**
   * Get audit log summary statistics
   */
  private async getAuditLogSummary(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogResponse['summary']> {
    try {
      const params = this.buildAuditLogFilters(filters);
      
      return await this.get<AuditLogResponse['summary']>(
        `${this.baseEndpoint}/audit/summary`,
        { params }
      );
    } catch (error) {
      this.logger.warn('Failed to fetch audit log summary', { error });
      
      // Return default summary if request fails
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByUser: {},
      };
    }
  }
}