# API Service Layer Documentation

## Overview

The API Service Layer provides a comprehensive, type-safe abstraction over HTTP APIs and WebSocket connections for the CCP Admin Dashboard. It includes caching, error handling, real-time updates, and optimistic UI patterns.

## Architecture

### Core Components

```
services/
├── api/                    # HTTP API services
│   ├── base.api.ts        # Base HTTP client with interceptors
│   ├── customers.api.ts   # Customer management operations
│   ├── modules.api.ts     # Module catalog and management
│   └── analytics.api.ts   # Metrics and monitoring
├── queries/               # React Query hooks
│   ├── customers.queries.ts
│   ├── modules.queries.ts
│   └── analytics.queries.ts
├── websocket/             # Real-time WebSocket integration
│   ├── websocket.service.ts
│   └── realtime.hooks.ts
├── errors/                # Error handling and normalization
├── types/                 # TypeScript interfaces
└── config/               # Configuration and cache keys
```

### Technology Stack

- **HTTP Client**: Axios with interceptors for correlation and logging
- **State Management**: React Query for server state and caching
- **Real-time**: WebSocket integration with automatic reconnection
- **Error Handling**: Centralized error normalization and user feedback
- **TypeScript**: Full type safety with comprehensive interfaces

## HTTP API Services

### Base API Service

All API services extend `BaseAPIService` which provides:

- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE with type safety
- **Request Correlation**: Automatic request ID generation and tracking
- **Error Handling**: Standardized error normalization and logging
- **File Operations**: Upload/download with progress tracking
- **Bulk Operations**: Optimized for large data operations
- **Analytics Queries**: Specialized timeout handling for metrics

```typescript
import { BaseAPIService } from './base.api';

class MyAPIService extends BaseAPIService {
  async getResource<T>(id: string): Promise<T> {
    return this.get<T>(`/api/resource/${id}`);
  }

  async createResource<T>(data: CreateRequest): Promise<T> {
    return this.post<T>('/api/resource', data);
  }

  async uploadFile<T>(file: File, onProgress?: (progress: number) => void): Promise<T> {
    return this.uploadFile<T>('/api/upload', file, onProgress);
  }
}
```

### Customer API Service

Comprehensive customer management with:

- **CRUD Operations**: Create, read, update, delete customers
- **Configuration Management**: Customer-specific configuration with validation
- **Module Management**: Enable/disable modules per customer
- **Integration Management**: Set up and test external integrations
- **Analytics**: Customer metrics, usage, and activity data
- **Bulk Operations**: Multiple customer operations in single request
- **Import/Export**: CSV, JSON, XLSX format support

```typescript
import { CustomerAPIService } from './customers.api';

const customerAPI = new CustomerAPIService();

// Create customer with validation
const newCustomer = await customerAPI.createCustomer({
  name: 'Acme Corp',
  plan: 'enterprise',
  branding: { primary_color: '#1f2937' },
  features: { chat_functionality: true },
});

// Enable module with configuration
await customerAPI.enableModule(customerId, moduleId, {
  enabled: true,
  config: { setting1: 'value1' },
});

// Test integration connectivity
const testResult = await customerAPI.testIntegration(customerId, integrationId);
```

### Module API Service

Module catalog and management including:

- **Catalog Browsing**: Paginated catalog with filtering and search
- **Module Details**: Comprehensive information including dependencies
- **Installation Management**: Install, uninstall, enable, disable
- **Reviews and Ratings**: User feedback and module evaluation
- **Dependency Resolution**: Automatic dependency checking
- **Version Management**: Multiple version support and compatibility

```typescript
import { ModuleAPIService } from './modules.api';

const moduleAPI = new ModuleAPIService();

// Browse module catalog
const catalog = await moduleAPI.getModuleCatalog({
  category: 'integrations',
  status: 'available',
  sortBy: 'popularity',
});

// Check dependencies before installation
const dependencies = await moduleAPI.checkDependencyResolution(
  moduleId, 
  customerId
);

// Submit module review
await moduleAPI.submitModuleReview(moduleId, {
  rating: 5,
  title: 'Excellent module',
  comment: 'Works perfectly with our setup',
  userId: 'user123',
});
```

### Analytics API Service

Comprehensive monitoring and analytics:

