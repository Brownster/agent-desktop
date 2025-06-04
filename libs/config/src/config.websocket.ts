/**
 * @fileoverview WebSocket service for real-time configuration updates
 * @module @agent-desktop/config
 */

import type { Logger } from '@agent-desktop/logging';
import type { ConfigChangeEvent } from './config.service';

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  CONFIG_CHANGED = 'config_changed',
  CONFIG_SUBSCRIBED = 'config_subscribed',
  CONFIG_UNSUBSCRIBED = 'config_unsubscribed',
  CONFIG_ERROR = 'config_error',
  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat_ack',
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  readonly type: WebSocketMessageType;
  readonly payload?: unknown;
  readonly timestamp: string;
  readonly id: string;
}

/**
 * Configuration change message payload
 */
export interface ConfigChangeMessage {
  readonly customerId: string;
  readonly change: ConfigChangeEvent;
}

/**
 * Subscription message payload
 */
export interface SubscriptionMessage {
  readonly customerId: string;
  readonly pattern?: string;
}

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  readonly url: string;
  readonly reconnectInterval: number;
  readonly maxReconnectAttempts: number;
  readonly heartbeatInterval: number;
  readonly connectionTimeout: number;
  readonly enableCompression: boolean;
  readonly maxQueueSize: number;
}

/**
 * Default WebSocket options
 */
const DEFAULT_WEBSOCKET_OPTIONS: WebSocketOptions = {
  url: process.env.WS_ENDPOINT || 'wss://config-ws.example.com',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  enableCompression: true,
  maxQueueSize: 100,
};

/**
 * WebSocket configuration service for real-time updates
 */
export class ConfigWebSocketService {
  private ws?: WebSocket;
  private readonly options: WebSocketOptions;
  private readonly logger: Logger;
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private readonly subscriptions = new Map<string, Set<(event: ConfigChangeEvent) => void>>();
  private readonly messageQueue: WebSocketMessage[] = [];
  private readonly maxQueueSize: number;
  private isConnected = false;

