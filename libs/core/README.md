# @agent-desktop/core

Core module system and runtime for the Amazon Connect CCP desktop application. This library provides the foundation for the modular architecture that powers the CCP client.

## Overview

The core library implements a sophisticated module system that enables dynamic loading, dependency management, health monitoring, and lifecycle management for CCP modules. Each feature (customer info, cases, knowledge base, etc.) is implemented as a separate module that can be enabled/disabled per customer configuration.

## Architecture

### Module System Components

- **BaseModule**: Abstract base class providing common module functionality
- **ModuleRegistry**: Central registry for module registration and lifecycle management
- **ModuleLoader**: Dynamic module loading with caching and hot-reload support
- **ModuleHealthChecker**: Health monitoring and status reporting for modules

### Key Interfaces

- `IModule`: Core interface that all modules must implement
- `IModuleRegistry`: Registry interface for module management
- `IModuleLoader`: Loader interface for dynamic module loading
- `IModuleHealthChecker`: Health checker interface for monitoring

## Module Lifecycle

Modules go through the following states:

1. **UNLOADED**: Module is not loaded
2. **LOADING**: Module is being loaded
3. **LOADED**: Module code is loaded but not initialized
4. **INITIALIZING**: Module is being initialized
5. **RUNNING**: Module is active and operational
6. **ERROR**: Module encountered an error
7. **STOPPED**: Module has been stopped
8. **UNLOADING**: Module is being unloaded

## Module Development

### Creating a Module

```typescript
import { BaseModule, ModuleMetadata, ModuleContext } from '@agent-desktop/core';

export class MyModule extends BaseModule {
  constructor() {
    super({
      id: 'my-module',
      name: 'My Module',
      version: '1.0.0',
      description: 'Example module',
      author: 'Developer',
      dependencies: [],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.LAZY,
      position: 'sidebar',
      priority: 100,
      tags: ['example'],
    });
  }

  async onInitialize(context: ModuleContext): Promise<Result<void, Error>> {
    // Initialize module resources
    return super.onInitialize(context);
  }

  async onStart(context: ModuleContext): Promise<Result<void, Error>> {
    // Start module operations
    return super.onStart(context);
  }

  async onStop(context: ModuleContext): Promise<Result<void, Error>> {
    // Stop module operations
    return super.onStop(context);
  }
}
```

### Module Dependencies

Modules can declare dependencies on other modules:

```typescript
const metadata: ModuleMetadata = {
  id: 'customer-info',
  dependencies: [
    { moduleId: 'ccp-core', version: '1.0.0', optional: false },
    { moduleId: 'analytics', version: '2.0.0', optional: true },
  ],
  // ... other metadata
};
```

### Module Permissions

Modules can declare required permissions:

```typescript
const permissions: ModulePermission[] = [
  {
    name: 'contacts.read',
    description: 'Read contact information',
    required: true,
  },
  {
    name: 'analytics.write',
    description: 'Write analytics data',
    required: false,
  },
];
```

## Usage

### Setting up the Module Registry

```typescript
import { ModuleRegistry, ModuleLoader, ModuleHealthChecker } from '@agent-desktop/core';
import { ConfigService } from '@agent-desktop/config';
import { Logger } from '@agent-desktop/logging';

const logger = new Logger({ level: 'info' });
const configService = new ConfigService();

const registry = new ModuleRegistry({
  logger,
  configService,
  customerId: 'customer-123',
  enableHotReload: true,
  maxConcurrentLoads: 5,
  dependencyTimeoutMs: 30000,
  healthCheckIntervalMs: 30000,
});
```

### Registering and Loading Modules

```typescript
// Register a module
const module = new MyModule();
await registry.register(module);

// Load a specific module
await registry.loadModule('my-module');

// Load all customer modules based on configuration
await registry.loadCustomerModules();
```

### Module Loading with Caching

```typescript
const loader = new ModuleLoader(logger, {
  enableCache: true,
  maxCacheSize: 100,
  enableHotReload: true,
  modulePaths: {
    'my-module': './modules/my-module/index.js',
  },
});

const result = await loader.loadModule({
  moduleId: 'my-module',
  timeout: 30000,
  retries: 3,
});
```

### Health Monitoring

