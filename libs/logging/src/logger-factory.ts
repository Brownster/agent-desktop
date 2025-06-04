/**
 * @fileoverview Logger factory for creating and managing logger instances
 * @module @agent-desktop/logging
 */

import type { LogLevel, LogTransport } from '@agent-desktop/types';
import { Logger, type LoggerConfig } from './logger';
import { ConsoleTransport, FileTransport, CloudWatchTransport } from './transports';

/**
 * Logger factory configuration
 */
export interface LoggerFactoryConfig {
  readonly defaultLevel: LogLevel;
  readonly defaultTransports: readonly LogTransport[];
  readonly enableConsole: boolean;
  readonly enableFile: boolean;
  readonly enableCloudWatch: boolean;
  readonly fileConfig?: {
    readonly filename: string;
    readonly maxFileSize: number;
    readonly maxFiles: number;
  };
  readonly cloudWatchConfig?: {
    readonly logGroupName: string;
    readonly logStreamName: string;
    readonly region: string;
  };
}

/**
 * Default factory configuration
 */
const DEFAULT_FACTORY_CONFIG: LoggerFactoryConfig = {
  defaultLevel: LogLevel.INFO,
  defaultTransports: [],
  enableConsole: true,
  enableFile: false,
  enableCloudWatch: false,
};

/**
 * Logger factory for creating configured logger instances
 * 
 * Features:
 * - Centralized logger configuration
 * - Automatic transport setup
 * - Logger instance caching
 * - Environment-specific defaults
 * - Graceful shutdown handling
 */
export class LoggerFactory {
  private static instance: LoggerFactory;
  private readonly config: LoggerFactoryConfig;
  private readonly loggers: Map<string, Logger> = new Map();
  private readonly transports: LogTransport[] = [];
  private isShuttingDown = false;

