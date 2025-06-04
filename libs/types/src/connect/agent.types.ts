/**
 * @fileoverview Amazon Connect agent-related types
 * @module @agent-desktop/types/connect/agent
 */

/**
 * Agent availability states in Amazon Connect
 */
export enum AgentState {
  AVAILABLE = 'Available',
  AWAY = 'Away',
  BREAK = 'Break',
  LUNCH = 'Lunch',
  TRAINING = 'Training',
  OFFLINE = 'Offline',
  CUSTOM = 'Custom',
}

/**
 * Agent activity states
 */
export enum AgentActivity {
  IDLE = 'idle',
  INCOMING = 'incoming',
  BUSY = 'busy',
  AFTER_CALL_WORK = 'after_call_work',
  PENDING = 'pending',
}

/**
 * Agent information interface
 */
export interface AgentInfo {
  readonly agentId: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly email: string;
  readonly routingProfile: RoutingProfile;
  readonly permissions: readonly AgentPermission[];
  readonly state: AgentState;
  readonly activity: AgentActivity;
  readonly extension?: string;
  readonly hierarchyGroups: readonly HierarchyGroup[];
  readonly tags: readonly AgentTag[];
}

/**
 * Agent state change information
 */
export interface AgentStateChange {
  readonly agentId: string;
  readonly previousState: AgentState;
  readonly newState: AgentState;
  readonly timestamp: Date;
  readonly reason?: string;
  readonly duration: number;
}

/**
 * Agent statistics
 */
export interface AgentStatistics {
  readonly agentId: string;
  readonly period: StatisticsPeriod;
  readonly contactsHandled: number;
  readonly averageHandleTime: number;
  readonly averageTalkTime: number;
  readonly averageAfterCallWorkTime: number;
  readonly occupancyRate: number;
  readonly adherenceRate: number;
  readonly loginTime: Date;
  readonly availableTime: number;
  readonly busyTime: number;
  readonly awayTime: number;
}

/**
 * Agent routing profile
 */
export interface RoutingProfile {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly defaultOutboundQueue: Queue;
  readonly queueConfigs: readonly QueueConfig[];
  readonly mediaChannels: readonly MediaChannel[];
  readonly maxContacts: number;
}

/**
 * Queue configuration for routing profiles
 */
export interface QueueConfig {
  readonly queueId: string;
  readonly priority: number;
  readonly delay: number;
  readonly enabled: boolean;
}

/**
 * Media channel configuration
 */
export interface MediaChannel {
  readonly type: 'VOICE' | 'CHAT' | 'TASK';
  readonly concurrency: number;
  readonly enabled: boolean;
  readonly skills: readonly Skill[];
}

/**
 * Agent skill
 */
export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly category: string;
}

/**
 * Agent permission
 */
export interface AgentPermission {
  readonly id: string;
  readonly name: string;
  readonly resource: string;
  readonly actions: readonly string[];
  readonly conditions?: Record<string, unknown>;
}

/**
 * Agent hierarchy group
 */
export interface HierarchyGroup {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly parentId?: string;
  readonly path: readonly string[];
}

/**
 * Agent tag
 */
export interface AgentTag {
  readonly key: string;
  readonly value: string;
  readonly category?: string;
}

/**
 * Statistics time period
 */
export interface StatisticsPeriod {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly interval: 'FIFTEEN_MIN' | 'THIRTY_MIN' | 'HOUR' | 'DAY';
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  readonly agentId: string;
  readonly date: Date;
  readonly contactsOffered: number;
  readonly contactsHandled: number;
  readonly contactsMissed: number;
  readonly contactsAbandoned: number;
  readonly averageHandleTime: number;
  readonly averageTalkTime: number;
  readonly averageHoldTime: number;
  readonly averageAfterCallWorkTime: number;
  readonly longestHoldTime: number;
  readonly occupancyRate: number;
  readonly serviceLevel: number;
  readonly firstCallResolution: number;
  readonly customerSatisfactionScore?: number;
}

/**
 * Agent schedule information
 */
export interface AgentSchedule {
  readonly agentId: string;
  readonly date: Date;
  readonly shifts: readonly Shift[];
  readonly breaks: readonly Break[];
  readonly totalScheduledTime: number;
  readonly adherenceRate: number;
}

/**
 * Work shift
 */
export interface Shift {
  readonly id: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly activity: string;
  readonly location?: string;
}

/**
 * Scheduled break
 */
export interface Break {
  readonly id: string;
  readonly type: 'BREAK' | 'LUNCH' | 'MEETING' | 'TRAINING';
  readonly startTime: Date;
  readonly endTime: Date;
  readonly description?: string;
}

/**
 * Agent connection information
 */
export interface AgentConnection {
  readonly agentId: string;
  readonly connectionId: string;
  readonly endpoint: AgentEndpoint;
  readonly connected: boolean;
  readonly connectionTime?: Date;
  readonly lastHeartbeat?: Date;
  readonly softphoneEnabled: boolean;
  readonly autoAccept: boolean;
}

/**
 * Agent endpoint (phone/softphone)
 */
export interface AgentEndpoint {
  readonly type: 'PHONE_NUMBER' | 'SOFTPHONE';
  readonly address?: string;
  readonly displayName?: string;
}

// Re-export from other files to avoid circular dependencies
interface Queue {
  readonly id: string;
  readonly name: string;
  readonly arn: string;
  readonly description?: string;
  readonly status: 'ENABLED' | 'DISABLED';
  readonly maxContacts?: number;
  readonly defaultOutboundCallerId?: string;
  readonly outboundCallerConfig?: OutboundCallerConfig;
  readonly hoursOfOperation?: HoursOfOperation;
  readonly tags?: Record<string, string>;
}

interface OutboundCallerConfig {
  readonly outboundCallerIdName?: string;
  readonly outboundCallerIdNumberId?: string;
  readonly outboundFlowId?: string;
}

interface HoursOfOperation {
  readonly id: string;
  readonly name: string;
  readonly timeZone: string;
  readonly config: readonly HoursOfOperationConfig[];
}

interface HoursOfOperationConfig {
  readonly day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
}

interface TimeOfDay {
  readonly hours: number;
  readonly minutes: number;
}