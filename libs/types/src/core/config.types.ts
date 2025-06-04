/**
 * @fileoverview Configuration types for the Agent Desktop application
 * @module @agent-desktop/types/core/config
 */

/**
 * Environment types for different deployment stages
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Log level configuration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * VDI platform types supported by the application
 */
export type VDIPlatform = 'citrix' | 'vmware' | 'aws-workspaces' | 'azure-vdi' | 'native';

/**
 * Module position types within the application layout
 */
export type ModulePosition = 'sidebar' | 'main' | 'modal' | 'header' | 'footer';

/**
 * Base configuration interface that all config objects must implement
 */
export interface BaseConfig {
  readonly id: string;
  readonly version: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isActive: boolean;
}

/**
 * Application-wide configuration settings
 */
export interface AppConfig extends BaseConfig {
  readonly environment: Environment;
  readonly logLevel: LogLevel;
  readonly apiEndpoint: string;
  readonly websocketEndpoint: string;
  readonly maxRetryAttempts: number;
  readonly requestTimeoutMs: number;
  readonly enableTelemetry: boolean;
  readonly enableAnalytics: boolean;
  readonly debugMode: boolean;
}

/**
 * Module-specific configuration
 */
export interface ModuleConfig {
  readonly module_id: string;
  readonly enabled: boolean;
  readonly position: ModulePosition;
  readonly priority: number;
  readonly lazy: boolean;
  readonly settings: Record<string, unknown>;
  readonly permissions: readonly string[];
  readonly dependencies: readonly string[];
}

/**
 * VDI-specific configuration
 */
export interface VDIConfig {
  readonly platform: VDIPlatform;
  readonly audioOptimization: boolean;
  readonly localAudioPath: boolean;
  readonly bandwidthOptimization: boolean;
  readonly compressionLevel: number;
  readonly maxLatencyMs: number;
  readonly fallbackEnabled: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  readonly enableCSP: boolean;
  readonly allowedOrigins: readonly string[];
  readonly sessionTimeoutMs: number;
  readonly enableAuditLogging: boolean;
  readonly encryptionKey?: string;
  readonly ssoEnabled: boolean;
  readonly mfaRequired: boolean;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ConfigValidationError[];
  readonly warnings: readonly ConfigValidationWarning[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'critical';
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly recommendation?: string;
}