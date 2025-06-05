/**
 * @fileoverview Admin WebSocket service for real-time updates and notifications
 * @module services/websocket/websocket
 */

import { 
  ConfigWebSocketService, 
  type WebSocketOptions,
  type ConfigChangeEvent,
} from '@agent-desktop/config';
import { Logger } from '@agent-desktop/logging';
import { websocketConfig } from '../config/api.config';
import type { SystemEvent } from '../types';

/**
 * Event types for admin dashboard real-time updates
 */
export enum AdminEventType {
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  CUSTOMER_DELETED = 'customer_deleted',
  MODULE_INSTALLED = 'module_installed',
  MODULE_UNINSTALLED = 'module_uninstalled',
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_STATUS_CHANGED = 'system_status_changed',
  AUDIT_EVENT = 'audit_event',
  PERFORMANCE_ALERT = 'performance_alert',
  SECURITY_ALERT = 'security_alert',
}

/**
 * Admin-specific event interface
 */
export interface AdminEvent {
  readonly type: AdminEventType;
  readonly data: unknown;
  readonly timestamp: Date;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly customerId?: string;
  readonly userId?: string;
  readonly source: string;
}

/**
 * Subscription callback type
 */
export type EventCallback<T = unknown> = (event: AdminEvent & { data: T }) => void;

/**
 * Subscription management interface
 */
export interface Subscription {
  readonly id: string;
  readonly eventType: AdminEventType | 'all';
  readonly customerId?: string;
  readonly callback: EventCallback;
  readonly unsubscribe: () => void;
}

/**
 * Connection state type
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Admin WebSocket service for managing real-time connections and event subscriptions
 * Wraps the base ConfigWebSocketService with admin-specific functionality
 */
export class AdminWebSocketService {
  private readonly wsService: ConfigWebSocketService;
  private readonly logger: Logger;
  private readonly subscriptions = new Map<string, Subscription>();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private reconnectTimer?: NodeJS.Timeout | null;
  private heartbeatTimer?: NodeJS.Timeout | null;
  private readonly eventListeners = new Map<string, Set<EventCallback>>();

  constructor(options: Partial<WebSocketOptions> = {}, logger?: Logger) {
    this.logger = logger?.createChild('AdminWebSocketService') || new Logger({
      context: 'AdminWebSocketService',
      level: 'info',
    });

    // Initialize WebSocket service with admin-specific configuration
    this.wsService = new ConfigWebSocketService(
      {
        ...websocketConfig,
        ...options,
      },
      this.logger
    );

    this.logger.info('Admin WebSocket service initialized', {
      url: websocketConfig.url,
      maxReconnectAttempts: this.maxReconnectAttempts,
    });
  }

  /**
   * Connect to WebSocket server with retry logic
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      this.logger.debug('WebSocket already connected or connecting');
      return;
    }

    this.connectionState = 'connecting';
    this.logger.info('Connecting to WebSocket server');

    try {
      await this.wsService.connect();
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      this.logger.info('WebSocket connected successfully');
      this.startHeartbeat();
      this.notifyConnectionStateChange('connected');
      
    } catch (error) {
      this.connectionState = 'error';
      this.logger.error('Failed to connect to WebSocket', { error });
      this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.logger.info('Disconnecting from WebSocket server');
    
    this.connectionState = 'disconnected';
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.wsService.disconnect();
    
    this.notifyConnectionStateChange('disconnected');
  }

  /**
   * Subscribe to specific event type with optional customer filtering
   */
  subscribe<T = unknown>(
    eventType: AdminEventType | 'all',
    callback: EventCallback<T>,
    customerId?: string
  ): Subscription {
    const subscriptionId = this.generateSubscriptionId();
    
    this.logger.info('Creating event subscription', {
      subscriptionId,
      eventType,
      customerId,
    });

    // Create unsubscribe function
    const unsubscribe = () => {
      this.unsubscribe(subscriptionId);
    };

    // Create subscription object
    const subscription: Subscription = {
      id: subscriptionId,
      eventType,
      customerId: customerId ?? '',
      callback: callback as EventCallback,
      unsubscribe,
    };

    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);

    // Add to event listeners map for efficient lookup
    const listenerKey = this.getListenerKey(eventType, customerId);
    if (!this.eventListeners.has(listenerKey)) {
      this.eventListeners.set(listenerKey, new Set());
    }
    this.eventListeners.get(listenerKey)!.add(callback as EventCallback);

    // Subscribe to WebSocket events if customer-specific
    if (customerId) {
      this.wsService.subscribe(
        customerId,
        'admin.*',
        (event: any) => this.handleConfigChangeEvent(event, customerId)
      );
    }

