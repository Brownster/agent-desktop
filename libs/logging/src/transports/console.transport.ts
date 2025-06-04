/**
 * @fileoverview Console transport for development and debugging
 * @module @agent-desktop/logging/transports
 */

import type { LogLevel, LogEntry, LogTransport } from '@agent-desktop/types';

/**
 * Console transport configuration
 */
export interface ConsoleTransportConfig {
  readonly enableColors: boolean;
  readonly enableTimestamp: boolean;
  readonly enableContext: boolean;
  readonly enableMetadata: boolean;
  readonly metadataDepth: number;
  readonly timestampFormat: 'iso' | 'locale' | 'time';
}

/**
 * Default console transport configuration
 */
const DEFAULT_CONFIG: ConsoleTransportConfig = {
  enableColors: true,
  enableTimestamp: true,
  enableContext: true,
  enableMetadata: true,
  metadataDepth: 3,
  timestampFormat: 'iso',
};

/**
 * Console transport for development and debugging
 * 
 * Features:
 * - Colored output based on log level
 * - Formatted timestamps
 * - Context display
 * - Structured metadata output
 * - Configurable formatting options
 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console';
  readonly type = 'console' as const;
  
  private readonly config: ConsoleTransportConfig;

  /**
   * Create a new console transport
   * 
   * @param config - Transport configuration
   */
  constructor(config: Partial<ConsoleTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Write a log entry to the console
   * 
   * @param entry - Log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatMessage(entry);
    
    // Use appropriate console method based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...(this.getMetadataArgs(entry)));
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...(this.getMetadataArgs(entry)));
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...(this.getMetadataArgs(entry)));
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, ...(this.getMetadataArgs(entry)));
        break;
      default:
        console.log(formattedMessage, ...(this.getMetadataArgs(entry)));
    }
  }

  /**
   * Format the main log message
   * 
   * @param entry - Log entry to format
   * @returns Formatted message string
   */
  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.enableTimestamp) {
      const timestamp = this.formatTimestamp(entry.timestamp);
      const timestampColor = this.config.enableColors ? '\x1b[90m' : ''; // Gray
      const reset = this.config.enableColors ? '\x1b[0m' : '';
      parts.push(`${timestampColor}[${timestamp}]${reset}`);
    }

    // Log level
    const levelName = this.getLevelName(entry.level);
    const levelColor = this.config.enableColors ? this.getLevelColor(entry.level) : '';
    const reset = this.config.enableColors ? '\x1b[0m' : '';
    parts.push(`${levelColor}${levelName}${reset}`);

    // Context
    if (this.config.enableContext && entry.context) {
      const contextColor = this.config.enableColors ? '\x1b[96m' : ''; // Bright cyan
      parts.push(`${contextColor}[${entry.context}]${reset}`);
    }

    // Correlation ID (if present)
    if (entry.correlationId) {
      const idColor = this.config.enableColors ? '\x1b[95m' : ''; // Bright magenta
      parts.push(`${idColor}(${entry.correlationId.slice(0, 8)})${reset}`);
    }

    // Message
    parts.push(entry.message);

    return parts.join(' ');
  }

  /**
   * Get metadata arguments for console output
   * 
   * @param entry - Log entry
   * @returns Array of metadata arguments
   */
  private getMetadataArgs(entry: LogEntry): unknown[] {
    if (!this.config.enableMetadata) {
      return [];
    }

    const args: unknown[] = [];

    // Add structured metadata
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      args.push('\n  Metadata:', this.formatMetadata(entry.metadata));
    }

    // Add error information if present
    if (entry.error) {
      args.push('\n  Error:', {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack?.split('\n').slice(0, 5).join('\n'),
      });
    }

    // Add performance information if present
    if (entry.performance) {
      args.push('\n  Performance:', this.formatPerformance(entry.performance));
    }

    return args;
  }

  /**
   * Format metadata for console output
   * 
   * @param metadata - Metadata object
   * @returns Formatted metadata
   */
  private formatMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        formatted[key] = this.truncateValue(value, this.config.metadataDepth);
      }
    }

    return formatted;
  }

  /**
   * Format performance metrics for console output
   * 
   * @param performance - Performance metrics
   * @returns Formatted performance object
   */
  private formatPerformance(performance: any): Record<string, unknown> {
    const formatted: Record<string, unknown> = {};

    if (performance.duration !== undefined) {
      formatted.duration = `${performance.duration.toFixed(2)}ms`;
    }

    if (performance.memory) {
      formatted.memory = this.formatMemoryUsage(performance.memory);
    }

    if (performance.memoryDelta) {
      formatted.memoryDelta = performance.memoryDelta;
    }

    return formatted;
  }

  /**
   * Format memory usage for display
   * 
   * @param memory - Memory usage object
   * @returns Formatted memory usage
   */
  private formatMemoryUsage(memory: any): Record<string, string> {
    if (typeof memory === 'object' && memory !== null) {
      const formatted: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(memory)) {
        if (typeof value === 'number') {
          formatted[key] = `${Math.round(value / 1024 / 1024)}MB`;
        } else if (typeof value === 'string') {
          formatted[key] = value;
        }
      }
      
      return formatted;
    }
    
    return { memory: String(memory) };
  }

  /**
   * Truncate deep object values to prevent excessive output
   * 
   * @param value - Value to truncate
   * @param depth - Maximum depth
   * @returns Truncated value
   */
  private truncateValue(value: unknown, depth: number): unknown {
    if (depth <= 0) {
      return '[Object]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string' && value.length > 200) {
      return value.slice(0, 200) + '...';
    }

    if (Array.isArray(value)) {
      if (value.length > 10) {
        return [
          ...value.slice(0, 10).map(item => this.truncateValue(item, depth - 1)),
          `... and ${value.length - 10} more items`,
        ];
      }
      return value.map(item => this.truncateValue(item, depth - 1));
    }

    if (typeof value === 'object') {
      const truncated: Record<string, unknown> = {};
      const entries = Object.entries(value as Record<string, unknown>);
      
      for (const [key, val] of entries.slice(0, 20)) {
        truncated[key] = this.truncateValue(val, depth - 1);
      }
      
      if (entries.length > 20) {
        truncated['...'] = `${entries.length - 20} more properties`;
      }
      
      return truncated;
    }

    return value;
  }

  /**
   * Format timestamp according to configuration
   * 
   * @param timestamp - ISO timestamp string
   * @returns Formatted timestamp
   */
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);

    switch (this.config.timestampFormat) {
      case 'locale':
        return date.toLocaleString();
      case 'time':
        return date.toLocaleTimeString();
      case 'iso':
      default:
        return timestamp;
    }
  }

  /**
   * Get display name for log level
   * 
   * @param level - Log level
   * @returns Level name
   */
  private getLevelName(level: LogLevel): string {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    return names[level] || 'UNKNOWN';
  }

  /**
   * Get ANSI color code for log level
   * 
   * @param level - Log level
   * @returns ANSI color code
   */
  private getLevelColor(level: LogLevel): string {
    const colors = [
      '\x1b[36m', // Cyan - DEBUG
      '\x1b[32m', // Green - INFO
      '\x1b[33m', // Yellow - WARN
      '\x1b[31m', // Red - ERROR
      '\x1b[35m', // Magenta - FATAL
    ];
    return colors[level] || '';
  }
}