/**
 * @fileoverview Enterprise logger with structured logging and multiple transports
 * @module @agent-desktop/logging
 */

import {
  LogLevel,
  type LogEntry,
  type LogTransport,
  type CorrelationContext,
  type PerformanceMetrics,
  type ErrorInfo,
} from '@agent-desktop/types';

/**
 * Enterprise logger configuration
 */
export interface LoggerConfig {
  readonly level: LogLevel;
  readonly context: string;
  readonly transports: readonly LogTransport[];
  readonly enableConsole: boolean;
  readonly enableStructured: boolean;
  readonly maxBufferSize: number;
  readonly flushIntervalMs: number;
  readonly enablePerformanceTracking: boolean;
  readonly enableMemoryTracking: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  context: 'default',
  transports: [],
  enableConsole: true,
  enableStructured: true,
  maxBufferSize: 1000,
  flushIntervalMs: 5000,
  enablePerformanceTracking: true,
  enableMemoryTracking: true,
};

/**
 * Enterprise logger with structured logging and multiple transports
 * 
 * Features:
 * - Multiple log levels with filtering
 * - Structured logging with metadata
 * - Multiple transport support
 * - Performance and memory tracking
 * - Correlation ID support for distributed tracing
 * - Child logger creation for hierarchical contexts
 * - Automatic batching and flushing
 * - Error handling and failsafe mechanisms
 */
export class Logger {
  private readonly config: LoggerConfig;
  private level: LogLevel;
  private correlationContext: CorrelationContext = {};
  private readonly buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | undefined;
  private isDestroyed = false;

  /**
   * Create a new logger instance
   * 
   * @param config - Logger configuration
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.level = this.config.level;
    this.startAutoFlush();
  }

  /**
   * Create a child logger with additional context
   * 
   * @param childContext - Additional context to append
   * @returns New logger instance with combined context
   */
  createChild(childContext: string): Logger {
    const child = new Logger({
      ...this.config,
      context: `${this.config.context}:${childContext}`,
    });

    // Inherit correlation context from parent
    child.correlationContext = { ...this.correlationContext };

    return child;
  }

  /**
   * Set correlation context for request tracing
   * 
   * @param context - Correlation context to set
   */
  setContext(context: CorrelationContext): void {
    this.correlationContext = { ...this.correlationContext, ...context };
  }

  /**
   * Clear correlation context
   */
  clearContext(): void {
    this.correlationContext = {};
  }

  /**
   * Get current correlation context
   * 
   * @returns Current correlation context
   */
  getContext(): CorrelationContext {
    return { ...this.correlationContext };
  }

  /**
   * Set log level at runtime
   *
   * @param level - New log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   *
   * @returns Current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Debug level logging
   * 
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Info level logging
   * 
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning level logging
   * 
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error level logging
   * 
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Fatal level logging
   * 
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, metadata);
  }

  /**
   * Log an error object with full error information
   * 
   * @param error - Error object to log
   * @param message - Optional custom message
   * @param metadata - Additional structured data
   */
  logError(error: Error, message?: string, metadata?: Record<string, unknown>): void {
    const errorInfo = this.extractErrorInfo(error);
    
    this.log(LogLevel.ERROR, message || error.message, {
      ...metadata,
      error: errorInfo,
    });
  }