- **Dashboard Data**: Summary metrics with charts and alerts
- **System Metrics**: Performance, connections, queue metrics
- **Customer Analytics**: Usage trends and behavior analysis
- **Error Analytics**: Error tracking and resolution monitoring
- **Audit Logs**: Comprehensive activity logging with search
- **Custom Reports**: Flexible reporting with parameter support
- **Data Export**: Multiple format export capabilities

```typescript
import { AnalyticsAPIService } from './analytics.api';

const analyticsAPI = new AnalyticsAPIService();

// Get dashboard summary
const dashboard = await analyticsAPI.getAnalyticsDashboard({
  start: new Date('2024-01-01'),
  end: new Date(),
  granularity: 'day',
});

// Monitor system health
const health = await analyticsAPI.getSystemHealth();

// Export analytics data
const exportResponse = await analyticsAPI.exportAnalyticsData(
  'dashboard',
  { timeRange: { start: '2024-01-01', end: '2024-01-31' } },
  'csv'
);
```

## React Query Integration

### Query Hooks

React Query hooks provide caching, background updates, and optimistic mutations:

```typescript
// Customer queries
const { data: customers, isLoading, error } = useCustomers({
  search: 'acme',
  status: 'active',
  page: 1,
  pageSize: 25,
});

const { data: customer } = useCustomer(customerId);
const { data: modules } = useCustomerModules(customerId);

// Module queries
const { data: catalog } = useModuleCatalog({ category: 'crm' });
const { data: module } = useModule(moduleId);
const { data: reviews } = useModuleReviews(moduleId);

// Analytics queries
const { data: metrics } = useSystemMetrics(timeRange);
const { data: dashboard } = useAnalyticsDashboard(timeRange);
```

### Mutation Hooks

Mutations include optimistic updates and cache invalidation:

```typescript
// Customer mutations
const { mutate: createCustomer, isLoading } = useCreateCustomer({
  onSuccess: (customer) => {
    toast.success(`Customer ${customer.name} created successfully`);
  },
  onError: (error) => {
    toast.error(`Failed to create customer: ${error.message}`);
  },
});

const { mutate: updateCustomer } = useUpdateCustomer({
  // Optimistic update - UI updates immediately
  onMutate: async ({ customerId, updates }) => {
    // Cancel outgoing refetches and snapshot previous value
    await queryClient.cancelQueries({ queryKey: ['customer', customerId] });
    const previous = queryClient.getQueryData(['customer', customerId]);
    
    // Optimistically update
    queryClient.setQueryData(['customer', customerId], old => ({
      ...old,
      ...updates,
      updatedAt: new Date(),
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Revert on error
    queryClient.setQueryData(['customer', variables.customerId], context?.previous);
  },
});

// Module mutations
const { mutate: enableModule } = useEnableModule();
const { mutate: submitReview } = useSubmitModuleReview();

// Bulk operations
const { mutate: bulkUpdate } = useBulkUpdateCustomers();
```

### Cache Management

Intelligent cache invalidation and background updates:

```typescript
// Automatic cache invalidation on mutations
const { mutate: createCustomer } = useCreateCustomer({
  onSuccess: (newCustomer) => {
    // Invalidate customer list
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    
    // Set individual customer cache
    queryClient.setQueryData(['customer', newCustomer.id], newCustomer);
  },
});

// Manual cache management
const { invalidateModule, invalidateAllModuleQueries } = useInvalidateModuleQueries();

// Background refetching for fresh data
const { data: systemStatus } = useSystemStatus({
  refetchInterval: 30000, // Refetch every 30 seconds
  staleTime: 15000,       // Consider stale after 15 seconds
});
```

## WebSocket Integration

### Real-time Service

The `AdminWebSocketService` provides:

- **Connection Management**: Automatic connection and reconnection
- **Event Subscription**: Type-safe event subscriptions with filtering
- **Message Queuing**: Reliable message delivery with queue management
- **Error Handling**: Connection error recovery and notification

```typescript
import { AdminWebSocketService, AdminEventType } from './websocket.service';

const wsService = new AdminWebSocketService();

// Connect to WebSocket
await wsService.connect();

// Subscribe to customer events
const subscription = wsService.subscribeToCustomerEvents(
  customerId,
  (event) => {
    console.log('Customer event:', event);
    // Handle real-time customer updates
  }
);

// Subscribe to system events
wsService.subscribeToEventType(
  AdminEventType.SYSTEM_ALERT,
  (event) => {
    // Handle system alerts
    showAlert(event.data);
  }
);

// Clean up
subscription.unsubscribe();
```

