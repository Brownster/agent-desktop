/**
 * @fileoverview Amazon Connect queue-related types
 * @module @agent-desktop/types/connect/queue
 */

/**
 * Queue status
 */
export enum QueueStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

/**
 * Queue information
 */
export interface QueueInfo {
  readonly id: string;
  readonly name: string;
  readonly arn: string;
  readonly description?: string;
  readonly status: QueueStatus;
  readonly maxContacts?: number;
  readonly hoursOfOperationId?: string;
}

/**
 * Queue metrics
 */
export interface QueueMetrics {
  readonly queueId: string;
  readonly contactsInQueue: number;
  readonly longestQueueTime: number;
  readonly averageQueueTime: number;
  readonly serviceLevel: number;
  readonly availableAgents: number;
  readonly busyAgents: number;
}