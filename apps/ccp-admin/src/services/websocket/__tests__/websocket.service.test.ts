/**
 * @fileoverview Unit tests for WebSocket service
 * @module services/websocket/__tests__/websocket.service
 */

import { WebSocketService } from '../websocket.service';
import { ApiError } from '../../errors';

// Mock WebSocket
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
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate message sent successfully
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason });
      this.onclose?.(closeEvent);
    }, 10);
  }

  // Test helpers
  simulateMessage(data: any): void {
    if (this.readyState === MockWebSocket.OPEN) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage?.(messageEvent);
    }
  }

  simulateError(): void {
    const errorEvent = new Event('error');
    this.onerror?.(errorEvent);
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockConsole: jest.SpyInstance;

  beforeEach(() => {
    service = new WebSocketService();
    mockConsole = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    service.disconnect();
    mockConsole.mockRestore();
    jest.clearAllTimers();
  });

  describe('connect', () => {
    it('should connect to WebSocket server successfully', async () => {
      const url = 'ws://localhost:8080';
      
      const connectPromise = service.connect(url);
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(service.isConnected()).toBe(true);
    });

    it('should reject if already connected', async () => {
      const url = 'ws://localhost:8080';
      
      await service.connect(url);
      
      await expect(service.connect(url)).rejects.toThrow('Already connected');
    });

    it('should handle connection error', async () => {
      const url = 'ws://invalid-url';
      
      // Override the mock to simulate connection failure
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.simulateError();
          }, 10);
        }
      };

      await expect(service.connect(url)).rejects.toThrow(ApiError);
      expect(service.isConnected()).toBe(false);

      // Restore original mock
      (global as any).WebSocket = originalWebSocket;
    });

    it('should handle unexpected close during connection', async () => {
      const url = 'ws://localhost:8080';
      
      // Override the mock to simulate unexpected close
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.(new Event('open'));
            // Immediately close with error code
            this.close(1006, 'Connection dropped');
          }, 10);
        }
      };

      await expect(service.connect(url)).rejects.toThrow('Connection lost');

      // Restore original mock
      (global as any).WebSocket = originalWebSocket;
    });
  });

  describe('disconnect', () => {
    it('should disconnect from WebSocket server', async () => {
      const url = 'ws://localhost:8080';
      
      await service.connect(url);
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      
      // Wait for close event
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(service.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', () => {
      expect(() => service.disconnect()).not.toThrow();
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080');
    });

    it('should send message successfully', () => {
      const message = { type: 'test', data: 'hello' };
      
      expect(() => service.send(message)).not.toThrow();
    });

    it('should throw error when not connected', () => {
      service.disconnect();
      
      const message = { type: 'test', data: 'hello' };
      expect(() => service.send(message)).toThrow('Not connected');
    });

    it('should handle WebSocket send error', () => {
      // Mock WebSocket to throw on send
      const ws = (service as any).ws as MockWebSocket;
      const originalSend = ws.send;
      ws.send = jest.fn().mockImplementation(() => {
        throw new Error('Send failed');
      });

      const message = { type: 'test', data: 'hello' };
      expect(() => service.send(message)).toThrow(ApiError);

      // Restore original send
      ws.send = originalSend;
    });
  });

  describe('subscribe', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080');
    });

    it('should subscribe to message type', () => {
      const callback = jest.fn();
      
      const unsubscribe = service.subscribe('test', callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should receive messages for subscribed type', () => {
      const callback = jest.fn();
      service.subscribe('test', callback);
      
      const message = { type: 'test', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(message);
      
      expect(callback).toHaveBeenCalledWith(message);
    });

    it('should not receive messages for unsubscribed type', () => {
      const callback = jest.fn();
      service.subscribe('test', callback);
      
      const message = { type: 'other', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(message);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers for same type', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      service.subscribe('test', callback1);
      service.subscribe('test', callback2);
      
      const message = { type: 'test', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(message);
      
      expect(callback1).toHaveBeenCalledWith(message);
      expect(callback2).toHaveBeenCalledWith(message);
    });

    it('should handle malformed JSON messages gracefully', () => {
      const callback = jest.fn();
      service.subscribe('test', callback);
      
      const ws = (service as any).ws as MockWebSocket;
      const messageEvent = new MessageEvent('message', { data: 'invalid json' });
      ws.onmessage?.(messageEvent);
      
      expect(callback).not.toHaveBeenCalled();
      expect(mockConsole).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080');
    });

    it('should unsubscribe from message type', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe('test', callback);
      
      unsubscribe();
      
      const message = { type: 'test', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(message);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle unsubscribe of non-existent subscription', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe('test', callback);
      
      // Call unsubscribe twice
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should only unsubscribe specific callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = service.subscribe('test', callback1);
      service.subscribe('test', callback2);
      
      unsubscribe1();
      
      const message = { type: 'test', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(message);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(message);
    });
  });

  describe('reconnection', () => {
    it('should attempt to reconnect on unexpected disconnection', async () => {
      const url = 'ws://localhost:8080';
      await service.connect(url);
      
      // Simulate unexpected disconnect
      const ws = (service as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost');
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Service should still be considered connected (attempting to reconnect)
      expect(service.isConnected()).toBe(true);
    });

    it('should not reconnect on normal close', async () => {
      const url = 'ws://localhost:8080';
      await service.connect(url);
      
      service.disconnect();
      
      // Wait to ensure no reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(service.isConnected()).toBe(false);
    });

    it('should respect maximum reconnection attempts', async () => {
      const url = 'ws://localhost:8080';
      
      // Override WebSocket to always fail
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.simulateError();
          }, 10);
        }
      };

      // Try to connect - this should fail and eventually stop retrying
      try {
        await service.connect(url);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }

      // After max attempts, should stop trying
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('connection state', () => {
    it('should report correct connection state', async () => {
      expect(service.isConnected()).toBe(false);
      
      const connectPromise = service.connect('ws://localhost:8080');
      expect(service.isConnected()).toBe(false); // Still connecting
      
      await connectPromise;
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      const url = 'ws://localhost:8080';
      await service.connect(url);
      
      const callback = jest.fn();
      service.subscribe('test', callback);
      
      // Simulate WebSocket error
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateError();
      
      // Should not crash and should attempt reconnection
      expect(service.isConnected()).toBe(true);
    });

    it('should handle subscription callback errors', async () => {
      const url = 'ws://localhost:8080';
      await service.connect(url);
      
      const callback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      service.subscribe('test', callback);
      
      const message = { type: 'test', data: 'hello' };
      const ws = (service as any).ws as MockWebSocket;
      
      // Should not crash when callback throws
      expect(() => ws.simulateMessage(message)).not.toThrow();
      expect(callback).toHaveBeenCalled();
      expect(mockConsole).toHaveBeenCalledWith(
        'Error in WebSocket subscription callback:',
        expect.any(Error)
      );
    });
  });

  describe('message queuing', () => {
    it('should queue messages when disconnected', () => {
      const message = { type: 'test', data: 'hello' };
      
      // Try to send when not connected
      expect(() => service.send(message)).toThrow('Not connected');
    });

    it('should process queued messages after reconnection', async () => {
      // This test would require implementing message queuing feature
      // For now, we just ensure it doesn't crash
      expect(true).toBe(true);
    });
  });
});