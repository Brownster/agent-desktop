/**
 * @fileoverview API response schemas and interfaces
 * @module services/types/responses
 */

import type {
  CustomerConfig,
  ModuleConfig,
  IntegrationConfig,
} from '@agent-desktop/types';
import type {
  PaginatedResponse,
  UsageMetrics,
  ActivityMetrics,
  SystemMetrics,
  PerformanceMetrics,
  VDIMetrics,
  SystemStatus,
  ConnectionMetrics,
  QueueMetrics,
} from './api.types';

/**
 * Customer list response
 */
export interface CustomersResponse extends PaginatedResponse<CustomerConfig> {
  readonly summary: {
    readonly totalActive: number;
    readonly totalInactive: number;
    readonly totalByPlan: Record<string, number>;
  };
}

/**
 * Customer details response
 */
export interface CustomerResponse {
  readonly customer: CustomerConfig;
  readonly modules: readonly ModuleConfig[];
  readonly integrations: readonly IntegrationConfig[];
  readonly usage: UsageMetrics;
  activity: ActivityMetrics['events'];
}

/**
 * Module catalog response
 */
export interface ModuleCatalogResponse extends PaginatedResponse<ModuleInfo> {
  readonly categories: readonly ModuleCategory[];
  readonly featured: readonly ModuleInfo[];
}

/**
 * Module information
 */
export interface ModuleInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly author: string;
  readonly license: string;
  readonly documentation_url: string;
  readonly repository_url: string;
  readonly icon_url?: string;
  readonly screenshots: readonly string[];
  readonly tags: readonly string[];
  readonly dependencies: readonly ModuleDependency[];
  readonly config_schema: Record<string, unknown>;
  readonly install_count: number;
  readonly rating: number;
  readonly last_updated: Date;
  readonly status: 'available' | 'deprecated' | 'beta';
  readonly pricing: ModulePricing;
}

/**
 * Module category
 */
export interface ModuleCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly module_count: number;
}

/**
 * Module dependency
 */
export interface ModuleDependency {
  readonly module_id: string;
  readonly module_name: string;
  readonly version_constraint: string;
  readonly required: boolean;
}

/**
 * Module pricing information
 */
export interface ModulePricing {
  readonly type: 'free' | 'paid' | 'subscription';
  readonly price?: number;
  readonly currency?: string;
  readonly billing_period?: 'monthly' | 'yearly';
  readonly trial_days?: number;
}

/**
 * Customer module installation response
 */
export interface CustomerModulesResponse {
  readonly modules: readonly CustomerModuleInfo[];
  readonly available: readonly ModuleInfo[];
  readonly dependencies: readonly ModuleDependencyCheck[];
}

/**
 * Customer module information
 */
export interface CustomerModuleInfo extends ModuleConfig {
  readonly info: ModuleInfo;
  readonly status: 'enabled' | 'disabled' | 'error' | 'updating';
  readonly installed_at: Date;
  readonly last_updated: Date;
  readonly usage_stats: ModuleUsageStats;
}

/**
 * Module usage statistics
 */
export interface ModuleUsageStats {
  readonly total_calls: number;
  readonly avg_response_time: number;
  readonly error_rate: number;
  readonly last_used: Date;
  readonly peak_usage: Date;
}

/**
 * Module dependency check
 */
export interface ModuleDependencyCheck {
  readonly module_id: string;
  readonly dependency_id: string;
  readonly status: 'satisfied' | 'missing' | 'conflict';
  readonly required_version: string;
  readonly installed_version?: string;
  readonly message: string;
}

/**
 * Analytics dashboard response
 */
export interface AnalyticsDashboardResponse {
  readonly summary: AnalyticsSummary;
  readonly charts: readonly AnalyticsChart[];
  readonly alerts: readonly AnalyticsAlert[];
  readonly timeRange: {
    readonly start: Date;
    readonly end: Date;
  };
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  readonly totalCustomers: number;
  readonly activeCustomers: number;
  readonly totalContacts: number;
  readonly avgSatisfactionScore: number;
  readonly systemUptime: number;
  readonly trends: {
    readonly customers: number;
    readonly contacts: number;
    readonly satisfaction: number;
  };
}

/**
 * Analytics chart data
 */
export interface AnalyticsChart {
  readonly id: string;
  readonly title: string;
  readonly type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  readonly data: readonly ChartDataPoint[];
  readonly metadata: ChartMetadata;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  readonly x: string | number | Date;
  readonly y: number;
  readonly label?: string;
  readonly color?: string;
}

/**
 * Chart metadata
 */
export interface ChartMetadata {
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly unit?: string;
  readonly format?: 'number' | 'percentage' | 'currency' | 'duration';
  readonly colors?: readonly string[];
}

/**
 * Analytics alert
 */
export interface AnalyticsAlert {
  readonly id: string;
  readonly type: 'info' | 'warning' | 'error' | 'critical';
  readonly title: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly acknowledged: boolean;
  readonly actions?: readonly AlertAction[];
}

/**
 * Alert action
 */
export interface AlertAction {
  readonly id: string;
  readonly label: string;
  readonly type: 'button' | 'link';
  readonly url?: string;
  readonly action?: string;
}

/**
 * System health response
 */
export interface SystemHealthResponse {
  readonly status: SystemStatus;
  readonly metrics: SystemMetrics;
  readonly performance: PerformanceMetrics;
  readonly connections: ConnectionMetrics;
  readonly queues: QueueMetrics;
  readonly vdi?: VDIMetrics;
}

/**
 * Audit log response
 */
export interface AuditLogResponse extends PaginatedResponse<AuditLogEntry> {
  readonly summary: {
    readonly totalEvents: number;
    readonly eventsByType: Record<string, number>;
    readonly eventsByUser: Record<string, number>;
  };
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  readonly id: string;
  readonly timestamp: Date;
  readonly user_id: string;
  readonly user_name: string;
  readonly action: string;
  readonly resource_type: string;
  readonly resource_id: string;
  readonly details: Record<string, unknown>;
  readonly ip_address: string;
  readonly user_agent: string;
  readonly status: 'success' | 'failure' | 'partial';
}

/**
 * Configuration validation response
 */
export interface ConfigValidationResponse {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly suggestions: readonly ValidationSuggestion[];
}

/**
 * Configuration validation error
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error';
}

/**
 * Configuration validation warning
 */
export interface ValidationWarning {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'warning';
}

/**
 * Configuration validation suggestion
 */
export interface ValidationSuggestion {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'info';
  readonly suggestion: unknown;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T = unknown> {
  readonly total: number;
  readonly successful: number;
  readonly failed: number;
  readonly results: readonly BulkOperationResult<T>[];
  readonly errors: readonly BulkOperationError[];
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = unknown> {
  readonly id: string;
  readonly status: 'success' | 'failure';
  readonly data?: T;
  readonly error?: string;
}

/**
 * Bulk operation error
 */
export interface BulkOperationError {
  readonly id: string;
  readonly error: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Export response
 */
export interface ExportResponse {
  readonly export_id: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly format: 'csv' | 'json' | 'xlsx';
  readonly download_url?: string;
  readonly expires_at?: Date;
  readonly progress?: number;
  readonly error?: string;
}

/**
 * Import response
 */
export interface ImportResponse {
  readonly import_id: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly total_records: number;
  readonly processed_records: number;
  readonly successful_records: number;
  readonly failed_records: number;
  readonly errors: readonly ImportError[];
  readonly progress: number;
}

/**
 * Import error
 */
export interface ImportError {
  readonly row: number;
  readonly column?: string;
  readonly message: string;
  readonly value?: unknown;
}