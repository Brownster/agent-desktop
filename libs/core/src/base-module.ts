/**
 * @fileoverview Base module class and interfaces for the modular architecture
 * @module @agent-desktop/core
 */

import type {
  ModuleConfig,
  ModuleID,
  Result,
  Logger,
} from '@agent-desktop/types';

/**
 * Module lifecycle states
 */
export enum ModuleStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  ERROR = 'error',
  STOPPED = 'stopped',
  UNLOADING = 'unloading',
}

/**
 * Module loading strategies
 */
export enum ModuleLoadStrategy {
  EAGER = 'eager',
  LAZY = 'lazy',
  ON_DEMAND = 'on_demand',
}

/**
 * Module permission types
 */
export interface ModulePermission {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Module dependency information
 */
export interface ModuleDependency {
  readonly moduleId: ModuleID;
  readonly version?: string;
  readonly optional: boolean;
}

/**
 * Module metadata
 */
export interface ModuleMetadata {
  readonly id: ModuleID;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly dependencies: readonly ModuleDependency[];
  readonly permissions: readonly ModulePermission[];
  readonly loadStrategy: ModuleLoadStrategy;
  readonly position: string;
  readonly priority: number;
  readonly tags: readonly string[];
  readonly minAppVersion?: string;
  readonly maxAppVersion?: string;
}

/**
 * Module context provided to modules at runtime
 */
export interface ModuleContext {
  readonly logger: Logger;
  readonly config: ModuleConfig;
  readonly moduleId: ModuleID;
  readonly registry: IModuleRegistry;
  readonly services: Record<string, unknown>;
  readonly eventBus: IModuleEventBus;
}

/**
 * Module lifecycle hooks
 */
export interface ModuleLifecycle {
  /**
   * Called when module is being initialized
   * 
   * @param context - Module context
   * @returns Promise that resolves when initialization is complete
   */
  onInitialize?(context: ModuleContext): Promise<Result<void, Error>>;

  /**
   * Called when module is being started
   * 
   * @param context - Module context
   * @returns Promise that resolves when startup is complete
   */
  onStart?(context: ModuleContext): Promise<Result<void, Error>>;

  /**
   * Called when module is being stopped
   * 
   * @param context - Module context
   * @returns Promise that resolves when shutdown is complete
   */
  onStop?(context: ModuleContext): Promise<Result<void, Error>>;

  /**
   * Called when module is being destroyed
   * 
   * @param context - Module context
   * @returns Promise that resolves when cleanup is complete
   */
  onDestroy?(context: ModuleContext): Promise<Result<void, Error>>;

  /**
   * Called when module configuration changes
   * 
   * @param newConfig - New module configuration
   * @param oldConfig - Previous module configuration
   * @param context - Module context
   * @returns Promise that resolves when configuration update is complete
   */
  onConfigChange?(
    newConfig: ModuleConfig,
    oldConfig: ModuleConfig,
    context: ModuleContext
  ): Promise<Result<void, Error>>;

  /**
   * Called when a dependency module status changes
   * 
   * @param dependencyId - ID of the dependency module
   * @param status - New status of the dependency
   * @param context - Module context
   * @returns Promise that resolves when dependency change is handled
   */
  onDependencyChange?(
    dependencyId: ModuleID,
    status: ModuleStatus,
    context: ModuleContext
  ): Promise<Result<void, Error>>;
}

/**
 * Module event bus interface
 */
export interface IModuleEventBus {
  /**
   * Emit an event to other modules
   * 
   * @param event - Event name
   * @param data - Event data
   * @param sourceModule - Source module ID
   */
  emit(event: string, data: unknown, sourceModule: ModuleID): void;

  /**
   * Subscribe to module events
   * 
   * @param event - Event name or pattern
   * @param handler - Event handler
   * @param targetModule - Target module ID
   * @returns Unsubscribe function
   */
  subscribe(
    event: string,
    handler: (data: unknown, sourceModule: ModuleID) => void,
    targetModule: ModuleID
  ): () => void;
}

/**
 * Core module interface that all modules must implement
 */
export interface IModule extends ModuleLifecycle {
  /**
   * Module metadata
   */
  readonly metadata: ModuleMetadata;

  /**
   * Current module status
   */
  readonly status: ModuleStatus;

  /**
   * Module context (available after initialization)
   */
  readonly context?: ModuleContext;

  /**
   * Get module health status
   * 
   * @returns Module health information
   */
  getHealth(): Promise<ModuleHealthStatus>;

  /**
   * Get module metrics
   * 
   * @returns Module performance and usage metrics
   */
  getMetrics(): Promise<Record<string, unknown>>;

  /**
   * Validate module configuration
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: ModuleConfig): Result<void, Error>;
}

/**
 * Module registry interface
 */
export interface IModuleRegistry {
  /**
   * Register a module
   * 
   * @param module - Module instance
   * @returns Promise that resolves when module is registered
   */
  register(module: IModule): Promise<Result<void, Error>>;

  /**
   * Unregister a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unregistered
   */
  unregister(moduleId: ModuleID): Promise<Result<void, Error>>;

  /**
   * Load a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is loaded
   */
  loadModule(moduleId: ModuleID): Promise<Result<void, Error>>;

  /**
   * Unload a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unloaded
   */
  unloadModule(moduleId: ModuleID): Promise<Result<void, Error>>;

  /**
   * Get module by ID
   * 
   * @param moduleId - Module ID
   * @returns Module instance or undefined
   */
  getModule(moduleId: ModuleID): IModule | undefined;

  /**
   * Get all registered modules
   * 
   * @returns Array of all modules
   */
  getAllModules(): readonly IModule[];

