/**
 * @fileoverview React hooks for real-time WebSocket functionality
 * @module services/websocket/realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  AdminWebSocketService, 
  type AdminEvent, 
  type EventCallback,
  type Subscription,
  type ConnectionState,
  AdminEventType,
} from './websocket.service';
import type { CustomerConfig, SystemStatus } from '@agent-desktop/types';
import { cacheKeys } from '../config/api.config';

/**
 * Global WebSocket service instance
 */
let globalWebSocketService: AdminWebSocketService | null = null;

/**
 * Get or create the global WebSocket service instance
 */
function getWebSocketService(): AdminWebSocketService {
  if (!globalWebSocketService) {
    globalWebSocketService = new AdminWebSocketService();
  }
  return globalWebSocketService;
}

/**
 * Hook for managing WebSocket connection state
 */
export function useWebSocketConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const wsService = useRef(getWebSocketService());

  const connect = useCallback(async () => {
    if (isConnecting || connectionState === 'connected') {
      return;
    }

    setIsConnecting(true);
    try {
      await wsService.current.connect();
      setConnectionState('connected');
    } catch (error) {
      setConnectionState('error');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, connectionState]);

  const disconnect = useCallback(() => {
    wsService.current.disconnect();
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await wsService.current.reconnect();
      setConnectionState('connected');
    } catch (error) {
      setConnectionState('error');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Subscribe to connection state changes
  useEffect(() => {
    const subscription = wsService.current.subscribeToEventType(
      AdminEventType.SYSTEM_STATUS_CHANGED,
      (event) => {
        const data = event.data as { connectionState: ConnectionState };
        if (data.connectionState) {
          setConnectionState(data.connectionState);
        }
      }
    );

    // Get initial connection state
    setConnectionState(wsService.current.getConnectionState());

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    connectionState,
    isConnecting,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * Hook for subscribing to real-time customer updates
 */
export function useRealtimeCustomer(customerId: string) {
  const queryClient = useQueryClient();
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    if (!customerId) return;

    const subscription = wsService.current.subscribeToCustomerEvents(
      customerId,
      (event) => {
        // Update customer data in React Query cache based on event type
        switch (event.type) {
          case AdminEventType.CUSTOMER_UPDATED:
            if (event.data && typeof event.data === 'object' && 'newValue' in event.data) {
              const updatedConfig = event.data.newValue as CustomerConfig;
              queryClient.setQueryData(cacheKeys.customer(customerId), updatedConfig);
              queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
            }
            break;

          case AdminEventType.CUSTOMER_DELETED:
            queryClient.removeQueries({ queryKey: cacheKeys.customer(customerId) });
            queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
            break;

          case AdminEventType.MODULE_INSTALLED:
          case AdminEventType.MODULE_UNINSTALLED:
            queryClient.invalidateQueries({ queryKey: cacheKeys.customerModules(customerId) });
            break;

          case AdminEventType.INTEGRATION_CONNECTED:
          case AdminEventType.INTEGRATION_DISCONNECTED:
            queryClient.invalidateQueries({ queryKey: cacheKeys.customerIntegrations(customerId) });
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [customerId, queryClient]);
}

/**
 * Hook for subscribing to real-time customer list updates
 */
export function useRealtimeCustomers() {
  const queryClient = useQueryClient();
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    const subscription = wsService.current.subscribe('all', (event) => {
      // Invalidate customer list on any customer-related event
      switch (event.type) {
        case AdminEventType.CUSTOMER_CREATED:
        case AdminEventType.CUSTOMER_UPDATED:
        case AdminEventType.CUSTOMER_DELETED:
          queryClient.invalidateQueries({ queryKey: cacheKeys.customers });
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Hook for real-time system status monitoring
 */
export function useRealtimeSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    const subscription = wsService.current.subscribeToEventType(
      AdminEventType.SYSTEM_STATUS_CHANGED,
      (event) => {
        if (event.data && typeof event.data === 'object' && 'status' in event.data) {
          setSystemStatus(event.data as SystemStatus);
          setLastUpdated(event.timestamp);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    systemStatus,
    lastUpdated,
  };
}

/**
 * Hook for subscribing to system alerts and notifications
 */
export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<AdminEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsService = useRef(getWebSocketService());

  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.type === alertId ? { ...alert, data: { ...(alert.data as object), read: true } } : alert
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, data: { ...(alert.data as object), read: true } })));
    setUnreadCount(0);
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.type !== alertId));
    setUnreadCount(prev => {
      const alert = alerts.find(a => a.type === alertId);
      return alert && !('read' in (alert.data as any) && (alert.data as any).read) ? Math.max(0, prev - 1) : prev;
    });
  }, [alerts]);

  useEffect(() => {
    const subscription = wsService.current.subscribe('all', (event) => {
      // Only capture alert-type events
      if (event.severity === 'warning' || event.severity === 'error' || event.severity === 'critical') {
        setAlerts(prev => [event, ...prev.slice(0, 49)]); // Keep only last 50 alerts
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAlert,
  };
}

/**
 * Hook for custom event subscriptions
 */
export function useRealtimeEvents<T = unknown>(
  eventType: AdminEventType | 'all',
  customerId?: string
): {
  events: AdminEvent[];
  subscribe: (callback: EventCallback<T>) => Subscription;
  clearEvents: () => void;
} {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const wsService = useRef(getWebSocketService());

  const subscribe = useCallback((callback: EventCallback<T>) => {
    return wsService.current.subscribe<T>(eventType, (event) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep only last 100 events
      callback(event);
    }, customerId);
  }, [eventType, customerId]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    subscribe,
    clearEvents,
  };
}

/**
 * Hook for monitoring module-related real-time events
 */
export function useRealtimeModules() {
  const queryClient = useQueryClient();
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    const subscription = wsService.current.subscribe('all', (event) => {
      switch (event.type) {
        case AdminEventType.MODULE_INSTALLED:
        case AdminEventType.MODULE_UNINSTALLED:
          // Invalidate module-related queries
          queryClient.invalidateQueries({ queryKey: cacheKeys.modules });
          if (event.customerId) {
            queryClient.invalidateQueries({ queryKey: cacheKeys.customerModules(event.customerId) });
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Hook for monitoring integration-related real-time events
 */
export function useRealtimeIntegrations() {
  const queryClient = useQueryClient();
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    const subscription = wsService.current.subscribe('all', (event) => {
      switch (event.type) {
        case AdminEventType.INTEGRATION_CONNECTED:
        case AdminEventType.INTEGRATION_DISCONNECTED:
          if (event.customerId) {
            queryClient.invalidateQueries({ queryKey: cacheKeys.customerIntegrations(event.customerId) });
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Hook for real-time performance monitoring
 */
export function useRealtimePerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    cpu: number;
    memory: number;
    connections: number;
    responseTime: number;
    lastUpdated: Date;
  } | null>(null);
  
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    const subscription = wsService.current.subscribeToEventType(
      AdminEventType.PERFORMANCE_ALERT,
      (event) => {
        if (event.data && typeof event.data === 'object') {
          const data = event.data as Record<string, unknown>;
          if ('cpu' in data || 'memory' in data || 'connections' in data || 'responseTime' in data) {
            setPerformanceMetrics({
              cpu: (data.cpu as number) || 0,
              memory: (data.memory as number) || 0,
              connections: (data.connections as number) || 0,
              responseTime: (data.responseTime as number) || 0,
              lastUpdated: event.timestamp,
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return performanceMetrics;
}

/**
 * Provider component for WebSocket context
 */
export function useWebSocketService(): AdminWebSocketService {
  return getWebSocketService();
}