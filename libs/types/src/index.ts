/**
 * @fileoverview Central export for all TypeScript types used across the Agent Desktop application
 * @module @agent-desktop/types
 */

// Core types
export * from './core/config.types';
export * from './core/logging.types';
export * from './core/module.types';
export * from './core/event.types';

// Amazon Connect types
export * from './connect/agent.types';
export * from './connect/contact.types';
export * from './connect/queue.types';
export * from './connect/streams.types';

// Application types
export {
  CustomerConfig,
  BrandingConfig,
  FeatureFlags,
  IntegrationConfig,
  AuthenticationConfig,
  EndpointConfig,
  RateLimit,
  SyncSettings,
  FieldMapping,
  FieldTransformation,
  ValidationRule,
  DeploymentConfig,
  CachingConfig,
  MonitoringConfig,
  AuditConfig,
  CSPConfig,
  CORSConfig,
  SessionConfig,
  EncryptionConfig,
  CustomerTenant,
  TenantLimits,
  TenantUsage,
} from './app/customer.types';
export * from './app/deployment.types';
export * from './app/integration.types';
export * from './app/branding.types';

// Utility types
export {
  Result,
  Success,
  Failure,
  AsyncResult,
  Fallible,
  AsyncFallible,
  isSuccess,
  isFailure,
  success,
  failure,
} from './utils/common.types';
