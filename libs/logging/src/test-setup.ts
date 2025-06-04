/**
 * @fileoverview Test setup for logging library
 */

// Mock performance.now for consistent timing in tests
const mockPerformanceNow = jest.fn(() => Date.now());
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: mockPerformanceNow,
  },
});

// Mock process.memoryUsage for testing
const mockMemoryUsage = jest.fn(() => ({
  rss: 1024 * 1024 * 100, // 100MB
  heapTotal: 1024 * 1024 * 50, // 50MB
  heapUsed: 1024 * 1024 * 25, // 25MB
  external: 1024 * 1024 * 5, // 5MB
  arrayBuffers: 1024 * 1024 * 2, // 2MB
}));

Object.defineProperty(process, 'memoryUsage', {
  writable: true,
  value: mockMemoryUsage,
});

// Reset mocks before each test
beforeEach(() => {
  mockPerformanceNow.mockClear();
  mockMemoryUsage.mockClear();
  
  // Reset to default implementation
  mockPerformanceNow.mockImplementation(() => Date.now());
  mockMemoryUsage.mockImplementation(() => ({
    rss: 1024 * 1024 * 100,
    heapTotal: 1024 * 1024 * 50,
    heapUsed: 1024 * 1024 * 25,
    external: 1024 * 1024 * 5,
    arrayBuffers: 1024 * 1024 * 2,
  }));
});

// Global test utilities for logging
global.LoggingTestUtils = {
  mockPerformanceNow,
  mockMemoryUsage,
  
  /**
   * Create a mock transport for testing
   */
  createMockTransport: (name = 'mock-transport') => ({
    name,
    type: 'mock' as const,
    write: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  
  /**
   * Wait for async operations to complete
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Flush all pending promises
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
};