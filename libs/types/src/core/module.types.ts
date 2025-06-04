/**
 * @fileoverview Module system types for the modular architecture
 * @module @agent-desktop/types/core/module
 */

import type { ComponentType } from 'react';
import type { HealthStatus } from './health.types';
import type { EventBus } from './event.types';
import type { ModuleConfig } from './config.types';

/**
 * Available module types in the system
 */
export enum ModuleType {
  CCP_CORE = 'ccp-core',
  CUSTOMER_INFO = 'customer-info',
  CASES = 'cases',
  TASKS = 'tasks',
  KNOWLEDGE = 'knowledge',
  ANALYTICS = 'analytics',
  SUPERVISOR = 'supervisor',
  CHAT = 'chat',
  RECORDINGS = 'recordings',
}

/**
 * Module lifecycle states
 */
export enum ModuleLifecycle {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  ERROR = 'error',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
}

/**
 * Module metadata interface defining module structure
 */
export interface ModuleMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly dependencies: readonly string[];
  readonly loadPriority: number;
  readonly lazy: boolean;
  readonly tags: readonly string[];
  readonly permissions: readonly string[];
  readonly minAppVersion: string;
  readonly maxAppVersion?: string;
}

/**
 * Module context provided to each module during initialization
 */
export interface ModuleContext {
  readonly logger: Logger;
  readonly config: ConfigService;
  readonly eventBus: EventBus;
  readonly dependencies: ReadonlyMap<string, CCPModule>;
  readonly moduleId: string;
  readonly customerId: string;
  readonly environment: string;
}

/**
 * Module interface that all CCP modules must implement
 */
export interface CCPModule {
  readonly metadata: ModuleMetadata;
  readonly lifecycle: ModuleLifecycle;
  
  /**
   * Initialize the module with the provided context
   */
  initialize(context: ModuleContext): Promise<void>;
  
  /**
   * Destroy the module and clean up resources
   */
  destroy(): Promise<void>;
  
  /**
   * Get the React component for this module
   */
  getComponent(): ComponentType<ModuleProps>;
  
  /**
   * Get the current health status of the module
   */
  getHealthStatus(): Promise<HealthStatus>;
  
  /**
   * Handle configuration updates
   */
  updateConfig(config: ModuleConfig): Promise<void>;
  
  /**
   * Validate module dependencies
   */
  validateDependencies(availableModules: readonly string[]): Promise<ValidationResult>;
}

/**
 * Props passed to module components
 */
export interface ModuleProps {
  readonly moduleId: string;
  readonly config: ModuleConfig;
  readonly context: ModuleContext;
  readonly onError?: (error: Error) => void;
  readonly onConfigChange?: (config: ModuleConfig) => void;
}

/**
 * Module factory interface for dynamic module loading
 */
export interface ModuleFactory {
  readonly moduleType: ModuleType;
  readonly version: string;
  
  /**
   * Create a new instance of the module
   */
  create(config: ModuleConfig): Promise<CCPModule>;
  
  /**
   * Validate the module configuration
   */
  validateConfig(config: ModuleConfig): Promise<ValidationResult>;
  
  /**
   * Get default configuration for the module
   */
  getDefaultConfig(): ModuleConfig;
}

/**
 * Module loading result
 */
export interface LoadedModule {
  readonly moduleId: string;
  readonly status: 'loaded' | 'failed';
  readonly component?: ComponentType<ModuleProps>;
  readonly loadTime: number;
  readonly healthStatus?: HealthStatus;
  readonly error?: string;
  readonly metadata?: ModuleMetadata;
}

/**
 * Module registry interface for managing modules
 */
export interface ModuleRegistry {
  /**
   * Register a module factory
   */
  registerFactory(factory: ModuleFactory): Promise<void>;
  
  /**
   * Load modules based on configuration
   */
  loadModules(configs: readonly ModuleConfig[]): Promise<readonly LoadedModule[]>;
  
  /**
   * Unload a specific module
   */
  unloadModule(moduleId: string): Promise<void>;
  
  /**
   * Get all loaded modules
   */
  getLoadedModules(): ReadonlyMap<string, CCPModule>;
  
  /**
   * Get module by ID
   */
  getModule(moduleId: string): CCPModule | undefined;
  
  /**
   * Validate module dependencies
   */
  validateDependencies(moduleId: string): Promise<ValidationResult>;
}

/**
 * Validation result for module operations
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'error' | 'critical';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly recommendation?: string;
}

/**
 * Module dependency information
 */
export interface ModuleDependency {
  readonly moduleId: string;
  readonly version: string;
  readonly optional: boolean;
  readonly reason: string;
}

/**
 * Module performance metrics
 */
export interface ModulePerformanceMetrics {
  readonly moduleId: string;
  readonly loadTime: number;
  readonly initializationTime: number;
  readonly renderTime: number;
  readonly memoryUsage: number;
  readonly errorCount: number;
  readonly healthCheckLatency: number;
}

// Re-export commonly used interfaces
interface Logger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  fatal(message: string, metadata?: Record<string, unknown>): void;
  createChild(context: string): Logger;
  setContext(context: Record<string, unknown>): void;
  time<T>(operation: string, fn: () => Promise<T>): Promise<T>;
}

interface ConfigService {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  getAll(): Record<string, unknown>;
  validate(config: Record<string, unknown>): ValidationResult;
}