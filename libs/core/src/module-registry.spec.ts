/**
 * @fileoverview Tests for the ModuleRegistry class
 */

import {
  ModuleRegistry,
  type ModuleRegistryOptions,
} from './module-registry';
import {
  BaseModule,
  ModuleStatus,
  ModuleLoadStrategy,
  type ModuleMetadata,
  type IModule,
} from './base-module';
import { ConfigService } from '@agent-desktop/config';
import { createLogger } from '@agent-desktop/logging';
import type { CustomerID, ModuleID, ModuleConfig } from '@agent-desktop/types';

// Test module implementations
class TestModule extends BaseModule {
  constructor(metadata: ModuleMetadata) {
    super(metadata);
  }

  public setStatusPublic(status: ModuleStatus): void {
    this.setStatus(status);
  }
}

class FailingModule extends BaseModule {
  constructor(metadata: ModuleMetadata) {
    super(metadata);
  }

  async onInitialize(): Promise<any> {
    return {
      success: false,
      error: new Error('Initialization failed'),
    };
  }
}

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;
  let mockLogger: any;
  let mockConfigService: jest.Mocked<ConfigService>;
  let options: ModuleRegistryOptions;
  let testModule: TestModule;
  let dependentModule: TestModule;

  beforeEach(() => {
    mockLogger = global.TestUtils?.createMockLogger() || {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    };

    mockConfigService = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
      clear: jest.fn(),
      watch: jest.fn().mockReturnValue(() => {}),
      validate: jest.fn(),
      loadCustomerConfig: jest.fn(),
      saveCustomerConfig: jest.fn(),
      getEnvironmentConfig: jest.fn(),
    } as any;

    options = {
      logger: mockLogger,
      configService: mockConfigService,
      customerId: 'test-customer' as CustomerID,
      enableHotReload: false,
      maxConcurrentLoads: 3,
      dependencyTimeoutMs: 5000,
      healthCheckIntervalMs: 10000,
    };

    testModule = new TestModule({
      id: 'test-module' as ModuleID,
      name: 'Test Module',
      version: '1.0.0',
      description: 'A test module',
      author: 'Test Author',
      dependencies: [],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.EAGER,
      position: 'main',
      priority: 1,
      tags: ['test'],
    });

    dependentModule = new TestModule({
      id: 'dependent-module' as ModuleID,
      name: 'Dependent Module',
      version: '1.0.0',
      description: 'A module that depends on test-module',
      author: 'Test Author',
      dependencies: [
        {
          moduleId: 'test-module' as ModuleID,
          optional: false,
        },
      ],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.EAGER,
      position: 'main',
      priority: 2,
      tags: ['test'],
    });

    registry = new ModuleRegistry(options);
  });

  afterEach(async () => {
    await registry.destroy();
  });

  describe('module registration', () => {
    it('should register a module successfully', async () => {
      const result = await registry.register(testModule);
      
      expect(result.success).toBe(true);
      expect(registry.getModule('test-module' as ModuleID)).toBe(testModule);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module registered',
        expect.objectContaining({
          moduleId: 'test-module',
          version: '1.0.0',
          dependencies: 0,
        })
      );
    });

    it('should prevent duplicate module registration', async () => {
      await registry.register(testModule);
      const result = await registry.register(testModule);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already registered');
    });

    it('should validate dependencies during registration', async () => {
      // Try to register dependent module without its dependency
      const result = await registry.register(dependentModule);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Required dependency test-module is not registered');
    });

    it('should register modules with dependencies in correct order', async () => {
      // Register dependency first
      await registry.register(testModule);
      
      // Then register dependent module
      const result = await registry.register(dependentModule);
      
      expect(result.success).toBe(true);
      expect(registry.getModule('dependent-module' as ModuleID)).toBe(dependentModule);
    });
  });

  describe('module unregistration', () => {
    beforeEach(async () => {
      await registry.register(testModule);
      await registry.register(dependentModule);
    });

    it('should unregister a module without dependents', async () => {
      const result = await registry.unregister('dependent-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(registry.getModule('dependent-module' as ModuleID)).toBeUndefined();
    });

    it('should prevent unregistering module with dependents', async () => {
      const result = await registry.unregister('test-module' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('still has dependents');
    });

    it('should handle unregistering non-existent module', async () => {
      const result = await registry.unregister('non-existent' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('is not registered');
    });
  });

  describe('module loading', () => {
    beforeEach(async () => {
      await registry.register(testModule);
      
      // Mock configuration
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'modules.test-module') {
          return {
            module_id: 'test-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 1,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: [],
          } as ModuleConfig;
        }
        return undefined;
      });
    });

    it('should load a module successfully', async () => {
      const result = await registry.loadModule('test-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(testModule.status).toBe(ModuleStatus.RUNNING);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module loaded successfully',
        expect.objectContaining({
          moduleId: 'test-module',
        })
      );
    });

    it('should skip loading disabled modules', async () => {
      mockConfigService.get.mockReturnValue({
        module_id: 'test-module' as ModuleID,
        enabled: false,
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      } as ModuleConfig);

      const result = await registry.loadModule('test-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(testModule.status).toBe(ModuleStatus.UNLOADED);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module is disabled, skipping load',
        { moduleId: 'test-module' }
      );
    });

    it('should handle loading non-existent module', async () => {
      const result = await registry.loadModule('non-existent' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('is not registered');
    });

    it('should handle missing configuration', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      
      const result = await registry.loadModule('test-module' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('No configuration found');
    });

    it('should load dependencies before loading module', async () => {
      await registry.register(dependentModule);
      
      mockConfigService.get.mockImplementation((key: string) => {
        const configs = {
          'modules.test-module': {
            module_id: 'test-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 1,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: [],
          },
          'modules.dependent-module': {
            module_id: 'dependent-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 2,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: ['test-module'],
          },
        };
        return configs[key as keyof typeof configs];
      });

      const result = await registry.loadModule('dependent-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(testModule.status).toBe(ModuleStatus.RUNNING);
      expect(dependentModule.status).toBe(ModuleStatus.RUNNING);
    });

    it('should handle initialization failures', async () => {
      const failingModule = new FailingModule({
        id: 'failing-module' as ModuleID,
        name: 'Failing Module',
        version: '1.0.0',
        description: 'A module that fails to initialize',
        author: 'Test Author',
        dependencies: [],
        permissions: [],
        loadStrategy: ModuleLoadStrategy.EAGER,
        position: 'main',
        priority: 1,
        tags: ['test'],
      });

      await registry.register(failingModule);
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'modules.failing-module') {
          return {
            module_id: 'failing-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 1,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: [],
          } as ModuleConfig;
        }
        return undefined;
      });

      const result = await registry.loadModule('failing-module' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Initialization failed');
    });
  });

  describe('module unloading', () => {
    beforeEach(async () => {
      await registry.register(testModule);
      await registry.register(dependentModule);
      
      mockConfigService.get.mockImplementation((key: string) => {
        const configs = {
          'modules.test-module': {
            module_id: 'test-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 1,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: [],
          },
          'modules.dependent-module': {
            module_id: 'dependent-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 2,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: ['test-module'],
          },
        };
        return configs[key as keyof typeof configs];
      });

      await registry.loadModule('test-module' as ModuleID);
      await registry.loadModule('dependent-module' as ModuleID);
    });

    it('should unload a module successfully', async () => {
      const result = await registry.unloadModule('dependent-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(dependentModule.status).toBe(ModuleStatus.UNLOADED);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module unloaded',
        { moduleId: 'dependent-module' }
      );
    });

    it('should unload dependents before unloading module', async () => {
      const result = await registry.unloadModule('test-module' as ModuleID);
      
      expect(result.success).toBe(true);
      expect(dependentModule.status).toBe(ModuleStatus.UNLOADED);
      expect(testModule.status).toBe(ModuleStatus.UNLOADED);
    });

    it('should handle unloading non-existent module', async () => {
      const result = await registry.unloadModule('non-existent' as ModuleID);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('is not registered');
    });

    it('should skip unloading already unloaded module', async () => {
      testModule.setStatusPublic(ModuleStatus.UNLOADED);
      
      const result = await registry.unloadModule('test-module' as ModuleID);
      
      expect(result.success).toBe(true);
    });
  });

  describe('module queries', () => {
    beforeEach(async () => {
      await registry.register(testModule);
      await registry.register(dependentModule);
    });

    it('should get module by ID', () => {
      const module = registry.getModule('test-module' as ModuleID);
      expect(module).toBe(testModule);
    });

    it('should return undefined for non-existent module', () => {
      const module = registry.getModule('non-existent' as ModuleID);
      expect(module).toBeUndefined();
    });

    it('should get all modules', () => {
      const modules = registry.getAllModules();
      expect(modules).toHaveLength(2);
      expect(modules).toContain(testModule);
      expect(modules).toContain(dependentModule);
    });

    it('should get modules by status', () => {
      testModule.setStatusPublic(ModuleStatus.RUNNING);
      dependentModule.setStatusPublic(ModuleStatus.LOADED);
      
      const runningModules = registry.getModulesByStatus(ModuleStatus.RUNNING);
      const loadedModules = registry.getModulesByStatus(ModuleStatus.LOADED);
      
      expect(runningModules).toHaveLength(1);
      expect(runningModules[0]).toBe(testModule);
      expect(loadedModules).toHaveLength(1);
      expect(loadedModules[0]).toBe(dependentModule);
    });
  });

  describe('customer module loading', () => {
    it('should load customer modules based on configuration', async () => {
      await registry.register(testModule);
      
      const customerConfig = global.ConfigTestUtils?.createMockConfig() || {
        customer_id: 'test-customer' as CustomerID,
        name: 'Test Customer',
        version: '1.0.0',
        isActive: true,
        modules: [
          {
            module_id: 'test-module' as ModuleID,
            enabled: true,
            position: 'main',
            priority: 1,
            lazy: false,
            settings: {},
            permissions: ['read'],
            dependencies: [],
          },
        ],
        branding: {
          primary_color: '#000000',
          secondary_color: '#ffffff',
          font_family: 'Arial',
          theme: 'light' as const,
          application_title: 'Test App',
          company_name: 'Test Company',
        },
        features: {
          recording_controls: true,
          screen_sharing: false,
          file_uploads: true,
          chat_functionality: true,
          supervisor_monitoring: false,
          analytics_dashboard: true,
          custom_scripts: false,
          third_party_integrations: true,
          advanced_routing: false,
          real_time_reporting: true,
          voice_analytics: false,
          sentiment_analysis: false,
        },
        integrations: [],
        deployment: {
          domain: 'test.example.com',
          environment: 'development' as const,
          region: 'us-east-1',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockConfigService.loadCustomerConfig.mockResolvedValue({
        success: true,
        data: customerConfig,
      });

      mockConfigService.get.mockReturnValue({
        module_id: 'test-module' as ModuleID,
        enabled: true,
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      } as ModuleConfig);

      const result = await registry.loadCustomerModules();
      
      expect(result.success).toBe(true);
      expect(mockConfigService.loadCustomerConfig).toHaveBeenCalledWith('test-customer');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Customer modules loaded',
        expect.objectContaining({
          customerId: 'test-customer',
          totalModules: 1,
        })
      );
    });

    it('should handle customer config loading failure', async () => {
      mockConfigService.loadCustomerConfig.mockResolvedValue({
        success: false,
        error: new Error('Config load failed'),
      });

      const result = await registry.loadCustomerModules();
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Config load failed');
    });
  });

  describe('service management', () => {
    it('should register and provide services to modules', () => {
      const testService = { name: 'Test Service' };
      
      registry.registerService('testService', testService);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Service registered',
        { name: 'testService' }
      );
    });

    it('should unregister services', () => {
      const testService = { name: 'Test Service' };
      registry.registerService('testService', testService);
      
      registry.unregisterService('testService');
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Service unregistered',
        { name: 'testService' }
      );
    });
  });

  describe('configuration change handling', () => {
    beforeEach(async () => {
      await registry.register(testModule);
    });

    it('should handle module enable/disable changes', async () => {
      const mockWatch = mockConfigService.watch.mock.calls[0][1];
      
      // Mock the module as loaded
      testModule.setStatusPublic(ModuleStatus.RUNNING);
      
      // Simulate disabling the module
      await mockWatch({
        key: 'modules.test-module.enabled',
        newValue: false,
        oldValue: true,
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module configuration changed',
        expect.objectContaining({
          moduleId: 'test-module',
          key: 'modules.test-module.enabled',
          oldValue: true,
          newValue: false,
        })
      );
    });
  });

  describe('cleanup and destruction', () => {
    beforeEach(async () => {
      await registry.register(testModule);
      await registry.register(dependentModule);
    });

    it('should destroy registry and cleanup resources', async () => {
      await registry.destroy();
      
      expect(registry.getAllModules()).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Module registry destroyed');
    });
  });
});

