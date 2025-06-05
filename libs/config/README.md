# @agent-desktop/config

Enterprise configuration management library with validation, watching, caching, and customer-specific configurations.

## Features

- **Hierarchical Configuration**: Dot-notation support for nested configuration access
- **Multiple Sources**: Environment variables, files, databases, and runtime overrides
- **Real-time Watching**: Subscribe to configuration changes with wildcard support
- **Schema Validation**: Comprehensive validation with custom rules and error reporting
- **Performance Caching**: Intelligent caching with TTL and size limits
- **Customer Configurations**: Load and save customer-specific settings
- **Environment Support**: Environment-specific configuration management
- **Type Safety**: Full TypeScript support with strict typing
- **Enterprise Features**: Logging, error handling, and monitoring integration
- **Production Storage**: Automatically uses DynamoDB in production
- **WebSocket Updates**: Real-time configuration change notifications
- **Version History**: Retrieve previous versions and rollback

## Quick Start

```typescript
import { ConfigService } from '@agent-desktop/config';

// Create configuration service
const config = new ConfigService({
  enableWatching: true,
  enableValidation: true,
  enableCaching: true,
});

// Set configuration values
config.set('app.database.host', 'localhost');
config.set('app.database.port', 5432);

// Get configuration values
const host = config.get<string>('app.database.host');
const port = config.get<number>('app.database.port');

// Watch for changes
const unwatch = config.watch('app.database.*', event => {
  console.log(`Config changed: ${event.key} = ${event.newValue}`);
});
```

## Configuration Service

### Basic Operations

```typescript
import { ConfigService } from '@agent-desktop/config';

const config = new ConfigService();

// Set values (supports dot notation)
config.set('app.name', 'Agent Desktop');
config.set('app.features.auth.enabled', true);
config.set('app.modules', [
  { id: 'ccp-core', enabled: true },
  { id: 'customer-info', enabled: false },
]);

// Get values with type safety
const appName = config.get<string>('app.name');
const authEnabled = config.get<boolean>('app.features.auth.enabled');
const modules = config.get<ModuleConfig[]>('app.modules');

// Check existence
if (config.has('app.features.auth.provider')) {
  const provider = config.get<string>('app.features.auth.provider');
}

// Delete values
config.delete('app.features.auth.provider');

// Get all configuration
const allConfig = config.getAll();

// Clear everything
config.clear();
```

### Configuration Sources

```typescript
import { ConfigService, ConfigSource } from '@agent-desktop/config';

const config = new ConfigService({
  sources: [
    ConfigSource.ENVIRONMENT, // Process environment variables
    ConfigSource.FILE, // Configuration files
    ConfigSource.DATABASE, // Customer configurations
    ConfigSource.REMOTE, // Remote configuration service
    ConfigSource.OVERRIDE, // Runtime overrides
  ],
});

// Set with specific source
config.set('api.endpoint', 'https://api.example.com', ConfigSource.ENVIRONMENT);
```

### Real-time Configuration Watching

```typescript
// Watch specific keys
const unwatch1 = config.watch('app.database.host', event => {
  console.log('Database host changed:', event.newValue);
  // Reconnect to database with new host
});

// Watch with wildcards
const unwatch2 = config.watch('app.modules.*', event => {
  console.log('Module configuration changed:', event.key);
  // Reload affected modules
});

// Watch all changes
const unwatch3 = config.watch('*', event => {
  console.log('Any configuration changed');
});

// Unwatch when done
unwatch1();
unwatch2();
unwatch3();
```

### Configuration Validation

```typescript
// Validate configuration object
const customerConfig = {
  customer_id: 'acme-corp',
  name: 'ACME Corporation',
  version: '1.0.0',
  modules: [{ module_id: 'ccp-core', enabled: true }],
  // ... other configuration
};

const result = config.validate(customerConfig);

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
  result.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
  });
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

## Customer Configuration Management

### Loading Customer Configurations

```typescript
// Load customer-specific configuration
const result = await config.loadCustomerConfig('acme-corp');

