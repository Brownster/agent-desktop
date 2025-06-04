/**
 * Global test utilities type declarations
 */

declare global {
  var ConfigTestUtils: {
    createMockConfig: (overrides?: Partial<any>) => any;
    createMockCustomerConfig: (overrides?: Partial<any>) => any;
    createMockModuleConfig: (overrides?: Partial<any>) => any;
    createMockBrandingConfig: (overrides?: Partial<any>) => any;
    createMockFeatureFlags: (overrides?: Partial<any>) => any;
    createValidationResult: (valid?: boolean, errors?: any[], warnings?: any[]) => any;
    createValidationError: (field?: string, message?: string) => any;
    createValidationWarning: (field?: string, message?: string) => any;
    createEnvironmentConfig: (env?: string) => any;
    waitFor: (ms?: number) => Promise<void>;
    flushPromises: () => Promise<void>;
    mockConfigService: {
      getCustomerConfig: jest.MockedFunction<any>;
      updateCustomerConfig: jest.MockedFunction<any>;
      validateConfig: jest.MockedFunction<any>;
      reset: () => void;
    };
  };
}

export {};