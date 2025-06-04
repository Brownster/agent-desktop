/**
 * @fileoverview Deployment configuration types
 * @module @agent-desktop/types/app/deployment
 */

import type { MonitoringConfig } from './customer.types';

/**
 * Deployment environments
 */
export type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Deployment strategies
 */
export type DeploymentStrategy = 'multi-tenant' | 'customer-specific' | 'hybrid';

/**
 * Deployment configuration
 */
export interface DeploymentInfo {
  readonly environment: DeploymentEnvironment;
  readonly strategy: DeploymentStrategy;
  readonly version: string;
  readonly buildNumber: string;
  readonly deployedAt: Date;
  readonly region: string;
  readonly availabilityZones: readonly string[];
}

/**
 * Infrastructure configuration
 */
export interface InfrastructureConfig {
  readonly cloudProvider: 'aws' | 'azure' | 'gcp';
  readonly region: string;
  readonly vpc?: VPCConfig;
  readonly cdn?: CDNConfig;
  readonly monitoring?: MonitoringConfig;
}

/**
 * VPC configuration
 */
export interface VPCConfig {
  readonly id: string;
  readonly cidr: string;
  readonly subnets: readonly SubnetConfig[];
}

/**
 * Subnet configuration
 */
export interface SubnetConfig {
  readonly id: string;
  readonly cidr: string;
  readonly availabilityZone: string;
  readonly type: 'public' | 'private';
}

/**
 * CDN configuration
 */
export interface CDNConfig {
  readonly distributionId: string;
  readonly domain: string;
  readonly cachingEnabled: boolean;
  readonly compressionEnabled: boolean;
}