if (result.success) {
  const customerConfig = result.data;
  console.log('Loaded config for:', customerConfig.name);

  // Apply customer configuration
  customerConfig.modules.forEach(module => {
    config.set(`modules.${module.module_id}`, module);
  });
} else {
  console.error('Failed to load customer config:', result.error);
}
```

### Saving Customer Configurations

```typescript
const customerConfig: CustomerConfig = {
  customer_id: 'acme-corp',
  name: 'ACME Corporation',
  version: '1.2.0',
  branding: {
    primary_color: '#1e40af',
    secondary_color: '#374151',
    font_family: 'Inter, sans-serif',
    theme: 'light',
    application_title: 'ACME Contact Center',
    company_name: 'ACME Corporation',
  },
  modules: [
    {
      module_id: 'ccp-core',
      enabled: true,
      position: 'sidebar',
      priority: 1,
      lazy: false,
      settings: { autoAnswer: true },
      permissions: ['read', 'write'],
      dependencies: [],
    },
    {
      module_id: 'customer-info',
      enabled: true,
      position: 'main',
      priority: 2,
      lazy: true,
      settings: { showHistory: true },
      permissions: ['read'],
      dependencies: ['ccp-core'],
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
  // ... other configuration sections
};

const saveResult = await config.saveCustomerConfig(customerConfig);

if (saveResult.success) {
  console.log('Customer configuration saved successfully');
} else {
  console.error('Failed to save:', saveResult.error);
}
```

### Rolling Back Configuration

```typescript
// Roll back to a previous version
const result = await config.rollbackCustomerConfig('acme-corp', '1.1.0');
if (result.success) {
  console.log('Rolled back to 1.1.0');
}
```

## Environment Configuration

```typescript
// Get environment-specific configuration
const envConfig = config.getEnvironmentConfig();

console.log('Environment:', envConfig.environment);
console.log('API Endpoint:', envConfig.apiEndpoint);
console.log('Debug Mode:', envConfig.debugMode);

// Environment variables are automatically loaded:
// NODE_ENV -> environment
// API_ENDPOINT -> apiEndpoint
// WS_ENDPOINT -> websocketEndpoint
// LOG_LEVEL -> logLevel
// MAX_RETRY_ATTEMPTS -> maxRetryAttempts
// REQUEST_TIMEOUT_MS -> requestTimeoutMs
```

## Configuration Validator

### Using the Built-in Validator

```typescript
import { ConfigValidator } from '@agent-desktop/config';

const validator = new ConfigValidator();

// Validate customer configuration
const customerResult = validator.validateCustomerConfig(customerConfig);

// Validate module configuration
const moduleResult = validator.validateModuleConfig(moduleConfig);
```

### Custom Validation Schemas

```typescript
// Add custom validation schema
validator.addSchema('CustomModule', {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      required: true,
      pattern: /^custom-[a-z0-9\-]+$/,
    },
    settings: {
      type: 'object',
      required: true,
      properties: {
        timeout: {
          type: 'number',
          min: 1000,
          max: 30000,
        },
        retries: {
          type: 'number',
          min: 0,
          max: 5,
        },
      },
    },
  },
});
```

## Advanced Configuration

### Service Options

```typescript
const config = new ConfigService({
  logger: myLogger, // Custom logger instance
  enableWatching: true, // Enable change notifications
  enableValidation: true, // Enable validation
  enableCaching: true, // Enable caching
  cacheSize: 1000, // Maximum cache entries
  cacheTtl: 300000, // Cache TTL in milliseconds (5 minutes)
  sources: [
    // Configuration sources in priority order
    ConfigSource.OVERRIDE,
    ConfigSource.DATABASE,
    ConfigSource.FILE,
    ConfigSource.ENVIRONMENT,
  ],
});
```

### WebSocket Options

The `webSocketOptions.maxQueueSize` option limits how many outbound WebSocket
messages may be buffered while the connection is unavailable. The default value
is **100** messages. When this threshold is exceeded, the oldest queued message
is dropped before adding a new one.

### Performance Optimization

```typescript
// Batch configuration updates
config.set('app.module1.enabled', true);
config.set('app.module1.settings', { option: 'value' });
config.set('app.module2.enabled', false);

// Use caching for frequently accessed values
const cachedValue = config.get('frequently.accessed.setting');