  constructor(options: Partial<WebSocketOptions> = {}, logger?: Logger) {
    const mergedOptions = { ...DEFAULT_WEBSOCKET_OPTIONS, ...options };
    if (!Number.isInteger(mergedOptions.maxQueueSize) || mergedOptions.maxQueueSize <= 0) {
      logger?.warn?.('Invalid maxQueueSize provided, using default value', {
        maxQueueSize: mergedOptions.maxQueueSize,
      });
      console.warn('[ConfigWebSocketService] Invalid maxQueueSize provided, using default value', {
        maxQueueSize: mergedOptions.maxQueueSize,
      });
      mergedOptions.maxQueueSize = DEFAULT_WEBSOCKET_OPTIONS.maxQueueSize;
    }

    this.options = mergedOptions;
    this.maxQueueSize = this.options.maxQueueSize;

    if (logger) {
      this.logger = logger.createChild('ConfigWebSocketService');
    } else {
      // Fallback logger
      this.logger = {
        debug: (message, context) => console.debug(`[ConfigWebSocketService] ${message}`, context || ''),
        info: (message, context) => console.info(`[ConfigWebSocketService] ${message}`, context || ''),
        warn: (message, context) => console.warn(`[ConfigWebSocketService] ${message}`, context || ''),
        error: (message, context) => console.error(`[ConfigWebSocketService] ${message}`, context || ''),
        createChild: () => this.logger, // Simplistic child creation
      } as Logger;
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    this.logger.info('Connecting to WebSocket server', {
      url: this.options.url,
    });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.url);

        const connectionTimeout = setTimeout(() => {
          this.logger.error('WebSocket connection timeout');
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }, this.options.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          this.logger.info('WebSocket connected successfully');
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Flush message queue
          this.flushMessageQueue();
          
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          this.stopHeartbeat();
          
          this.logger.warn('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          // Attempt reconnection
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          this.logger.error('WebSocket error', { error });
          clearTimeout(connectionTimeout);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        this.logger.error('Failed to create WebSocket connection', {
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.logger.info('Disconnecting from WebSocket server');

    this.stopHeartbeat();
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = undefined;
    }
  }

  /**
   * Subscribe to configuration changes for a customer
   */
  subscribe(customerId: string, pattern?: string, callback?: (event: ConfigChangeEvent) => void): () => void {
    this.logger.info('Subscribing to configuration changes', {
      customerId,
      pattern,
    });

    // Add callback to subscriptions if provided
    if (callback) {
      const key = pattern ? `${customerId}:${pattern}` : customerId;
      if (!this.subscriptions.has(key)) {
        this.subscriptions.set(key, new Set());
      }
      this.subscriptions.get(key)!.add(callback);
    }

    // Send subscription message
    const message: WebSocketMessage = {
      type: WebSocketMessageType.CONFIG_SUBSCRIBED,
      payload: { customerId, pattern } satisfies SubscriptionMessage,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId(),
    };

    this.sendMessage(message);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(customerId, pattern, callback);
    };
  }

  /**
   * Unsubscribe from configuration changes
   */
  unsubscribe(customerId: string, pattern?: string, callback?: (event: ConfigChangeEvent) => void): void {
    this.logger.info('Unsubscribing from configuration changes', {
      customerId,
      pattern,
    });

    // Remove callback from subscriptions if provided
    if (callback) {
      const key = pattern ? `${customerId}:${pattern}` : customerId;
      const callbacks = this.subscriptions.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    }

    // Send unsubscription message
    const message: WebSocketMessage = {
      type: WebSocketMessageType.CONFIG_UNSUBSCRIBED,
      payload: { customerId, pattern } satisfies SubscriptionMessage,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId(),
    };

    this.sendMessage(message);
  }

  /**
   * Send configuration change notification
   */
  notifyConfigChange(customerId: string, change: ConfigChangeEvent): void {
    this.logger.info('Sending configuration change notification', {
      customerId,
      key: change.key,
    });

    const message: WebSocketMessage = {
      type: WebSocketMessageType.CONFIG_CHANGED,
      payload: { customerId, change } satisfies ConfigChangeMessage,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId(),
    };

    this.sendMessage(message);
  }

  /**
   * Get connection status
   */
  isConnectionOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      this.logger.debug('Received WebSocket message', {
        type: message.type,
        id: message.id,
      });

      switch (message.type) {
        case WebSocketMessageType.CONFIG_CHANGED:
          this.handleConfigChange(message.payload as ConfigChangeMessage);
          break;

        case WebSocketMessageType.CONFIG_SUBSCRIBED:
          this.logger.info('Configuration subscription confirmed', {
            payload: message.payload,
          });
          break;

        case WebSocketMessageType.CONFIG_UNSUBSCRIBED:
          this.logger.info('Configuration unsubscription confirmed', {
            payload: message.payload,
          });
          break;

        case WebSocketMessageType.CONFIG_ERROR:
          this.logger.error('Configuration error received', {
            payload: message.payload,
          });
          break;

        case WebSocketMessageType.HEARTBEAT:
          this.handleHeartbeat(message);
          break;

        case WebSocketMessageType.HEARTBEAT_ACK:
          this.logger.debug('Heartbeat acknowledged');
          break;

        default:
          this.logger.warn('Unknown message type received', {
            type: message.type,
          });
      }
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle configuration change message
   */
  private handleConfigChange(payload: ConfigChangeMessage): void {
    const { customerId, change } = payload;
    
    this.logger.info('Handling configuration change', {
      customerId,
      key: change.key,
    });

    // Notify exact match subscribers
    const exactCallbacks = this.subscriptions.get(customerId);
    if (exactCallbacks) {
      for (const callback of exactCallbacks) {
        try {
          callback(change);
        } catch (error) {
          this.logger.error('Error in configuration change callback', {
            customerId,
            key: change.key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Notify pattern match subscribers
    for (const [key, callbacks] of this.subscriptions.entries()) {
      if (key.includes(':') && key.startsWith(customerId + ':')) {
        const pattern = key.split(':', 2)[1];
        if (this.matchesPattern(change.key, pattern)) {
          for (const callback of callbacks) {
            try {
              callback(change);
            } catch (error) {
              this.logger.error('Error in pattern configuration change callback', {
                customerId,
                pattern,
                key: change.key,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    }
  }

  /**
   * Handle heartbeat message
   */
  private handleHeartbeat(message: WebSocketMessage): void {
    this.logger.debug('Received heartbeat, sending acknowledgment');

    const ackMessage: WebSocketMessage = {
      type: WebSocketMessageType.HEARTBEAT_ACK,
      payload: { id: message.id },
      timestamp: new Date().toISOString(),
      id: this.generateMessageId(),
    };

    this.sendMessage(ackMessage);
  }

  /**
   * Enqueue a message respecting the maximum queue size
   */
  private enqueueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift();
      this.logger.warn('Message queue full, dropping oldest message', {
        maxQueueSize: this.maxQueueSize,
      });
    }
    this.messageQueue.push(message);
  }

  /**
   * Send WebSocket message
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.isConnectionOpen()) {
      try {
        this.ws!.send(JSON.stringify(message));
        this.logger.debug('WebSocket message sent', {
          type: message.type,
          id: message.id,
        });
      } catch (error) {
        this.logger.error('Failed to send WebSocket message', {
          type: message.type,
          error: error instanceof Error ? error.message : String(error),
        });

        // Queue message for retry
        this.enqueueMessage(message);
      }
    } else {
      this.logger.debug('WebSocket not connected, queueing message', {
        type: message.type,
        id: message.id,
      });

      // Queue message for when connection is established
      this.enqueueMessage(message);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (!this.isConnectionOpen()) {
      return;
    }

    this.logger.info('Flushing WebSocket message queue', {
      queueSize: this.messageQueue.length,
    });

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.logger.debug('Starting WebSocket heartbeat');

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnectionOpen()) {
        const heartbeatMessage: WebSocketMessage = {
          type: WebSocketMessageType.HEARTBEAT,
          timestamp: new Date().toISOString(),
          id: this.generateMessageId(),
        };

        this.sendMessage(heartbeatMessage);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      this.logger.debug('WebSocket heartbeat stopped');
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.logger.error('Maximum reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.options.maxReconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    
    this.logger.info('Attempting WebSocket reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.options.maxReconnectAttempts,
    });

    setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, this.options.reconnectInterval);
  }

  /**
   * Check if a key matches a pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
