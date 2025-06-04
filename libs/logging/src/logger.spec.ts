/**
 * @fileoverview Tests for the Logger class
 */

// Import LogLevel from types library
import { LogLevel } from '@agent-desktop/types';
import { Logger } from './logger';

describe('Logger', () => {
  let mockTransport: any;
  let logger: Logger;

  beforeEach(() => {
    mockTransport = global.LoggingTestUtils.createMockTransport();
    
    logger = new Logger({
      level: LogLevel.DEBUG,
      context: 'test',
      transports: [mockTransport],
      enableConsole: false,
      flushIntervalMs: 0, // Disable auto-flush for testing
    });
  });

  afterEach(async () => {
    await logger.destroy();
  });

  describe('constructor', () => {
    it('should create logger with default configuration', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeDefined();
    });

    it('should create logger with custom configuration', () => {
      const customLogger = new Logger({
        level: LogLevel.ERROR,
        context: 'custom',
        enableConsole: false,
      });
      
      expect(customLogger).toBeDefined();
    });
  });

  describe('log level filtering', () => {
    it('should respect log level filtering', async () => {
      const errorLogger = new Logger({
        level: LogLevel.ERROR,
        transports: [mockTransport],
        enableConsole: false,
      });

      errorLogger.debug('debug message');
      errorLogger.info('info message');
      errorLogger.warn('warn message');
      errorLogger.error('error message');

      await errorLogger.flush();

      // Only error should be logged
      expect(mockTransport.write).toHaveBeenCalledTimes(1);
      const loggedEntry = mockTransport.write.mock.calls[0][0];
      expect(loggedEntry.level).toBe(LogLevel.ERROR);
      expect(loggedEntry.message).toBe('error message');

      await errorLogger.destroy();
    });

    it('should log all levels when set to DEBUG', async () => {
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      logger.fatal('fatal message');

      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledTimes(5);
    });
  });

  describe('log methods', () => {
    it('should log debug messages', async () => {
      logger.debug('test debug message', { key: 'value' });
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.DEBUG,
          message: 'test debug message',
          metadata: { key: 'value' },
          context: 'test',
        })
      );
    });

    it('should log info messages', async () => {
      logger.info('test info message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'test info message',
          context: 'test',
        })
      );
    });

    it('should log warning messages', async () => {
      logger.warn('test warning message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'test warning message',
        })
      );
    });

    it('should log error messages', async () => {
      logger.error('test error message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'test error message',
        })
      );
    });

    it('should log fatal messages', async () => {
      logger.fatal('test fatal message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.FATAL,
          message: 'test fatal message',
        })
      );
    });
  });

  describe('logError method', () => {
    it('should log error objects with full information', async () => {
      const error = new Error('test error');
      error.stack = 'Error: test error\n    at test.js:1:1';
      
      logger.logError(error, 'Custom error message', { context: 'test' });
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Custom error message',
          metadata: {
            context: 'test',
            error: {
              name: 'Error',
              message: 'test error',
              stack: 'Error: test error\n    at test.js:1:1',
            },
          },
        })
      );
    });

    it('should use error message when no custom message provided', async () => {
      const error = new Error('original error message');
      
      logger.logError(error);
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'original error message',
        })
      );
    });
  });

  describe('child logger creation', () => {
    it('should create child logger with combined context', () => {
      const child = logger.createChild('child');
      expect(child).toBeInstanceOf(Logger);
    });

    it('should inherit correlation context from parent', async () => {
      logger.setContext({
        correlationId: 'test-correlation-id',
        sessionId: 'test-session-id',
      });

      const child = logger.createChild('child');
      child.info('child message');
      await child.flush();

      // The child should have inherited the parent's context
      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'test-correlation-id',
          sessionId: 'test-session-id',
        })
      );

      await child.destroy();
    });
  });

  describe('correlation context', () => {
    it('should set and use correlation context', async () => {
      const context = {
        correlationId: 'test-correlation',
        sessionId: 'test-session',
        userId: 'test-user',
        customerId: 'test-customer',
      };

      logger.setContext(context);
      logger.info('test message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledWith(
        expect.objectContaining(context)
      );
    });

    it('should get current correlation context', () => {
      const context = {
        correlationId: 'test-correlation',
        sessionId: 'test-session',
      };

      logger.setContext(context);
      const retrievedContext = logger.getContext();

      expect(retrievedContext).toEqual(context);
    });

    it('should clear correlation context', () => {
      logger.setContext({ correlationId: 'test' });
      logger.clearContext();
      
      const context = logger.getContext();
      expect(context).toEqual({});
    });
  });

  describe('timing functions', () => {
    beforeEach(() => {
      global.LoggingTestUtils.mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1250); // End time (250ms duration)
    });

    it('should time async operations', async () => {
      const result = await logger.time('test operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test result';
      });

      expect(result).toBe('test result');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledTimes(2); // Start and end
      
      const startCall = mockTransport.write.mock.calls[0][0];
      const endCall = mockTransport.write.mock.calls[1][0];

      expect(startCall.message).toBe('Starting test operation');
      expect(endCall.message).toBe('Completed test operation');
      expect(endCall.metadata.performance.duration).toBe(250);
    });

    it('should time sync operations', () => {
      const result = logger.timeSync('test sync operation', () => {
        return 'sync result';
      });

      expect(result).toBe('sync result');
    });

    it('should handle errors in timed operations', async () => {
      const testError = new Error('test error');

      await expect(
        logger.time('failing operation', async () => {
          throw testError;
        })
      ).rejects.toThrow('test error');

      await logger.flush();

      const errorCall = mockTransport.write.mock.calls.find((call: any) => 
        call[0].level === LogLevel.ERROR
      );

      expect(errorCall).toBeDefined();
      expect(errorCall[0].message).toBe('Failed failing operation');
    });
  });

  describe('buffering and flushing', () => {
    it('should buffer log entries', () => {
      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');

      // No writes yet since we haven't flushed
      expect(mockTransport.write).not.toHaveBeenCalled();
    });

    it('should flush buffered entries', async () => {
      logger.info('message 1');
      logger.info('message 2');
      
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledTimes(2);
    });

    it('should handle transport write failures gracefully', async () => {
      mockTransport.write.mockRejectedValueOnce(new Error('Transport failed'));

      logger.error('test message');
      
      // Should not throw
      await expect(logger.flush()).resolves.toBeUndefined();
    });
  });

  describe('performance tracking', () => {
    it('should include performance metrics when enabled', async () => {
      const perfLogger = new Logger({
        level: LogLevel.DEBUG,
        transports: [mockTransport],
        enablePerformanceTracking: true,
        enableMemoryTracking: true,
        enableConsole: false,
      });

      perfLogger.info('test message');
      await perfLogger.flush();

      const logEntry = mockTransport.write.mock.calls[0][0];
      expect(logEntry.performance).toBeDefined();
      expect(logEntry.performance.memory).toBeDefined();

      await perfLogger.destroy();
    });

    it('should exclude performance metrics when disabled', async () => {
      const noPerfLogger = new Logger({
        level: LogLevel.DEBUG,
        transports: [mockTransport],
        enablePerformanceTracking: false,
        enableConsole: false,
      });

      noPerfLogger.info('test message');
      await noPerfLogger.flush();

      const logEntry = mockTransport.write.mock.calls[0][0];
      expect(logEntry.performance).toBeUndefined();

      await noPerfLogger.destroy();
    });
  });

  describe('destruction and cleanup', () => {
    it('should stop logging after destruction', async () => {
      await logger.destroy();
      
      logger.info('should not be logged');
      await logger.flush();

      expect(mockTransport.write).not.toHaveBeenCalled();
    });

    it('should close all transports on destruction', async () => {
      await logger.destroy();

      if (mockTransport.close) {
        expect(mockTransport.close).toHaveBeenCalled();
      }
    });

    it('should handle multiple destroy calls gracefully', async () => {
      await logger.destroy();
      await logger.destroy(); // Should not throw

      expect(mockTransport.write).not.toHaveBeenCalled();
    });
  });

  describe('multiple transports', () => {
    it('should write to all configured transports', async () => {
      const transport1 = global.LoggingTestUtils.createMockTransport('transport1');
      const transport2 = global.LoggingTestUtils.createMockTransport('transport2');

      const multiLogger = new Logger({
        level: LogLevel.DEBUG,
        transports: [transport1, transport2],
        enableConsole: false,
      });

      multiLogger.info('test message');
      await multiLogger.flush();

      expect(transport1.write).toHaveBeenCalled();
      expect(transport2.write).toHaveBeenCalled();

      await multiLogger.destroy();
    });

    it('should continue with other transports if one fails', async () => {
      const workingTransport = global.LoggingTestUtils.createMockTransport('working');
      const failingTransport = global.LoggingTestUtils.createMockTransport('failing');
      failingTransport.write.mockRejectedValue(new Error('Transport failed'));

      const multiLogger = new Logger({
        level: LogLevel.DEBUG,
        transports: [workingTransport, failingTransport],
        enableConsole: false,
      });

      multiLogger.info('test message');
      await multiLogger.flush();

      expect(workingTransport.write).toHaveBeenCalled();
      expect(failingTransport.write).toHaveBeenCalled();

      await multiLogger.destroy();
    });
  });

  describe('runtime level changes', () => {
    it('should update log level dynamically', async () => {
      logger.setLevel(LogLevel.ERROR);
      logger.debug('debug message');
      logger.error('error message');
      await logger.flush();

      expect(mockTransport.write).toHaveBeenCalledTimes(1);
      const entry = mockTransport.write.mock.calls[0][0];
      expect(entry.level).toBe(LogLevel.ERROR);
    });

    it('should expose current log level', () => {
      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });
  });
});