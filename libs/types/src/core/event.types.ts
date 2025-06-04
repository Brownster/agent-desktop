/**
 * @fileoverview Event system types for inter-module communication
 * @module @agent-desktop/types/core/event
 */

/**
 * Event priority levels
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Event categories for organization
 */
export enum EventCategory {
  SYSTEM = 'system',
  MODULE = 'module',
  USER = 'user',
  CONNECT = 'connect',
  HEALTH = 'health',
  CONFIG = 'config',
  SECURITY = 'security',
}

/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  readonly id: string;
  readonly type: string;
  readonly category: EventCategory;
  readonly priority: EventPriority;
  readonly timestamp: Date;
  readonly source: string;
  readonly metadata?: Record<string, unknown>;
  readonly correlationId?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly customerId?: string;
}

/**
 * Event with typed payload
 */
export interface Event<T = unknown> extends BaseEvent {
  readonly payload: T;
}

/**
 * System events
 */
export interface SystemEvent extends BaseEvent {
  readonly category: EventCategory.SYSTEM;
}

/**
 * Module lifecycle events
 */
export interface ModuleEvent extends BaseEvent {
  readonly category: EventCategory.MODULE;
  readonly moduleId: string;
}

/**
 * User interaction events
 */
export interface UserEvent extends BaseEvent {
  readonly category: EventCategory.USER;
  readonly userId: string;
  readonly action: string;
}

/**
 * Amazon Connect events
 */
export interface ConnectEvent extends BaseEvent {
  readonly category: EventCategory.CONNECT;
  readonly contactId?: string;
  readonly agentId?: string;
  readonly queueId?: string;
}

/**
 * Health monitoring events
 */
export interface HealthEvent extends BaseEvent {
  readonly category: EventCategory.HEALTH;
  readonly component: string;
  readonly status: string;
}

/**
 * Configuration change events
 */
export interface ConfigEvent extends BaseEvent {
  readonly category: EventCategory.CONFIG;
  readonly configKey: string;
  readonly oldValue?: unknown;
  readonly newValue: unknown;
}

/**
 * Security events
 */
export interface SecurityEvent extends BaseEvent {
  readonly category: EventCategory.SECURITY;
  readonly action: string;
  readonly resource: string;
  readonly outcome: 'success' | 'failure' | 'blocked';
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Event listener function signature
 */
export type EventListener<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * Event listener with error handling
 */
export type SafeEventListener<T = unknown> = (
  event: Event<T>,
  error?: Error
) => void | Promise<void>;

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  readonly id: string;
  readonly eventType: string;
  readonly listener: EventListener;
  readonly once: boolean;
  readonly priority: EventPriority;
  readonly filter?: EventFilter;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event filter for conditional event handling
 */
export interface EventFilter {
  readonly source?: string | readonly string[];
  readonly category?: EventCategory | readonly EventCategory[];
  readonly priority?: EventPriority | readonly EventPriority[];
  readonly userId?: string;
  readonly customerId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly custom?: (event: BaseEvent) => boolean;
}

/**
 * Event bus interface for centralized event management
 */
export interface EventBus {
  /**
   * Emit an event
   */
  emit<T>(event: Event<T>): Promise<void>;
  
  /**
   * Subscribe to events
   */
  on<T>(eventType: string, listener: EventListener<T>, options?: SubscriptionOptions): string;
  
  /**
   * Subscribe to events once
   */
  once<T>(eventType: string, listener: EventListener<T>, options?: SubscriptionOptions): string;
  
  /**
   * Unsubscribe from events
   */
  off(subscriptionId: string): void;
  
  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: string): void;
  
  /**
   * Get active subscriptions
   */
  getSubscriptions(eventType?: string): readonly EventSubscription[];
  
  /**
   * Check if there are listeners for an event type
   */
  hasListeners(eventType: string): boolean;
  
  /**
   * Get event statistics
   */
  getStats(): EventBusStats;
  
  /**
   * Clear event bus statistics
   */
  clearStats(): void;
}

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  readonly priority?: EventPriority;
  readonly filter?: EventFilter;
  readonly maxExecutions?: number;
  readonly timeout?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event bus statistics
 */
export interface EventBusStats {
  readonly totalEvents: number;
  readonly eventsByType: Record<string, number>;
  readonly eventsByCategory: Record<EventCategory, number>;
  readonly eventsByPriority: Record<EventPriority, number>;
  readonly totalSubscriptions: number;
  readonly activeSubscriptions: number;
  readonly averageProcessingTime: number;
  readonly errorCount: number;
  readonly lastEventTime?: Date;
}

/**
 * Event processing result
 */
export interface EventProcessingResult {
  readonly eventId: string;
  readonly success: boolean;
  readonly duration: number;
  readonly listenersExecuted: number;
  readonly errors: readonly EventProcessingError[];
}

/**
 * Event processing error
 */
export interface EventProcessingError {
  readonly subscriptionId: string;
  readonly error: Error;
  readonly timestamp: Date;
}

/**
 * Event history entry for auditing
 */
export interface EventHistoryEntry {
  readonly event: BaseEvent;
  readonly processingResult: EventProcessingResult;
  readonly timestamp: Date;
}

/**
 * Event middleware for processing events
 */
export interface EventMiddleware {
  readonly name: string;
  readonly priority: number;
  
  /**
   * Process event before emission
   */
  before?(event: BaseEvent): Promise<BaseEvent> | BaseEvent;
  
  /**
   * Process event after emission
   */
  after?(event: BaseEvent, result: EventProcessingResult): Promise<void> | void;
  
  /**
   * Handle event processing errors
   */
  onError?(event: BaseEvent, error: Error): Promise<void> | void;
}

/**
 * Predefined system event types
 */
export const SystemEventTypes = {
  APPLICATION_STARTED: 'system.application.started',
  APPLICATION_STOPPED: 'system.application.stopped',
  MODULE_LOADED: 'system.module.loaded',
  MODULE_UNLOADED: 'system.module.unloaded',
  MODULE_ERROR: 'system.module.error',
  CONFIG_CHANGED: 'system.config.changed',
  HEALTH_CHECK: 'system.health.check',
  ERROR_OCCURRED: 'system.error.occurred',
} as const;

/**
 * Predefined Connect event types
 */
export const ConnectEventTypes = {
  AGENT_STATE_CHANGED: 'connect.agent.state_changed',
  CONTACT_INCOMING: 'connect.contact.incoming',
  CONTACT_CONNECTED: 'connect.contact.connected',
  CONTACT_ENDED: 'connect.contact.ended',
  CONTACT_MISSED: 'connect.contact.missed',
  QUEUE_STATS_UPDATED: 'connect.queue.stats_updated',
  STREAMS_INITIALIZED: 'connect.streams.initialized',
  STREAMS_ERROR: 'connect.streams.error',
} as const;