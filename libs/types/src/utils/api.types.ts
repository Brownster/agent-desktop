/**
 * @fileoverview API-related types for HTTP communication
 * @module @agent-desktop/types/utils/api
 */

import type { PaginatedResponse, Result } from './common.types';

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP status codes
 */
export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly params?: Record<string, string | number | boolean>;
  readonly data?: unknown;
  readonly timeout?: number;
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly validateStatus?: (status: number) => boolean;
}

/**
 * API response interface
 */
export interface ApiResponse<T = unknown> {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly config: ApiRequestConfig;
  readonly request?: unknown;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  readonly error: ApiError;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly config: ApiRequestConfig;
}

/**
 * API error information
 */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly errors?: readonly ValidationError[];
  readonly timestamp: string;
  readonly path: string;
  readonly traceId?: string;
}

/**
 * Validation error for API requests
 */
export interface ValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
  readonly value?: unknown;
}

/**
 * API client interface
 */
export interface ApiClient {
  /**
   * Make a generic API request
   */
  request<T>(config: ApiRequestConfig): Promise<Result<ApiResponse<T>, ApiErrorResponse>>;
  
  /**
   * Make a GET request
   */
  get<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<Result<T, ApiErrorResponse>>;
  
  /**
   * Make a POST request
   */
  post<T>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<Result<T, ApiErrorResponse>>;
  
  /**
   * Make a PUT request
   */
  put<T>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<Result<T, ApiErrorResponse>>;
  
  /**
   * Make a PATCH request
   */
  patch<T>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<Result<T, ApiErrorResponse>>;
  
  /**
   * Make a DELETE request
   */
  delete<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<Result<T, ApiErrorResponse>>;
}

/**
 * API pagination request parameters
 */
export interface ApiPaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly offset?: number;
  readonly sort?: string;
  readonly order?: 'asc' | 'desc';
}

/**
 * API paginated response wrapper
 */
export interface ApiPaginatedResponse<T> extends PaginatedResponse<T> {
  readonly links: PaginationLinks;
  readonly meta: PaginationMeta;
}

/**
 * Pagination links for navigation
 */
export interface PaginationLinks {
  readonly first?: string;
  readonly prev?: string;
  readonly next?: string;
  readonly last?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  readonly currentPage: number;
  readonly itemsPerPage: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * API request interceptor
 */
export interface RequestInterceptor {
  readonly name: string;
  readonly priority: number;
  
  /**
   * Intercept and modify request before sending
   */
  onRequest(config: ApiRequestConfig): Promise<ApiRequestConfig> | ApiRequestConfig;
  
  /**
   * Handle request errors
   */
  onRequestError?(error: Error): Promise<Error> | Error;
}

/**
 * API response interceptor
 */
export interface ResponseInterceptor {
  readonly name: string;
  readonly priority: number;
  
  /**
   * Intercept and modify successful responses
   */
  onResponse<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> | ApiResponse<T>;
  
  /**
   * Handle response errors
   */
  onResponseError?(error: ApiErrorResponse): Promise<ApiErrorResponse> | ApiErrorResponse;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  readonly baseURL: string;
  readonly timeout: number;
  readonly headers: Record<string, string>;
  readonly retries: number;
  readonly retryDelay: number;
  readonly requestInterceptors: readonly RequestInterceptor[];
  readonly responseInterceptors: readonly ResponseInterceptor[];
  readonly validateStatus: (status: number) => boolean;
}

/**
 * Webhook payload interface
 */
export interface WebhookPayload<T = unknown> {
  readonly id: string;
  readonly event: string;
  readonly timestamp: string;
  readonly data: T;
  readonly version: string;
  readonly signature?: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  readonly url: string;
  readonly events: readonly string[];
  readonly secret?: string;
  readonly headers?: Record<string, string>;
  readonly timeout: number;
  readonly retries: number;
  readonly enabled: boolean;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
  readonly retryAfter?: number;
}

/**
 * API health check response
 */
export interface ApiHealthResponse {
  readonly status: 'ok' | 'degraded' | 'error';
  readonly timestamp: string;
  readonly version: string;
  readonly uptime: number;
  readonly dependencies: readonly DependencyHealth[];
  readonly metrics?: Record<string, number>;
}

/**
 * Dependency health information
 */
export interface DependencyHealth {
  readonly name: string;
  readonly status: 'ok' | 'error';
  readonly responseTime?: number;
  readonly lastChecked: string;
  readonly error?: string;
}