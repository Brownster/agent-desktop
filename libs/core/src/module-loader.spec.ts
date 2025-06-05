import { ModuleLoader } from './module-loader';
import type { ModuleID } from '@agent-desktop/types';

const goodModulePath = require.resolve('./__tests__/modules/good-module.js');
const invalidModulePath = require.resolve('./__tests__/modules/invalid-module.js');
const slowModulePath = require.resolve('./__tests__/modules/slow-module.js');

describe('ModuleLoader', () => {
  let loader: ModuleLoader;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = global.TestUtils.createMockLogger();
    loader = new ModuleLoader(mockLogger, { enableCache: true });
  });

  afterEach(() => {
    loader.clearCache();
  });

  it('loads a module successfully', async () => {
    const result = await loader.loadModule({
      moduleId: 'good-module' as ModuleID,
      modulePath: goodModulePath,
    });

    expect(result.success).toBe(true);
    expect(result.data?.fromCache).toBe(false);
    expect(result.data?.module.metadata.id).toBe('good-module');
  });

  it('caches loaded modules', async () => {
    await loader.loadModule({ moduleId: 'good-module' as ModuleID, modulePath: goodModulePath });
    const second = await loader.loadModule({ moduleId: 'good-module' as ModuleID, modulePath: goodModulePath });

    expect(second.success).toBe(true);
    expect(second.data?.fromCache).toBe(true);
    const stats = loader.getCacheStats();
    expect(stats.hits).toBe(1);
  });

  it('fails when module path cannot be resolved', async () => {
    jest.spyOn(loader as any, 'resolveModulePath').mockReturnValue(undefined);

    const result = await loader.loadModule({ moduleId: 'missing-module' as ModuleID });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Cannot resolve path');
  });

  it('fails validation for invalid module export', async () => {
    const result = await loader.loadModule({
      moduleId: 'invalid-module' as ModuleID,
      modulePath: invalidModulePath,
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/Module must have metadata/);
  });

  it('retries loading on failure', async () => {
    let attempt = 0;
    const spy = jest.spyOn(loader as any, 'loadModuleFromPath').mockImplementation(async (path: string) => {
      attempt++;
      if (attempt === 1) {
        throw new Error('load failed');
      }
      // Return the good module instance on second attempt
      const GoodModuleClass = require(goodModulePath);
      return new GoodModuleClass();
    });

    const result = await loader.loadModule({
      moduleId: 'good-module' as ModuleID,
      modulePath: goodModulePath,
      retries: 1,
    });

    expect(spy).toHaveBeenCalledTimes(2);
    if (!result.success) {
      console.log('Retry test failed with error:', result.error?.message);
    }
    expect(result.success).toBe(true);
  });

  it('handles load timeouts', async () => {
    const result = await loader.loadModule({
      moduleId: 'slow-module' as ModuleID,
      modulePath: slowModulePath,
      timeout: 10,
      retries: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/timed out/i);
  });
});
