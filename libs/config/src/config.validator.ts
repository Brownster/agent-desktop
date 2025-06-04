/**
 * @fileoverview Configuration validator with schema-based validation
 * @module @agent-desktop/config
 */

import type {
  CustomerConfig,
  ModuleConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
} from '@agent-desktop/types';

/**
 * Validation schema for configuration fields
 */
export interface ValidationSchema {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
  readonly pattern?: RegExp;
  readonly enum?: readonly unknown[];
  readonly properties?: Record<string, ValidationSchema>;
  readonly items?: ValidationSchema;
  readonly custom?: (value: unknown) => string | null;
}

/**
 * Configuration validator with comprehensive schema validation
 * 
 * Features:
 * - Schema-based validation
 * - Type checking
 * - Format validation
 * - Business rule validation
 * - Custom validation functions
 * - Detailed error reporting
 */
export class ConfigValidator {
  private readonly schemas = new Map<string, ValidationSchema>();

  constructor() {
    this.initializeSchemas();
  }

  /**
   * Validate customer configuration
   * 
   * @param config - Customer configuration to validate
   * @returns Validation result with errors and warnings
   */
  validateCustomerConfig(config: unknown): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    if (!config || typeof config !== 'object') {
      errors.push({
        field: 'root',
        message: 'Configuration must be an object',
        code: 'INVALID_TYPE',
        severity: 'error',
      });
      
      return { isValid: false, errors, warnings };
    }

    const customerConfig = config as Record<string, unknown>;
    const schema = this.schemas.get('CustomerConfig');
    
    if (schema) {
      this.validateAgainstSchema(customerConfig, schema, '', errors, warnings);
    }