### Real-time React Hooks

Hooks for common real-time patterns:

```typescript
// Connection management
const { connect, disconnect, isConnected, connectionState } = useWebSocketConnection();

// Automatic cache updates from WebSocket events
useRealtimeCustomer(customerId); // Updates customer data automatically
useRealtimeCustomers();          // Updates customer list
useRealtimeModules();            // Updates module data

// System monitoring
const systemStatus = useRealtimeSystemStatus();
const performanceMetrics = useRealtimePerformance();

// Alert management
const { alerts, unreadCount, markAsRead } = useRealtimeAlerts();

// Custom event subscriptions
const { events, subscribe, clearEvents } = useRealtimeEvents(
  AdminEventType.MODULE_INSTALLED
);
```

## Error Handling

### Error Classes

Comprehensive error classification with specific handling:

```typescript
import { APIError, ValidationError, NetworkError } from './errors';

try {
  const customer = await customerAPI.createCustomer(data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    error.validationErrors.forEach(err => {
      showFieldError(err.field, err.message);
    });
  } else if (error instanceof NetworkError) {
    // Handle network issues
    showRetryDialog();
  } else if (error instanceof APIError) {
    // Handle other API errors
    showErrorMessage(error.message);
  }
}
```

### Error Normalization

Automatic error normalization across all API calls:

```typescript
import { ErrorHandler } from './errors';

// All errors are automatically normalized
const apiError = ErrorHandler.normalize(rawError);

// Check error properties
if (apiError.isRetryable()) {
  // Implement retry logic
}

// Format for user display
const userMessage = ErrorHandler.formatForUser(apiError);
```

## Configuration and Setup

### Environment Configuration

```typescript
// Environment variables
VITE_API_BASE_URL=https://api.agent-desktop.aws
VITE_WS_ENDPOINT=wss://ws.agent-desktop.aws
VITE_API_TIMEOUT=30000
VITE_ENABLE_REALTIME=true
VITE_ENABLE_DEVTOOLS=true
```

### API Provider Setup

```typescript
import { APIProvider } from './providers/APIProvider';

// Wrap your app with APIProvider
function App() {
  return (
    <APIProvider>
      <BrowserRouter>
        <Routes>
          {/* Your routes */}
        </Routes>
      </BrowserRouter>
    </APIProvider>
  );
}
```

### Cache Keys

Centralized cache key management:

```typescript
import { cacheKeys } from './config/api.config';

// Standardized cache keys
const customerKey = cacheKeys.customer(customerId);
const customersKey = cacheKeys.customers;
const modulesKey = cacheKeys.customerModules(customerId);

// Use in queries
const { data } = useQuery({
  queryKey: customerKey,
  queryFn: () => customerAPI.getCustomer(customerId),
});
```

## Performance Considerations

### Caching Strategy

- **Stale-while-revalidate**: Fresh data with background updates
- **Intelligent invalidation**: Minimize unnecessary refetches
- **Memory management**: Automatic garbage collection of unused data
- **Background refetching**: Keep data fresh without blocking UI

### Request Optimization

- **Request deduplication**: Automatic deduplication of identical requests
- **Connection pooling**: Efficient HTTP connection reuse
- **Timeout management**: Operation-specific timeout configurations
- **Retry logic**: Exponential backoff for failed requests

### WebSocket Efficiency

- **Smart reconnection**: Exponential backoff with maximum attempts
- **Message queuing**: Reliable delivery during disconnections
- **Subscription management**: Efficient event routing and filtering
- **Memory cleanup**: Automatic subscription cleanup

## Testing

### Unit Tests

Test API services with mocked HTTP clients:

```typescript
import { CustomerAPIService } from './customers.api';
import { MockHttpClient } from '../test-utils';

describe('CustomerAPIService', () => {
  let service: CustomerAPIService;
  let mockClient: MockHttpClient;

  beforeEach(() => {
    mockClient = new MockHttpClient();
    service = new CustomerAPIService(undefined, undefined, mockClient);
  });

  it('should create customer', async () => {
    const customerData = { name: 'Test Corp', plan: 'basic' };
    const expected = { ...customerData, id: '123', createdAt: new Date() };
    
    mockClient.post.mockResolvedValue({ data: { success: true, data: expected } });
    
    const result = await service.createCustomer(customerData);
    
    expect(result).toEqual(expected);
    expect(mockClient.post).toHaveBeenCalledWith('/api/v1/customers', customerData);
  });
});
```

