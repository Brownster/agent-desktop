import { BaseModule, ModuleLoadStrategy } from '../src';
import type { ModuleConfig, ModuleID } from '@agent-desktop/types';

export const DEFAULT_TEMPLATE_CONFIG: ModuleConfig = {
  module_id: 'example-module' as ModuleID,
  enabled: true,
  position: 'main',
  priority: 1,
  lazy: false,
  settings: {},
  permissions: [],
  dependencies: [],
};

export class ExampleModule extends BaseModule {
  constructor() {
    super({
      id: DEFAULT_TEMPLATE_CONFIG.module_id,
      name: 'Example Module',
      version: '1.0.0',
      description: 'Starter template for new modules',
      author: 'Your Name',
      dependencies: [],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.LAZY,
      position: DEFAULT_TEMPLATE_CONFIG.position,
      priority: DEFAULT_TEMPLATE_CONFIG.priority,
      tags: ['template'],
    });
  }

  getDefaultConfig(): ModuleConfig {
    return { ...DEFAULT_TEMPLATE_CONFIG };
  }
}

export default ExampleModule;
