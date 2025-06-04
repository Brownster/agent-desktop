/**
 * @fileoverview API error classes and error handling utilities
 * @module services/errors/api
 */

import type { APIErrorDetails, ValidationErrorDetail } from '../types/api.types';

/**
 * Base API error class
 * Extends Error with additional API-specific information
 */
export class APIError extends Error {
  /**
   * HTTP status code of the error response
   */
  public readonly status: number;

  /**
   * Machine-readable error code
   */
  public readonly code: string;

  /**
   * Additional error details and context
   */
  public readonly details?: unknown;

  /**
   * Request ID for tracing
   */
  public readonly requestId?: string;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Check if this is a client error (4xx status)
   */
  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx status)
   */
  public isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this error should be retried
   */
  public isRetryable(): boolean {
    // Retry server errors and some specific client errors
    return this.isServerError() || this.status === 408 || this.status === 429;
  }

  /**
   * Convert error to JSON for logging
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      requestId: this.requestId,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Validation error class for form and data validation failures
 */
export class ValidationError extends APIError {
  /**
   * Array of validation error details
   */
  public readonly validationErrors: readonly ValidationErrorDetail[];

  constructor(
    validationErrors: readonly ValidationErrorDetail[],
    message = 'Validation failed',
    requestId?: string
  ) {
    super(400, 'VALIDATION_ERROR', message, validationErrors, requestId);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }

  /**
   * Get validation errors for a specific field
   */
  public getFieldErrors(field: string): readonly ValidationErrorDetail[] {
    return this.validationErrors.filter(error => error.field === field);
  }

  /**
   * Check if a specific field has validation errors
   */
  public hasFieldError(field: string): boolean {
    return this.validationErrors.some(error => error.field === field);
  }

  /**
   * Get all field names that have validation errors
   */
  public getErrorFields(): readonly string[] {
    return [...new Set(this.validationErrors.map(error => error.field))];
  }
}

/**
 * Network error class for connection and network-related failures
 */
export class NetworkError extends APIError {
  constructor(message = 'Network request failed', originalError?: Error) {
    super(0, 'NETWORK_ERROR', message, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout error class for request timeout failures
 */
export class TimeoutError extends APIError {
  constructor(timeout: number, message = `Request timed out after ${timeout}ms`) {
    super(408, 'TIMEOUT_ERROR', message, { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Authentication error class for auth-related failures
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(401, 'AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class for permission-related failures
 */
export class AuthorizationError extends APIError {
  constructor(message = 'Access denied', details?: unknown) {
    super(403, 'AUTHORIZATION_ERROR', message, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class for resource not found failures
 */
export class NotFoundError extends APIError {
  constructor(resource = 'Resource', id?: string) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(404, 'NOT_FOUND_ERROR', message, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class for resource conflict failures
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(409, 'CONFLICT_ERROR', message, details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class for rate limiting failures
 */
export class RateLimitError extends APIError {
  /**
   * Time until rate limit resets (in seconds)
   */
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, message = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_ERROR', message, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Server error class for internal server errors
 */
export class ServerError extends APIError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, 'SERVER_ERROR', message, details);
    this.name = 'ServerError';
  }
}

/**
 * Service unavailable error class for service downtime
 */
export class ServiceUnavailableError extends APIError {
  /**
   * Time until service becomes available (in seconds)
   */
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, message = 'Service temporarily unavailable') {
    super(503, 'SERVICE_UNAVAILABLE_ERROR', message, { retryAfter });
    this.name = 'ServiceUnavailableError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Convert unknown error to standardized APIError
   */
  static normalize(error: unknown): APIError {
    // Already an APIError
    if (error instanceof APIError) {
      return error;
    }

    // Axios error
    if (this.isAxiosError(error)) {
      return this.fromAxiosError(error);
    }

    // Standard Error
    if (error instanceof Error) {
      return new APIError(500, 'UNKNOWN_ERROR', error.message, { originalError: error });
    }

    // Unknown error type
    return new APIError(500, 'UNKNOWN_ERROR', 'An unexpected error occurred', { originalError: error });
  }

  /**
   * Check if error is an Axios error
   */
  private static isAxiosError(error: unknown): error is {
    isAxiosError: boolean;
    response?: {
      status: number;
      data?: {
        code?: string;
        message?: string;
        details?: unknown;
        validationErrors?: ValidationErrorDetail[];
        requestId?: string;
      };
    };
    message: string;
    code?: string;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      error.isAxiosError === true
    );
  }

  /**
   * Convert Axios error to APIError
   */
  private static fromAxiosError(error: {
    response?: {
      status: number;
      data?: {
        code?: string;
        message?: string;
        details?: unknown;
        validationErrors?: ValidationErrorDetail[];
        requestId?: string;
      };
    };
    message: string;
    code?: string;
  }): APIError {
    const status = error.response?.status || 0;
    const data = error.response?.data;
    const code = data?.code || this.getDefaultErrorCode(status);
    const message = data?.message || error.message || this.getDefaultErrorMessage(status);
    const details = data?.details;
    const requestId = data?.requestId;

    // Handle validation errors
    if (status === 400 && data?.validationErrors) {
      return new ValidationError(data.validationErrors, message, requestId);
    }

    // Handle specific error types based on status code
    switch (status) {
      case 401:
        return new AuthenticationError(message, details);
      case 403:
        return new AuthorizationError(message, details);
      case 404:
        return new NotFoundError('Resource', undefined);
      case 408:
        return new TimeoutError(0, message);
      case 409:
        return new ConflictError(message, details);
      case 429:
        const retryAfter = this.extractRetryAfter(error.response);
        return new RateLimitError(retryAfter, message);
      case 500:
        return new ServerError(message, details);
      case 503:
        const serviceRetryAfter = this.extractRetryAfter(error.response);
        return new ServiceUnavailableError(serviceRetryAfter, message);
      default:
        // Network error (no response)
        if (status === 0) {
          return new NetworkError(message, new Error(error.message));
        }
        return new APIError(status, code, message, details, requestId);
    }
  }

  /**
   * Extract retry-after header value
   */
  private static extractRetryAfter(response?: { headers?: Record<string, string> }): number | undefined {
    const retryAfterHeader = response?.headers?.['retry-after'];
    if (retryAfterHeader) {
      const retryAfter = parseInt(retryAfterHeader, 10);
      return isNaN(retryAfter) ? undefined : retryAfter;
    }
    return undefined;
  }

  /**
   * Get default error code for status
   */
  private static getDefaultErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 408: return 'TIMEOUT';
      case 409: return 'CONFLICT';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get default error message for status
   */
  private static getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400: return 'Bad request';
      case 401: return 'Authentication required';
      case 403: return 'Access denied';
      case 404: return 'Resource not found';
      case 408: return 'Request timeout';
      case 409: return 'Resource conflict';
      case 429: return 'Too many requests';
      case 500: return 'Internal server error';
      case 502: return 'Bad gateway';
      case 503: return 'Service unavailable';
      case 504: return 'Gateway timeout';
      default: return 'An error occurred';
    }
  }

  /**
   * Check if error should be retried
   */
  static shouldRetry(error: APIError, retryCount: number, maxRetries: number): boolean {
    if (retryCount >= maxRetries) {
      return false;
    }

    return error.isRetryable();
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(retryCount: number, baseDelay = 1000, maxDelay = 30000): number {
    const delay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Format error for display to users
   */
  static formatForUser(error: APIError): string {
    // Don't expose technical details to users
    switch (error.status) {
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
}