    // Additional business rule validations
    this.validateBusinessRules(customerConfig, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate module configuration
   * 
   * @param config - Module configuration to validate
   * @returns Validation result
   */
  validateModuleConfig(config: unknown): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    if (!config || typeof config !== 'object') {
      errors.push({
        field: 'root',
        message: 'Module configuration must be an object',
        code: 'INVALID_TYPE',
        severity: 'error',
      });
      
      return { isValid: false, errors, warnings };
    }

    const moduleConfig = config as Record<string, unknown>;
    const schema = this.schemas.get('ModuleConfig');
    
    if (schema) {
      this.validateAgainstSchema(moduleConfig, schema, '', errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Add custom validation schema
   * 
   * @param name - Schema name
   * @param schema - Validation schema
   */
  addSchema(name: string, schema: ValidationSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Initialize built-in validation schemas
   */
  private initializeSchemas(): void {
    // Customer configuration schema
    this.schemas.set('CustomerConfig', {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          required: true,
          pattern: /^[a-z0-9\-]+$/,
        },
        name: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 100,
        },
        version: {
          type: 'string',
          required: true,
          pattern: /^\d+\.\d+\.\d+(-[\w\d\-]+)?$/,
        },
        isActive: {
          type: 'boolean',
          required: true,
        },
        branding: {
          type: 'object',
          required: true,
          properties: {
            primary_color: {
              type: 'string',
              required: true,
              pattern: /^#[0-9a-fA-F]{6}$/,
            },
            secondary_color: {
              type: 'string',
              required: true,
              pattern: /^#[0-9a-fA-F]{6}$/,
            },
            font_family: {
              type: 'string',
              required: true,
              minLength: 1,
            },
            theme: {
              type: 'string',
              required: true,
              enum: ['light', 'dark', 'auto'],
            },
            application_title: {
              type: 'string',
              required: true,
              minLength: 1,
              maxLength: 50,
            },
            company_name: {
              type: 'string',
              required: true,
              minLength: 1,
              maxLength: 100,
            },
          },
        },
        modules: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            properties: {
              module_id: {
                type: 'string',
                required: true,
                pattern: /^[a-z][a-z0-9\-]*$/,
              },
              enabled: {
                type: 'boolean',
                required: true,
              },
              position: {
                type: 'string',
                required: true,
                enum: ['sidebar', 'main', 'modal', 'header', 'footer'],
              },
              priority: {
                type: 'number',
                required: true,
                min: 0,
                max: 100,
              },
              lazy: {
                type: 'boolean',
                required: true,
              },
              settings: {
                type: 'object',
                required: true,
              },
              permissions: {
                type: 'array',
                required: true,
                items: {
                  type: 'string',
                },
              },
              dependencies: {
                type: 'array',
                required: true,
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        features: {
          type: 'object',
          required: true,
          properties: {
            recording_controls: { type: 'boolean', required: true },
            screen_sharing: { type: 'boolean', required: true },
            file_uploads: { type: 'boolean', required: true },
            chat_functionality: { type: 'boolean', required: true },
            supervisor_monitoring: { type: 'boolean', required: true },
            analytics_dashboard: { type: 'boolean', required: true },
            custom_scripts: { type: 'boolean', required: true },
            third_party_integrations: { type: 'boolean', required: true },
            advanced_routing: { type: 'boolean', required: true },
            real_time_reporting: { type: 'boolean', required: true },
            voice_analytics: { type: 'boolean', required: true },
            sentiment_analysis: { type: 'boolean', required: true },
          },
        },
        integrations: {
          type: 'array',
          required: true,
        },
        deployment: {
          type: 'object',
          required: true,
          properties: {
            domain: {
              type: 'string',
              required: true,
              pattern: /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
            },
            environment: {
              type: 'string',
              required: true,
              enum: ['development', 'staging', 'production'],
            },
            region: {
              type: 'string',
              required: true,
              pattern: /^[a-z]{2}-[a-z]+-\d+$/,
            },
          },
        },
        createdAt: {
          type: 'string',
          required: true,
          custom: (value) => {
            if (typeof value === 'string') {
              const date = new Date(value);
              return isNaN(date.getTime()) ? 'Invalid date format' : null;
            }
            return value instanceof Date ? null : 'Must be a Date object or ISO string';
          },
        },
        updatedAt: {
          type: 'string',
          required: true,
          custom: (value) => {
            if (typeof value === 'string') {
              const date = new Date(value);
              return isNaN(date.getTime()) ? 'Invalid date format' : null;
            }
            return value instanceof Date ? null : 'Must be a Date object or ISO string';
          },
        },
      },
    });

    // Module configuration schema
    this.schemas.set('ModuleConfig', {
      type: 'object',
      properties: {
        module_id: {
          type: 'string',
          required: true,
          pattern: /^[a-z][a-z0-9\-]*$/,
        },
        enabled: {
          type: 'boolean',
          required: true,
        },
        position: {
          type: 'string',
          required: true,
          enum: ['sidebar', 'main', 'modal', 'header', 'footer'],
        },
        priority: {
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
        lazy: {
          type: 'boolean',
          required: true,
        },
        settings: {
          type: 'object',
          required: true,
        },
        permissions: {
          type: 'array',
          required: true,
          items: {
            type: 'string',
          },
        },
        dependencies: {
          type: 'array',
          required: true,
          items: {
            type: 'string',
          },
        },
      },
    });
  }

  /**
   * Validate object against schema
   */
  private validateAgainstSchema(
    obj: Record<string, unknown>,
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (schema.type === 'object' && schema.properties) {
      // Validate required properties
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const fullPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (propSchema.required && (value === undefined || value === null)) {
          errors.push({
            field: fullPath,
            message: `Required field '${fullPath}' is missing`,
            code: 'REQUIRED_FIELD_MISSING',
            severity: 'error',
          });
          continue;
        }

        if (value !== undefined && value !== null) {
          this.validateValue(value, propSchema, fullPath, errors, warnings);
        }
      }

      // Check for unknown properties
      for (const key of Object.keys(obj)) {
        if (!schema.properties[key]) {
          warnings.push({
            field: path ? `${path}.${key}` : key,
            message: `Unknown property '${key}'`,
            code: 'UNKNOWN_PROPERTY',
            recommendation: 'Remove unknown property or add it to the schema',
          });
        }
      }
    } else {
      // Validate the object itself
      this.validateValue(obj, schema, path, errors, warnings);
    }
  }

  /**
   * Validate a single value against schema
   */
  private validateValue(
    value: unknown,
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    // Type validation
    if (!this.validateType(value, schema.type)) {
      errors.push({
        field: path,
        message: `Expected type '${schema.type}', got '${typeof value}'`,
        code: 'INVALID_TYPE',
        severity: 'error',
      });
      return;
    }

    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      this.validateString(value, schema, path, errors, warnings);
    }

    // Number validations
    if (schema.type === 'number' && typeof value === 'number') {
      this.validateNumber(value, schema, path, errors, warnings);
    }

    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
      this.validateArray(value, schema, path, errors, warnings);
    }

    // Object validations
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      this.validateObject(value as Record<string, unknown>, schema, path, errors, warnings);
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: 'INVALID_ENUM_VALUE',
        severity: 'error',
      });
    }

    // Custom validation
    if (schema.custom) {
      const customError = schema.custom(value);
      if (customError) {
        errors.push({
          field: path,
          message: customError,
          code: 'CUSTOM_VALIDATION_FAILED',
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate type
   */
  private validateType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate string value
   */
  private validateString(
    value: string,
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        field: path,
        message: `String must be at least ${schema.minLength} characters long`,
        code: 'STRING_TOO_SHORT',
        severity: 'error',
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        field: path,
        message: `String must be at most ${schema.maxLength} characters long`,
        code: 'STRING_TOO_LONG',
        severity: 'error',
      });
    }

    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push({
        field: path,
        message: `String does not match required pattern: ${schema.pattern.source}`,
        code: 'INVALID_PATTERN',
        severity: 'error',
      });
    }
  }

  /**
   * Validate number value
   */
  private validateNumber(
    value: number,
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field: path,
        message: `Number must be at least ${schema.min}`,
        code: 'NUMBER_TOO_SMALL',
        severity: 'error',
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field: path,
        message: `Number must be at most ${schema.max}`,
        code: 'NUMBER_TOO_LARGE',
        severity: 'error',
      });
    }
  }

  /**
   * Validate array value
   */
  private validateArray(
    value: unknown[],
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (schema.items) {
      value.forEach((item, index) => {
        this.validateValue(item, schema.items!, `${path}[${index}]`, errors, warnings);
      });
    }
  }

  /**
   * Validate object value
   */
  private validateObject(
    value: Record<string, unknown>,
    schema: ValidationSchema,
    path: string,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    if (schema.properties) {
      this.validateAgainstSchema(value, schema, path, errors, warnings);
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(
    config: Record<string, unknown>,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    // Validate module dependencies
    if (config.modules && Array.isArray(config.modules)) {
      this.validateModuleDependencies(config.modules, errors, warnings);
    }

    // Validate integration consistency
    if (config.integrations && Array.isArray(config.integrations)) {
      this.validateIntegrations(config.integrations, errors, warnings);
    }

    // Validate deployment consistency
    if (config.deployment && typeof config.deployment === 'object') {
      this.validateDeployment(config.deployment as Record<string, unknown>, errors, warnings);
    }
  }

  /**
   * Validate module dependencies
   */
  private validateModuleDependencies(
    modules: unknown[],
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    const moduleIds = new Set<string>();
    const moduleMap = new Map<string, unknown>();

    // Build module map and check for duplicates
    modules.forEach((module, index) => {
      if (typeof module === 'object' && module !== null) {
        const moduleObj = module as Record<string, unknown>;
        const moduleId = moduleObj.module_id as string;

        if (moduleId) {
          if (moduleIds.has(moduleId)) {
            errors.push({
              field: `modules[${index}].module_id`,
              message: `Duplicate module ID: ${moduleId}`,
              code: 'DUPLICATE_MODULE_ID',
              severity: 'error',
            });
          } else {
            moduleIds.add(moduleId);
            moduleMap.set(moduleId, module);
          }
        }
      }
    });

    // Check dependencies
    modules.forEach((module, index) => {
      if (typeof module === 'object' && module !== null) {
        const moduleObj = module as Record<string, unknown>;
        const dependencies = moduleObj.dependencies as string[];

        if (Array.isArray(dependencies)) {
          dependencies.forEach((dep, depIndex) => {
            if (!moduleIds.has(dep)) {
              errors.push({
                field: `modules[${index}].dependencies[${depIndex}]`,
                message: `Module dependency '${dep}' not found`,
                code: 'MISSING_MODULE_DEPENDENCY',
                severity: 'error',
              });
            }
          });
        }
      }
    });
  }

  /**
   * Validate integrations
   */
  private validateIntegrations(
    integrations: unknown[],
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    const integrationNames = new Set<string>();

    integrations.forEach((integration, index) => {
      if (typeof integration === 'object' && integration !== null) {
        const integrationObj = integration as Record<string, unknown>;
        const name = integrationObj.name as string;

        if (name) {
          if (integrationNames.has(name)) {
            errors.push({
              field: `integrations[${index}].name`,
              message: `Duplicate integration name: ${name}`,
              code: 'DUPLICATE_INTEGRATION_NAME',
              severity: 'error',
            });
          } else {
            integrationNames.add(name);
          }
        }
      }
    });
  }

  /**
   * Validate deployment configuration
   */
  private validateDeployment(
    deployment: Record<string, unknown>,
    errors: ConfigValidationError[],
    warnings: ConfigValidationWarning[]
  ): void {
    const environment = deployment.environment as string;
    const domain = deployment.domain as string;

    // Environment-specific validations
    if (environment === 'production') {
      if (domain && (domain.includes('localhost') || domain.includes('127.0.0.1'))) {
        errors.push({
          field: 'deployment.domain',
          message: 'Production environment cannot use localhost domain',
          code: 'INVALID_PRODUCTION_DOMAIN',
          severity: 'error',
        });
      }
    }

    if (environment === 'development') {
      if (domain && !domain.includes('localhost') && !domain.includes('127.0.0.1') && !domain.includes('dev')) {
        warnings.push({
          field: 'deployment.domain',
          message: 'Development environment should typically use localhost or dev domain',
          code: 'UNUSUAL_DEVELOPMENT_DOMAIN',
          recommendation: 'Consider using localhost or a dev subdomain for development',
        });
      }
    }
  }
}