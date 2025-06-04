import { ModuleLoader } from '../../../core/src/module-loader';
import { ModuleRegistry } from '../../../core/src/module-registry';
import { CustomerInfoModule, DEFAULT_CUSTOMER_INFO_CONFIG } from './customer-info.module';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  createChild: jest.fn().mockReturnThis(),
};

describe('CustomerInfoModule', () => {
  it('loads via ModuleLoader with path mapping', async () => {
    const modulePath = require.resolve('./customer-info.module');
    const loader = new ModuleLoader(mockLogger as any, {
      modulePaths: { 'customer-info': modulePath },
    });

    const result = await loader.loadModule({ moduleId: 'customer-info' as any });
    expect(result.success).toBe(true);
    expect(result.data?.module.metadata.id).toBe('customer-info');
  });

  it('registers and loads through ModuleRegistry', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'modules.customer-info') {
          return DEFAULT_CUSTOMER_INFO_CONFIG;
        }
        return undefined;
      }),
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

    const registry = new ModuleRegistry({
      logger: mockLogger as any,
      configService,
      customerId: 'test' as any,
    });

    const module = new CustomerInfoModule();
    const regResult = await registry.register(module as any);
    expect(regResult.success).toBe(true);

    const loadResult = await registry.loadModule('customer-info' as any);
    expect(loadResult.success).toBe(true);
  });
});
