# @agent-desktop/customer-info

React component and module wrapper that exposes the **ContactInfo** UI as a loadable module for the Agent Desktop. It provides the default configuration and metadata used by the core module system.

The module simply re-exports the `ContactInfo` component from the `ccp-client` application and can be registered with the `ModuleRegistry` for dynamic loading.

## Usage

```typescript
import { CustomerInfoModule } from '@agent-desktop/customer-info';

// Register module with the registry
registry.register(new CustomerInfoModule());
```

## Running unit tests

Run `nx test customer-info` to execute the unit tests with [Vitest](https://vitest.dev/).