    return subscription;
  }

  /**
   * Unsubscribe from event notifications
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      this.logger.warn('Subscription not found', { subscriptionId });
      return;
    }

    this.logger.info('Removing event subscription', {
      subscriptionId,
      eventType: subscription.eventType,
      customerId: subscription.customerId,
    });

    // Remove from subscriptions map
    this.subscriptions.delete(subscriptionId);

    // Remove from event listeners map
    const listenerKey = this.getListenerKey(subscription.eventType, subscription.customerId);
    const listeners = this.eventListeners.get(listenerKey);
    if (listeners) {
      listeners.delete(subscription.callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(listenerKey);
      }
    }
  }

  /**
   * Subscribe to system-wide events
   */
  subscribeToSystemEvents(callback: EventCallback<SystemEvent>): Subscription {
    return this.subscribe<SystemEvent>('all', callback);
  }

  /**
   * Subscribe to customer-specific events
   */
  subscribeToCustomerEvents(
    customerId: string,
    callback: EventCallback
  ): Subscription {
    if (!customerId) {
      throw new Error('Customer ID is required for customer event subscription');
    }

    return this.subscribe('all', callback, customerId);
  }

  /**
   * Subscribe to specific event type across all customers
   */
  subscribeToEventType<T = unknown>(
    eventType: AdminEventType,
    callback: EventCallback<T>
  ): Subscription {
    return this.subscribe<T>(eventType, callback);
  }

  /**
   * Send custom admin event
   */
  sendAdminEvent(event: Omit<AdminEvent, 'timestamp'>): void {
    this.logger.info('Sending admin event', {
      type: event.type,
      severity: event.severity,
      customerId: event.customerId,
      source: event.source,
    });

    const fullEvent: AdminEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Broadcast to all relevant subscribers
    this.broadcastEvent(fullEvent);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get active subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscription details for debugging
   */
  getSubscriptions(): readonly Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.wsService.isConnectionOpen();
  }

  /**
   * Force reconnection attempt
   */
  async reconnect(): Promise<void> {
    this.logger.info('Manual reconnection requested');
    
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await this.connect();
  }

  /**
   * Handle configuration change events from WebSocket service
   */
  private handleConfigChangeEvent(event: ConfigChangeEvent, customerId: string): void {
    // Convert configuration changes to admin events
    let eventType: AdminEventType;
    
    if (event.key.startsWith('customer.')) {
      eventType = AdminEventType.CUSTOMER_UPDATED;
    } else if (event.key.startsWith('module.')) {
      eventType = event.newValue ? AdminEventType.MODULE_INSTALLED : AdminEventType.MODULE_UNINSTALLED;
    } else if (event.key.startsWith('integration.')) {
      eventType = event.newValue ? AdminEventType.INTEGRATION_CONNECTED : AdminEventType.INTEGRATION_DISCONNECTED;
    } else {
      // Generic system event
      return;
    }

    const adminEvent: AdminEvent = {
      type: eventType,
      data: {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        source: event.source,
      },
      timestamp: event.timestamp,
      severity: 'info',
      customerId,
      source: 'config_service',
    };

    this.broadcastEvent(adminEvent);
  }

  /**
   * Broadcast event to all relevant subscribers
   */
  private broadcastEvent(event: AdminEvent): void {
    const eventCallbacks = new Set<EventCallback>();

    // Find all subscribers for this event
    const keys = [
      this.getListenerKey('all'),
      this.getListenerKey('all', event.customerId),
      this.getListenerKey(event.type),
      this.getListenerKey(event.type, event.customerId),
    ];

    for (const key of keys) {
      const listeners = this.eventListeners.get(key);
      if (listeners) {
        for (const callback of listeners) {
          eventCallbacks.add(callback);
        }
      }
    }

    // Execute callbacks safely
    for (const callback of eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        this.logger.error('Error in event callback', {
          eventType: event.type,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Handle connection errors and initiate reconnection
   */
  private handleConnectionError(error: unknown): void {
    this.logger.error('WebSocket connection error', { 
      error: error instanceof Error ? error.message : String(error),
      reconnectAttempts: this.reconnectAttempts,
    });

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnection();
    } else {
      this.logger.error('Maximum reconnection attempts reached');
      this.connectionState = 'error';
      this.notifyConnectionStateChange('error');
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnection(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.logger.info('Scheduling reconnection', {
      attempt: this.reconnectAttempts + 1,
      delay,
    });

    this.connectionState = 'reconnecting';
    this.notifyConnectionStateChange('reconnecting');

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
      } catch (error) {
        this.handleConnectionError(error);
      }
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected()) {
        this.logger.warn('Heartbeat failed - connection lost');
        this.handleConnectionError(new Error('Heartbeat failed'));
      }
    }, websocketConfig.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Notify subscribers of connection state changes
   */
  private notifyConnectionStateChange(state: ConnectionState): void {
    const event: AdminEvent = {
      type: AdminEventType.SYSTEM_STATUS_CHANGED,
      data: { connectionState: state },
      timestamp: new Date(),
      severity: state === 'error' ? 'error' : 'info',
      source: 'websocket_service',
    };

    this.broadcastEvent(event);
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get listener key for efficient event routing
   */
  private getListenerKey(eventType: AdminEventType | 'all', customerId?: string): string {
    return customerId ? `${eventType}:${customerId}` : eventType;
  }
}