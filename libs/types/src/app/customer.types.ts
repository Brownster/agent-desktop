/**
 * @fileoverview Customer configuration and deployment types
 * @module @agent-desktop/types/app/customer
 */

import type { ModuleConfig, Environment } from '../core/config.types';

/**
 * Audio configuration for controlling softphone behavior
 */
export interface AudioConfiguration {
  readonly mode: 'local' | 'mobile_browser' | 'vdi';
  readonly vdiOptions?: {
    readonly platformHint?: 'citrix' | 'vmware' | 'workspaces' | 'generic';
  };
}

/**
 * Customer configuration schema
 */
export interface CustomerConfig {
  readonly customer_id: string;
  readonly name: string;
  readonly description?: string;
  readonly branding: BrandingConfig;
  readonly modules: readonly ModuleConfig[];
  readonly features: FeatureFlags;
  readonly integrations: readonly IntegrationConfig[];
  readonly deployment: DeploymentConfig;
  readonly security: SecurityConfig;
  readonly vdi: VDIConfig;
  readonly audioConfiguration: AudioConfiguration;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: string;
  readonly isActive: boolean;
}

/**
 * Branding configuration for customer customization
 */
export interface BrandingConfig {
  readonly logo_url?: string;
  readonly favicon_url?: string;
  readonly primary_color: string;
  readonly secondary_color: string;
  readonly accent_color?: string;
  readonly font_family: string;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly custom_css?: string;
  readonly application_title: string;
  readonly company_name: string;
}

/**
 * Feature flags for enabling/disabling functionality
 */
export interface FeatureFlags {
  readonly recording_controls: boolean;
  readonly screen_sharing: boolean;
  readonly file_uploads: boolean;
  readonly chat_functionality: boolean;
  readonly supervisor_monitoring: boolean;
  readonly analytics_dashboard: boolean;
  readonly custom_scripts: boolean;
  readonly third_party_integrations: boolean;
  readonly advanced_routing: boolean;
  readonly real_time_reporting: boolean;
  readonly voice_analytics: boolean;
  readonly sentiment_analysis: boolean;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  readonly type: IntegrationType;
  readonly name: string;
  readonly enabled: boolean;
  readonly config: Record<string, unknown>;
  readonly authentication: AuthenticationConfig;
  readonly endpoints: EndpointConfig;
  readonly sync_settings: SyncSettings;
  readonly field_mappings: readonly FieldMapping[];
}

/**
 * Supported integration types
 */
export enum IntegrationType {
  SALESFORCE = 'salesforce',
  SERVICENOW = 'servicenow',
  ZENDESK = 'zendesk',
  MICROSOFT_DYNAMICS = 'microsoft_dynamics',
  CUSTOM_CRM = 'custom_crm',
  CUSTOM_API = 'custom_api',
  WEBHOOK = 'webhook',
}

/**
 * Authentication configuration for integrations
 */
export interface AuthenticationConfig {
  readonly type: 'oauth2' | 'api_key' | 'basic_auth' | 'jwt' | 'custom';
  readonly credentials: Record<string, string>;
  readonly token_endpoint?: string;
  readonly refresh_token_endpoint?: string;
  readonly scopes?: readonly string[];
  readonly expires_in?: number;
}

/**
 * Endpoint configuration for integrations
 */
export interface EndpointConfig {
  readonly base_url: string;
  readonly api_version?: string;
  readonly timeout: number;
  readonly retry_attempts: number;
  readonly rate_limit?: RateLimit;
  readonly custom_headers?: Record<string, string>;
}

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  readonly requests_per_minute: number;
  readonly burst_limit: number;
  readonly backoff_strategy: 'linear' | 'exponential';
}

/**
 * Data synchronization settings
 */
export interface SyncSettings {
  readonly enabled: boolean;
  readonly direction: 'bidirectional' | 'inbound' | 'outbound';
  readonly frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  readonly batch_size: number;
  readonly conflict_resolution: 'source_wins' | 'target_wins' | 'timestamp' | 'custom';
}

/**
 * Field mapping for data integration
 */
