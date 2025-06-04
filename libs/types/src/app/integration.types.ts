/**
 * @fileoverview Integration configuration types
 * @module @agent-desktop/types/app/integration
 */

/**
 * Integration status
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
}

/**
 * Integration health
 */
export interface IntegrationHealth {
  readonly status: IntegrationStatus;
  readonly lastChecked: Date;
  readonly responseTime?: number;
  readonly errorMessage?: string;
  readonly uptimePercentage: number;
}

/**
 * Data synchronization status
 */
export interface SyncStatus {
  readonly lastSync: Date;
  readonly nextSync?: Date;
  readonly recordsSynced: number;
  readonly recordsFailed: number;
  readonly status: 'success' | 'error' | 'in_progress';
}

/**
 * Integration metrics
 */
export interface IntegrationMetrics {
  readonly requestCount: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly averageResponseTime: number;
  readonly dataVolume: number;
  readonly period: {
    readonly start: Date;
    readonly end: Date;
  };
}