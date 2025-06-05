import fs from 'fs';
import os from 'os';
import path from 'path';
import { ModuleRegistryService } from './module-registry.service';
import type { ModuleID } from '@agent-desktop/types';

describe('ModuleRegistryService - ESM publishModule', () => {
  let tmpDir: string;
  let modulesRoot: string;
  let registryFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-'));
    modulesRoot = path.join(tmpDir, 'modules');
    registryFile = path.join(tmpDir, 'registry.json');
    fs.mkdirSync(modulesRoot, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('publishes module using dynamic import when require is unavailable', async () => {
    const moduleDir = path.join(tmpDir, 'good');
    fs.mkdirSync(moduleDir);
    fs.copyFileSync(
      path.resolve(__dirname, '../__tests__/modules/good-module.js'),
      path.join(moduleDir, 'index.js'),
    );
    const logger = global.TestUtils.createMockLogger();
    const service = new ModuleRegistryService(registryFile, modulesRoot, logger);

    const originalRequire = (global as any).require;
    (global as any).require = undefined;
    try {
      const record = await service.publishModule(moduleDir);
      expect(record.id).toBe('good-module');
      const meta = service.getModuleMetadata('good-module' as ModuleID);
      expect(meta?.filePath).toBeDefined();
      expect(fs.existsSync(meta!.filePath)).toBe(true);
    } finally {
      (global as any).require = originalRequire;
    }
  });
});
