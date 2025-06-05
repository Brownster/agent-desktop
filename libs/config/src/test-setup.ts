/**
 * @fileoverview Test setup for configuration library
 */

// Provide a WebSocket implementation for Node-based tests
// so that modules using WebSocket can run without errors.
// eslint-disable-next-line @typescript-eslint/no-var-requires
(globalThis as any).WebSocket = require('ws');

// Global test utilities for configuration
global.ConfigTestUtils = {
  /**
   * Create a mock configuration for testing
   */
  createMockConfig: (overrides = {}) => ({
    customer_id: 'test-customer',
    name: 'Test Customer',
    branding: {
      primary_color: '#1e40af',
      secondary_color: '#374151',
      font_family: 'Inter, sans-serif',
      theme: 'light' as const,
      application_title: 'Test App',
      company_name: 'Test Company',
    },
    modules: [
      {
        module_id: 'ccp-core',
        enabled: true,
        position: 'sidebar' as const,
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read', 'write'],
        dependencies: [],
      },
    ],
    features: {
      recording_controls: true,
      screen_sharing: false,
      file_uploads: true,
      chat_functionality: true,
      supervisor_monitoring: false,
      analytics_dashboard: true,
      custom_scripts: false,
      third_party_integrations: true,
      advanced_routing: false,
      real_time_reporting: true,
      voice_analytics: false,
      sentiment_analysis: false,
    },
    integrations: [],
    deployment: {
      domain: 'test.example.com',
      cdn_distribution: 'test-distribution',
      environment: 'development' as const,
      region: 'us-east-1',
      ssl_certificate: 'test-cert',
      custom_domains: [],
      caching_strategy: {
        enabled: true,
        ttl: 3600,
        static_assets_ttl: 86400,
        api_cache_ttl: 300,
        invalidation_rules: [],
      },
      monitoring: {
        enabled: true,
        log_level: 'info' as const,
        metrics_enabled: true,
        alerts_enabled: true,
        notification_channels: [],
      },
    },
    security: {
      content_security_policy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
        },
        report_only: false,
      },
      cors: {
        enabled: true,
        allowed_origins: ['https://example.com'],
        allowed_methods: ['GET', 'POST'],
        allowed_headers: ['Content-Type'],
        exposed_headers: [],
        credentials: false,
        max_age: 86400,
      },
      session: {
        timeout_minutes: 60,
        sliding_expiration: true,
        secure_cookies: true,
        same_site_policy: 'strict' as const,
        idle_timeout_minutes: 30,
      },
      encryption: {
        algorithm: 'AES-256-GCM',
        key_rotation_days: 90,
        data_at_rest: true,
        data_in_transit: true,
        pii_encryption: true,
      },
      audit: {
        enabled: true,
        log_all_requests: false,
        log_data_access: true,
        retention_days: 365,
        export_enabled: true,
        anonymize_pii: true,
      },
    },
    vdi: {
      platform: 'auto-detect' as const,
      audio_optimization: true,
      video_optimization: false,
      bandwidth_optimization: true,
      local_storage_enabled: false,
      clipboard_enabled: true,
      file_transfer_enabled: false,
      print_redirection: false,
      performance_monitoring: true,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: '1.0.0',
    isActive: true,
    ...overrides,
  }),

  /**
   * Create validation result for testing
   */
  createValidationResult: (valid = true, errors = [], warnings = []) => ({
    isValid: valid,
    errors,
    warnings,
  }),

  /**
   * Create a mock validation error
   */
  createValidationError: (field = 'test_field', message = 'Test error') => ({
    field,
    message,
    code: 'TEST_ERROR',
    severity: 'error' as const,
  }),

  /**
   * Create a mock validation warning
   */
  createValidationWarning: (field = 'test_field', message = 'Test warning') => ({
    field,
    message,
    code: 'TEST_WARNING',
    recommendation: 'Test recommendation',
  }),

  /**
   * Create a mock environment configuration
   */
  createEnvironmentConfig: (env = 'development') => ({
    environment: env,
    apiEndpoint: `https://api-${env}.example.com`,
    websocketEndpoint: `wss://ws-${env}.example.com`,
    logLevel: env === 'production' ? 'info' : 'debug',
    enableTelemetry: env === 'production',
    enableAnalytics: env === 'production',
    debugMode: env !== 'production',
  }),

  /**
   * Wait for async operations to complete
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Flush all pending promises
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),

  /**
   * Create a mock customer configuration
   */
  createMockCustomerConfig: (overrides = {}) => ({
    customer_id: 'test-customer',
    name: 'Test Customer',
    ...overrides,
  }),

  /**
   * Create a mock module configuration
   */
  createMockModuleConfig: (overrides = {}) => ({
    module_id: 'test-module',
    enabled: true,
    position: 'sidebar',
    priority: 1,
    ...overrides,
  }),

  /**
   * Create a mock branding configuration
   */
  createMockBrandingConfig: (overrides = {}) => ({
    primary_color: '#1e40af',
    secondary_color: '#374151',
    font_family: 'Inter, sans-serif',
    theme: 'light',
    application_title: 'Test App',
    company_name: 'Test Company',
    ...overrides,
  }),

  /**
   * Create mock feature flags
   */
  createMockFeatureFlags: (overrides = {}) => ({
    recording_controls: true,
    screen_sharing: false,
    file_uploads: true,
    chat_functionality: true,
    supervisor_monitoring: false,
    analytics_dashboard: true,
    custom_scripts: false,
    third_party_integrations: true,
    advanced_routing: false,
    real_time_reporting: true,
    voice_analytics: false,
    sentiment_analysis: false,
    ...overrides,
  }),

  /**
   * Mock configuration service
   */
  mockConfigService: {
    getCustomerConfig: jest.fn(),
    updateCustomerConfig: jest.fn(),
    validateConfig: jest.fn(),
    reset: () => {
      jest.clearAllMocks();
    },
  },
};