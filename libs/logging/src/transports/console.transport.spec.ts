/**
 * @fileoverview Tests for the ConsoleTransport class
 */

// Import LogLevel from types library
const { LogLevel } = require('@agent-desktop/types');
import { ConsoleTransport } from './console.transport';

describe('ConsoleTransport', () => {
  let transport: ConsoleTransport;
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
    log: jest.SpyInstance;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      log: jest.spyOn(console, 'log').mockImplementation(),
    };

    transport = new ConsoleTransport();
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('constructor', () => {
    it('should create transport with default configuration', () => {
      expect(transport.name).toBe('console');
      expect(transport.type).toBe('console');
    });

    it('should create transport with custom configuration', () => {
      const customTransport = new ConsoleTransport({
        enableColors: false,
        enableTimestamp: false,
        enableContext: false,
      });

      expect(customTransport.name).toBe('console');
    });
  });

  describe('write method', () => {
    const createLogEntry = (level: LogLevel, message: string, overrides = {}) => ({
      timestamp: '2024-01-01T00:00:00.000Z',
      level,
      message,
      context: 'test-context',
      correlationId: 'test-correlation-id',
      ...overrides,
    });

    it('should write DEBUG level to console.debug', async () => {
      const entry = createLogEntry(LogLevel.DEBUG, 'debug message');
      
      await transport.write(entry);

      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should write INFO level to console.info', async () => {
      const entry = createLogEntry(LogLevel.INFO, 'info message');
      
      await transport.write(entry);

      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should write WARN level to console.warn', async () => {
      const entry = createLogEntry(LogLevel.WARN, 'warn message');
      
      await transport.write(entry);

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should write ERROR level to console.error', async () => {
      const entry = createLogEntry(LogLevel.ERROR, 'error message');
      
      await transport.write(entry);

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should write FATAL level to console.error', async () => {
      const entry = createLogEntry(LogLevel.FATAL, 'fatal message');
      
      await transport.write(entry);

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in message', async () => {
      const entry = {
        timestamp: '2024-01-01T12:30:45.123Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).toContain('2024-01-01T12:30:45.123Z');
    });

    it('should include context in message', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'my-context',
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).toContain('[my-context]');
    });

    it('should include correlation ID in message', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        correlationId: 'correlation-123456789',
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      // Should include truncated correlation ID
      expect(call[0]).toContain('(correlat)');
    });

    it('should include level name in message', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.WARN,
        message: 'test message',
        context: 'test',
      };

      await transport.write(entry);

      const call = consoleSpy.warn.mock.calls[0];
      expect(call[0]).toContain('WARN');
    });
  });

  describe('metadata handling', () => {
    it('should include metadata in console output', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        metadata: {
          key1: 'value1',
          key2: 42,
          nested: { inner: 'value' },
        },
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call[1]).toContain('Metadata:');
      expect(call[2]).toEqual(
        expect.objectContaining({
          key1: 'value1',
          key2: 42,
          nested: { inner: 'value' },
        })
      );
    });

    it('should include error information', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.ERROR,
        message: 'error message',
        context: 'test',
        error: {
          name: 'TestError',
          message: 'Something went wrong',
          stack: 'Error: Something went wrong\n    at test.js:1:1\n    at test.js:2:2',
        },
      };

      await transport.write(entry);

      const call = consoleSpy.error.mock.calls[0];
      expect(call[1]).toContain('Error:');
      expect(call[2]).toEqual(
        expect.objectContaining({
          name: 'TestError',
          message: 'Something went wrong',
          stack: expect.stringContaining('Error: Something went wrong'),
        })
      );
    });

    it('should include performance metrics', async () => {
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.DEBUG,
        message: 'performance message',
        context: 'test',
        performance: {
          duration: 123.45,
          memory: {
            rss: 104857600, // 100MB in bytes
            heapTotal: 52428800, // 50MB in bytes
            heapUsed: 26214400, // 25MB in bytes
            external: 5242880, // 5MB in bytes
          },
        },
      };

      await transport.write(entry);

      const call = consoleSpy.debug.mock.calls[0];
      expect(call[1]).toContain('Performance:');
      expect(call[2]).toEqual(
        expect.objectContaining({
          duration: '123.45ms',
          memory: expect.objectContaining({
            rss: '100MB',
            heapTotal: '50MB',
            heapUsed: '25MB',
            external: '5MB',
          }),
        })
      );
    });
  });

  describe('configuration options', () => {
    it('should disable colors when configured', async () => {
      const noColorTransport = new ConsoleTransport({
        enableColors: false,
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.ERROR,
        message: 'error message',
        context: 'test',
      };

      await noColorTransport.write(entry);

      const call = consoleSpy.error.mock.calls[0];
      // Should not contain ANSI color codes
      expect(call[0]).not.toMatch(/\x1b\[[0-9;]*m/);
    });

    it('should disable timestamp when configured', async () => {
      const noTimestampTransport = new ConsoleTransport({
        enableTimestamp: false,
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
      };

      await noTimestampTransport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).not.toContain('2024-01-01T00:00:00.000Z');
    });

    it('should disable context when configured', async () => {
      const noContextTransport = new ConsoleTransport({
        enableContext: false,
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test-context',
      };

      await noContextTransport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).not.toContain('[test-context]');
    });

    it('should disable metadata when configured', async () => {
      const noMetadataTransport = new ConsoleTransport({
        enableMetadata: false,
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        metadata: { key: 'value' },
      };

      await noMetadataTransport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      expect(call.length).toBe(1); // Only the formatted message, no metadata args
    });

    it('should use different timestamp formats', async () => {
      const localeTransport = new ConsoleTransport({
        timestampFormat: 'locale',
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
      };

      await localeTransport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      // Should contain locale-formatted timestamp, not ISO string
      expect(call[0]).not.toContain('2024-01-01T00:00:00.000Z');
      expect(call[0]).toMatch(/\[.*\]/); // Should still have brackets around timestamp
    });
  });

  describe('value truncation', () => {
    it('should truncate long strings', async () => {
      const longString = 'a'.repeat(300);
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        metadata: {
          longValue: longString,
        },
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      const metadataArg = call[2];
      expect(metadataArg.longValue).toContain('...');
      expect(metadataArg.longValue.length).toBeLessThan(longString.length);
    });

    it('should truncate large arrays', async () => {
      const largeArray = Array.from({ length: 15 }, (_, i) => `item${i}`);
      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        metadata: {
          largeArray,
        },
      };

      await transport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      const metadataArg = call[2];
      expect(metadataArg.largeArray).toHaveLength(11); // 10 items + truncation message
      expect(metadataArg.largeArray[10]).toContain('and 5 more items');
    });

    it('should truncate deep objects', async () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      };

      const shallowTransport = new ConsoleTransport({
        metadataDepth: 2,
      });

      const entry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: LogLevel.INFO,
        message: 'test message',
        context: 'test',
        metadata: { deepObject },
      };

      await shallowTransport.write(entry);

      const call = consoleSpy.info.mock.calls[0];
      const metadataArg = call[2];
      
      // Should truncate at depth 2
      expect(metadataArg.deepObject.level1.level2).toBe('[Object]');
    });
  });
});