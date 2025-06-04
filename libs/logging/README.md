# @agent-desktop/logging

Enterprise-grade structured logging library with multiple transports, correlation tracking, and performance monitoring.

## Features

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL with filtering
- **Structured Logging**: JSON-structured logs with metadata support
- **Multiple Transports**: Console, File, CloudWatch, and custom transports
- **Performance Tracking**: Automatic timing and memory usage monitoring
- **Correlation IDs**: Distributed tracing support with correlation contexts
- **Child Loggers**: Hierarchical logger contexts
- **Buffering & Batching**: Optimized log output with automatic flushing
- **Error Handling**: Graceful fallback and error recovery
- **VDI Optimization**: Special handling for virtual desktop environments
- **High Test Coverage**: 80%+ test coverage with comprehensive test suite

## Quick Start

```typescript
import { createLogger } from '@agent-desktop/logging';

// Create a logger
const logger = createLogger('my-service');

// Basic logging
logger.info('Service started');
logger.error('Something went wrong', { userId: '123', action: 'login' });

// Timing operations
const result = await logger.time('database-query', async () => {
  return await database.query('SELECT * FROM users');
});

// Child loggers for scoped contexts
const requestLogger = logger.createChild('request-handler');
requestLogger.info('Processing request', { requestId: 'req-123' });
```

## Logger Configuration

### Basic Configuration

```typescript
import { Logger, LogLevel, ConsoleTransport } from '@agent-desktop/logging';

const logger = new Logger({
  level: LogLevel.DEBUG,
  context: 'my-service',
  transports: [new ConsoleTransport()],
  enableConsole: true,
  enableStructured: true,
  maxBufferSize: 1000,
  flushIntervalMs: 5000,
  enablePerformanceTracking: true,
  enableMemoryTracking: true,
});
```

### Using Logger Factory

```typescript
import { LoggerFactory } from '@agent-desktop/logging';

// Configure factory
const factory = LoggerFactory.getInstance({
  defaultLevel: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  fileConfig: {
    filename: 'app.log',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  },
});

// Create loggers
const serviceLogger = factory.createLogger('service');
const dbLogger = factory.createLogger('database');
```

## Transports

### Console Transport

Perfect for development and debugging:

```typescript
import { ConsoleTransport } from '@agent-desktop/logging';

const consoleTransport = new ConsoleTransport({
  enableColors: true,
  enableTimestamp: true,
  enableContext: true,
  enableMetadata: true,
  timestampFormat: 'iso', // 'iso', 'locale', or 'time'
});
```

### File Transport

For persistent logging:

```typescript
import { FileTransport } from '@agent-desktop/logging';

const fileTransport = new FileTransport({
  filename: 'logs/app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableRotation: true,
  format: 'json', // 'json' or 'text'
  createDirectory: true,
});
```

### CloudWatch Transport

For AWS environments:

```typescript
import { CloudWatchTransport } from '@agent-desktop/logging';

const cloudWatchTransport = new CloudWatchTransport({
  logGroupName: '/aws/lambda/my-function',
  logStreamName: 'my-stream',
  region: 'us-east-1',
  maxBatchSize: 25,
  maxBatchTime: 5000,
  enableMetrics: true,
});
```

## Correlation Context

Track requests across service boundaries:

```typescript
// Set correlation context
logger.setContext({
  correlationId: 'req-123',
  sessionId: 'sess-456',
  userId: 'user-789',
  customerId: 'customer-abc',
});

// All subsequent logs will include this context
logger.info('Processing user action'); // Includes correlation data

// Child loggers inherit parent context
const childLogger = logger.createChild('user-service');
childLogger.info('User lookup'); // Includes inherited correlation data

// Clear context when done
logger.clearContext();
```

## Performance Timing

Monitor operation performance:

```typescript
// Time async operations
const result = await logger.time('api-call', async () => {
  return await fetch('/api/users');
}, LogLevel.DEBUG);

// Time sync operations
const data = logger.timeSync('data-processing', () => {
  return processLargeDataset(rawData);
});

// Manual timing with custom metrics
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;

logger.info('Operation completed', {
  operation: 'custom-task',
  duration: `${duration.toFixed(2)}ms`,
  itemsProcessed: 1000,
});
```

## Error Logging

