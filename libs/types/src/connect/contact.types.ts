/**
 * @fileoverview Amazon Connect contact-related types
 * @module @agent-desktop/types/connect/contact
 */

/**
 * Contact states in Amazon Connect
 */
export enum ContactState {
  INCOMING = 'incoming',
  PENDING = 'pending',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  MISSED = 'missed',
  ERROR = 'error',
  ENDED = 'ended',
}

/**
 * Contact types
 */
export enum ContactType {
  VOICE = 'voice',
  CHAT = 'chat',
  TASK = 'task',
}

/**
 * Contact information interface
 */
export interface ContactInfo {
  readonly contactId: string;
  readonly type: ContactType;
  readonly state: ContactState;
  readonly customerNumber?: string;
  readonly queueId: string;
  readonly agentId?: string;
  readonly initiationMethod: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly duration?: number;
  readonly attributes: Record<string, string>;
}

/**
 * Customer endpoint information
 */
export interface CustomerEndpoint {
  readonly type: 'TELEPHONE_NUMBER' | 'VOIP' | 'CONTACT_FLOW';
  readonly address: string;
}