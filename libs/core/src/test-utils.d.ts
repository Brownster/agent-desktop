/**
 * Global test utilities type declarations for the core library
 */

declare global {
  var TestUtils: {
    createMockLogger: () => {
      debug: jest.Mock;
      info: jest.Mock;
      warn: jest.Mock;
      error: jest.Mock;
      fatal: jest.Mock;
      createChild: jest.Mock;
      setContext: jest.Mock;
      time: jest.Mock;
    };
    createMockConfig: (overrides?: Record<string, unknown>) => any;
    createMockModuleContext: (overrides?: Record<string, unknown>) => any;
    waitFor: (ms?: number) => Promise<void>;
    flushPromises: () => Promise<void>;
  };

  // Provide access to configuration test utilities when available
  var ConfigTestUtils: any;
  var LoggingTestUtils: any;
}

export {};
