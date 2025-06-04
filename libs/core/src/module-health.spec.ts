import { ModuleHealthChecker } from './module-health';
import type { ModuleID, ModuleConfig, Result } from '@agent-desktop/types';
import type { IModule, ModuleHealthStatus, ModuleContext } from './base-module';
import { ModuleStatus, ModuleLoadStrategy } from './base-module';

class TestModule implements IModule {
  metadata = {
    id: 'test-module' as ModuleID,
    name: 'Test',
    version: '1.0.0',
    description: 't',
    author: 'tester',
    dependencies: [],
    permissions: [],
    loadStrategy: ModuleLoadStrategy.EAGER,
    position: 'main',
    priority: 1,
    tags: [],
  };

  constructor(private health: () => Promise<ModuleHealthStatus>) {}

  context?: ModuleContext;
  status: ModuleStatus = ModuleStatus.RUNNING;

  onInitialize = async (
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });
  onStart = async (
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });
  onStop = async (
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });
  onDestroy = async (
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });
  onConfigChange = async (
    _newConfig: ModuleConfig,
    _oldConfig: ModuleConfig,
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });
  onDependencyChange = async (
    _dependencyId: ModuleID,
    _status: ModuleStatus,
    _context: ModuleContext
  ): Promise<Result<void, Error>> => ({ success: true, data: undefined });

  getHealth = () => this.health();
  getMetrics = async () => ({ });
  validateConfig = (_config: ModuleConfig) => ({ success: true, data: undefined } as Result<void, Error>);
}

describe('ModuleHealthChecker', () => {
  let checker: ModuleHealthChecker;
  let mockLogger: any;

  beforeEach(() => {
    jest.useFakeTimers();
    mockLogger = global.TestUtils.createMockLogger();
    checker = new ModuleHealthChecker(mockLogger);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await checker.destroy();
  });

  it('monitors module health and updates status', async () => {
    const mod = new TestModule(async () => ({ status: 'healthy', timestamp: new Date() }));
    await checker.startMonitoring(mod, { moduleId: mod.metadata.id, interval: 50, timeout: 20, retries: 1, enabled: true });

    expect(checker.getModuleHealth(mod.metadata.id)?.status).toBe('healthy');

    const unhealthy = { status: 'unhealthy', message: 'fail', timestamp: new Date() };
    mod.getHealth = jest.fn().mockResolvedValue(unhealthy);

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    expect(checker.getModuleHealth(mod.metadata.id)).toEqual(unhealthy);
  });

  it('retries failed checks and marks module unhealthy', async () => {
    const mod = new TestModule(() => Promise.reject(new Error('fail')));
    await checker.startMonitoring(mod, { moduleId: mod.metadata.id, interval: 10, timeout: 5, retries: 2, enabled: true });

    jest.advanceTimersByTime(10);
    await Promise.resolve();
    expect(checker.getModuleHealth(mod.metadata.id)?.status).toBe('unhealthy');

    jest.advanceTimersByTime(10);
    await Promise.resolve();
    expect(checker.getModuleHealth(mod.metadata.id)?.status).toBe('unhealthy');
  });

  it('handles health check timeouts', async () => {
    const mod = new TestModule(() => new Promise(resolve => setTimeout(() => resolve({ status: 'healthy', timestamp: new Date() }), 100)));
    await checker.startMonitoring(mod, { moduleId: mod.metadata.id, interval: 20, timeout: 5, retries: 0, enabled: true });

    jest.advanceTimersByTime(20);
    await Promise.resolve();

    const status = checker.getModuleHealth(mod.metadata.id);
    expect(status?.status).toBe('unhealthy');
    expect(status?.message).toMatch(/timeout/i);
  });
});