describe('ModuleEventBus', () => {
  let registry: ModuleRegistry;
  let mockLogger: any;
  let mockConfigService: jest.Mocked<ConfigService>;
  let testModule: TestModule;

  beforeEach(() => {
    mockLogger = global.TestUtils?.createMockLogger() || {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    };

    mockConfigService = {
      watch: jest.fn().mockReturnValue(() => {}),
    } as any;

    const options: ModuleRegistryOptions = {
      logger: mockLogger,
      configService: mockConfigService,
      customerId: 'test-customer' as CustomerID,
    };

    registry = new ModuleRegistry(options);
    
    testModule = new TestModule({
      id: 'test-module' as ModuleID,
      name: 'Test Module',
      version: '1.0.0',
      description: 'A test module',
      author: 'Test Author',
      dependencies: [],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.EAGER,
      position: 'main',
      priority: 1,
      tags: ['test'],
    });
  });

  afterEach(async () => {
    await registry.destroy();
  });

  it('should handle event bus functionality through context', async () => {
    await registry.register(testModule);
    
    mockConfigService.get = jest.fn().mockReturnValue({
      module_id: 'test-module' as ModuleID,
      enabled: true,
      position: 'main',
      priority: 1,
      lazy: false,
      settings: {},
      permissions: ['read'],
      dependencies: [],
    } as ModuleConfig);

    await registry.loadModule('test-module' as ModuleID);
    
    expect(testModule.context?.eventBus).toBeDefined();
    expect(typeof testModule.context?.eventBus.emit).toBe('function');
    expect(typeof testModule.context?.eventBus.subscribe).toBe('function');
  });
});