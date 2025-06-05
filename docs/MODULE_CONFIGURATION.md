# Module Configuration System

## Overview

The Module Configuration system provides administrators with comprehensive control over which modules are enabled, how they're configured, and how they load in the Amazon Connect CCP application. This system builds upon the existing module registry and extends it with customer-specific configuration management.

## Features

### 🔧 Module Management
- **Enable/Disable Modules**: Toggle modules on or off per customer
- **Dependency Resolution**: Automatic dependency checking and validation
- **Load Order Optimization**: Intelligent module loading based on dependencies and priorities
- **Configuration Persistence**: Real-time configuration updates stored in DynamoDB

### 🎛️ Configuration Interface
- **Dynamic Forms**: Auto-generated configuration forms based on module schemas
- **Live Preview**: Real-time configuration validation and preview
- **Bulk Operations**: Enable/disable multiple modules simultaneously
- **Dependency Visualization**: Visual representation of module dependencies

### 📊 Monitoring & Analytics
- **Load Order Tracking**: Visual load order display
- **Health Monitoring**: Real-time module health status
- **Performance Metrics**: Module loading and execution metrics

## Architecture

### Core Components

#### 1. Module Interface Extensions
```typescript
interface Module {
  // Existing properties...
  enabled?: boolean;
  installed?: boolean;
  configuration?: Record<string, any>;
  hasConfiguration?: boolean;
  loadPriority?: number;
  loadStrategy?: 'eager' | 'lazy' | 'on-demand';
}
```

#### 2. Dependency Management
```typescript
interface DependencyCheck {
  moduleId: string;
  satisfied: boolean;
  missing?: string[];
  conflicts?: string[];
}
```

#### 3. View Modes
- **Catalog**: Browse and install available modules
- **Installed**: Manage enabled/disabled state of installed modules
- **Configuration**: Configure module-specific settings

### Key Functions

#### `checkDependencies(moduleId: string, enabledModules: string[]): DependencyCheck`
Validates whether a module's dependencies are satisfied by currently enabled modules.

#### `getDependentModules(moduleId: string): string[]`
Returns list of modules that depend on the specified module (prevents breaking dependencies).

#### `calculateLoadOrder(enabledModuleIds: string[]): string[]`
Calculates optimal load order based on dependencies and priority settings.

## User Interface

### Module Cards
Each module displays:
- **Toggle Switch**: Enable/disable with dependency validation
- **Configuration Status**: Shows if module has configurable options
- **Dependency Information**: Lists required and dependent modules
- **Load Priority**: Visual indicator of load order

### Configuration Modal
- **Dynamic Form Fields**: Auto-generated based on module configuration schema
- **Type-aware Inputs**: Boolean switches, number inputs, text fields
- **Validation**: Real-time validation with error messages
- **Save/Cancel**: Persistent configuration storage

### Load Order Visualization
- **Sequential Display**: Shows modules in load order (1 → 2 → 3...)
- **Dependency Flow**: Visual representation of module relationships
- **Priority Indicators**: Color-coded priority levels

## Implementation Details

### State Management
```typescript
const [moduleStates, setModuleStates] = useState(() => 
  modules.reduce((acc, module) => {
    acc[module.id] = { 
      enabled: module.enabled || false, 
      configuration: module.configuration || {} 
    };
    return acc;
  }, {} as Record<string, { enabled: boolean; configuration: Record<string, any> }>)
);
```

### Dependency Validation
```typescript
const handleModuleToggle = (moduleId: string, enabled: boolean) => {
  // Check dependencies before enabling
  if (enabled) {
    const dependencyCheck = checkDependencies(moduleId, enabledModules);
    if (!dependencyCheck.satisfied) {
      // Show error or auto-enable dependencies
      return;
    }
  }
  
  // Check dependents before disabling
  if (!enabled) {
    const dependents = getDependentModules(moduleId).filter(/* enabled */);
    if (dependents.length > 0) {
      // Show warning or auto-disable dependents
      return;
    }
  }
  
  setModuleStates(prev => ({
    ...prev,
    [moduleId]: { ...prev[moduleId], enabled }
  }));
};
```

## Integration Points

### 1. Existing Module Registry
- Extends `libs/core/src/module-registry.ts`
- Leverages existing dependency resolution
- Uses existing health monitoring

### 2. Configuration Service
- Integrates with `libs/config/src/config.service.ts`
- Stores settings in DynamoDB
- Real-time updates via WebSocket

### 3. API Layer
- Extends `apps/ccp-admin/src/services/api/modules.api.ts`
- Customer-specific module state endpoints
- Configuration CRUD operations

## Usage Examples

### Enabling a Module
1. Navigate to Module Management → Installed
2. Find the module card
3. Toggle the switch to "Enabled"
4. System validates dependencies automatically
5. If dependencies missing, shows required modules
6. Configuration persists immediately

### Configuring a Module
1. Ensure module is installed and enabled
2. Click "Configure" button on module card
3. Modal opens with dynamic form
4. Modify settings as needed
5. Click "Save Configuration"
6. Changes apply in real-time

### Viewing Load Order
1. Multiple modules must be enabled
2. Load order appears below filters
3. Shows sequence: Module 1 → Module 2 → Module 3
4. Reflects dependency requirements and priorities

## Testing

### Unit Tests
- Module toggle functionality
- Dependency validation logic
- Configuration form generation
- Load order calculation

### Integration Tests
- End-to-end module enable/disable workflows
- Configuration persistence
- Dependency chain validation
- UI interaction testing

### Performance Tests
- Large module sets (100+ modules)
- Complex dependency graphs
- Configuration form responsiveness

## Future Enhancements

### Planned Features
1. **Module Templates**: Pre-configured module sets for common use cases
2. **A/B Testing**: Compare different module configurations
3. **Usage Analytics**: Track which modules are most/least used
4. **Automated Rollback**: Restore previous configurations on errors
5. **Bulk Import/Export**: Configuration backup and restore
6. **Version Management**: Module version constraints and compatibility

### Technical Improvements
1. **Lazy Loading**: Load configuration UI components on demand
2. **Caching**: Intelligent configuration caching strategies
3. **Validation Schema**: JSON Schema-based configuration validation
4. **Real-time Sync**: Multi-admin session synchronization

## Security Considerations

### Access Control
- Role-based permissions for module management
- Audit logging for configuration changes
- Secure configuration storage with encryption

### Validation
- Input sanitization for configuration values
- Schema validation prevents invalid configurations
- Dependency cycle detection prevents system locks

### Monitoring
- Configuration change tracking
- Module performance impact monitoring
- Security event logging for audit compliance

## Troubleshooting

### Common Issues

#### Module Won't Enable
- Check dependencies are satisfied
- Verify module is installed
- Check for circular dependencies
- Review error logs

#### Configuration Not Saving
- Validate all required fields
- Check network connectivity
- Verify DynamoDB permissions
- Review validation errors

#### Load Order Issues
- Verify dependency declarations
- Check for circular dependencies
- Review priority settings
- Validate module registry state

### Debug Tools
- Browser developer tools for UI issues
- Module registry health endpoint
- Configuration validation endpoint
- Dependency graph visualization

---

*This documentation covers the Module Configuration system implementation in Phase 2 of the Amazon Connect CCP Admin Dashboard development.*