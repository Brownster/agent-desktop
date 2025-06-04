/**
 * @fileoverview Module registry for managing module lifecycle and dependencies
 * @module @agent-desktop/core
 */

import type {
  ModuleConfig,
  ModuleID,
  CustomerID,
  Result,
  Logger,
} from '@agent-desktop/types';

import type { ConfigService } from '@agent-desktop/config';

import {
  type IModule,
  type IModuleRegistry,
  type ModuleContext,
  type IModuleEventBus,
  ModuleStatus,
  ModuleLoadStrategy,
} from './base-module';

/**
 * Module registry options
 */
export interface ModuleRegistryOptions {
  readonly logger: Logger;
  readonly configService: ConfigService;
  readonly customerId: CustomerID;
  readonly enableHotReload?: boolean;
  readonly maxConcurrentLoads?: number;
  readonly dependencyTimeoutMs?: number;
  readonly healthCheckIntervalMs?: number;
}

/**
 * Module dependency graph node
 */
interface DependencyNode {
  readonly moduleId: ModuleID;
  readonly dependencies: Set<ModuleID>;
  readonly dependents: Set<ModuleID>;
  readonly depth: number;
}

/**
 * Module event bus implementation
 */
class ModuleEventBus implements IModuleEventBus {
  private readonly listeners = new Map<string, Map<ModuleID, (data: unknown, sourceModule: ModuleID) => void>>();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChild('event-bus');
  }

  /**
   * Emit an event to other modules
   * 
   * @param event - Event name
   * @param data - Event data
   * @param sourceModule - Source module ID
   */
  emit(event: string, data: unknown, sourceModule: ModuleID): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    this.logger.debug('Emitting module event', {
      event,
      sourceModule,
      listenerCount: eventListeners.size,
    });

    for (const [targetModule, handler] of eventListeners) {
      if (targetModule !== sourceModule) {
        try {
          handler(data, sourceModule);
        } catch (error) {
          this.logger.error('Error in module event handler', {
            event,
            sourceModule,
            targetModule,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

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
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.set(targetModule, handler);

    this.logger.debug('Module subscribed to event', {
      event,
      targetModule,
    });

    return () => {
      eventListeners.delete(targetModule);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }

      this.logger.debug('Module unsubscribed from event', {
        event,
        targetModule,
      });
    };
  }

  /**
   * Clear all listeners for a module
   * 
   * @param moduleId - Module ID
   */
  clearModule(moduleId: ModuleID): void {
    for (const [event, listeners] of this.listeners) {
      listeners.delete(moduleId);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
}

/**
 * Module registry implementation
 */
export class ModuleRegistry implements IModuleRegistry {
  private readonly modules = new Map<ModuleID, IModule>();
  private readonly dependencyGraph = new Map<ModuleID, DependencyNode>();
  private readonly loadPromises = new Map<ModuleID, Promise<Result<void, Error>>>();
  private readonly eventBus: ModuleEventBus;
  private readonly services = new Map<string, unknown>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(private readonly options: ModuleRegistryOptions) {
    this.eventBus = new ModuleEventBus(options.logger.createChild('event-bus'));
    
    if (options.healthCheckIntervalMs) {
      this.startHealthChecks();
    }
    
    // Watch for configuration changes
    this.options.configService.watch('modules.*', this.handleConfigChange.bind(this));
  }

  /**
   * Register a module
   * 
   * @param module - Module instance
   * @returns Promise that resolves when module is registered
   */
  async register(module: IModule): Promise<Result<void, Error>> {
    try {
      const moduleId = module.metadata.id;

      if (this.modules.has(moduleId)) {
        return {
          success: false,
          error: new Error(`Module ${moduleId} is already registered`),
        };
      }

      // Validate module dependencies
      const dependencyValidation = this.validateDependencies(module);
      if (!dependencyValidation.success) {
        return dependencyValidation;
      }

      // Register the module
      this.modules.set(moduleId, module);
      this.buildDependencyGraph();

      this.options.logger.info('Module registered', {
        moduleId,
        version: module.metadata.version,
        dependencies: module.metadata.dependencies.length,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown registration error'),
      };
    }
  }

  /**
   * Unregister a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unregistered
   */
  async unregister(moduleId: ModuleID): Promise<Result<void, Error>> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          error: new Error(`Module ${moduleId} is not registered`),
        };
      }

      // Check if other modules depend on this one
      const dependents = this.getDependents(moduleId);
      if (dependents.length > 0) {
        return {
          success: false,
          error: new Error(`Cannot unregister module ${moduleId}: still has dependents: ${dependents.join(', ')}`),
        };
      }

      // Unload the module if it's loaded
      if (module.status !== ModuleStatus.UNLOADED) {
        const unloadResult = await this.unloadModule(moduleId);
        if (!unloadResult.success) {
          return unloadResult;
        }
      }

      // Clean up event listeners
      this.eventBus.clearModule(moduleId);

      // Remove from registry
      this.modules.delete(moduleId);
      this.dependencyGraph.delete(moduleId);
      this.buildDependencyGraph();

      this.options.logger.info('Module unregistered', { moduleId });
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown unregistration error'),
      };
    }
  }

  /**
   * Load a module and its dependencies
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is loaded
   */
  async loadModule(moduleId: ModuleID): Promise<Result<void, Error>> {
    // Check if already loading
    const existingPromise = this.loadPromises.get(moduleId);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = this.performModuleLoad(moduleId);
    this.loadPromises.set(moduleId, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadPromises.delete(moduleId);
    }
  }

  /**
   * Perform the actual module loading
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is loaded
   */
  private async performModuleLoad(moduleId: ModuleID): Promise<Result<void, Error>> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          error: new Error(`Module ${moduleId} is not registered`),
        };
      }

      // Skip if already loaded
      if (module.status === ModuleStatus.RUNNING) {
        return { success: true, data: undefined };
      }

      // Get module configuration
      const config = this.getModuleConfig(moduleId);
      if (!config) {
        return {
          success: false,
          error: new Error(`No configuration found for module ${moduleId}`),
        };
      }

      // Check if module is enabled
      if (!config.enabled) {
        this.options.logger.info('Module is disabled, skipping load', { moduleId });
        return { success: true, data: undefined };
      }

      // Load dependencies first
      const dependencyResult = await this.loadDependencies(moduleId);
      if (!dependencyResult.success) {
        return dependencyResult;
      }

      // Create module context
      const context: ModuleContext = {
        logger: this.options.logger.createChild(`module:${moduleId}`),
        config,
        moduleId,
        registry: this,
        services: Object.fromEntries(this.services),
        eventBus: this.eventBus,
      };

      // Initialize the module
      if (module.onInitialize) {
        const initResult = await module.onInitialize(context);
        if (!initResult.success) {
          return initResult;
        }
      }

      // Start the module
      if (module.onStart) {
        const startResult = await module.onStart(context);
        if (!startResult.success) {
          return startResult;
        }
      }

      this.options.logger.info('Module loaded successfully', {
        moduleId,
        loadTime: Date.now(),
      });

      // Notify dependents
      this.notifyDependents(moduleId, ModuleStatus.RUNNING);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown load error'),
      };
    }
  }

  /**
   * Unload a module
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unloaded
   */
  async unloadModule(moduleId: ModuleID): Promise<Result<void, Error>> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          error: new Error(`Module ${moduleId} is not registered`),
        };
      }

      // Skip if already unloaded
      if (module.status === ModuleStatus.UNLOADED) {
        return { success: true, data: undefined };
      }

      // Check for dependents
      const dependents = this.getLoadedDependents(moduleId);
      if (dependents.length > 0) {
        // Unload dependents first
        for (const dependentId of dependents) {
          const unloadResult = await this.unloadModule(dependentId);
          if (!unloadResult.success) {
            this.options.logger.warn('Failed to unload dependent module', {
              moduleId: dependentId,
              error: unloadResult.error.message,
            });
          }
        }
      }

      // Stop the module
      if (module.onStop && module.context) {
        const stopResult = await module.onStop(module.context);
        if (!stopResult.success) {
          this.options.logger.warn('Module stop hook failed', {
            moduleId,
            error: stopResult.error.message,
          });
        }
      }

      // Destroy the module
      if (module.onDestroy && module.context) {
        const destroyResult = await module.onDestroy(module.context);
        if (!destroyResult.success) {
          this.options.logger.warn('Module destroy hook failed', {
            moduleId,
            error: destroyResult.error.message,
          });
        }
      }

      // Clean up event listeners
      this.eventBus.clearModule(moduleId);

      this.options.logger.info('Module unloaded', { moduleId });

      // Notify dependents
      this.notifyDependents(moduleId, ModuleStatus.UNLOADED);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown unload error'),
      };
    }
  }

  /**
   * Get module by ID
   * 
   * @param moduleId - Module ID
   * @returns Module instance or undefined
   */
  getModule(moduleId: ModuleID): IModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   * 
   * @returns Array of all modules
   */
  getAllModules(): readonly IModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by status
   * 
   * @param status - Module status to filter by
   * @returns Array of modules with the specified status
   */
  getModulesByStatus(status: ModuleStatus): readonly IModule[] {
    return Array.from(this.modules.values()).filter(module => module.status === status);
  }

  /**
   * Load modules based on customer configuration
   * 
   * @returns Promise that resolves when all enabled modules are loaded
   */
  async loadCustomerModules(): Promise<Result<void, Error>> {
    try {
      const customerConfig = await this.options.configService.loadCustomerConfig(this.options.customerId);
      if (!customerConfig.success) {
        return customerConfig;
      }

      const enabledModules = customerConfig.data.modules
        .filter(module => module.enabled)
        .sort((a, b) => a.priority - b.priority);

      const loadPromises: Promise<Result<void, Error>>[] = [];
      const concurrencyLimit = this.options.maxConcurrentLoads || 5;

      // Load modules in batches based on concurrency limit
      for (let i = 0; i < enabledModules.length; i += concurrencyLimit) {
        const batch = enabledModules.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(moduleConfig => this.loadModule(moduleConfig.module_id));
        
        const batchResults = await Promise.all(batchPromises);
        
        // Check for failures
        for (const result of batchResults) {
          if (!result.success) {
            this.options.logger.error('Module load failed in batch', {
              error: result.error.message,
            });
          }
        }
      }

      this.options.logger.info('Customer modules loaded', {
        customerId: this.options.customerId,
        totalModules: enabledModules.length,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown customer load error'),
      };
    }
  }

  /**
   * Register a service for modules to use
   * 
   * @param name - Service name
   * @param service - Service instance
   */
  registerService(name: string, service: unknown): void {
    this.services.set(name, service);
    this.options.logger.debug('Service registered', { name });
  }

  /**
   * Unregister a service
   * 
   * @param name - Service name
   */
  unregisterService(name: string): void {
    this.services.delete(name);
    this.options.logger.debug('Service unregistered', { name });
  }

  /**
   * Destroy the registry and cleanup resources
   */
  async destroy(): Promise<void> {
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Unload all modules
    const unloadPromises = Array.from(this.modules.keys()).map(moduleId => this.unloadModule(moduleId));
    await Promise.all(unloadPromises);

    // Clear all data
    this.modules.clear();
    this.dependencyGraph.clear();
    this.services.clear();
    this.loadPromises.clear();

    this.options.logger.info('Module registry destroyed');
  }

  /**
   * Get module configuration from config service
   * 
   * @param moduleId - Module ID
   * @returns Module configuration or undefined
   */
  private getModuleConfig(moduleId: ModuleID): ModuleConfig | undefined {
    return this.options.configService.get<ModuleConfig>(`modules.${moduleId}`);
  }

  /**
   * Validate module dependencies
   * 
   * @param module - Module to validate
   * @returns Validation result
   */
  private validateDependencies(module: IModule): Result<void, Error> {
    for (const dependency of module.metadata.dependencies) {
      if (!dependency.optional && !this.modules.has(dependency.moduleId)) {
        return {
          success: false,
          error: new Error(`Required dependency ${dependency.moduleId} is not registered`),
        };
      }
    }
    return { success: true, data: undefined };
  }

  /**
   * Load module dependencies
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when dependencies are loaded
   */
  private async loadDependencies(moduleId: ModuleID): Promise<Result<void, Error>> {
    const module = this.modules.get(moduleId);
    if (!module) {
      return {
        success: false,
        error: new Error(`Module ${moduleId} not found`),
      };
    }

    const dependencyPromises = module.metadata.dependencies.map(async dependency => {
      const dependencyModule = this.modules.get(dependency.moduleId);
      if (!dependencyModule) {
        if (dependency.optional) {
          this.options.logger.warn('Optional dependency not found', {
            moduleId,
            dependency: dependency.moduleId,
          });
          return { success: true, data: undefined };
        } else {
          return {
            success: false,
            error: new Error(`Required dependency ${dependency.moduleId} not found`),
          };
        }
      }

      // Load the dependency if not already loaded
      if (dependencyModule.status !== ModuleStatus.RUNNING) {
        return this.loadModule(dependency.moduleId);
      }

      return { success: true, data: undefined };
    });

    const results = await Promise.all(dependencyPromises);
    
    for (const result of results) {
      if (!result.success) {
        return result;
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(): void {
    this.dependencyGraph.clear();

    // Initialize nodes
    for (const [moduleId, module] of this.modules) {
      this.dependencyGraph.set(moduleId, {
        moduleId,
        dependencies: new Set(module.metadata.dependencies.map(d => d.moduleId)),
        dependents: new Set(),
        depth: 0,
      });
    }

    // Build dependent relationships
    for (const [moduleId, node] of this.dependencyGraph) {
      for (const depId of node.dependencies) {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode) {
          depNode.dependents.add(moduleId);
        }
      }
    }

    // Calculate depths
    this.calculateDependencyDepths();
  }

  /**
   * Calculate dependency depths for load ordering
   */
  private calculateDependencyDepths(): void {
    const visited = new Set<ModuleID>();
    const visiting = new Set<ModuleID>();

    const visit = (moduleId: ModuleID): number => {
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected involving ${moduleId}`);
      }
      if (visited.has(moduleId)) {
        return this.dependencyGraph.get(moduleId)?.depth || 0;
      }

      visiting.add(moduleId);
      const node = this.dependencyGraph.get(moduleId);
      if (!node) return 0;

      let maxDepth = 0;
      for (const depId of node.dependencies) {
        const depDepth = visit(depId);
        maxDepth = Math.max(maxDepth, depDepth + 1);
      }

      // Update the node with calculated depth
      this.dependencyGraph.set(moduleId, {
        ...node,
        depth: maxDepth,
      });

      visiting.delete(moduleId);
      visited.add(moduleId);
      return maxDepth;
    };

    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }
  }

  /**
   * Get modules that depend on the given module
   * 
   * @param moduleId - Module ID
   * @returns Array of dependent module IDs
   */
  private getDependents(moduleId: ModuleID): ModuleID[] {
    const node = this.dependencyGraph.get(moduleId);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * Get loaded modules that depend on the given module
   * 
   * @param moduleId - Module ID
   * @returns Array of loaded dependent module IDs
   */
  private getLoadedDependents(moduleId: ModuleID): ModuleID[] {
    return this.getDependents(moduleId).filter(depId => {
      const module = this.modules.get(depId);
      return module && module.status === ModuleStatus.RUNNING;
    });
  }

  /**
   * Notify dependents of module status change
   * 
   * @param moduleId - Module ID
   * @param status - New status
   */
  private notifyDependents(moduleId: ModuleID, status: ModuleStatus): void {
    const dependents = this.getDependents(moduleId);
    
    for (const dependentId of dependents) {
      const dependent = this.modules.get(dependentId);
      if (dependent && dependent.context && dependent.onDependencyChange) {
        dependent.onDependencyChange(moduleId, status, dependent.context).catch(error => {
          this.options.logger.error('Error in dependency change handler', {
            dependentId,
            moduleId,
            status,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }
  }

  /**
   * Handle configuration changes
   * 
   * @param event - Configuration change event
   */
  private async handleConfigChange(event: { key: string; newValue: unknown; oldValue: unknown }): Promise<void> {
    try {
      // Extract module ID from key (e.g., 'modules.ccp-core.enabled' -> 'ccp-core')
      const keyParts = event.key.split('.');
      if (keyParts.length < 2 || keyParts[0] !== 'modules') {
        return;
      }

      const moduleId = keyParts[1] as ModuleID;
      const module = this.modules.get(moduleId);
      if (!module) {
        return;
      }

      this.options.logger.info('Module configuration changed', {
        moduleId,
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
      });

      // Handle enabled/disabled changes
      if (keyParts[2] === 'enabled') {
        if (event.newValue === true && module.status === ModuleStatus.UNLOADED) {
          await this.loadModule(moduleId);
        } else if (event.newValue === false && module.status === ModuleStatus.RUNNING) {
          await this.unloadModule(moduleId);
        }
        return;
      }

      // Handle other configuration changes
      if (module.context && module.onConfigChange) {
        const newConfig = this.getModuleConfig(moduleId);

        if (!newConfig) {
          this.options.logger.warn('Configuration missing for module', {
            moduleId,
          });
          return;
        }

        const oldConfig = {
          ...newConfig,
          [keyParts[2]]: event.oldValue,
        } as ModuleConfig;

        const result = await module.onConfigChange(
          newConfig,
          oldConfig,
          module.context,
        );

        if (!result.success) {
          this.options.logger.warn('Module config change handler failed', {
            moduleId,
            error: result.error?.message,
          });
        }
      }
    } catch (error) {
      this.options.logger.error('Error handling configuration change', {
        key: event.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const modules = this.getModulesByStatus(ModuleStatus.RUNNING);
        
        for (const module of modules) {
          try {
            const health = await module.getHealth();
            if (health.status !== 'healthy') {
              this.options.logger.warn('Module health check failed', {
                moduleId: module.metadata.id,
                status: health.status,
                message: health.message,
              });
            }
          } catch (error) {
            this.options.logger.error('Health check error', {
              moduleId: module.metadata.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        this.options.logger.error('Health check cycle error', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.options.healthCheckIntervalMs || 30000);
  }
}

// Re-export types and enums
export { ModuleStatus, ModuleLoadStrategy } from './base-module';