```typescript
const healthChecker = new ModuleHealthChecker(logger);

// Start monitoring a module
await healthChecker.startMonitoring(module, {
  moduleId: 'my-module',
  interval: 30000,
  timeout: 5000,
  retries: 3,
  enabled: true,
});

// Get aggregated health status
const health = healthChecker.getAggregatedHealth();
console.log(`Overall status: ${health.overallStatus}`);

// Listen for health changes
healthChecker.onHealthChange('*', (moduleId, status) => {
  console.log(`Module ${moduleId} health changed to ${status.status}`);
});
```

### Module Communication

Modules can communicate through the event bus:

```typescript
// In a module
this.context.eventBus.emit('user-selected', { userId: '123' }, this.metadata.id);

// Listen for events
this.context.eventBus.subscribe('user-selected', (data, sourceModule) => {
  console.log(`User selected: ${data.userId} from ${sourceModule}`);
}, this.metadata.id);
```

## Configuration

Modules are configured through the configuration service:

```typescript
// Module configuration
interface ModuleConfig {
  module_id: string;
  enabled: boolean;
  priority: number;
  position: string;
  settings: Record<string, unknown>;
}
```

## Error Handling

All module operations return `Result<T, Error>` types for consistent error handling:

```typescript
const result = await registry.loadModule('my-module');
if (result.success) {
  console.log('Module loaded successfully');
} else {
  console.error('Module load failed:', result.error.message);
}
```

## Testing

The core library includes comprehensive test utilities:

```typescript
import { BaseModule } from '@agent-desktop/core';

describe('MyModule', () => {
  it('should initialize correctly', async () => {
    const module = new MyModule();
    const context = createMockContext();
    
    const result = await module.onInitialize(context);
    expect(result.success).toBe(true);
  });
});
```

## TypeScript Support

Full TypeScript support with strict typing:

- No `any` types allowed
- Explicit return types required
- JSDoc comments for all public APIs
- Comprehensive type definitions exported

## Performance

The module system is optimized for:

- **Lazy Loading**: Modules load only when needed
- **Caching**: Loaded modules are cached for performance
- **Dependency Resolution**: Efficient dependency graph calculation
- **Concurrent Loading**: Multiple modules can load simultaneously
- **Health Monitoring**: Lightweight health checks with configurable intervals

## Security

Security features include:

- **Permission System**: Modules declare required permissions
- **Dependency Validation**: Dependencies are validated before loading
- **Error Isolation**: Module errors don't affect other modules
- **Resource Cleanup**: Proper cleanup when modules are unloaded

## API Reference

### Core Classes

- `BaseModule` - Abstract base class for modules
- `ModuleRegistry` - Central module registry and lifecycle manager
- `ModuleLoader` - Dynamic module loader with caching
- `ModuleHealthChecker` - Health monitoring system

### Core Interfaces

- `IModule` - Module interface
- `IModuleRegistry` - Registry interface
- `IModuleLoader` - Loader interface
- `IModuleHealthChecker` - Health checker interface
- `ModuleContext` - Runtime context provided to modules
- `ModuleMetadata` - Module metadata definition

### Types and Enums

- `ModuleStatus` - Module lifecycle states
- `ModuleLoadStrategy` - Loading strategies (eager, lazy, on-demand)
- `ModuleHealthStatus` - Health status information
- `ModuleDependency` - Dependency declaration
- `ModulePermission` - Permission declaration

## Examples

See the test files for comprehensive usage examples:

- `base-module.spec.ts` - Module development examples
- `module-registry.spec.ts` - Registry usage examples

## Related Libraries

- `@agent-desktop/types` - TypeScript type definitions
- `@agent-desktop/config` - Configuration management
- `@agent-desktop/logging` - Structured logging

## Module Templates

Starter templates for new modules are available under `libs/core/templates`.
The `ExampleModule` demonstrates minimal metadata and configuration. Copy this
file when creating new modules to ensure consistent structure and dependency
declarations.

## Module Publishing

Modules can be packaged and published to the local registry using the provided CLI.

```
pnpm module:publish ./path/to/my-module
```

This command copies the module into the `modules/` directory and records its metadata in `module-registry.json`. The loader will resolve modules from this registry when no explicit path is provided.
