# @agent-desktop/types

Comprehensive TypeScript type definitions for the Agent Desktop application.

## Overview

This library provides enterprise-grade TypeScript types for all aspects of the Agent Desktop application, including:

- **Core Types**: Configuration, logging, modules, health monitoring, and events
- **Amazon Connect Types**: Agents, contacts, queues, and Streams API
- **Application Types**: Customer configuration, branding, deployment, and integrations
- **Utility Types**: Common utilities, API communication, and validation

## Features

- **Strict TypeScript**: All types enforce strict typing with no `any` usage
- **Comprehensive Coverage**: Types for all application domains
- **Enterprise-Grade**: Designed for scalability and maintainability
- **Well-Documented**: Every type includes JSDoc comments
- **Branded Types**: Nominal typing for enhanced type safety
- **Utility Helpers**: Type guards, result types, and common patterns

## Usage

```typescript
import type {
  CustomerConfig,
  ModuleConfig,
  AgentInfo,
  LogEntry,
  HealthStatus,
  Result,
} from '@agent-desktop/types';

// Use in function signatures
function processCustomerConfig(config: CustomerConfig): Result<void, Error> {
  // Implementation
}

// Use with branded types
function handleAgent(agentId: AgentID, info: AgentInfo): void {
  // Implementation
}
```

## Type Categories

### Core Types
- `config.types.ts` - Configuration management
- `logging.types.ts` - Structured logging
- `module.types.ts` - Modular architecture
- `health.types.ts` - Health monitoring
- `event.types.ts` - Event system

### Amazon Connect Types
- `agent.types.ts` - Agent information and states
- `contact.types.ts` - Contact handling
- `queue.types.ts` - Queue management
- `streams.types.ts` - Streams API integration

### Application Types
- `customer.types.ts` - Customer configuration
- `branding.types.ts` - Theming and branding
- `deployment.types.ts` - Deployment configuration
- `integration.types.ts` - Third-party integrations

### Utility Types
- `common.types.ts` - Common patterns and utilities
- `api.types.ts` - HTTP API communication
- `validation.types.ts` - Data validation

## Type Safety Features

### Branded Types
```typescript
type CustomerID = Brand<string, 'CustomerID'>;
type UserID = Brand<string, 'UserID'>;

// Prevents mixing different ID types
function getCustomer(id: CustomerID): Customer {
  // Implementation
}
```

### Result Types
```typescript
type Result<T, E = Error> = Success<T> | Failure<E>;

function parseConfig(data: string): Result<Config, ValidationError> {
  // Returns either success or failure, never throws
}
```

### Deep Readonly
```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Ensures immutability at compile time
```

## Development

### Building
```bash
pnpm nx build types
```

### Testing
```bash
pnpm nx test types
```

### Type Checking
```bash
pnpm nx type-check types
```

### Linting
```bash
pnpm nx lint types
```

## Best Practices

1. **Use Branded Types**: For domain-specific strings like IDs
2. **Prefer Readonly**: All data structures should be immutable
3. **Result Types**: Use `Result<T, E>` instead of throwing exceptions
4. **Type Guards**: Implement type guards for runtime type checking
5. **JSDoc Comments**: Document all public types and interfaces
6. **Strict Typing**: Avoid `any` and use proper union types

## Contributing

When adding new types:

1. Follow existing naming conventions
2. Add comprehensive JSDoc documentation
3. Include examples in documentation
4. Add appropriate tests
5. Export from the main `index.ts` file
6. Consider backward compatibility