  /**
   * Time a function execution and log the duration
   * 
   * @param operation - Name of the operation being timed
   * @param fn - Function to execute and time
   * @param level - Log level for timing messages
   * @returns Promise that resolves to the function result
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    level: LogLevel = LogLevel.DEBUG
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

    this.log(level, `Starting ${operation}`, {
      operation,
      startMemory: startMemory ? this.formatMemoryUsage(startMemory) : undefined,
    });

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const endMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

      this.log(level, `Completed ${operation}`, {
        operation,
        performance: {
          duration,
          memory: endMemory ? this.formatMemoryUsage(endMemory) : undefined,
          memoryDelta: startMemory && endMemory 
            ? this.calculateMemoryDelta(startMemory, endMemory) 
            : undefined,
        },
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

      this.error(`Failed ${operation}`, {
        operation,
        performance: {
          duration,
          memory: endMemory ? this.formatMemoryUsage(endMemory) : undefined,
        },
        error: error instanceof Error ? this.extractErrorInfo(error) : { 
          name: 'Unknown', 
          message: String(error) 
        },
      });

      throw error;
    }
  }

  /**
   * Time a synchronous function execution and log the duration
   * 
   * @param operation - Name of the operation being timed
   * @param fn - Function to execute and time
   * @param level - Log level for timing messages
   * @returns Function result
   */
  timeSync<T>(
    operation: string,
    fn: () => T,
    level: LogLevel = LogLevel.DEBUG
  ): T {
    const startTime = performance.now();
    const startMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

    this.log(level, `Starting ${operation}`, {
      operation,
      startMemory: startMemory ? this.formatMemoryUsage(startMemory) : undefined,
    });

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      const endMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

      this.log(level, `Completed ${operation}`, {
        operation,
        performance: {
          duration,
          memory: endMemory ? this.formatMemoryUsage(endMemory) : undefined,
          memoryDelta: startMemory && endMemory 
            ? this.calculateMemoryDelta(startMemory, endMemory) 
            : undefined,
        },
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const endMemory = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

      this.error(`Failed ${operation}`, {
        operation,
        performance: {
          duration,
          memory: endMemory ? this.formatMemoryUsage(endMemory) : undefined,
        },
        error: error instanceof Error ? this.extractErrorInfo(error) : { 
          name: 'Unknown', 
          message: String(error) 
        },
      });

      throw error;
    }
  }

  /**
   * Manually flush all pending log entries
   * 
   * @returns Promise that resolves when all entries are flushed
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer.length = 0;

    // Write to all transports in parallel
    const writePromises = this.config.transports.map(async (transport) => {
      try {
        for (const entry of entries) {
          await transport.write(entry);
        }
        
        if (transport.flush) {
          await transport.flush();
        }
      } catch (error) {
        // Failsafe: write to console if transport fails
        console.error(`Failed to write to transport ${transport.name}:`, error);
        
        if (this.config.enableConsole) {
          entries.forEach(entry => this.writeToConsole(entry));
        }
      }
    });

    await Promise.allSettled(writePromises);
  }

  /**
   * Destroy the logger and clean up resources
   * 
   * @returns Promise that resolves when cleanup is complete
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // Stop auto-flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush any remaining entries
    await this.flush();

    // Close all transports
    const closePromises = this.config.transports.map(async (transport) => {
      try {
        if (transport.close) {
          await transport.close();
        }
      } catch (error) {
        console.error(`Failed to close transport ${transport.name}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
  }

  /**
   * Core logging method
   * 
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Additional structured data
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (this.isDestroyed || level < this.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.context,
      ...(metadata ? { metadata } : {}),
      ...this.correlationContext,
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      ...(() => {
        if (!this.config.enablePerformanceTracking) {
          return {};
        }
        const metrics = this.getPerformanceMetrics();
        return metrics ? { performance: metrics } : {};
      })(),
    };

    // Add to buffer
    this.buffer.push(entry);

    // Immediate console output if enabled and high priority
    if (this.config.enableConsole && level >= LogLevel.WARN) {
      this.writeToConsole(entry);
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      // Non-blocking flush
      this.flush().catch(error => {
        console.error('Failed to flush log buffer:', error);
      });
    }
  }

  /**
   * Start automatic flushing of log buffer
   */
  private startAutoFlush(): void {
    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch(error => {
          console.error('Failed to auto-flush log buffer:', error);
        });
      }, this.config.flushIntervalMs);
    }
  }

  /**
   * Write log entry to console with formatting
   * 
   * @param entry - Log entry to write
   */
  private writeToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelColors = [
      '\x1b[36m', // Cyan
      '\x1b[32m', // Green
      '\x1b[33m', // Yellow
      '\x1b[31m', // Red
      '\x1b[35m', // Magenta
    ];

    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';
    const levelName = levelNames[entry.level] || 'UNKNOWN';

    const timestamp = new Date(entry.timestamp).toISOString();
    const contextStr = entry.context ? `[${entry.context}]` : '';
    
    console.log(
      `${color}[${timestamp}] ${levelName} ${contextStr}:${reset} ${entry.message}`,
      entry.metadata ? entry.metadata : ''
    );
  }

  /**
   * Extract error information for logging
   * 
   * @param error - Error object
   * @returns Structured error information
   */
  private extractErrorInfo(error: Error): ErrorInfo {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.cause ? { cause: this.extractErrorInfo(error.cause as Error) } : {}),
    };
  }

  /**
   * Get current performance metrics
   * 
   * @returns Performance metrics object
   */
  private getPerformanceMetrics(): PerformanceMetrics | undefined {
    if (!this.config.enablePerformanceTracking) {
      return undefined;
    }

    try {
      return this.config.enableMemoryTracking
        ? { memory: process.memoryUsage() }
        : {};
    } catch {
      return undefined;
    }
  }

  /**
   * Format memory usage for logging
   * 
   * @param usage - Memory usage object
   * @returns Formatted memory usage
   */
  private formatMemoryUsage(usage: NodeJS.MemoryUsage): Record<string, string> {
    return {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    };
  }

  /**
   * Calculate memory delta between two measurements
   * 
   * @param start - Starting memory usage
   * @param end - Ending memory usage
   * @returns Memory delta
   */
  private calculateMemoryDelta(
    start: NodeJS.MemoryUsage,
    end: NodeJS.MemoryUsage
  ): Record<string, string> {
    return {
      rss: `${Math.round((end.rss - start.rss) / 1024 / 1024)}MB`,
      heapTotal: `${Math.round((end.heapTotal - start.heapTotal) / 1024 / 1024)}MB`,
      heapUsed: `${Math.round((end.heapUsed - start.heapUsed) / 1024 / 1024)}MB`,
      external: `${Math.round((end.external - start.external) / 1024 / 1024)}MB`,
    };
  }

  /**
   * Generate trace ID for distributed tracing
   * 
   * @returns Trace ID string
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID for distributed tracing
   * 
   * @returns Span ID string
   */
  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }
}