export interface FieldMapping {
  readonly source_field: string;
  readonly target_field: string;
  readonly transformation?: FieldTransformation;
  readonly required: boolean;
  readonly default_value?: unknown;
}

/**
 * Field transformation rules
 */
export interface FieldTransformation {
  readonly type: 'format' | 'lookup' | 'calculation' | 'custom';
  readonly config: Record<string, unknown>;
  readonly validation?: ValidationRule;
}

/**
 * Validation rule for field transformations
 */
export interface ValidationRule {
  readonly type: 'regex' | 'range' | 'enum' | 'custom';
  readonly rule: string | number | readonly string[];
  readonly error_message: string;
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  readonly domain: string;
  readonly subdomain?: string;
  readonly cdn_distribution: string;
  readonly environment: Environment;
  readonly region: string;
  readonly ssl_certificate: string;
  readonly custom_domains: readonly string[];
  readonly caching_strategy: CachingConfig;
  readonly monitoring: MonitoringConfig;
}

/**
 * Caching configuration
 */
export interface CachingConfig {
  readonly enabled: boolean;
  readonly ttl: number;
  readonly static_assets_ttl: number;
  readonly api_cache_ttl: number;
  readonly invalidation_rules: readonly string[];
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly log_level: 'debug' | 'info' | 'warn' | 'error';
  readonly metrics_enabled: boolean;
  readonly alerts_enabled: boolean;
  readonly webhook_url?: string;
  readonly notification_channels: readonly string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  readonly content_security_policy: CSPConfig;
  readonly cors: CORSConfig;
  readonly session: SessionConfig;
  readonly encryption: EncryptionConfig;
  readonly audit: AuditConfig;
}

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  readonly enabled: boolean;
  readonly directives: Record<string, readonly string[]>;
  readonly report_uri?: string;
  readonly report_only: boolean;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  readonly enabled: boolean;
  readonly allowed_origins: readonly string[];
  readonly allowed_methods: readonly string[];
  readonly allowed_headers: readonly string[];
  readonly exposed_headers: readonly string[];
  readonly credentials: boolean;
  readonly max_age: number;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  readonly timeout_minutes: number;
  readonly sliding_expiration: boolean;
  readonly secure_cookies: boolean;
  readonly same_site_policy: 'strict' | 'lax' | 'none';
  readonly idle_timeout_minutes: number;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  readonly algorithm: string;
  readonly key_rotation_days: number;
  readonly data_at_rest: boolean;
  readonly data_in_transit: boolean;
  readonly pii_encryption: boolean;
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  readonly enabled: boolean;
  readonly log_all_requests: boolean;
  readonly log_data_access: boolean;
  readonly retention_days: number;
  readonly export_enabled: boolean;
  readonly anonymize_pii: boolean;
}

/**
 * VDI-specific configuration
 */
export interface VDIConfig {
  readonly platform: 'citrix' | 'vmware' | 'aws-workspaces' | 'azure-vdi' | 'auto-detect';
  readonly audio_optimization: boolean;
  readonly video_optimization: boolean;
  readonly bandwidth_optimization: boolean;
  readonly local_storage_enabled: boolean;
  readonly clipboard_enabled: boolean;
  readonly file_transfer_enabled: boolean;
  readonly print_redirection: boolean;
  readonly performance_monitoring: boolean;
}

/**
 * Customer tenant information
 */
export interface CustomerTenant {
  readonly customer_id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly status: 'active' | 'inactive' | 'suspended' | 'trial';
  readonly plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly expires_at?: Date;
  readonly limits: TenantLimits;
  readonly usage: TenantUsage;
}

/**
 * Tenant resource limits
 */
export interface TenantLimits {
  readonly max_agents: number;
  readonly max_modules: number;
  readonly max_integrations: number;
  readonly storage_gb: number;
  readonly bandwidth_gb: number;
  readonly api_calls_per_day: number;
}

/**
 * Tenant usage statistics
 */
export interface TenantUsage {
  readonly active_agents: number;
  readonly enabled_modules: number;
  readonly configured_integrations: number;
  readonly storage_used_gb: number;
  readonly bandwidth_used_gb: number;
  readonly api_calls_today: number;
  readonly last_updated: Date;
}