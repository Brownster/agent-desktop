/**
 * @fileoverview Module health checking and monitoring
 * @module @agent-desktop/core
 */

import type {
  ModuleID,
  Result,
  Logger,
} from '@agent-desktop/types';

import type {
  IModule,
  ModuleHealthStatus,
} from './base-module';

/**
 * Module health check configuration
 */
export interface ModuleHealthCheck {
  readonly moduleId: ModuleID;
  readonly interval: number;
  readonly timeout: number;
  readonly retries: number;
  readonly enabled: boolean;
}

/**
 * Aggregated health status for multiple modules
 */
export interface AggregatedHealthStatus {
  readonly overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  readonly healthyCount: number;
  readonly degradedCount: number;
  readonly unhealthyCount: number;
  readonly totalCount: number;
  readonly moduleStatuses: Record<ModuleID, ModuleHealthStatus>;
  readonly timestamp: Date;
}

/**
 * Module health checker interface
 */
export interface IModuleHealthChecker {
  /**
   * Start health checking for a module
   * 
   * @param module - Module to monitor
   * @param config - Health check configuration
   * @returns Promise that resolves when monitoring starts
   */
  startMonitoring(module: IModule, config: ModuleHealthCheck): Promise<Result<void, Error>>;

  /**
   * Stop health checking for a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when monitoring stops
   */
  stopMonitoring(moduleId: ModuleID): Promise<Result<void, Error>>;

  /**
   * Get current health status for a module
   * 
   * @param moduleId - Module ID
   * @returns Module health status or undefined
   */
  getModuleHealth(moduleId: ModuleID): ModuleHealthStatus | undefined;

  /**
   * Get aggregated health status for all monitored modules
   * 
   * @returns Aggregated health status
   */
  getAggregatedHealth(): AggregatedHealthStatus;

  /**
   * Perform health check for a specific module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves with health status
   */
  performHealthCheck(moduleId: ModuleID): Promise<Result<ModuleHealthStatus, Error>>;

  /**
   * Register a health status change listener
   * 
   * @param moduleId - Module ID (or '*' for all modules)
   * @param listener - Health status change listener
   * @returns Unregister function
   */
  onHealthChange(
    moduleId: ModuleID | '*',
    listener: (moduleId: ModuleID, status: ModuleHealthStatus) => void
  ): () => void;

  /**
   * Stop all health monitoring and cleanup
   */
  destroy(): Promise<void>;
}

/**
 * Health check timer information
 */
interface HealthCheckTimer {
  readonly moduleId: ModuleID;
  readonly interval: NodeJS.Timeout;
  readonly config: ModuleHealthCheck;
  retryCount: number;
  lastCheck: Date;
  lastStatus?: ModuleHealthStatus;
}

/**
 * Module health checker implementation
 */
export class ModuleHealthChecker implements IModuleHealthChecker {
  private readonly modules = new Map<ModuleID, IModule>();
  private readonly timers = new Map<ModuleID, HealthCheckTimer>();
  private readonly healthStatuses = new Map<ModuleID, ModuleHealthStatus>();
  private readonly listeners = new Map<ModuleID | '*', Set<(moduleId: ModuleID, status: ModuleHealthStatus) => void>>();

  constructor(private readonly logger: Logger) {
    this.logger = logger.createChild('health-checker');
  }

  /**
   * Start health checking for a module
   * 
   * @param module - Module to monitor
   * @param config - Health check configuration
   * @returns Promise that resolves when monitoring starts
   */
  async startMonitoring(module: IModule, config: ModuleHealthCheck): Promise<Result<void, Error>> {
    try {
      const moduleId = module.metadata.id;

      if (this.timers.has(moduleId)) {
        return {
          success: false,
          error: new Error(`Health monitoring already started for module ${moduleId}`),
        };
      }

      if (!config.enabled) {
        this.logger.debug('Health monitoring disabled for module', { moduleId });
        return { success: true, data: undefined };
      }

      this.modules.set(moduleId, module);

      // Perform initial health check
      const initialCheck = await this.performHealthCheck(moduleId);
      if (initialCheck.success) {
        this.healthStatuses.set(moduleId, initialCheck.data);
        this.notifyListeners(moduleId, initialCheck.data);
      }

      // Set up periodic health checks
      const interval = setInterval(async () => {
        await this.performPeriodicHealthCheck(moduleId);
      }, config.interval);

      const timer: HealthCheckTimer = {
        moduleId,
        interval,
        config,
        retryCount: 0,
        lastCheck: new Date(),
      };

      this.timers.set(moduleId, timer);

      this.logger.info('Health monitoring started', {
        moduleId,
        interval: config.interval,
        timeout: config.timeout,
        retries: config.retries,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown monitoring start error'),
      };
    }
  }

  /**
   * Stop health checking for a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when monitoring stops
   */
  async stopMonitoring(moduleId: ModuleID): Promise<Result<void, Error>> {
    try {
      const timer = this.timers.get(moduleId);
      if (!timer) {
        return {
          success: false,
          error: new Error(`No health monitoring found for module ${moduleId}`),
        };
      }

      clearInterval(timer.interval);
      this.timers.delete(moduleId);
      this.modules.delete(moduleId);
      this.healthStatuses.delete(moduleId);

      this.logger.info('Health monitoring stopped', { moduleId });
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown monitoring stop error'),
      };
    }
  }

