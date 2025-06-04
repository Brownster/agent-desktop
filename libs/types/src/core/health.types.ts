/**
 * @fileoverview Health monitoring types for system observability
 * @module @agent-desktop/types/core/health
 */

/**
 * Health status levels
 */
export enum HealthStatusLevel {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * Health check types
 */
export enum HealthCheckType {
  READINESS = 'readiness',
  LIVENESS = 'liveness',
  DEPENDENCY = 'dependency',
  CUSTOM = 'custom',
}

/**
 * Health status interface
 */
export interface HealthStatus {
  readonly status: HealthStatusLevel;
  readonly timestamp: Date;
  readonly checks: readonly HealthCheck[];
  readonly summary: HealthSummary;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Individual health check
 */
export interface HealthCheck {
  readonly name: string;
  readonly type: HealthCheckType;
  readonly status: HealthStatusLevel;
  readonly message?: string;
  readonly duration: number;
  readonly timestamp: Date;
  readonly critical: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly error?: HealthCheckError;
}

/**
 * Health check error information
 */
export interface HealthCheckError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
}

/**
 * Health summary aggregation
 */
export interface HealthSummary {
  readonly overallStatus: HealthStatusLevel;
  readonly totalChecks: number;
  readonly healthyChecks: number;
  readonly degradedChecks: number;
  readonly unhealthyChecks: number;
  readonly criticalChecks: number;
  readonly unknownChecks: number;
  readonly averageDuration: number;
  readonly longestCheck: string;
  readonly shortestCheck: string;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  readonly name: string;
  readonly type: HealthCheckType;
  readonly interval: number;
  readonly timeout: number;
  readonly critical: boolean;
  readonly enabled: boolean;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly thresholds: HealthThresholds;
}

/**
 * Health check thresholds
 */
export interface HealthThresholds {
  readonly responseTimeWarning: number;
  readonly responseTimeCritical: number;
  readonly errorRateWarning: number;
  readonly errorRateCritical: number;
  readonly memoryUsageWarning: number;
  readonly memoryUsageCritical: number;
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  readonly cpu: CPUMetrics;
  readonly memory: MemoryMetrics;
  readonly network: NetworkMetrics;
  readonly storage: StorageMetrics;
  readonly application: ApplicationMetrics;
}

/**
 * CPU usage metrics
 */
export interface CPUMetrics {
  readonly usage: number;
  readonly loadAverage: readonly number[];
  readonly coreCount: number;
  readonly processUsage: number;
}

/**
 * Memory usage metrics
 */
export interface MemoryMetrics {
  readonly total: number;
  readonly used: number;
  readonly free: number;
  readonly usage: number;
  readonly heapTotal: number;
  readonly heapUsed: number;
  readonly external: number;
}

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
  readonly latency: number;
  readonly throughput: number;
  readonly packetsLost: number;
  readonly connectionCount: number;
  readonly bandwidth: number;
}

/**
 * Storage metrics
 */
export interface StorageMetrics {
  readonly total: number;
  readonly used: number;
  readonly free: number;
  readonly usage: number;
  readonly readLatency: number;
  readonly writeLatency: number;
}

/**
 * Application-specific metrics
 */
export interface ApplicationMetrics {
  readonly uptime: number;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly responseTime: number;
  readonly activeConnections: number;
  readonly moduleStatus: Record<string, HealthStatusLevel>;
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  readonly enabled: boolean;
  readonly interval: number;
  readonly timeout: number;
  readonly checks: readonly HealthCheckConfig[];
  readonly alerts: HealthAlertConfig;
  readonly retention: HealthRetentionConfig;
}

/**
 * Health alert configuration
 */
export interface HealthAlertConfig {
  readonly enabled: boolean;
  readonly webhook?: string;
  readonly email?: readonly string[];
  readonly thresholds: HealthThresholds;
  readonly cooldownPeriod: number;
}

/**
 * Health data retention configuration
 */
export interface HealthRetentionConfig {
  readonly maxEntries: number;
  readonly maxAge: number;
  readonly compressionEnabled: boolean;
  readonly exportEnabled: boolean;
}

/**
 * Health event for monitoring and alerting
 */
export interface HealthEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: 'status_change' | 'check_failed' | 'alert_triggered' | 'recovery';
  readonly source: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
  readonly resolved: boolean;
  readonly resolvedAt?: Date;
}

/**
 * Health monitor interface
 */
export interface HealthMonitor {
  /**
   * Start health monitoring
   */
  start(): Promise<void>;
  
  /**
   * Stop health monitoring
   */
  stop(): Promise<void>;
  
  /**
   * Get current health status
   */
  getHealthStatus(): Promise<HealthStatus>;
  
  /**
   * Register a health check
   */
  registerCheck(check: HealthCheckConfig, handler: HealthCheckHandler): void;
  
  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void;
  
  /**
   * Force run all health checks
   */
  runChecks(): Promise<HealthStatus>;
  
  /**
   * Get health history
   */
  getHealthHistory(limit?: number): Promise<readonly HealthStatus[]>;
}

/**
 * Health check handler function
 */
export type HealthCheckHandler = () => Promise<HealthCheckResult>;

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly status: HealthStatusLevel;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}