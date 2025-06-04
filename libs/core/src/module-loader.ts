/**
 * @fileoverview Module loader for dynamic module loading and instantiation
 * @module @agent-desktop/core
 */

import type {
  ModuleID,
  Result,
  Logger,
} from '@agent-desktop/types';

import type { IModule } from './base-module';

/**
 * Module load options
 */
export interface ModuleLoadOptions {
  readonly moduleId: ModuleID;
  readonly modulePath?: string;
  readonly version?: string;
  readonly timeout?: number;
  readonly retries?: number;
}

/**
 * Module load result
 */
export interface ModuleLoadResult {
  readonly module: IModule;
  readonly loadTime: number;
  readonly fromCache: boolean;
}

/**
 * Module loader interface
 */
export interface IModuleLoader {
  /**
   * Load a module from the given path or module ID
   * 
   * @param options - Module load options
   * @returns Promise that resolves with the loaded module
   */
  loadModule(options: ModuleLoadOptions): Promise<Result<ModuleLoadResult, Error>>;

  /**
   * Unload a module and free its resources
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unloaded
   */
  unloadModule(moduleId: ModuleID): Promise<Result<void, Error>>;

  /**
   * Check if a module is cached
   * 
   * @param moduleId - Module ID
   * @returns True if module is cached
   */
  isCached(moduleId: ModuleID): boolean;

  /**
   * Clear the module cache
   */
  clearCache(): void;

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
}

/**
 * Cached module entry
 */
interface CachedModule {
  readonly module: IModule;
  readonly loadTime: number;
  readonly accessTime: number;
  readonly accessCount: number;
}

/**
 * Module loader implementation with caching and hot-reload support
 */
