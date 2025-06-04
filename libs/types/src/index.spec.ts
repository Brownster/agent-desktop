/**
 * @fileoverview Basic type tests to ensure type exports work correctly
 */

import type {
  // Core types
  LogLevel,
  ModuleType,
  HealthStatusLevel,
  EventCategory,
  
  // Amazon Connect types
  AgentState,
  ContactState,
  ContactType,
  QueueStatus,
  
  // Application types
  CustomerConfig,
  BrandingConfig,
  IntegrationType,
  DeploymentEnvironment,
  
  // Utility types
  Result,
  UUID,
  Email,
  PhoneNumber,
} from './index';

import {
  success,
  failure,
  isSuccess,
  isFailure,
  isDefined,
  isNullOrUndefined,
} from './utils/common.types';

describe('Type Library', () => {
  describe('Core Types', () => {
    it('should have correct LogLevel enum values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.FATAL).toBe(4);
    });

    it('should have correct ModuleType enum values', () => {
      expect(ModuleType.CCP_CORE).toBe('ccp-core');
      expect(ModuleType.CUSTOMER_INFO).toBe('customer-info');
      expect(ModuleType.CASES).toBe('cases');
      expect(ModuleType.TASKS).toBe('tasks');
      expect(ModuleType.KNOWLEDGE).toBe('knowledge');
    });

    it('should have correct HealthStatusLevel enum values', () => {
      expect(HealthStatusLevel.HEALTHY).toBe('healthy');
      expect(HealthStatusLevel.DEGRADED).toBe('degraded');
      expect(HealthStatusLevel.UNHEALTHY).toBe('unhealthy');
      expect(HealthStatusLevel.CRITICAL).toBe('critical');
      expect(HealthStatusLevel.UNKNOWN).toBe('unknown');
    });

    it('should have correct EventCategory enum values', () => {
      expect(EventCategory.SYSTEM).toBe('system');
      expect(EventCategory.MODULE).toBe('module');
      expect(EventCategory.USER).toBe('user');
      expect(EventCategory.CONNECT).toBe('connect');
    });
  });

  describe('Amazon Connect Types', () => {
    it('should have correct AgentState enum values', () => {
      expect(AgentState.AVAILABLE).toBe('Available');
      expect(AgentState.AWAY).toBe('Away');
      expect(AgentState.BREAK).toBe('Break');
      expect(AgentState.OFFLINE).toBe('Offline');
    });

    it('should have correct ContactState enum values', () => {
      expect(ContactState.INCOMING).toBe('incoming');
      expect(ContactState.CONNECTED).toBe('connected');
      expect(ContactState.ENDED).toBe('ended');
    });

    it('should have correct ContactType enum values', () => {
      expect(ContactType.VOICE).toBe('voice');
      expect(ContactType.CHAT).toBe('chat');
      expect(ContactType.TASK).toBe('task');
    });
  });

  describe('Application Types', () => {
    it('should have correct IntegrationType enum values', () => {
      expect(IntegrationType.SALESFORCE).toBe('salesforce');
      expect(IntegrationType.SERVICENOW).toBe('servicenow');
      expect(IntegrationType.ZENDESK).toBe('zendesk');
    });
  });

  describe('Utility Types and Functions', () => {
    describe('Result type utilities', () => {
      it('should create success results correctly', () => {
        const result = success('test data');
        expect(result.success).toBe(true);
        expect(result.data).toBe('test data');
        expect(isSuccess(result)).toBe(true);
        expect(isFailure(result)).toBe(false);
      });

      it('should create failure results correctly', () => {
        const error = new Error('test error');
        const result = failure(error);
        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
        expect(isSuccess(result)).toBe(false);
        expect(isFailure(result)).toBe(true);
      });
    });

    describe('Null/undefined checking utilities', () => {
      it('should correctly identify defined values', () => {
        expect(isDefined('test')).toBe(true);
        expect(isDefined(0)).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
      });

      it('should correctly identify null/undefined values', () => {
        expect(isNullOrUndefined(null)).toBe(true);
        expect(isNullOrUndefined(undefined)).toBe(true);
        expect(isNullOrUndefined('test')).toBe(false);
        expect(isNullOrUndefined(0)).toBe(false);
      });
    });
  });

  describe('Type compilation', () => {
    it('should compile customer config type correctly', () => {
      // This test mainly ensures the types compile correctly
      const config: Partial<CustomerConfig> = {
        customer_id: 'test-customer',
        name: 'Test Customer',
        version: '1.0.0',
        isActive: true,
      };

      expect(config.customer_id).toBe('test-customer');
      expect(config.name).toBe('Test Customer');
    });

    it('should compile branding config type correctly', () => {
      const branding: Partial<BrandingConfig> = {
        primary_color: '#1e40af',
        secondary_color: '#374151',
        font_family: 'Inter, sans-serif',
        theme: 'light',
        application_title: 'Agent Desktop',
      };

      expect(branding.primary_color).toBe('#1e40af');
      expect(branding.theme).toBe('light');
    });
  });

  describe('Branded types', () => {
    it('should handle branded types correctly in tests', () => {
      // Note: Branded types are compile-time only, so we can't test the branding at runtime
      // This test mainly ensures the types are available
      const uuid = 'test-uuid' as UUID;
      const email = 'test@example.com' as Email;
      const phone = '+1234567890' as PhoneNumber;

      expect(typeof uuid).toBe('string');
      expect(typeof email).toBe('string');
      expect(typeof phone).toBe('string');
    });
  });
});