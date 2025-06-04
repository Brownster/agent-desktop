/**
 * @fileoverview Tests for the BaseModule class and module interfaces
 */

import {
  BaseModule,
  ModuleStatus,
  ModuleLoadStrategy,
  type ModuleMetadata,
  type ModuleContext,
  type IModuleRegistry,
  type IModuleEventBus,
} from './base-module';
import { createLogger } from '@agent-desktop/logging';
import type { ModuleConfig, ModuleID } from '@agent-desktop/types';

// Test module implementation
class TestModule extends BaseModule {
  constructor(metadata?: Partial<ModuleMetadata>) {
    const defaultMetadata: ModuleMetadata = {
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
      ...metadata,
    };
    super(defaultMetadata);
  }

  // Override for testing
  public setStatusPublic(status: ModuleStatus): void {
    this.setStatus(status);
  }

  public setMetricPublic(key: string, value: unknown): void {
    this.setMetric(key, value);
  }

  public incrementMetricPublic(key: string, increment?: number): void {
    this.incrementMetric(key, increment);
  }

  public logPublic(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.log(level, message, data);
  }
}

describe('BaseModule', () => {
  let module: TestModule;
  let mockLogger: any;
  let mockRegistry: IModuleRegistry;
  let mockEventBus: IModuleEventBus;
  let mockContext: ModuleContext;

  beforeEach(() => {
    mockLogger = global.TestUtils?.createMockLogger() || {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    };

    mockRegistry = {
      register: jest.fn(),
      unregister: jest.fn(),
      loadModule: jest.fn(),
      unloadModule: jest.fn(),
      getModule: jest.fn(),
      getAllModules: jest.fn(),
      getModulesByStatus: jest.fn(),
    };

    mockEventBus = {
      emit: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {}),
    };

    mockContext = {
      logger: mockLogger,
      config: {
        module_id: 'test-module' as ModuleID,
        enabled: true,
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      },
      moduleId: 'test-module' as ModuleID,
      registry: mockRegistry,
      services: {},
      eventBus: mockEventBus,
    };

    module = new TestModule();
  });

  describe('constructor and basic properties', () => {
    it('should initialize with correct metadata', () => {
      expect(module.metadata.id).toBe('test-module');
      expect(module.metadata.name).toBe('Test Module');
      expect(module.metadata.version).toBe('1.0.0');
      expect(module.status).toBe(ModuleStatus.UNLOADED);
      expect(module.context).toBeUndefined();
    });

    it('should allow custom metadata', () => {
      const customModule = new TestModule({
        id: 'custom-module' as ModuleID,
        name: 'Custom Module',
        version: '2.0.0',
      });

      expect(customModule.metadata.id).toBe('custom-module');
      expect(customModule.metadata.name).toBe('Custom Module');
      expect(customModule.metadata.version).toBe('2.0.0');
    });
  });

  describe('status management', () => {
    it('should track status changes', () => {
      expect(module.status).toBe(ModuleStatus.UNLOADED);

      module.setStatusPublic(ModuleStatus.LOADING);
      expect(module.status).toBe(ModuleStatus.LOADING);

      module.setStatusPublic(ModuleStatus.RUNNING);
      expect(module.status).toBe(ModuleStatus.RUNNING);
    });

    it('should log status changes when context is available', () => {
      module.setContext(mockContext);
      module.setStatusPublic(ModuleStatus.RUNNING);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Module status changed',
        expect.objectContaining({
          moduleId: 'test-module',
          oldStatus: ModuleStatus.UNLOADED,
          newStatus: ModuleStatus.RUNNING,
        })
      );
    });
  });

  describe('context management', () => {
    it('should set and get context', () => {
      expect(module.context).toBeUndefined();

      module.setContext(mockContext);
      expect(module.context).toBe(mockContext);
    });
  });

  describe('metrics management', () => {
    it('should set and track custom metrics', async () => {
      module.setMetricPublic('test-metric', 'test-value');
      module.setMetricPublic('count', 42);

      const metrics = await module.getMetrics();
      expect(metrics['test-metric']).toBe('test-value');
      expect(metrics.count).toBe(42);
    });

    it('should increment numeric metrics', async () => {
      module.incrementMetricPublic('counter');
      module.incrementMetricPublic('counter');
      module.incrementMetricPublic('counter', 5);

      const metrics = await module.getMetrics();
      expect(metrics.counter).toBe(7);
    });

    it('should include base metrics', async () => {
      const metrics = await module.getMetrics();
      
      expect(metrics).toHaveProperty('status');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('dependencyCount');
      expect(metrics).toHaveProperty('permissionCount');
    });
  });

  describe('health monitoring', () => {
    it('should return healthy status when running', async () => {
      module.setStatusPublic(ModuleStatus.RUNNING);
      const health = await module.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Module is running');
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should return degraded status when loading', async () => {
      module.setStatusPublic(ModuleStatus.LOADING);
      const health = await module.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.message).toBe('Module is loading');
    });

    it('should return unhealthy status when in error state', async () => {
      module.setStatusPublic(ModuleStatus.ERROR);
      const health = await module.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Module is error');
    });

    it('should include health details', async () => {
      module.setContext(mockContext);
      const health = await module.getHealth();

      expect(health.details).toEqual({
        status: module.status,
        hasContext: true,
        dependencies: 0,
      });
    });
  });

  describe('configuration validation', () => {
    it('should validate correct module configuration', () => {
      const config: ModuleConfig = {
        module_id: 'test-module' as ModuleID,
        enabled: true,
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      };

      const result = module.validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject configuration with wrong module ID', () => {
      const config: ModuleConfig = {
        module_id: 'wrong-module' as ModuleID,
        enabled: true,
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      };

      const result = module.validateConfig(config);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid module_id');
    });

    it('should reject configuration with invalid enabled flag', () => {
      const config = {
        module_id: 'test-module' as ModuleID,
        enabled: 'yes', // Invalid type
        position: 'main',
        priority: 1,
        lazy: false,
        settings: {},
        permissions: ['read'],
        dependencies: [],
      } as any;

      const result = module.validateConfig(config);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('enabled flag must be a boolean');
    });
  });

  describe('logging', () => {
    it('should not log without context', () => {
      module.logPublic('info', 'Test message');
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should log with context', () => {
      module.setContext(mockContext);
      module.logPublic('info', 'Test message', { data: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          moduleId: 'test-module',
          data: 'test',
        })
      );
    });

    it('should support all log levels', () => {
      module.setContext(mockContext);

      module.logPublic('debug', 'Debug message');
      module.logPublic('info', 'Info message');
      module.logPublic('warn', 'Warn message');
      module.logPublic('error', 'Error message');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Debug message',
        expect.objectContaining({ moduleId: 'test-module' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Info message',
        expect.objectContaining({ moduleId: 'test-module' })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Warn message',
        expect.objectContaining({ moduleId: 'test-module' })
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error message',
        expect.objectContaining({ moduleId: 'test-module' })
      );
    });
  });

  describe('lifecycle hooks', () => {
    beforeEach(() => {
      jest.spyOn(module, 'setStatusPublic');
    });

    describe('onInitialize', () => {
      it('should initialize successfully', async () => {
        const result = await module.onInitialize!(mockContext);

        expect(result.success).toBe(true);
        expect(module.context).toBe(mockContext);
        expect(mockLogger.info).toHaveBeenCalledWith('Module initialized successfully');
      });

      it('should set status correctly during initialization', async () => {
        await module.onInitialize!(mockContext);

        // Should call setStatus twice: INITIALIZING and LOADED
        expect(module.setStatusPublic).toHaveBeenCalledWith(ModuleStatus.INITIALIZING);
        expect(module.setStatusPublic).toHaveBeenCalledWith(ModuleStatus.LOADED);
      });

      it('should set start time metric', async () => {
        await module.onInitialize!(mockContext);
        const metrics = await module.getMetrics();
        
        expect(metrics.startTime).toBeDefined();
        expect(typeof metrics.startTime).toBe('number');
      });
    });

    describe('onStart', () => {
      it('should start successfully', async () => {
        const result = await module.onStart!(mockContext);

        expect(result.success).toBe(true);
        expect(module.setStatusPublic).toHaveBeenCalledWith(ModuleStatus.RUNNING);
        expect(mockLogger.info).toHaveBeenCalledWith('Module starting');
      });

      it('should increment start count metric', async () => {
        await module.onStart!(mockContext);
        await module.onStart!(mockContext);
        
        const metrics = await module.getMetrics();
        expect(metrics.startCount).toBe(2);
      });
    });

    describe('onStop', () => {
      it('should stop successfully', async () => {
        const result = await module.onStop!(mockContext);

        expect(result.success).toBe(true);
        expect(module.setStatusPublic).toHaveBeenCalledWith(ModuleStatus.STOPPED);
        expect(mockLogger.info).toHaveBeenCalledWith('Module stopping');
      });

      it('should increment stop count metric', async () => {
        await module.onStop!(mockContext);
        
        const metrics = await module.getMetrics();
        expect(metrics.stopCount).toBe(1);
      });
    });

    describe('onDestroy', () => {
      it('should destroy successfully', async () => {
        module.setContext(mockContext);
        module.setMetricPublic('test', 'value');
        
        const result = await module.onDestroy!(mockContext);

        expect(result.success).toBe(true);
        expect(module.setStatusPublic).toHaveBeenCalledWith(ModuleStatus.UNLOADED);
        expect(module.context).toBeUndefined();
        expect(mockLogger.info).toHaveBeenCalledWith('Module being destroyed');
      });

      it('should clear metrics on destroy', async () => {
        module.setMetricPublic('test', 'value');
        await module.onDestroy!(mockContext);
        
        const metrics = await module.getMetrics();
        expect(metrics.test).toBeUndefined();
      });
    });
  });

  describe('error handling in lifecycle hooks', () => {
    class ErrorModule extends BaseModule {
      constructor() {
        super({
          id: 'error-module' as ModuleID,
          name: 'Error Module',
          version: '1.0.0',
          description: 'Module that throws errors',
          author: 'Test',
          dependencies: [],
          permissions: [],
          loadStrategy: ModuleLoadStrategy.EAGER,
          position: 'main',
          priority: 1,
          tags: [],
        });
      }

      async onInitialize(): Promise<any> {
        throw new Error('Initialization failed');
      }

      async onStart(): Promise<any> {
        throw new Error('Start failed');
      }

      async onStop(): Promise<any> {
        throw new Error('Stop failed');
      }

      async onDestroy(): Promise<any> {
        throw new Error('Destroy failed');
      }
    }

    let errorModule: ErrorModule;

    beforeEach(() => {
      errorModule = new ErrorModule();
      jest.spyOn(errorModule, 'setStatus' as any);
    });

    it('should handle initialization errors', async () => {
      const result = await errorModule.onInitialize!(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Initialization failed');
      expect((errorModule as any).setStatus).toHaveBeenCalledWith(ModuleStatus.ERROR);
    });

    it('should handle start errors', async () => {
      const result = await errorModule.onStart!(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Start failed');
      expect((errorModule as any).setStatus).toHaveBeenCalledWith(ModuleStatus.ERROR);
    });

    it('should handle stop errors', async () => {
      const result = await errorModule.onStop!(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Stop failed');
      expect((errorModule as any).setStatus).toHaveBeenCalledWith(ModuleStatus.ERROR);
    });

    it('should handle destroy errors', async () => {
      const result = await errorModule.onDestroy!(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Destroy failed');
      expect((errorModule as any).setStatus).toHaveBeenCalledWith(ModuleStatus.ERROR);
    });
  });
});

describe('ModuleStatus enum', () => {
  it('should have all expected status values', () => {
    expect(ModuleStatus.UNLOADED).toBe('unloaded');
    expect(ModuleStatus.LOADING).toBe('loading');
    expect(ModuleStatus.LOADED).toBe('loaded');
    expect(ModuleStatus.INITIALIZING).toBe('initializing');
    expect(ModuleStatus.RUNNING).toBe('running');
    expect(ModuleStatus.ERROR).toBe('error');
    expect(ModuleStatus.STOPPED).toBe('stopped');
    expect(ModuleStatus.UNLOADING).toBe('unloading');
  });
});

describe('ModuleLoadStrategy enum', () => {
  it('should have all expected strategy values', () => {
    expect(ModuleLoadStrategy.EAGER).toBe('eager');
    expect(ModuleLoadStrategy.LAZY).toBe('lazy');
    expect(ModuleLoadStrategy.ON_DEMAND).toBe('on_demand');
  });
});