export class ModuleLoader implements IModuleLoader {
  private readonly cache = new Map<ModuleID, CachedModule>();
  private readonly loadPromises = new Map<ModuleID, Promise<Result<ModuleLoadResult, Error>>>();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private readonly logger: Logger,
    private readonly options: {
      readonly enableCache?: boolean;
      readonly maxCacheSize?: number;
      readonly enableHotReload?: boolean;
      readonly modulePaths?: Record<ModuleID, string>;
    } = {}
  ) {
    this.logger = logger.createChild('module-loader');
  }

  /**
   * Load a module from the given path or module ID
   * 
   * @param options - Module load options
   * @returns Promise that resolves with the loaded module
   */
  async loadModule(options: ModuleLoadOptions): Promise<Result<ModuleLoadResult, Error>> {
    const { moduleId } = options;

    // Check if already loading
    const existingPromise = this.loadPromises.get(moduleId);
    if (existingPromise) {
      return existingPromise;
    }

    // Check cache first
    if (this.options.enableCache !== false) {
      const cached = this.getCachedModule(moduleId);
      if (cached) {
        this.cacheHits++;
        this.updateCacheAccess(moduleId);
        
        this.logger.debug('Module loaded from cache', {
          moduleId,
          loadTime: cached.loadTime,
          accessCount: cached.accessCount,
        });

        return {
          success: true,
          data: {
            module: cached.module,
            loadTime: cached.loadTime,
            fromCache: true,
          },
        };
      }
    }

    // Load module
    const loadPromise = this.performModuleLoad(options);
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
   * @param options - Module load options
   * @returns Promise that resolves with the loaded module
   */
  private async performModuleLoad(options: ModuleLoadOptions): Promise<Result<ModuleLoadResult, Error>> {
    const startTime = Date.now();
    const { moduleId, modulePath, timeout = 30000, retries = 3 } = options;

    this.cacheMisses++;
    
    try {
      this.logger.info('Loading module', {
        moduleId,
        modulePath,
        timeout,
        retries,
      });

      // Determine module path
      const resolvedPath = modulePath || this.resolveModulePath(moduleId);
      if (!resolvedPath) {
        return {
          success: false,
          error: new Error(`Cannot resolve path for module ${moduleId}`),
        };
      }

      // Load with retries
      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const module = await this.loadModuleFromPath(resolvedPath, timeout);
          const loadTime = Date.now() - startTime;

          // Validate the loaded module
          const validation = this.validateModule(module, moduleId);
          if (!validation.success) {
            return validation;
          }

          // Cache the module if caching is enabled
          if (this.options.enableCache !== false) {
            this.cacheModule(moduleId, module, loadTime);
          }

          this.logger.info('Module loaded successfully', {
            moduleId,
            loadTime,
            attempt: attempt + 1,
            fromCache: false,
          });

          return {
            success: true,
            data: {
              module,
              loadTime,
              fromCache: false,
            },
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < retries) {
            this.logger.warn('Module load attempt failed, retrying', {
              moduleId,
              attempt: attempt + 1,
              error: lastError.message,
            });
            
            // Wait before retry with exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }

      return {
        success: false,
        error: lastError || new Error(`Failed to load module ${moduleId} after ${retries + 1} attempts`),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown module load error'),
      };
    }
  }

  /**
   * Load module from file system path
   * 
   * @param modulePath - Path to module file
   * @param timeout - Load timeout in milliseconds
   * @returns Promise that resolves with the module instance
   */
  private async loadModuleFromPath(modulePath: string, timeout: number): Promise<IModule> {
    return new Promise<IModule>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Module load timeout after ${timeout}ms`));
      }, timeout);

      // Dynamic import with timeout
      import(modulePath)
        .then(moduleExports => {
          clearTimeout(timeoutId);
          
          // Look for the module class/factory
          const ModuleClass = moduleExports.default || moduleExports.Module || moduleExports;
          
          if (typeof ModuleClass === 'function') {
            // Instantiate the module
            const module = new ModuleClass();
            resolve(module);
          } else if (typeof ModuleClass === 'object' && ModuleClass !== null) {
            // Already instantiated module
            resolve(ModuleClass as IModule);
          } else {
            reject(new Error(`Invalid module export from ${modulePath}`));
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Validate a loaded module
   * 
   * @param module - Module to validate
   * @param expectedId - Expected module ID
   * @returns Validation result
   */
  private validateModule(module: unknown, expectedId: ModuleID): Result<IModule, Error> {
    try {
      if (!module || typeof module !== 'object') {
        return {
          success: false,
          error: new Error('Module must be an object'),
        };
      }

      const moduleObj = module as IModule;

      // Check required properties
      if (!moduleObj.metadata) {
        return {
          success: false,
          error: new Error('Module must have metadata property'),
        };
      }

      if (moduleObj.metadata.id !== expectedId) {
        return {
          success: false,
          error: new Error(`Module ID mismatch: expected ${expectedId}, got ${moduleObj.metadata.id}`),
        };
      }

      if (typeof moduleObj.getHealth !== 'function') {
        return {
          success: false,
          error: new Error('Module must implement getHealth method'),
        };
      }

      if (typeof moduleObj.getMetrics !== 'function') {
        return {
          success: false,
          error: new Error('Module must implement getMetrics method'),
        };
      }

      if (typeof moduleObj.validateConfig !== 'function') {
        return {
          success: false,
          error: new Error('Module must implement validateConfig method'),
        };
      }

      return { success: true, data: moduleObj };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown validation error'),
      };
    }
  }

  /**
   * Unload a module and free its resources
   * 
   * @param moduleId - Module ID
   * @returns Promise that resolves when module is unloaded
   */
  async unloadModule(moduleId: ModuleID): Promise<Result<void, Error>> {
    try {
      // Remove from cache
      this.cache.delete(moduleId);
      
      // Cancel any pending loads
      this.loadPromises.delete(moduleId);

      this.logger.info('Module unloaded', { moduleId });
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown unload error'),
      };
    }
  }

  /**
   * Check if a module is cached
   * 
   * @param moduleId - Module ID
   * @returns True if module is cached
   */
  isCached(moduleId: ModuleID): boolean {
    return this.cache.has(moduleId);
  }

  /**
   * Clear the module cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.logger.info('Module cache cleared');
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }

  /**
   * Resolve module path from module ID
   * 
   * @param moduleId - Module ID
   * @returns Module path or undefined
   */
  private resolveModulePath(moduleId: ModuleID): string | undefined {
    // Check explicit path mapping
    if (this.options.modulePaths?.[moduleId]) {
      return this.options.modulePaths[moduleId];
    }

    // Default path resolution
    // In a real implementation, this would resolve from a module registry or file system
    const basePath = './modules';
    return `${basePath}/${moduleId}/index.js`;
  }

  /**
   * Get cached module
   * 
   * @param moduleId - Module ID
   * @returns Cached module or undefined
   */
  private getCachedModule(moduleId: ModuleID): CachedModule | undefined {
    return this.cache.get(moduleId);
  }

  /**
   * Cache a module
   * 
   * @param moduleId - Module ID
   * @param module - Module instance
   * @param loadTime - Load time in milliseconds
   */
  private cacheModule(moduleId: ModuleID, module: IModule, loadTime: number): void {
    // Check cache size limit
    const maxSize = this.options.maxCacheSize || 100;
    if (this.cache.size >= maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(moduleId, {
      module,
      loadTime,
      accessTime: Date.now(),
      accessCount: 1,
    });

    this.logger.debug('Module cached', {
      moduleId,
      loadTime,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Update cache access statistics
   * 
   * @param moduleId - Module ID
   */
  private updateCacheAccess(moduleId: ModuleID): void {
    const cached = this.cache.get(moduleId);
    if (cached) {
      this.cache.set(moduleId, {
        ...cached,
        accessTime: Date.now(),
        accessCount: cached.accessCount + 1,
      });
    }
  }

  /**
   * Evict least recently used module from cache
   */
  private evictLeastRecentlyUsed(): void {
    let oldestTime = Date.now();
    let oldestId: ModuleID | undefined;

    for (const [moduleId, cached] of this.cache) {
      if (cached.accessTime < oldestTime) {
        oldestTime = cached.accessTime;
        oldestId = moduleId;
      }
    }

    if (oldestId) {
      this.cache.delete(oldestId);
      this.logger.debug('Evicted module from cache', {
        moduleId: oldestId,
        accessTime: oldestTime,
      });
    }
  }

  /**
   * Delay execution
   * 
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}