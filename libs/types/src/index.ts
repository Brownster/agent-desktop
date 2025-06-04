/**
 * @fileoverview Central export for all TypeScript types used across the Agent Desktop application
 * @module @agent-desktop/types
 */

// Core types
export * from './core/config.types';
export * from './core/logging.types';
export * from './core/module.types';
export * from './core/health.types';
export * from './core/event.types';

// Amazon Connect types
export * from './connect/agent.types';
export * from './connect/contact.types';
export * from './connect/queue.types';
export * from './connect/streams.types';

// Application types
export * from './app/customer.types';
export * from './app/deployment.types';
export * from './app/integration.types';
export * from './app/branding.types';

// Utility types
export * from './utils/common.types';
export * from './utils/api.types';
export * from './utils/validation.types';