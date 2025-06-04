/**
 * @fileoverview Main export for the configuration management library
 * @module @agent-desktop/config
 */

// Core configuration service
export { 
  ConfigService, 
  type IConfigService,
  type ConfigServiceOptions,
  ConfigSource,
  type ConfigChangeEvent,
  type ConfigWatcher,
} from './config.service';

// Configuration validator
export { 
  ConfigValidator,
  type ValidationSchema,
} from './config.validator';

// Configuration storage
export {
  DynamoDBConfigStore,
  MemoryConfigStore,
  type IConfigStore,
} from './config.store';

// WebSocket service
export {
  ConfigWebSocketService,
} from './config.websocket';

// Re-export types from the types library
export type {
  CustomerConfig,
  AppConfig,
  ModuleConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  Environment,
  VDIConfig,
  SecurityConfig,
  DeploymentConfig,
  BrandingConfig,
  FeatureFlags,
  IntegrationConfig,
  AudioConfiguration,
} from '@agent-desktop/types';