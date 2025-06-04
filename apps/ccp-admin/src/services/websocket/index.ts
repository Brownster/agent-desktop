/**
 * @fileoverview WebSocket services module exports
 * @module services/websocket
 */

export { 
  AdminWebSocketService,
  AdminEventType,
  type AdminEvent,
  type EventCallback,
  type Subscription,
  type ConnectionState,
} from './websocket.service';

export {
  useWebSocketConnection,
  useRealtimeCustomer,
  useRealtimeCustomers,
  useRealtimeSystemStatus,
  useRealtimeAlerts,
  useRealtimeEvents,
  useRealtimeModules,
  useRealtimeIntegrations,
  useRealtimePerformance,
  useWebSocketService,
} from './realtime.hooks';