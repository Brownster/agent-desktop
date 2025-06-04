/**
 * @fileoverview Main export for the enterprise logging library
 * @module @agent-desktop/logging
 */

// Core logger
export { Logger, type LoggerConfig } from './logger';

// Logger factory
export { 
  LoggerFactory, 
  type LoggerFactoryConfig,
  createLogger,
  getLogger,
} from './logger-factory';

// Transports
export {
  ConsoleTransport,
  FileTransport,
  CloudWatchTransport,
  type ConsoleTransportConfig,
  type FileTransportConfig,
  type CloudWatchTransportConfig,
} from './transports';

// Re-export types from the types library
export type {
  LogLevel,
  LogEntry,
  LogTransport,
  CorrelationContext,
  PerformanceMetrics,
  ErrorInfo,
  TransportType,
} from '@agent-desktop/types';