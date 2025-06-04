/**
 * @fileoverview API service types and interfaces
 * @module services/types/api
 */

import type {
  CustomerConfig,
  ModuleConfig,
  IntegrationConfig,
  ConfigValidationResult,
} from '@agent-desktop/types';

/**
 * Generic API response wrapper
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIErrorDetails;
  readonly timestamp: string;
  readonly requestId: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * API error details
 */
export interface APIErrorDetails {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly validationErrors?: readonly ValidationErrorDetail[];
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
  readonly granularity?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Customer filters for listing
 */
export interface CustomerFilters {
  readonly search?: string;
  readonly status?: 'active' | 'inactive' | 'suspended' | 'trial';
  readonly plan?: 'basic' | 'professional' | 'enterprise' | 'custom';
  readonly sortBy?: 'name' | 'created_at' | 'updated_at' | 'status';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * Module filters for listing
 */
export interface ModuleFilters {
  readonly category?: string;
  readonly status?: 'available' | 'installed' | 'deprecated';
  readonly search?: string;
  readonly sortBy?: 'name' | 'category' | 'version' | 'popularity';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Create customer request
 */
export interface CreateCustomerRequest {
  readonly name: string;
  readonly description?: string;
  readonly plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  readonly branding: Partial<CustomerConfig['branding']>;
  readonly features: Partial<CustomerConfig['features']>;
  readonly security: Partial<CustomerConfig['security']>;
  readonly vdi: Partial<CustomerConfig['vdi']>;
}

/**
 * Update customer request
 */
export interface UpdateCustomerRequest {
  readonly name?: string;
  readonly description?: string;
  readonly plan?: 'basic' | 'professional' | 'enterprise' | 'custom';
  readonly branding?: Partial<CustomerConfig['branding']>;
  readonly features?: Partial<CustomerConfig['features']>;
  readonly security?: Partial<CustomerConfig['security']>;
  readonly vdi?: Partial<CustomerConfig['vdi']>;
  readonly isActive?: boolean;
}

/**
 * Create integration request
 */
export interface CreateIntegrationRequest {
  readonly type: IntegrationConfig['type'];
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly authentication: IntegrationConfig['authentication'];
  readonly endpoints: IntegrationConfig['endpoints'];
  readonly syncSettings: IntegrationConfig['sync_settings'];
  readonly fieldMappings: IntegrationConfig['field_mappings'];
}

/**
 * Integration test result
 */
export interface IntegrationTestResult {
  readonly success: boolean;
  readonly latency: number;
  readonly message: string;
  readonly errors?: readonly string[];
  readonly timestamp: Date;
}

/**
 * Customer metrics for analytics
 */
export interface CustomerMetrics {
  readonly customerId: string;
  readonly activeAgents: number;
  readonly totalContacts: number;
  readonly avgHandleTime: number;
  readonly satisfactionScore: number;
  readonly moduleUsage: readonly ModuleUsageMetric[];
  readonly integrationStatus: readonly IntegrationStatusMetric[];
  readonly timeRange: TimeRange;
}

/**
 * Module usage metric
 */
export interface ModuleUsageMetric {
  readonly moduleId: string;
  readonly moduleName: string;
  readonly usageCount: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
}

/**
 * Integration status metric
 */
export interface IntegrationStatusMetric {
  readonly integrationId: string;
  readonly integrationName: string;
  readonly status: 'connected' | 'disconnected' | 'error';
  readonly lastSync: Date;
  readonly errorCount: number;
}

/**
 * Usage metrics
 */
export interface UsageMetrics {
  readonly customerId: string;
  readonly storageUsed: number;
  readonly bandwidthUsed: number;
  readonly apiCalls: number;
  readonly activeUsers: number;
  readonly peakConcurrency: number;
  readonly timeRange: TimeRange;
}

/**
 * Activity metrics
 */
export interface ActivityMetrics {
  readonly customerId: string;
  readonly events: readonly ActivityEvent[];
  readonly totalEvents: number;
  readonly timeRange: TimeRange;
}

/**
 * Activity event
 */
export interface ActivityEvent {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * System metrics
 */
export interface SystemMetrics {
  readonly totalCustomers: number;
  readonly activeCustomers: number;
  readonly totalModules: number;
  readonly systemLoad: number;
  readonly memoryUsage: number;
  readonly diskUsage: number;
  readonly networkIO: NetworkIOMetrics;
  readonly timestamp: Date;
}

/**
 * Network I/O metrics
 */
export interface NetworkIOMetrics {
  readonly inbound: number;
  readonly outbound: number;
  readonly connections: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly avgResponseTime: number;
  readonly p95ResponseTime: number;
  readonly p99ResponseTime: number;
  readonly errorRate: number;
  readonly throughput: number;
  readonly availability: number;
  readonly timeRange: TimeRange;
}

/**
 * VDI metrics
 */
export interface VDIMetrics {
  readonly platform: string;
  readonly audioQuality: number;
  readonly videoQuality: number;
  readonly latency: number;
  readonly packetLoss: number;
  readonly connectionStability: number;
  readonly timeRange: TimeRange;
}

/**
 * System status
 */
export interface SystemStatus {
  readonly overall: 'healthy' | 'degraded' | 'critical';
  readonly services: readonly ServiceStatus[];
  readonly lastUpdated: Date;
}

/**
 * Service status
 */
export interface ServiceStatus {
  readonly name: string;
  readonly status: 'healthy' | 'degraded' | 'critical';
  readonly responseTime: number;
  readonly errorRate: number;
  readonly lastCheck: Date;
}

/**
 * Connection metrics
 */
export interface ConnectionMetrics {
  readonly totalConnections: number;
  readonly activeConnections: number;
  readonly peakConnections: number;
  readonly avgConnectionDuration: number;
  readonly connectionsByRegion: readonly RegionConnectionMetric[];
}

/**
 * Region connection metric
 */
export interface RegionConnectionMetric {
  readonly region: string;
  readonly connections: number;
  readonly avgLatency: number;
}

/**
 * Queue metrics
 */
export interface QueueMetrics {
  readonly totalQueues: number;
  readonly activeQueues: number;
  readonly totalMessages: number;
  readonly processingRate: number;
  readonly avgProcessingTime: number;
  readonly errorRate: number;
}

/**
 * System event for WebSocket
 */
export interface SystemEvent {
  readonly type: string;
  readonly data: unknown;
  readonly timestamp: Date;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * API configuration
 */
export interface APIConfig {
  readonly baseURL: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly websocketURL: string;
}

/**
 * Query configuration for React Query
 */
export interface QueryConfig {
  readonly defaultStaleTime: number;
  readonly defaultGcTime: number;
  readonly retry: (failureCount: number, error: unknown) => boolean;
}