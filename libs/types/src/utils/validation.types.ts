/**
 * @fileoverview Validation types and schemas
 * @module @agent-desktop/types/utils/validation
 */

/**
 * Validation rule types
 */
export type ValidationRuleType = 
  | 'required'
  | 'email'
  | 'phone'
  | 'url'
  | 'regex'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'enum'
  | 'custom';

/**
 * Validation rule interface
 */
export interface ValidationRule {
  readonly type: ValidationRuleType;
  readonly value?: unknown;
  readonly message: string;
  readonly validator?: (value: unknown) => boolean | Promise<boolean>;
}

/**
 * Field validation schema
 */
export interface FieldSchema {
  readonly required?: boolean;
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  readonly rules: readonly ValidationRule[];
  readonly defaultValue?: unknown;
  readonly sanitize?: (value: unknown) => unknown;
}

/**
 * Object validation schema
 */
export interface ObjectSchema {
  readonly fields: Record<string, FieldSchema>;
  readonly strict?: boolean;
  readonly allowUnknown?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings?: readonly ValidationWarning[];
  readonly value?: unknown;
}

/**
 * Validation error
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
  readonly rule?: ValidationRule;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}