  /**
   * Get current health status for a module
   * 
   * @param moduleId - Module ID
   * @returns Module health status or undefined
   */
  getModuleHealth(moduleId: ModuleID): ModuleHealthStatus | undefined {
    return this.healthStatuses.get(moduleId);
  }

  /**
   * Get aggregated health status for all monitored modules
   * 
   * @returns Aggregated health status
   */
  getAggregatedHealth(): AggregatedHealthStatus {
    const moduleStatuses: Record<ModuleID, ModuleHealthStatus> = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const [moduleId, status] of this.healthStatuses) {
      moduleStatuses[moduleId] = status;
      
      switch (status.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
      }
    }

    const totalCount = healthyCount + degradedCount + unhealthyCount;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      overallStatus,
      healthyCount,
      degradedCount,
      unhealthyCount,
      totalCount,
      moduleStatuses,
      timestamp: new Date(),
    };
  }

  /**
   * Perform health check for a specific module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves with health status
   */
  async performHealthCheck(moduleId: ModuleID): Promise<Result<ModuleHealthStatus, Error>> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          error: new Error(`Module ${moduleId} not found`),
        };
      }

      const timer = this.timers.get(moduleId);
      const timeout = timer?.config.timeout || 5000;

      // Perform health check with timeout
      const healthStatus = await Promise.race([
        module.getHealth(),
        this.createTimeoutPromise(timeout),
      ]);

      return { success: true, data: healthStatus };
    } catch (error) {
      const errorStatus: ModuleHealthStatus = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown health check error',
        timestamp: new Date(),
      };

      return { success: true, data: errorStatus };
    }
  }

  /**
   * Register a health status change listener
   * 
   * @param moduleId - Module ID (or '*' for all modules)
   * @param listener - Health status change listener
   * @returns Unregister function
   */
  onHealthChange(
    moduleId: ModuleID | '*',
    listener: (moduleId: ModuleID, status: ModuleHealthStatus) => void
  ): () => void {
    if (!this.listeners.has(moduleId)) {
      this.listeners.set(moduleId, new Set());
    }

    const listenerSet = this.listeners.get(moduleId)!;
    listenerSet.add(listener);

    return () => {
      listenerSet.delete(listener);
      if (listenerSet.size === 0) {
        this.listeners.delete(moduleId);
      }
    };
  }

  /**
   * Stop all health monitoring and cleanup
   */
  async destroy(): Promise<void> {
    // Stop all timers
    for (const timer of this.timers.values()) {
      clearInterval(timer.interval);
    }

    // Clear all data
    this.timers.clear();
    this.modules.clear();
    this.healthStatuses.clear();
    this.listeners.clear();

    this.logger.info('Health checker destroyed');
  }

  /**
   * Perform periodic health check with retry logic
   * 
   * @param moduleId - Module ID
   */
  private async performPeriodicHealthCheck(moduleId: ModuleID): Promise<void> {
    const timer = this.timers.get(moduleId);
    if (!timer) {
      return;
    }

    try {
      const result = await this.performHealthCheck(moduleId);
      
      if (result.success) {
        const status = result.data;
        const previousStatus = this.healthStatuses.get(moduleId);
        
        // Update status
        this.healthStatuses.set(moduleId, status);
        timer.lastCheck = new Date();
        timer.lastStatus = status;
        timer.retryCount = 0;

        // Notify listeners if status changed
        if (!previousStatus || previousStatus.status !== status.status) {
          this.notifyListeners(moduleId, status);
        }

        this.logger.debug('Health check completed', {
          moduleId,
          status: status.status,
          message: status.message,
        });
      } else {
        throw result.error;
      }
    } catch (error) {
      timer.retryCount++;
      
      this.logger.warn('Health check failed', {
        moduleId,
        attempt: timer.retryCount,
        maxRetries: timer.config.retries,
        error: error instanceof Error ? error.message : String(error),
      });

      // If we've exceeded retries, mark as unhealthy
      if (timer.retryCount >= timer.config.retries) {
        const unhealthyStatus: ModuleHealthStatus = {
          status: 'unhealthy',
          message: `Health check failed after ${timer.retryCount} attempts: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };

        const previousStatus = this.healthStatuses.get(moduleId);
        this.healthStatuses.set(moduleId, unhealthyStatus);
        timer.lastStatus = unhealthyStatus;
        
        // Notify listeners if status changed
        if (!previousStatus || previousStatus.status !== 'unhealthy') {
          this.notifyListeners(moduleId, unhealthyStatus);
        }
      }
    }
  }

  /**
   * Notify health status change listeners
   * 
   * @param moduleId - Module ID
   * @param status - New health status
   */
  private notifyListeners(moduleId: ModuleID, status: ModuleHealthStatus): void {
    // Notify specific module listeners
    const moduleListeners = this.listeners.get(moduleId);
    if (moduleListeners) {
      for (const listener of moduleListeners) {
        try {
          listener(moduleId, status);
        } catch (error) {
          this.logger.error('Error in health status listener', {
            moduleId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      for (const listener of globalListeners) {
        try {
          listener(moduleId, status);
        } catch (error) {
          this.logger.error('Error in global health status listener', {
            moduleId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Create a timeout promise
   * 
   * @param timeout - Timeout in milliseconds
   * @returns Promise that rejects with timeout error
   */
  private createTimeoutPromise(timeout: number): Promise<ModuleHealthStatus> {
    return new Promise<ModuleHealthStatus>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${timeout}ms`));
      }, timeout);
    });
  }
}