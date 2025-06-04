import '@testing-library/jest-dom';

// Mock import.meta.env for Vite environment variables
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api',
      VITE_API_TIMEOUT: '30000',
      VITE_API_RETRY_ATTEMPTS: '3',
      VITE_API_RETRY_DELAY: '1000',
      VITE_WS_ENDPOINT: 'ws://localhost:3000/ws',
      VITE_API_VERSION: 'v1',
      VITE_ENABLE_DEVTOOLS: 'false',
      VITE_ENABLE_MOCKING: 'true',
      VITE_LOG_LEVEL: 'error',
      VITE_ENABLE_REALTIME: 'true',
      VITE_ENABLE_ANALYTICS: 'true',
      VITE_ENABLE_OPTIMISTIC_UPDATES: 'true',
      VITE_ENABLE_BULK_OPERATIONS: 'true',
      VITE_ENABLE_EXPORT_IMPORT: 'true',
      DEV: true,
      PROD: false,
    },
  },
});

// Mock global WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(_data: string): void {}
  close(_code?: number, _reason?: string): void {}
}

// Mock global fetch
global.fetch = jest.fn();

// Mock WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

// Increase timeout for async operations in tests
jest.setTimeout(10000);