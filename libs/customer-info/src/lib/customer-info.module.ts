import type { ModuleConfig, ModuleID } from '@agent-desktop/types';
import { BaseModule, ModuleLoadStrategy, type ModuleMetadata } from '@agent-desktop/core';
import { ContactInfo } from '@agent-desktop/ccp-client';
import type { ComponentType } from 'react';

export const DEFAULT_CUSTOMER_INFO_CONFIG: ModuleConfig = {
  module_id: 'customer-info' as ModuleID,
  enabled: true,
  position: 'main',
  priority: 1,
  lazy: false,
  settings: {},
  permissions: [],
  dependencies: [],
};

export class CustomerInfoModule extends BaseModule {
  constructor() {
    const metadata: ModuleMetadata = {
      id: DEFAULT_CUSTOMER_INFO_CONFIG.module_id,
      name: 'Customer Info',
      version: '1.0.0',
      description: 'Displays customer information for the active contact',
      author: 'Agent Desktop Team',
      dependencies: [],
      permissions: [],
      loadStrategy: ModuleLoadStrategy.EAGER,
      position: DEFAULT_CUSTOMER_INFO_CONFIG.position,
      priority: DEFAULT_CUSTOMER_INFO_CONFIG.priority,
      tags: ['ui'],
    };
    super(metadata);
  }

  /** Return React component used to render this module. */
  getComponent(): ComponentType<any> {
    return ContactInfo;
  }

  /** Provide the default configuration for this module. */
  getDefaultConfig(): ModuleConfig {
    return { ...DEFAULT_CUSTOMER_INFO_CONFIG };
  }
}

export default CustomerInfoModule;