  /**
   * Private constructor for singleton pattern
   * 
   * @param config - Factory configuration
   */
  private constructor(config: Partial<LoggerFactoryConfig> = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config };
    this.initializeTransports();
    this.setupGracefulShutdown();
  }

  /**
   * Get the singleton logger factory instance
   * 
   * @param config - Optional configuration for first-time initialization
   * @returns Logger factory instance
   */
  static getInstance(config?: Partial<LoggerFactoryConfig>): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory(config);
    }
    return LoggerFactory.instance;
  }

  /**
   * Create a new logger instance
   * 
   * @param context - Logger context/name
   * @param overrides - Optional configuration overrides
   * @returns Configured logger instance
   */
  createLogger(context: string, overrides: Partial<LoggerConfig> = {}): Logger {
    // Check if logger already exists
    const cacheKey = `${context}:${JSON.stringify(overrides)}`;
    const existingLogger = this.loggers.get(cacheKey);
    if (existingLogger) {
      return existingLogger;
    }

    // Create new logger
    const loggerConfig: LoggerConfig = {
      level: this.config.defaultLevel,
      context,
      transports: this.transports,
      enableConsole: this.config.enableConsole,
      enableStructured: true,
      maxBufferSize: 1000,
      flushIntervalMs: 5000,
      enablePerformanceTracking: true,
      enableMemoryTracking: true,
      ...overrides,
    };

    const logger = new Logger(loggerConfig);
    this.loggers.set(cacheKey, logger);

    return logger;
  }

  /**
   * Get or create a logger with the given context
   * 
   * @param context - Logger context/name
   * @returns Logger instance
   */
  getLogger(context: string): Logger {
    return this.createLogger(context);
  }

  /**
   * Create a logger configured for development environment
   * 
   * @param context - Logger context/name
   * @returns Development logger
   */
  createDevelopmentLogger(context: string): Logger {
    return this.createLogger(context, {
      level: LogLevel.DEBUG,
      enableConsole: true,
      transports: [new ConsoleTransport()],
    });
  }

  /**
   * Create a logger configured for production environment
   * 
   * @param context - Logger context/name
   * @returns Production logger
   */
  createProductionLogger(context: string): Logger {
    const transports: LogTransport[] = [];
    
    // Add file transport in production
    if (this.config.enableFile) {
      transports.push(new FileTransport(this.config.fileConfig));
    }
    
    // Add CloudWatch transport in production
    if (this.config.enableCloudWatch && this.config.cloudWatchConfig) {
      transports.push(new CloudWatchTransport(this.config.cloudWatchConfig));
    }

    return this.createLogger(context, {
      level: LogLevel.INFO,
      enableConsole: false,
      transports,
    });
  }

  /**
   * Create a logger configured for testing environment
   * 
   * @param context - Logger context/name
   * @returns Test logger
   */
  createTestLogger(context: string): Logger {
    return this.createLogger(context, {
      level: LogLevel.WARN, // Reduce noise in tests
      enableConsole: false,
      transports: [], // No output in tests
    });
  }

  /**
   * Set the global log level for all existing loggers
   * 
   * @param level - New log level
   */
  setGlobalLevel(level: LogLevel): void {
    // Note: This would require updating the Logger class to support
    // dynamic level changes. For now, this is a placeholder.
    console.warn('Dynamic log level changes not yet implemented');
  }

  /**
   * Add a transport to all future loggers
   * 
   * @param transport - Transport to add
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove a transport from all future loggers
   * 
   * @param transportName - Name of transport to remove
   */
  removeTransport(transportName: string): void {
    const index = this.transports.findIndex(t => t.name === transportName);
    if (index >= 0) {
      this.transports.splice(index, 1);
    }
  }

  /**
   * Flush all logger instances
   * 
   * @returns Promise that resolves when all loggers are flushed
   */
  async flushAll(): Promise<void> {
    const flushPromises = Array.from(this.loggers.values()).map(logger =>
      logger.flush().catch(error => {
        console.error('Failed to flush logger:', error);
      })
    );

    await Promise.allSettled(flushPromises);
  }

  /**
   * Shutdown all logger instances and clean up resources
   * 
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    // Destroy all logger instances
    const destroyPromises = Array.from(this.loggers.values()).map(logger =>
      logger.destroy().catch(error => {
        console.error('Failed to destroy logger:', error);
      })
    );

    await Promise.allSettled(destroyPromises);

    // Clear logger cache
    this.loggers.clear();

    // Close all transports
    const closePromises = this.transports.map(transport =>
      transport.close?.().catch(error => {
        console.error(`Failed to close transport ${transport.name}:`, error);
      })
    );

    await Promise.allSettled(closePromises);
  }

  /**
   * Get factory statistics
   * 
   * @returns Factory statistics
   */
  getStats(): {
    loggerCount: number;
    transportCount: number;
    transportNames: string[];
  } {
    return {
      loggerCount: this.loggers.size,
      transportCount: this.transports.length,
      transportNames: this.transports.map(t => t.name),
    };
  }

  /**
   * Initialize default transports based on configuration
   */
  private initializeTransports(): void {
    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport());
    }

    if (this.config.enableFile && this.config.fileConfig) {
      this.transports.push(new FileTransport(this.config.fileConfig));
    }

    if (this.config.enableCloudWatch && this.config.cloudWatchConfig) {
      this.transports.push(new CloudWatchTransport(this.config.cloudWatchConfig));
    }

    // Add any default transports from configuration
    this.transports.push(...this.config.defaultTransports);
  }

  /**
   * Setup graceful shutdown handling
   */
  private setupGracefulShutdown(): void {
    const shutdownHandler = () => {
      this.shutdown().catch(error => {
        console.error('Failed to shutdown logger factory:', error);
      });
    };

    // Handle different shutdown signals
    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    process.on('beforeExit', shutdownHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      const logger = this.createLogger('uncaughtException');
      logger.fatal('Uncaught exception', { error: error.message, stack: error.stack });
      
      // Give time for logs to flush before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      const logger = this.createLogger('unhandledRejection');
      logger.error('Unhandled promise rejection', { 
        reason: String(reason),
        promise: String(promise),
      });
    });
  }
}

/**
 * Create a logger using the default factory instance
 * 
 * @param context - Logger context/name
 * @returns Logger instance
 */
export function createLogger(context: string): Logger {
  return LoggerFactory.getInstance().createLogger(context);
}

/**
 * Get a logger using the default factory instance
 * 
 * @param context - Logger context/name
 * @returns Logger instance
 */
export function getLogger(context: string): Logger {
  return LoggerFactory.getInstance().getLogger(context);
}