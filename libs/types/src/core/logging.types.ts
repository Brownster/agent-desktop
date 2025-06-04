/**
 * @fileoverview Logging types for enterprise-grade structured logging
 * @module @agent-desktop/types/core/logging
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Transport types for different logging outputs
 */
export type TransportType = 'console' | 'file' | 'cloudwatch' | 'elasticsearch' | 'syslog';

/**
 * Structured log entry interface
 */
export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context: string;
  readonly metadata?: Record<string, unknown>;
  readonly correlationId?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly customerId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly performance?: PerformanceMetrics;
  readonly error?: ErrorInfo;
  readonly tags?: readonly string[];
}

/**
 * Performance metrics for operations
 */
export interface PerformanceMetrics {
  readonly duration?: number;
  readonly memory?: MemoryUsage;
  readonly cpuUsage?: number;
  readonly networkLatency?: number;
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  readonly rss: number;
  readonly heapTotal: number;
  readonly heapUsed: number;
  readonly external: number;
  readonly arrayBuffers?: number;
}

/**
 * Error information for logging
 */
export interface ErrorInfo {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly cause?: ErrorInfo;
}

/**
 * Log transport interface for different output targets
 */
export interface LogTransport {
  readonly name: string;
  readonly type: TransportType;
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  readonly level: LogLevel;
  readonly context: string;
  readonly transports: readonly LogTransport[];
  readonly enableConsole: boolean;
  readonly enableStructured: boolean;
  readonly maxBufferSize: number;
  readonly flushIntervalMs: number;
}

/**
 * Correlation context for request tracing
 */
export interface CorrelationContext {
  readonly correlationId?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly customerId?: string;
  readonly requestId?: string;
  readonly operationName?: string;
}

/**
 * Log aggregation metrics
 */
export interface LogMetrics {
  readonly totalEntries: number;
  readonly entriesByLevel: Record<LogLevel, number>;
  readonly averageLatency: number;
  readonly errorRate: number;
  readonly lastFlushTime: Date;
  readonly bufferSize: number;
}

/**
 * Audit log entry for security and compliance
 */
export interface AuditLogEntry extends LogEntry {
  readonly action: string;
  readonly resource: string;
  readonly outcome: 'success' | 'failure' | 'partial';
  readonly clientIp?: string;
  readonly userAgent?: string;
  readonly permissions?: readonly string[];
  readonly dataAccessed?: readonly string[];
}