### React Query Hook Tests

Test hooks with React Query test utilities:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomers } from './customers.queries';

describe('useCustomers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should fetch customers', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCustomers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### WebSocket Tests

Test WebSocket service with mock connections:

```typescript
import { AdminWebSocketService } from './websocket.service';
import { MockWebSocket } from '../test-utils';

describe('AdminWebSocketService', () => {
  let service: AdminWebSocketService;
  let mockWS: MockWebSocket;

  beforeEach(() => {
    mockWS = new MockWebSocket();
    service = new AdminWebSocketService({}, undefined, mockWS);
  });

  it('should handle connection events', async () => {
    const connectPromise = service.connect();
    
    // Simulate successful connection
    mockWS.simulateOpen();
    
    await expect(connectPromise).resolves.toBeUndefined();
    expect(service.isConnected()).toBe(true);
  });

  it('should route events to subscribers', () => {
    const callback = jest.fn();
    
    service.subscribe('customer_updated', callback);
    
    mockWS.simulateMessage({
      type: 'customer_updated',
      data: { customerId: '123' },
      timestamp: new Date().toISOString(),
    });
    
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'customer_updated',
        data: { customerId: '123' },
      })
    );
  });
});
```

## Usage Examples

### Complete Customer Management Flow

```typescript
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../services/queries';
import { useRealtimeCustomer } from '../services/websocket';

const CustomerManagement: React.FC = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // List customers with filtering
  const { data: customers, isLoading, error } = useCustomers({
    search: searchTerm,
    status: 'active',
    plan: selectedPlan,
    page: currentPage,
    pageSize: 25,
  });

  // Get individual customer with real-time updates
  const { data: customer } = useCustomer(selectedCustomerId);
  useRealtimeCustomer(selectedCustomerId); // Auto-updates customer data

  // Create customer mutation
  const { mutate: createCustomer, isLoading: isCreating } = useCreateCustomer({
    onSuccess: (newCustomer) => {
      toast.success(`Customer ${newCustomer.name} created successfully`);
      setSelectedCustomerId(newCustomer.customer_id);
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        error.validationErrors.forEach(err => {
          setFieldError(err.field, err.message);
        });
      } else {
        toast.error(`Failed to create customer: ${error.message}`);
      }
    },
  });

  // Update customer with optimistic updates
  const { mutate: updateCustomer } = useUpdateCustomer();

  const handleCreateCustomer = (customerData: CreateCustomerRequest) => {
    createCustomer(customerData);
  };

  const handleUpdateCustomer = (updates: Partial<Customer>) => {
    if (selectedCustomerId) {
      updateCustomer({
        customerId: selectedCustomerId,
        updates,
      });
    }
  };

  return (
    <div className="customer-management">
      <CustomerList 
        customers={customers}
        loading={isLoading}
        error={error}
        onSelectCustomer={setSelectedCustomerId}
      />
      <CustomerDetails 
        customer={customer}
        onUpdate={handleUpdateCustomer}
      />
      <CreateCustomerForm 
        onSubmit={handleCreateCustomer}
        loading={isCreating}
      />
    </div>
  );
};
```

### Module Management with Dependencies

```typescript
import { useModuleCatalog, useInstallModule, useModuleDependencies } from '../services/queries';

const ModuleInstallation: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [customerId] = useState<string>('customer_123');

  // Browse available modules
  const { data: catalog } = useModuleCatalog({
    category: 'integrations',
    status: 'available',
    compatibleWith: customerId,
  });

  // Check module dependencies
  const { data: dependencies } = useModuleDependencies(selectedModuleId, customerId, {
    enabled: !!selectedModuleId,
  });

  // Install module mutation
  const { mutate: installModule, isLoading: isInstalling } = useInstallModule({
    onSuccess: (installation) => {
      toast.success(`Module ${installation.module.name} installed successfully`);
      // Module will be automatically available due to real-time updates
    },
    onError: (error) => {
      if (error.code === 'DEPENDENCY_CONFLICT') {
        showDependencyConflictDialog(error.conflicts);
      } else {
        toast.error(`Installation failed: ${error.message}`);
      }
    },
  });

  const handleInstallModule = () => {
    if (selectedModuleId && dependencies?.canInstall) {
      installModule({
        customerId,
        moduleId: selectedModuleId,
        version: dependencies.recommendedVersion,
        config: defaultConfig,
      });
    }
  };

  return (
    <div className="module-installation">
      <ModuleCatalog 
        modules={catalog?.modules}
        onSelectModule={setSelectedModuleId}
      />
      {dependencies && (
        <DependencyCheck 
          dependencies={dependencies}
          canInstall={dependencies.canInstall}
          conflicts={dependencies.conflicts}
        />
      )}
      <InstallButton 
        onClick={handleInstallModule}
        disabled={!dependencies?.canInstall || isInstalling}
        loading={isInstalling}
      />
    </div>
  );
};
```

### Real-time Analytics Dashboard

```typescript
import { useAnalyticsDashboard, useSystemMetrics } from '../services/queries';
import { useRealtimeMetrics, useRealtimeAlerts } from '../services/websocket';

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState({
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  // Dashboard data with background refetching
  const { data: dashboard, isLoading } = useAnalyticsDashboard(timeRange, {
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,       // Consider stale after 15 seconds
  });

  // Real-time metrics updates
  const { realtimeMetrics } = useRealtimeMetrics();
  
  // System alerts
  const { alerts, unreadCount, markAsRead } = useRealtimeAlerts();

  // Export analytics data
  const { mutate: exportData, isLoading: isExporting } = useExportAnalytics({
    onSuccess: (exportResult) => {
      // Download file automatically
      downloadFile(exportResult.url, exportResult.filename);
    },
  });

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    exportData({
      reportType: 'dashboard',
      timeRange,
      format,
      includeCharts: format === 'pdf',
    });
  };

  return (
    <div className="analytics-dashboard">
      <DashboardHeader 
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExport={handleExport}
        isExporting={isExporting}
      />
      
      <MetricsGrid 
        metrics={dashboard?.metrics}
        realtimeMetrics={realtimeMetrics}
        loading={isLoading}
      />
      
      <ChartsSection 
        charts={dashboard?.charts}
        timeRange={timeRange}
      />
      
      <AlertsPanel 
        alerts={alerts}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
};
```

### Form Integration with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCustomer, useValidateCustomerConfig } from '../services/queries';
import { createCustomerSchema } from '../schemas/customer.schema';

const CreateCustomerForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isValid },
  } = useForm<CreateCustomerRequest>({
    resolver: zodResolver(createCustomerSchema),
    mode: 'onChange',
  });

  const formData = watch();

  // Real-time validation
  const { mutate: validateConfig, data: validationResult } = useValidateCustomerConfig('new', {
    onSuccess: (result) => {
      if (!result.valid) {
        result.errors.forEach(error => {
          setError(error.field as any, {
            type: 'validation',
            message: error.message,
          });
        });
      }
    },
  });

  // Create customer mutation
  const { mutate: createCustomer, isLoading } = useCreateCustomer({
    onSuccess: (customer) => {
      toast.success(`Customer ${customer.name} created successfully`);
      router.push(`/customers/${customer.customer_id}`);
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        error.validationErrors.forEach(err => {
          setError(err.field as any, {
            type: 'server',
            message: err.message,
          });
        });
      }
    },
  });

  // Validate configuration on form changes
  useEffect(() => {
    if (isValid && formData.name) {
      const timer = setTimeout(() => {
        validateConfig(formData);
      }, 500); // Debounce validation

      return () => clearTimeout(timer);
    }
  }, [formData, isValid, validateConfig]);

  const onSubmit = (data: CreateCustomerRequest) => {
    createCustomer(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="create-customer-form">
      <div className="form-group">
        <label htmlFor="name">Customer Name</label>
        <input
          id="name"
          {...register('name')}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="plan">Plan</label>
        <select id="plan" {...register('plan')}>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {errors.plan && <span className="error">{errors.plan.message}</span>}
      </div>

      {/* Validation feedback */}
      {validationResult && !validationResult.valid && (
        <div className="validation-warnings">
          {validationResult.warnings.map((warning, index) => (
            <div key={index} className="warning">
              {warning.message}
            </div>
          ))}
        </div>
      )}

      <button 
        type="submit" 
        disabled={!isValid || isLoading}
        className="submit-button"
      >
        {isLoading ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
};
```

### File Upload with Progress

```typescript
import { useUploadFile } from '../services/queries';
import { useDropzone } from 'react-dropzone';

const FileUploadComponent: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { mutate: uploadFile, isLoading: isUploading } = useUploadFile({
    onSuccess: (result) => {
      toast.success(`File uploaded successfully: ${result.filename}`);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadFile({
        file,
        metadata: {
          customerId: 'customer_123',
          category: 'configuration',
        },
        onProgress: setUploadProgress,
      });
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span>{Math.round(uploadProgress)}% uploaded</span>
          </div>
        ) : (
          <div className="upload-prompt">
            {isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <p>Drag and drop a file here, or click to select</p>
            )}
            <small>Supports JSON, CSV, and XLSX files up to 10MB</small>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Best Practices

### API Service Development

1. **Extend BaseAPIService**: Use the base class for consistent behavior
2. **Type Everything**: Define comprehensive TypeScript interfaces
3. **Handle Errors**: Implement proper error handling and user feedback
4. **Document Operations**: Include JSDoc comments for all public methods
5. **Validate Inputs**: Check required parameters and validate data
6. **Use Correlation IDs**: Track requests across the system for debugging
7. **Implement Timeouts**: Set appropriate timeouts for different operation types
8. **Cache Responses**: Use intelligent caching strategies for better performance

### React Query Usage

1. **Use Appropriate Keys**: Follow cache key conventions for consistency
2. **Handle Loading States**: Provide loading indicators for better UX
3. **Implement Error Boundaries**: Catch and handle query errors gracefully
4. **Optimize Refetching**: Configure appropriate stale times and refetch intervals
5. **Clean Up Subscriptions**: Properly clean up WebSocket subscriptions
6. **Use Optimistic Updates**: Implement optimistic mutations for better UX
7. **Invalidate Smartly**: Only invalidate queries that are actually affected
8. **Handle Background Updates**: Use background refetching for fresh data

### WebSocket Integration

1. **Handle Connection States**: Provide feedback for connection status
2. **Implement Reconnection**: Handle disconnections gracefully with exponential backoff
3. **Filter Events**: Only subscribe to relevant events to reduce overhead
4. **Clean Up Resources**: Unsubscribe when components unmount
5. **Handle Errors**: Implement proper error handling for WebSocket operations
6. **Queue Messages**: Implement message queuing for reliable delivery
7. **Use Heartbeats**: Implement periodic ping/pong for connection health
8. **Batch Updates**: Group related updates to reduce rendering overhead

### Error Handling Best Practices

1. **Classify Errors**: Use specific error types for different scenarios
2. **Provide User Feedback**: Show meaningful error messages to users
3. **Log Comprehensively**: Include context and correlation IDs in logs
4. **Implement Retry Logic**: Add exponential backoff for retryable errors
5. **Handle Network Issues**: Provide offline/online state management
6. **Validate Early**: Catch validation errors before API calls
7. **Use Error Boundaries**: Prevent error crashes in React components
8. **Monitor Errors**: Implement error tracking and alerting

## Troubleshooting

### Common Issues

1. **Network Errors**: Check API endpoints and network connectivity
2. **Authentication Failures**: Verify API tokens and credentials
3. **Cache Inconsistencies**: Clear cache or check invalidation logic
4. **WebSocket Disconnections**: Verify WebSocket endpoint and network stability
5. **Type Errors**: Ensure all interfaces are properly defined and imported

### Debug Tools

- **React Query DevTools**: Inspect cache state and query status
- **Network Tab**: Monitor HTTP requests and responses
- **WebSocket Inspector**: Debug WebSocket connections and messages
- **Console Logging**: Use structured logging for debugging
- **Error Boundaries**: Catch and display error information

### Performance Issues

- **Slow Queries**: Optimize API endpoints and add pagination
- **Memory Leaks**: Check for uncleaned subscriptions and listeners
- **Excessive Refetching**: Adjust stale times and refetch intervals
- **Large Payloads**: Implement pagination and data virtualization
- **Network Congestion**: Implement request batching and deduplication