import '@testing-library/jest-dom';

// Mock console.warn and console.error to reduce noise in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Setup global test utilities
global.TestUtils = {
  /**
   * Creates a mock logger for testing
   */
  createMockLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    createChild: jest.fn().mockReturnThis(),
    setContext: jest.fn(),
    time: jest.fn().mockImplementation(async (_, fn) => await fn()),
  }),

  /**
   * Creates a mock configuration service for testing
   */
  createMockConfig: (overrides = {}) => ({
    get: jest.fn().mockImplementation(key => overrides[key]),
    set: jest.fn(),
    has: jest.fn().mockReturnValue(true),
    getAll: jest.fn().mockReturnValue(overrides),
    validate: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    ...overrides,
  }),

  /**
   * Creates a mock module context for testing
   */
  createMockModuleContext: (overrides = {}) => ({
    logger: global.TestUtils.createMockLogger(),
    config: global.TestUtils.createMockConfig(),
    eventBus: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
    },
    dependencies: new Map(),
    ...overrides,
  }),

  /**
   * Waits for async operations to complete
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Flushes all pending promises
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
};

// Mock performance.now for consistent timing in tests
if (typeof performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
  };
}

// Mock process.memoryUsage for testing
if (typeof process !== 'undefined') {
  const originalMemoryUsage = process.memoryUsage;
  process.memoryUsage = jest.fn(() => ({
    rss: 1024 * 1024 * 100, // 100MB
    heapTotal: 1024 * 1024 * 50, // 50MB
    heapUsed: 1024 * 1024 * 25, // 25MB
    external: 1024 * 1024 * 5, // 5MB
    arrayBuffers: 1024 * 1024 * 2, // 2MB
  }));

  afterAll(() => {
    process.memoryUsage = originalMemoryUsage;
  });
}