Comprehensive error handling:

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Log error with full stack trace and context
  logger.logError(error, 'Failed to process request', {
    userId: '123',
    operation: 'data-sync',
    retryCount: 3,
  });
  
  // Or use error level directly
  logger.error('Operation failed', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context: 'additional-context',
  });
}
```

## Environment-Specific Configurations

### Development

```typescript
const devLogger = factory.createDevelopmentLogger('my-service');
// - DEBUG level
// - Console output with colors
// - Detailed metadata
```

### Production

```typescript
const prodLogger = factory.createProductionLogger('my-service');
// - INFO level
// - File and CloudWatch outputs
// - Structured JSON format
// - Performance monitoring
```

### Testing

```typescript
const testLogger = factory.createTestLogger('my-service');
// - WARN level (reduced noise)
// - No console output
// - Minimal transports
```

## Structured Logging

All logs are structured with consistent fields:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "context": "user-service",
  "message": "User login successful",
  "metadata": {
    "userId": "123",
    "loginMethod": "oauth",
    "duration": "150ms"
  },
  "correlationId": "req-abc123",
  "sessionId": "sess-xyz789",
  "traceId": "trace_1234567890_abc123",
  "spanId": "span_def456",
  "performance": {
    "memory": {
      "rss": "100MB",
      "heapTotal": "50MB",
      "heapUsed": "25MB",
      "external": "5MB"
    }
  }
}
```

## Best Practices

### Logger Naming

```typescript
// Use hierarchical naming
const appLogger = createLogger('app');
const serviceLogger = createLogger('app:user-service');
const dbLogger = createLogger('app:user-service:database');

// Or use child loggers
const baseLogger = createLogger('app');
const serviceLogger = baseLogger.createChild('user-service');
const dbLogger = serviceLogger.createChild('database');
```

### Metadata Usage

```typescript
// Good: Structured, searchable metadata
logger.info('User action', {
  action: 'login',
  userId: '123',
  success: true,
  duration: 150,
  ipAddress: '192.168.1.1',
});

// Avoid: Unstructured strings
logger.info(`User 123 logged in successfully in 150ms from 192.168.1.1`);
```

### Error Context

```typescript
// Include relevant context with errors
logger.error('Database connection failed', {
  database: 'users',
  host: 'db.example.com',
  port: 5432,
  retryAttempt: 3,
  timeoutMs: 5000,
});
```

### Sensitive Data

```typescript
// Never log sensitive information
logger.info('User authenticated', {
  userId: user.id,
  email: user.email.substring(0, 3) + '***', // Masked
  // password: user.password, // ❌ Never log passwords
  loginTime: new Date().toISOString(),
});
```

## Performance Considerations

- **Buffering**: Logs are buffered and flushed in batches for better performance
- **Lazy Evaluation**: Expensive operations only run if log level permits
- **Memory Monitoring**: Built-in memory usage tracking
- **Async Operations**: Non-blocking writes to transports
- **Transport Failover**: Graceful fallback if transports fail

## Testing

The library includes comprehensive test utilities:

```typescript
import { LoggingTestUtils } from '@agent-desktop/logging/test-utils';

describe('MyService', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = LoggingTestUtils.createMockLogger();
  });

  it('should log service events', () => {
    const service = new MyService(mockLogger);
    service.processData();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Data processed',
      expect.objectContaining({ itemCount: 100 })
    );
  });
});
```

## Migration Guide

### From console.log

```typescript
// Before
console.log('User logged in:', userId);
console.error('Failed to save:', error);

// After
logger.info('User logged in', { userId });
logger.logError(error, 'Failed to save user data');
```

### From winston

```typescript
// Before
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// After
import { createLogger } from '@agent-desktop/logging';
const logger = createLogger('my-service');
```

## API Reference

### Logger Class

- `debug(message, metadata?)` - Debug level logging
- `info(message, metadata?)` - Info level logging  
- `warn(message, metadata?)` - Warning level logging
- `error(message, metadata?)` - Error level logging
- `fatal(message, metadata?)` - Fatal level logging
- `logError(error, message?, metadata?)` - Log error objects
- `time(operation, fn, level?)` - Time async operations
- `timeSync(operation, fn, level?)` - Time sync operations
- `createChild(context)` - Create child logger
- `setContext(context)` - Set correlation context
- `getContext()` - Get current context
- `clearContext()` - Clear correlation context
- `flush()` - Flush buffered logs
- `destroy()` - Clean up resources

### LoggerFactory Class

- `getInstance(config?)` - Get singleton instance
- `createLogger(context, overrides?)` - Create new logger
- `getLogger(context)` - Get or create logger
- `createDevelopmentLogger(context)` - Development-optimized logger
- `createProductionLogger(context)` - Production-optimized logger
- `createTestLogger(context)` - Test-optimized logger
- `addTransport(transport)` - Add global transport
- `removeTransport(name)` - Remove global transport
- `flushAll()` - Flush all loggers
- `shutdown()` - Shutdown all loggers
- `getStats()` - Get factory statistics

## Contributing

1. Follow TypeScript strict mode requirements
2. Maintain 80%+ test coverage
3. Add JSDoc comments for all public APIs
4. Follow existing code style and patterns
5. Test in VDI environments when possible

## License

UNLICENSED - Internal use only