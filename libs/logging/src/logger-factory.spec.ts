/**
 * @fileoverview Tests for the LoggerFactory class
 */

import { LogLevel } from '@agent-desktop/types';
import { LoggerFactory, createLogger, getLogger } from './logger-factory';
import { Logger } from './logger';
import { ConsoleTransport } from './transports';

describe('LoggerFactory', () => {
  let factory: LoggerFactory;

  beforeEach(() => {
    // Reset singleton instance for each test
    (LoggerFactory as any).instance = undefined;
    
    factory = LoggerFactory.getInstance({
      enableConsole: false, // Disable console for testing
      enableFile: false,
      enableCloudWatch: false,
    });
  });

  afterEach(async () => {
    await factory.shutdown();
  });

  describe('singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = LoggerFactory.getInstance();
      const instance2 = LoggerFactory.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize with configuration on first call', () => {
      (LoggerFactory as any).instance = undefined;
      
      const instance = LoggerFactory.getInstance({
        defaultLevel: LogLevel.ERROR,
        enableConsole: true,
      });
      
      expect(instance).toBeDefined();
    });
  });

  describe('logger creation', () => {
    it('should create logger with default configuration', () => {
      const logger = factory.createLogger('test-context');
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom configuration', () => {
      const logger = factory.createLogger('test-context', {
        level: LogLevel.ERROR,
        enableConsole: true,
      });
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should cache logger instances', () => {
      const logger1 = factory.createLogger('same-context');
      const logger2 = factory.createLogger('same-context');
      
      expect(logger1).toBe(logger2);
    });

    it('should create different instances for different contexts', () => {
      const logger1 = factory.createLogger('context1');
      const logger2 = factory.createLogger('context2');
      
      expect(logger1).not.toBe(logger2);
    });

    it('should create different instances for different configurations', () => {
      const logger1 = factory.createLogger('same-context', { level: LogLevel.DEBUG });
      const logger2 = factory.createLogger('same-context', { level: LogLevel.ERROR });
      
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('getLogger method', () => {
    it('should return logger instance', () => {
      const logger = factory.getLogger('test-context');
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should be equivalent to createLogger with no overrides', () => {
      const logger1 = factory.getLogger('test-context');
      const logger2 = factory.createLogger('test-context');
      
      expect(logger1).toBe(logger2);
    });
  });

  describe('environment-specific logger creation', () => {
    it('should create development logger with debug level', () => {
      const logger = factory.createDevelopmentLogger('dev-context');
      
      expect(logger).toBeInstanceOf(Logger);
      // Note: We can't easily test the internal configuration without exposing it
    });

    it('should create production logger with appropriate configuration', () => {
      const logger = factory.createProductionLogger('prod-context');
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create test logger with minimal output', () => {
      const logger = factory.createTestLogger('test-context');
      
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('transport management', () => {
    it('should add transport to future loggers', () => {
      const mockTransport = global.LoggingTestUtils.createMockTransport();
      
      factory.addTransport(mockTransport);
      
      // Create new logger after adding transport
      const logger = factory.createLogger('transport-test');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should remove transport from future loggers', () => {
      const mockTransport = global.LoggingTestUtils.createMockTransport('removable');
      
      factory.addTransport(mockTransport);
      factory.removeTransport('removable');
      
      const logger = factory.createLogger('removal-test');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle removing non-existent transport', () => {
      expect(() => {
        factory.removeTransport('non-existent');
      }).not.toThrow();
    });
  });

  describe('bulk operations', () => {
    it('should flush all logger instances', async () => {
      const logger1 = factory.createLogger('context1');
      const logger2 = factory.createLogger('context2');
      
      // Mock the flush methods
      const flush1Spy = jest.spyOn(logger1, 'flush').mockResolvedValue();
      const flush2Spy = jest.spyOn(logger2, 'flush').mockResolvedValue();
      
      await factory.flushAll();
      
      expect(flush1Spy).toHaveBeenCalled();
      expect(flush2Spy).toHaveBeenCalled();
    });

    it('should handle flush failures gracefully', async () => {
      const logger = factory.createLogger('failing-context');
      
      // Mock flush to fail
      jest.spyOn(logger, 'flush').mockRejectedValue(new Error('Flush failed'));
      
      // Should not throw
      await expect(factory.flushAll()).resolves.toBeUndefined();
    });
  });

  describe('shutdown', () => {
    it('should destroy all logger instances', async () => {
      const logger1 = factory.createLogger('context1');
      const logger2 = factory.createLogger('context2');
      
      // Mock the destroy methods
      const destroy1Spy = jest.spyOn(logger1, 'destroy').mockResolvedValue();
      const destroy2Spy = jest.spyOn(logger2, 'destroy').mockResolvedValue();
      
      await factory.shutdown();
      
      expect(destroy1Spy).toHaveBeenCalled();
      expect(destroy2Spy).toHaveBeenCalled();
    });

    it('should handle destroy failures gracefully', async () => {
      const logger = factory.createLogger('failing-context');
      
      // Mock destroy to fail
      jest.spyOn(logger, 'destroy').mockRejectedValue(new Error('Destroy failed'));
      
      // Should not throw
      await expect(factory.shutdown()).resolves.toBeUndefined();
    });

    it('should clear logger cache after shutdown', async () => {
      factory.createLogger('context1');
      factory.createLogger('context2');
      
      const statsBefore = factory.getStats();
      expect(statsBefore.loggerCount).toBe(2);
      
      await factory.shutdown();
      
      const statsAfter = factory.getStats();
      expect(statsAfter.loggerCount).toBe(0);
    });

    it('should handle multiple shutdown calls gracefully', async () => {
      const logger = factory.createLogger('context');
      const destroySpy = jest.spyOn(logger, 'destroy').mockResolvedValue();
      
      await factory.shutdown();
      await factory.shutdown(); // Second call
      
      // Destroy should only be called once
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('statistics', () => {
    it('should return accurate statistics', () => {
      factory.createLogger('context1');
      factory.createLogger('context2');
      factory.createLogger('context3');
      
      const stats = factory.getStats();
      
      expect(stats.loggerCount).toBe(3);
      expect(stats.transportCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.transportNames)).toBe(true);
    });

    it('should include transport information', () => {
      const mockTransport = global.LoggingTestUtils.createMockTransport('test-transport');
      factory.addTransport(mockTransport);
      
      const stats = factory.getStats();
      
      expect(stats.transportNames).toContain('test-transport');
    });
  });

  describe('global level changes', () => {
    it('should warn about unimplemented feature', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      factory.setGlobalLevel(LogLevel.ERROR);
      
      expect(warnSpy).toHaveBeenCalledWith(
        'Dynamic log level changes not yet implemented'
      );
      
      warnSpy.mockRestore();
    });
  });
});

describe('module exports', () => {
  beforeEach(() => {
    // Reset singleton for module-level function tests
    (LoggerFactory as any).instance = undefined;
  });

  afterEach(async () => {
    const factory = LoggerFactory.getInstance();
    await factory.shutdown();
  });

  describe('createLogger function', () => {
    it('should create logger using default factory', () => {
      const logger = createLogger('module-test');
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use singleton factory instance', () => {
      const logger1 = createLogger('same-context');
      const logger2 = createLogger('same-context');
      
      expect(logger1).toBe(logger2);
    });
  });

  describe('getLogger function', () => {
    it('should get logger using default factory', () => {
      const logger = getLogger('module-test');
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should be equivalent to createLogger', () => {
      const logger1 = getLogger('same-context');
      const logger2 = createLogger('same-context');
      
      expect(logger1).toBe(logger2);
    });
  });
});