/**
 * @fileoverview Main export for the core library
 * @module @agent-desktop/core
 */

// Module system exports
export {
  ModuleRegistry,
  type IModuleRegistry,
  type ModuleRegistryOptions,
  ModuleStatus,
  ModuleLoadStrategy,
} from './module-registry';

export {
  BaseModule,
  type IModule,
  type ModuleMetadata,
  type ModuleContext,
  type ModuleLifecycle,
  type ModuleDependency,
  type ModulePermission,
} from './base-module';

export {
  ModuleLoader,
  type IModuleLoader,
  type ModuleLoadOptions,
  type ModuleLoadResult,
} from './module-loader';

export {
  ModuleHealthChecker,
  type IModuleHealthChecker,
  type ModuleHealthStatus,
  type ModuleHealthCheck,
} from './module-health';

// Re-export types from the types library
export type {
  ModuleConfig,
  CustomerID,
  ModuleID,
  Result,
  Logger,
} from '@agent-desktop/types';