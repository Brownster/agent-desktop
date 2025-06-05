#!/usr/bin/env ts-node
import { createLogger } from '@agent-desktop/logging';
import { ModuleRegistryService } from '../libs/core/src/registry/module-registry.service';
import path from 'path';

const logger = createLogger('publisher');
const moduleDir = process.argv[2];
if (!moduleDir) {
  console.error('Usage: pnpm module:publish <moduleDir>');
  process.exit(1);
}

(async () => {
  const service = new ModuleRegistryService('module-registry.json', 'modules', logger);
  await service.publishModule(path.resolve(moduleDir));
})();
