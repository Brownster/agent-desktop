/**
 * @fileoverview Amazon Connect Streams API types
 * @module @agent-desktop/types/connect/streams
 */

/**
 * Connect Streams initialization configuration
 */
export interface StreamsConfig {
  readonly ccpUrl: string;
  readonly loginUrl?: string;
  readonly region: string;
  readonly allowFramedSoftphone?: boolean;
  readonly disableRingtone?: boolean;
  readonly softphone?: SoftphoneConfig;
}

/**
 * Softphone configuration
 */
export interface SoftphoneConfig {
  readonly allowFramedSoftphone: boolean;
  readonly disableRingtone: boolean;
  readonly ringtoneUrl?: string;
}

/**
 * Streams event types
 */
export const StreamsEventTypes = {
  INIT: 'init',
  ACK: 'ack',
  LOG: 'log',
  MASTER_REQUEST: 'masterRequest',
  MASTER_RESPONSE: 'masterResponse',
  API_REQUEST: 'apiRequest',
  API_RESPONSE: 'apiResponse',
  AUTH_FAIL: 'authFail',
  ACCESS_DENIED: 'accessDenied',
  CLOSE: 'close',
  NEW_AGENT_CONFIG: 'newAgentConfig',
  UPDATE_AGENT_CONFIG: 'updateAgentConfig',
} as const;