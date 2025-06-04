/**
 * @fileoverview Test setup for logging library
 */

import { jest, beforeEach } from '@jest/globals';

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
   * Create a mock logger for testing
   */
  createMockLogger: (name = 'test-logger') => ({
    name,
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    createChild: jest.fn().mockReturnThis(),
    addTransport: jest.fn(),
    removeTransport: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  
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
   * Capture log output for testing
   */
  captureLogOutput: () => {
    const logs: any[] = [];
    const originalConsole = { ...console };
    
    ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
      (console as any)[method] = jest.fn((...args: any[]) => {
        logs.push({ level: method, args });
      });
    });
    
    return {
      logs,
      stop: () => {
        Object.assign(console, originalConsole);
      },
    };
  },
  
  /**
   * Wait for async operations to complete
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Flush all pending promises
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  /**
   * Mock console transport
   */
  mockConsoleTransport: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    reset: () => {
      jest.clearAllMocks();
    },
  },
  
  /**
   * Mock file transport
   */
  mockFileTransport: {
    write: jest.fn(),
    rotate: jest.fn(),
    reset: () => {
      jest.clearAllMocks();
    },
  },
};