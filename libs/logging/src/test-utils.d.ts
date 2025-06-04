/**
 * Global logging test utilities type declarations
 */

declare global {
  var LoggingTestUtils: {
    createMockLogger: (name?: string) => any;
    createMockTransport: (type?: string) => any;
    captureLogOutput: () => { logs: any[]; stop: () => void };
    mockPerformanceNow: jest.MockedFunction<any>;
    mockMemoryUsage: jest.MockedFunction<any>;
    waitFor: (ms?: number) => Promise<void>;
    flushPromises: () => Promise<void>;
    mockConsoleTransport: {
      log: jest.MockedFunction<any>;
      error: jest.MockedFunction<any>;
      warn: jest.MockedFunction<any>;
      info: jest.MockedFunction<any>;
      debug: jest.MockedFunction<any>;
      reset: () => void;
    };
    mockFileTransport: {
      write: jest.MockedFunction<any>;
      rotate: jest.MockedFunction<any>;
      reset: () => void;
    };
  };
}

export {};