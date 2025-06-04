/**
 * @fileoverview File transport for persistent logging
 * @module @agent-desktop/logging/transports
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { LogEntry, LogTransport } from '@agent-desktop/types';

/**
 * File transport configuration
 */
export interface FileTransportConfig {
  readonly filename: string;
  readonly maxFileSize: number;
  readonly maxFiles: number;
  readonly enableRotation: boolean;
  readonly enableCompression: boolean;
  readonly flushInterval: number;
  readonly format: 'json' | 'text';
  readonly datePattern?: string;
  readonly createDirectory: boolean;
}

/**
 * Default file transport configuration
 */
const DEFAULT_CONFIG: FileTransportConfig = {
  filename: 'app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableRotation: true,
  enableCompression: false,
  flushInterval: 1000,
  format: 'json',
  createDirectory: true,
};

/**
 * File transport for persistent logging
 * 
 * Features:
 * - Structured JSON or text output
 * - Automatic log rotation
 * - Configurable file sizes and retention
 * - Directory creation
 * - Compression support (future)
 * - Atomic writes with buffer management
 */
export class FileTransport implements LogTransport {
  readonly name = 'file';
  readonly type = 'file' as const;
  
  private readonly config: FileTransportConfig;
  private readonly buffer: string[] = [];
  private flushTimer: NodeJS.Timeout | undefined;
  private isWriting = false;
  private pendingWrites: string[] = [];

  /**
   * Create a new file transport
   * 
   * @param config - Transport configuration
   */
  constructor(config: Partial<FileTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Write a log entry to the file
   * 
   * @param entry - Log entry to write
   */
  async write(entry: LogEntry): Promise<void> {
    const formattedEntry = this.formatEntry(entry);
    
    // Add to buffer
    this.buffer.push(formattedEntry);
    this.pendingWrites.push(formattedEntry);

    // Immediate write for high-priority logs
    if (entry.level >= 3) { // ERROR and FATAL
      await this.flushBuffer();
    }
  }

  /**
   * Flush all buffered entries to file
   */
  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  /**
   * Close the file transport and clean up resources
   */
  async close(): Promise<void> {
    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush any remaining entries
    await this.flushBuffer();
  }

  /**
   * Initialize the file transport
   */
  private async initialize(): Promise<void> {
    try {
      // Create directory if needed
      if (this.config.createDirectory) {
        const dir = dirname(this.config.filename);
        await fs.mkdir(dir, { recursive: true });
      }

      // Start auto-flush timer
      if (this.config.flushInterval > 0) {
        this.flushTimer = setInterval(() => {
          this.flushBuffer().catch(error => {
            console.error('Failed to auto-flush file transport:', error);
          });
        }, this.config.flushInterval);
      }
    } catch (error) {
      console.error('Failed to initialize file transport:', error);
    }
  }

  /**
   * Format log entry for file output
   * 
   * @param entry - Log entry to format
   * @returns Formatted string
   */
  private formatEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify({
        timestamp: entry.timestamp,
        level: this.getLevelName(entry.level),
        context: entry.context,
        message: entry.message,
        metadata: entry.metadata,
        correlationId: entry.correlationId,
        sessionId: entry.sessionId,
        userId: entry.userId,
        customerId: entry.customerId,
        traceId: entry.traceId,
        spanId: entry.spanId,
        performance: entry.performance,
        error: entry.error,
        tags: entry.tags,
      }) + '\n';
    } else {
      // Text format
      const parts = [
        entry.timestamp,
        this.getLevelName(entry.level),
        entry.context ? `[${entry.context}]` : '',
        entry.correlationId ? `(${entry.correlationId.slice(0, 8)})` : '',
        entry.message,
      ].filter(Boolean);

      let line = parts.join(' ');

      // Add metadata on separate lines
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        line += '\n  Metadata: ' + JSON.stringify(entry.metadata);
      }

      if (entry.error) {
        line += '\n  Error: ' + JSON.stringify({
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        });
      }

      return line + '\n';
    }
  }

  /**
   * Flush buffered entries to file
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0 || this.isWriting) {
      return;
    }

    this.isWriting = true;
    const entriesToWrite = [...this.buffer];
    this.buffer.length = 0;

    try {
      // Check if rotation is needed
      if (this.config.enableRotation) {
        await this.rotateIfNeeded();
      }

      // Write all entries
      const content = entriesToWrite.join('');
      await fs.appendFile(this.config.filename, content, 'utf8');

      // Clear pending writes
      this.pendingWrites = this.pendingWrites.filter(
        entry => !entriesToWrite.includes(entry)
      );
    } catch (error) {
      // On error, put entries back in buffer
      this.buffer.unshift(...entriesToWrite);
      throw error;
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Rotate log files if needed
   */
  private async rotateIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.config.filename);
      
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      // File doesn't exist yet, no rotation needed
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to check file size for rotation:', error);
      }
    }
  }

  /**
   * Rotate log files
   */
  private async rotateLogs(): Promise<void> {
    const { filename, maxFiles } = this.config;
    
    try {
      // Remove oldest file if we're at the limit
      const oldestFile = `${filename}.${maxFiles}`;
      try {
        await fs.unlink(oldestFile);
      } catch {
        // File doesn't exist, ignore
      }

      // Rotate existing files
      for (let i = maxFiles - 1; i >= 1; i--) {
        const currentFile = i === 1 ? filename : `${filename}.${i}`;
        const nextFile = `${filename}.${i + 1}`;
        
        try {
          await fs.rename(currentFile, nextFile);
        } catch {
          // File doesn't exist, ignore
        }
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Get display name for log level
   * 
   * @param level - Log level number
   * @returns Level name
   */
  private getLevelName(level: number): string {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    return names[level] || 'UNKNOWN';
  }
}