  /**
   * Get modules by status
   * 
   * @param status - Module status to filter by
   * @returns Array of modules with the specified status
   */
  getModulesByStatus(status: ModuleStatus): readonly IModule[];
}

/**
 * Module health status
 */
export interface ModuleHealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly message?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;
}

/**
 * Base module class that provides common functionality
 */
export abstract class BaseModule implements IModule {
  private _status: ModuleStatus = ModuleStatus.UNLOADED;
  private _context?: ModuleContext;
  private readonly _metrics = new Map<string, unknown>();

  /**
   * Create a new base module
   * 
   * @param metadata - Module metadata
   */
  constructor(public readonly metadata: ModuleMetadata) {}

  /**
   * Get current module status
   */
  get status(): ModuleStatus {
    return this._status;
  }

  /**
   * Get module context
   */
  get context(): ModuleContext | undefined {
    return this._context;
  }

  /**
   * Set module status (internal use)
   * 
   * @param status - New status
   */
  protected setStatus(status: ModuleStatus): void {
    const oldStatus = this._status;
    this._status = status;
    
    if (this._context) {
      this._context.logger.info('Module status changed', {
        moduleId: this.metadata.id,
        oldStatus,
        newStatus: status,
      });
    }
  }

  /**
   * Set module context (internal use)
   * 
   * @param context - Module context
   */
  setContext(context: ModuleContext): void {
    this._context = context;
  }

  /**
   * Get module health status
   * 
   * @returns Module health information
   */
  async getHealth(): Promise<ModuleHealthStatus> {
    try {
      // Default health check based on status
      const isHealthy = this._status === ModuleStatus.RUNNING;
      const isDegraded = this._status === ModuleStatus.LOADING || this._status === ModuleStatus.INITIALIZING;
      
      return {
        status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
        message: `Module is ${this._status}`,
        details: {
          status: this._status,
          hasContext: !!this._context,
          dependencies: this.metadata.dependencies.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get module metrics
   * 
   * @returns Module performance and usage metrics
   */
  async getMetrics(): Promise<Record<string, unknown>> {
    const baseMetrics = {
      status: this._status,
      uptime: this._context ? Date.now() - (this._metrics.get('startTime') as number || 0) : 0,
      memoryUsage: process.memoryUsage(),
      dependencyCount: this.metadata.dependencies.length,
      permissionCount: this.metadata.permissions.length,
    };

    // Merge with custom metrics
    return {
      ...baseMetrics,
      ...Object.fromEntries(this._metrics),
    };
  }

  /**
   * Set a custom metric
   * 
   * @param key - Metric key
   * @param value - Metric value
   */
  protected setMetric(key: string, value: unknown): void {
    this._metrics.set(key, value);
  }

  /**
   * Increment a numeric metric
   * 
   * @param key - Metric key
   * @param increment - Amount to increment (default: 1)
   */
  protected incrementMetric(key: string, increment: number = 1): void {
    const current = (this._metrics.get(key) as number) || 0;
    this._metrics.set(key, current + increment);
  }

  /**
   * Validate module configuration (default implementation)
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: ModuleConfig): Result<void, Error> {
    try {
      // Basic validation - check required fields
      if (!config.module_id || config.module_id !== this.metadata.id) {
        return {
          success: false,
          error: new Error(`Invalid module_id: expected ${this.metadata.id}, got ${config.module_id}`),
        };
      }

      if (typeof config.enabled !== 'boolean') {
        return {
          success: false,
          error: new Error('Module enabled flag must be a boolean'),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown validation error'),
      };
    }
  }

  /**
   * Log a message with module context
   * 
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional log data
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (this._context) {
      this._context.logger[level](message, {
        moduleId: this.metadata.id,
        ...data,
      });
    }
  }

  /**
   * Default initialization hook
   * 
   * @param context - Module context
   * @returns Promise that resolves when initialization is complete
   */
  async onInitialize(context: ModuleContext): Promise<Result<void, Error>> {
    try {
      this.setStatus(ModuleStatus.INITIALIZING);
      this.setContext(context);
      this.setMetric('startTime', Date.now());
      
      this.log('info', 'Module initialized successfully');
      this.setStatus(ModuleStatus.LOADED);
      
      return { success: true, data: undefined };
    } catch (error) {
      this.setStatus(ModuleStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown initialization error'),
      };
    }
  }

  /**
   * Default start hook
   * 
   * @param context - Module context
   * @returns Promise that resolves when startup is complete
   */
  async onStart(context: ModuleContext): Promise<Result<void, Error>> {
    try {
      this.log('info', 'Module starting');
      this.setStatus(ModuleStatus.RUNNING);
      this.incrementMetric('startCount');
      
      return { success: true, data: undefined };
    } catch (error) {
      this.setStatus(ModuleStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown start error'),
      };
    }
  }

  /**
   * Default stop hook
   * 
   * @param context - Module context
   * @returns Promise that resolves when shutdown is complete
   */
  async onStop(context: ModuleContext): Promise<Result<void, Error>> {
    try {
      this.log('info', 'Module stopping');
      this.setStatus(ModuleStatus.STOPPED);
      this.incrementMetric('stopCount');
      
      return { success: true, data: undefined };
    } catch (error) {
      this.setStatus(ModuleStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown stop error'),
      };
    }
  }

  /**
   * Default destroy hook
   * 
   * @param context - Module context
   * @returns Promise that resolves when cleanup is complete
   */
  async onDestroy(context: ModuleContext): Promise<Result<void, Error>> {
    try {
      this.log('info', 'Module being destroyed');
      this.setStatus(ModuleStatus.UNLOADED);
      this._context = undefined;
      this._metrics.clear();
      
      return { success: true, data: undefined };
    } catch (error) {
      this.setStatus(ModuleStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown destroy error'),
      };
    }
  }
}