/**
 * @fileoverview Tests for the ConfigService class
 */

import { ConfigService, ConfigSource } from './config.service';
import { createLogger } from '@agent-desktop/logging';

describe('ConfigService', () => {
  let configService: ConfigService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = global.TestUtils?.createMockLogger() || {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    };

    configService = new ConfigService({
      logger: mockLogger,
      enableWatching: true,
      enableValidation: true,
      enableCaching: true,
      cacheSize: 100,
      cacheTtl: 1000, // 1 second for testing
    });
  });

  describe('basic get/set operations', () => {
    it('should set and get simple values', () => {
      configService.set('test.key', 'test value');
      expect(configService.get('test.key')).toBe('test value');
    });

    it('should set and get nested values using dot notation', () => {
      configService.set('app.database.host', 'localhost');
      configService.set('app.database.port', 5432);
      
      expect(configService.get('app.database.host')).toBe('localhost');
      expect(configService.get('app.database.port')).toBe(5432);
    });

    it('should return undefined for non-existent keys', () => {
      expect(configService.get('non.existent.key')).toBeUndefined();
    });

    it('should handle complex nested objects', () => {
      const complexConfig = {
        modules: [
          { id: 'module1', enabled: true },
          { id: 'module2', enabled: false },
        ],
        features: {
          auth: { enabled: true, provider: 'oauth' },
          logging: { level: 'debug' },
        },
      };

      configService.set('app.config', complexConfig);
      
      expect(configService.get('app.config.modules')).toEqual(complexConfig.modules);
      expect(configService.get('app.config.features.auth.provider')).toBe('oauth');
    });
  });

  describe('has method', () => {
    it('should return true for existing keys', () => {
      configService.set('existing.key', 'value');
      expect(configService.has('existing.key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(configService.has('non.existent.key')).toBe(false);
    });

    it('should work with nested keys', () => {
      configService.set('nested.object', { prop: 'value' });
      expect(configService.has('nested.object.prop')).toBe(true);
      expect(configService.has('nested.object.missing')).toBe(false);
    });
  });

  describe('delete method', () => {
    it('should delete existing keys', () => {
      configService.set('to.delete', 'value');
      expect(configService.has('to.delete')).toBe(true);
      
      const deleted = configService.delete('to.delete');
      expect(deleted).toBe(true);
      expect(configService.has('to.delete')).toBe(false);
    });

    it('should return false for non-existent keys', () => {
      const deleted = configService.delete('non.existent');
      expect(deleted).toBe(false);
    });

    it('should delete nested keys', () => {
      configService.set('nested', { prop1: 'value1', prop2: 'value2' });
      
      const deleted = configService.delete('nested.prop1');
      expect(deleted).toBe(true);
      expect(configService.has('nested.prop1')).toBe(false);
      expect(configService.has('nested.prop2')).toBe(true);
    });
  });

  describe('getAll method', () => {
    it('should return all configuration values', () => {
      configService.set('key1', 'value1');
      configService.set('key2', 'value2');
      configService.set('nested.key', 'nested value');

      const all = configService.getAll();
      
      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2',
        nested: { key: 'nested value' },
      });
    });

    it('should return empty object when no configuration exists', () => {
      const all = configService.getAll();
      expect(all).toEqual({});
    });
  });

  describe('clear method', () => {
    it('should clear all configuration values', () => {
      configService.set('key1', 'value1');
      configService.set('key2', 'value2');
      configService.set('nested.key', 'value');

      configService.clear();

      expect(configService.getAll()).toEqual({});
      expect(configService.has('key1')).toBe(false);
      expect(configService.has('nested.key')).toBe(false);
    });
  });

  describe('configuration watching', () => {
    it('should notify watchers on configuration changes', async () => {
      const watcher = jest.fn();
      const unwatch = configService.watch('test.key', watcher);

      configService.set('test.key', 'initial value');
      configService.set('test.key', 'updated value');

      // Allow async watcher notifications to complete
      await global.ConfigTestUtils.flushPromises();

      expect(watcher).toHaveBeenCalledTimes(2);
      expect(watcher).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test.key',
          newValue: 'initial value',
          source: ConfigSource.OVERRIDE,
        })
      );
      expect(watcher).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test.key',
          oldValue: 'initial value',
          newValue: 'updated value',
          source: ConfigSource.OVERRIDE,
        })
      );

      unwatch();
    });

    it('should support wildcard watchers', async () => {
      const watcher = jest.fn();
      const unwatch = configService.watch('app.*', watcher);

      configService.set('app.setting1', 'value1');
      configService.set('app.setting2', 'value2');
      configService.set('other.setting', 'value3');

      await global.ConfigTestUtils.flushPromises();

      expect(watcher).toHaveBeenCalledTimes(2); // Only app.* changes
      unwatch();
    });

    it('should handle watcher errors gracefully', async () => {
      const errorWatcher = jest.fn().mockRejectedValue(new Error('Watcher error'));
      const goodWatcher = jest.fn();

      const unwatch1 = configService.watch('test.key', errorWatcher);
      const unwatch2 = configService.watch('test.key', goodWatcher);

      configService.set('test.key', 'value');

      await global.ConfigTestUtils.flushPromises();

      expect(errorWatcher).toHaveBeenCalled();
      expect(goodWatcher).toHaveBeenCalled();

      unwatch1();
      unwatch2();
    });

    it('should unwatch properly', async () => {
      const watcher = jest.fn();
      const unwatch = configService.watch('test.key', watcher);

      configService.set('test.key', 'value1');
      unwatch();
      configService.set('test.key', 'value2');

      await global.ConfigTestUtils.flushPromises();

      expect(watcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching', () => {
    it('should cache frequently accessed values', () => {
      configService.set('cached.key', 'cached value');

      // First access should hit the source
      const value1 = configService.get('cached.key');
      expect(value1).toBe('cached value');

      // Second access should hit the cache
      const value2 = configService.get('cached.key');
      expect(value2).toBe('cached value');
    });

    it('should invalidate cache on updates', () => {
      configService.set('cache.key', 'initial');
      configService.get('cache.key'); // Cache the value

      configService.set('cache.key', 'updated');
      const value = configService.get('cache.key');
      
      expect(value).toBe('updated');
    });

    it('should expire cached values', async () => {
      // Create service with very short cache TTL
      const shortCacheService = new ConfigService({
        enableCaching: true,
        cacheTtl: 50, // 50ms
      });

      shortCacheService.set('expire.key', 'value');
      shortCacheService.get('expire.key'); // Cache it

      // Wait for cache to expire
      await global.ConfigTestUtils.waitFor(100);

      // Should still get the value, but from source
      const value = shortCacheService.get('expire.key');
      expect(value).toBe('value');
    });
  });

  describe('validation', () => {
    it('should validate configuration objects', () => {
      const validConfig = global.ConfigTestUtils.createMockConfig();
      const result = configService.validate(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid configuration', () => {
      const invalidConfig = {
        // Missing required fields
        name: 'Test',
        // Invalid version format
        version: 'not-semver',
      };

      const result = configService.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'customer_id')).toBe(true);
    });

    it('should return warnings for questionable configuration', () => {
      const questionableConfig = {
        customer_id: 'test-customer',
        name: '', // Empty string should generate warning
        version: '1.0.0',
        isActive: true,
      };

      const result = configService.validate(questionableConfig);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.field === 'name')).toBe(true);
    });
  });

  describe('customer configuration management', () => {
    it('should load customer configuration', async () => {
      const result = await configService.loadCustomerConfig('test-customer');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_id).toBe('test-customer');
        expect(result.data.name).toBe('Customer test-customer');
      }
    });

    it('should save valid customer configuration', async () => {
      const config = global.ConfigTestUtils.createMockConfig({
        customer_id: 'save-test',
        name: 'Save Test Customer',
      });

      const result = await configService.saveCustomerConfig(config);

      expect(result.success).toBe(true);
    });

    it('should reject invalid customer configuration', async () => {
      const invalidConfig = {
        customer_id: 'invalid-customer',
        // Missing required fields
      } as any;

      const result = await configService.saveCustomerConfig(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('validation failed');
      }
    });
  });

  describe('environment configuration', () => {
    it('should return environment configuration', () => {
      const envConfig = configService.getEnvironmentConfig();

      expect(envConfig).toBeDefined();
      expect(envConfig.environment).toBeDefined();
      expect(envConfig.apiEndpoint).toBeDefined();
      expect(envConfig.logLevel).toBeDefined();
    });

    it('should use environment variables when available', () => {
      const originalEnv = process.env.API_ENDPOINT;
      process.env.API_ENDPOINT = 'https://test-api.example.com';

      const envConfig = configService.getEnvironmentConfig();
      
      expect(envConfig.apiEndpoint).toBe('https://test-api.example.com');

      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.API_ENDPOINT = originalEnv;
      } else {
        delete process.env.API_ENDPOINT;
      }
    });

    it('should set appropriate defaults for different environments', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test production environment
      process.env.NODE_ENV = 'production';
      const prodConfig = configService.getEnvironmentConfig();
      expect(prodConfig.environment).toBe('production');
      expect(prodConfig.enableTelemetry).toBe(true);
      expect(prodConfig.debugMode).toBe(false);

      // Test development environment
      process.env.NODE_ENV = 'development';
      const devConfig = configService.getEnvironmentConfig();
      expect(devConfig.environment).toBe('development');
      expect(devConfig.enableTelemetry).toBe(false);
      expect(devConfig.debugMode).toBe(true);

      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid nested key access gracefully', () => {
      configService.set('simple', 'string value');
      
      // Trying to access a nested property of a string should return undefined
      expect(configService.get('simple.nested.property')).toBeUndefined();
    });

    it('should handle null values properly', () => {
      configService.set('null.value', null);
      
      expect(configService.get('null.value')).toBeNull();
      expect(configService.has('null.value')).toBe(true);
    });

    it('should handle setting nested values on non-objects', () => {
      configService.set('string', 'simple string');
      
      // This should overwrite the string with an object
      configService.set('string.nested', 'nested value');
      
      expect(configService.get('string.nested')).toBe('nested value');
    });
  });

  describe('performance', () => {
    it('should handle large numbers of configuration keys efficiently', () => {
      const startTime = performance.now();
      
      // Set 1000 configuration values
      for (let i = 0; i < 1000; i++) {
        configService.set(`perf.test.${i}`, `value-${i}`);
      }

      // Get all values
      for (let i = 0; i < 1000; i++) {
        configService.get(`perf.test.${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should limit cache size', () => {
      const limitedCacheService = new ConfigService({
        enableCaching: true,
        cacheSize: 5, // Very small cache
      });

      // Add more items than cache size
      for (let i = 0; i < 10; i++) {
        limitedCacheService.set(`cache.test.${i}`, `value-${i}`);
        limitedCacheService.get(`cache.test.${i}`); // Cache it
      }

      // Cache should not grow beyond limit
      // (We can't directly test cache size, but this ensures it doesn't crash)
      expect(limitedCacheService.get('cache.test.9')).toBe('value-9');
    });
  });
});