// Watch efficiently with specific patterns
const unwatch = config.watch('modules.*.enabled', event => {
  // Only notified when module enabled state changes
});
```

### Error Handling

```typescript
try {
  const result = await config.loadCustomerConfig('customer-id');

  if (!result.success) {
    // Handle configuration loading error
    console.error('Config load failed:', result.error.message);

    // Fall back to default configuration
    const defaultConfig = getDefaultConfiguration();
    applyConfiguration(defaultConfig);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Integration Examples

### With Module System

```typescript
import { ConfigService } from '@agent-desktop/config';
import { ModuleRegistry } from '@agent-desktop/core';

const config = new ConfigService();
const moduleRegistry = new ModuleRegistry();

// Load customer configuration and apply to modules
const customerResult = await config.loadCustomerConfig(customerId);

if (customerResult.success) {
  const customerConfig = customerResult.data;

  // Load modules based on configuration
  const enabledModules = customerConfig.modules.filter(m => m.enabled);
  await moduleRegistry.loadModules(enabledModules);

  // Watch for module configuration changes
  config.watch('modules.*', async event => {
    if (event.key.endsWith('.enabled')) {
      const moduleId = event.key.split('.')[1];

      if (event.newValue) {
        await moduleRegistry.loadModule(moduleId);
      } else {
        await moduleRegistry.unloadModule(moduleId);
      }
    }
  });
}
```

### With Logging System

```typescript
import { ConfigService } from '@agent-desktop/config';
import { createLogger } from '@agent-desktop/logging';

const logger = createLogger('config-service');

const config = new ConfigService({
  logger,
  enableWatching: true,
  enableValidation: true,
});

// Configuration changes are automatically logged
config.watch('*', event => {
  logger.info('Configuration changed', {
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
    source: event.source,
  });
});
```

## Best Practices

### Configuration Structure

```typescript
// Use hierarchical naming
config.set('app.database.primary.host', 'db1.example.com');
config.set('app.database.primary.port', 5432);
config.set('app.database.replica.host', 'db2.example.com');
config.set('app.database.replica.port', 5432);

// Group related settings
config.set('app.auth', {
  provider: 'oauth',
  clientId: 'client-123',
  scopes: ['read', 'write'],
});

// Use descriptive names
config.set('app.features.realTimeNotifications.enabled', true);
config.set('app.features.realTimeNotifications.pollIntervalMs', 5000);
```

### Validation Rules

```typescript
// Always validate external configuration
const externalConfig = await loadConfigurationFromAPI();
const validationResult = config.validate(externalConfig);

if (!validationResult.isValid) {
  throw new Error(`Invalid configuration: ${validationResult.errors[0].message}`);
}

// Use type-safe getters
const timeout = config.get<number>('api.timeout') ?? 30000;
const enableAuth = config.get<boolean>('auth.enabled') ?? false;
```

### Watch Patterns

```typescript
// Watch specific subsystems
config.watch('database.*', handleDatabaseConfigChange);
config.watch('auth.*', handleAuthConfigChange);
config.watch('modules.*.enabled', handleModuleToggle);

// Avoid watching too broadly
// config.watch('*', handler); // Can be noisy

// Use meaningful watch handlers
const unwatchDatabase = config.watch('database.*', async event => {
  if (event.key === 'database.host' || event.key === 'database.port') {
    await reconnectDatabase();
  }
});
```

### Memory Management

```typescript
// Always unwatch when components are destroyed
class MyComponent {
  private unwatchConfig: (() => void)[] = [];

  constructor(private config: ConfigService) {
    this.unwatchConfig.push(config.watch('component.setting', this.handleSettingChange));
  }

  destroy() {
    // Clean up watchers
    this.unwatchConfig.forEach(unwatch => unwatch());
    this.unwatchConfig = [];
  }
}
```

## API Reference

### ConfigService

- `get<T>(key: string): T | undefined` - Get configuration value
- `set(key: string, value: unknown, source?: ConfigSource): void` - Set configuration value
- `has(key: string): boolean` - Check if key exists
- `delete(key: string): boolean` - Delete configuration key
- `getAll(): Record<string, unknown>` - Get all configuration
- `clear(): void` - Clear all configuration
- `watch(key: string, callback: ConfigWatcher): () => void` - Watch for changes
- `validate(config: Record<string, unknown>): ConfigValidationResult` - Validate configuration
- `loadCustomerConfig(customerId: string): Promise<Result<CustomerConfig, Error>>` - Load customer config
- `saveCustomerConfig(config: CustomerConfig): Promise<Result<void, Error>>` - Save customer config
- `getEnvironmentConfig(): AppConfig` - Get environment configuration

### ConfigValidator

- `validateCustomerConfig(config: unknown): ConfigValidationResult` - Validate customer configuration
- `validateModuleConfig(config: unknown): ConfigValidationResult` - Validate module configuration
- `addSchema(name: string, schema: ValidationSchema): void` - Add custom validation schema

## Contributing

1. Follow TypeScript strict mode requirements
2. Maintain 75%+ test coverage
3. Add comprehensive JSDoc documentation
4. Follow existing code patterns and naming conventions
5. Validate all configuration changes
6. Test with various customer configuration scenarios

## License

UNLICENSED - Internal use only
