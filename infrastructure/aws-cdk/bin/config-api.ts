#!/usr/bin/env node
/**
 * @fileoverview CDK app entry point for Configuration API infrastructure
 * @module infrastructure/aws-cdk
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConfigApiStack } from '../lib/config-api-stack';

/**
 * CDK App for Configuration API infrastructure
 */
const app = new cdk.App();

// Get environment context
const environment = app.node.tryGetContext('environment') || 'development';
const region = app.node.tryGetContext('region') || 'us-east-1';
const account = app.node.tryGetContext('account');

// Stack naming convention: ccp-config-api-{environment}
const stackName = `ccp-config-api-${environment}`;

// Create the Configuration API stack
new ConfigApiStack(app, stackName, {
  stackName,
  description: `Amazon Connect CCP Configuration API infrastructure for ${environment} environment`,
  env: {
    account: account || process.env.CDK_DEFAULT_ACCOUNT,
    region: region || process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Service: 'ccp-config-api',
    ManagedBy: 'aws-cdk',
    Project: 'amazon-connect-ccp',
    Purpose: 'configuration-management',
  },
  terminationProtection: environment === 'production',
});

// Add stack-level tags
cdk.Tags.of(app).add('Project', 'amazon-connect-ccp');
cdk.Tags.of(app).add('ManagedBy', 'aws-cdk');
cdk.Tags.of(app).add('Environment', environment);