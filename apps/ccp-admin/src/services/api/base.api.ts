/**
 * @fileoverview Base API service with common functionality
 * @module services/api/base
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { 
  ConfigService, 
  type IConfigService,
  type ConfigServiceOptions 
} from '@agent-desktop/config';
import { Logger } from '@agent-desktop/logging';
import { apiConfig, defaultHeaders, timeoutConfig } from '../config/api.config';
import { ErrorHandler, type APIError } from '../errors';
import type { APIResponse, PaginatedResponse } from '../types';

/**
 * Request interceptor context for logging and tracking
 */
interface RequestContext {
  readonly requestId: string;
  readonly startTime: number;
  readonly method: string;
  readonly url: string;
}

/**
 * Base API service class providing common HTTP operations and error handling
 * All domain-specific API services should extend this class
 */
export abstract class BaseAPIService {
  /**
   * Axios instance for HTTP requests
   */
  protected readonly client: AxiosInstance;

  /**
   * Configuration service for accessing customer configs
   */
  protected readonly configService: IConfigService;

  /**
   * Logger instance for service-specific logging
   */
  protected readonly logger: Logger;

  /**
   * Request tracking for correlation and debugging
   */
  private readonly requestTracker = new Map<string, RequestContext>();

  constructor(
    configService?: IConfigService,
    logger?: Logger,
    baseURL = apiConfig.baseURL
  ) {
    // Initialize configuration service
    this.configService = configService || new ConfigService({
      environment: 'production',
      customerId: 'admin-dashboard',
    } as ConfigServiceOptions);

    // Initialize logger
    this.logger = logger?.createChild(this.constructor.name) || new Logger({
      service: this.constructor.name,
      level: 'info',
    });

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL,
      timeout: apiConfig.timeout,
      headers: { ...defaultHeaders },
    });

    // Set up request and response interceptors
    this.setupInterceptors();

    this.logger.info('API service initialized', {
      baseURL,
      timeout: apiConfig.timeout,
    });
  }

  /**
   * Setup axios request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for logging and adding correlation IDs
    this.client.interceptors.request.use(
      (config) => {
        const requestId = this.generateRequestId();
        const context: RequestContext = {
          requestId,
          startTime: Date.now(),
          method: config.method?.toUpperCase() || 'UNKNOWN',
          url: config.url || 'unknown',
        };

        // Add request ID to headers
        config.headers = {
          ...config.headers,
          'X-Request-ID': requestId,
        };

        // Store context for response logging
        this.requestTracker.set(requestId, context);

        this.logger.debug('API request started', {
          requestId,
          method: context.method,
          url: context.url,
          headers: this.sanitizeHeaders(config.headers),
        });

        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error });
        return Promise.reject(ErrorHandler.normalize(error));
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        const requestId = response.config.headers?.['X-Request-ID'] as string;
        const context = this.requestTracker.get(requestId);

        if (context) {
          const duration = Date.now() - context.startTime;
          
          this.logger.info('API request completed', {
            requestId,
            method: context.method,
            url: context.url,
            status: response.status,
            duration,
          });

          // Clean up tracking
          this.requestTracker.delete(requestId);
        }

        return response;
      },
      (error) => {
        const requestId = error.config?.headers?.['X-Request-ID'] as string;
        const context = this.requestTracker.get(requestId);

        if (context) {
          const duration = Date.now() - context.startTime;
          
          this.logger.error('API request failed', {
            requestId,
            method: context.method,
            url: context.url,
            status: error.response?.status,
            duration,
            error: error.message,
          });

          // Clean up tracking
          this.requestTracker.delete(requestId);
        }

        return Promise.reject(ErrorHandler.normalize(error));
      }
    );
  }

  /**
   * Generic GET request with type safety
   */
  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.get<APIResponse<T>>(endpoint, config);
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Generic POST request with type safety
   */
  protected async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.post<APIResponse<T>>(endpoint, data, config);
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Generic PUT request with type safety
   */
  protected async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.put<APIResponse<T>>(endpoint, data, config);
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'PUT', endpoint);
    }
  }

  /**
   * Generic PATCH request with type safety
   */
  protected async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.patch<APIResponse<T>>(endpoint, data, config);
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'PATCH', endpoint);
    }
  }

  /**
   * Generic DELETE request with type safety
   */
  protected async delete<T = void>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.delete<APIResponse<T>>(endpoint, config);
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'DELETE', endpoint);
    }
  }

  /**
   * GET request with pagination support
   */
  protected async getPaginated<ItemType>(
    endpoint: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<ItemType>> {
    try {
      const response = await this.client.get<APIResponse<PaginatedResponse<ItemType>>>(
        endpoint,
        {
          ...config,
          params: {
            ...config?.params,
            ...params,
          },
        }
      );
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Upload file with progress tracking
   */
  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post<APIResponse<T>>(
        endpoint,
        formData,
        {
          ...config,
          headers: {
            ...config?.headers,
            'Content-Type': 'multipart/form-data',
          },
          timeout: timeoutConfig.fileOperations,
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Download file with progress tracking
   */
  protected async downloadFile(
    endpoint: string,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<Blob> {
    try {
      const response = await this.client.get(endpoint, {
        ...config,
        responseType: 'blob',
        timeout: timeoutConfig.fileOperations,
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Execute bulk operations with proper timeout
   */
  protected async executeBulk<T, D = unknown>(
    endpoint: string,
    data: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.post<APIResponse<T>>(
        endpoint,
        data,
        {
          ...config,
          timeout: timeoutConfig.bulkOperations,
        }
      );
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Execute analytics queries with proper timeout
   */
  protected async executeAnalytics<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.get<APIResponse<T>>(
        endpoint,
        {
          ...config,
          params: {
            ...config?.params,
            ...params,
          },
          timeout: timeoutConfig.analytics,
        }
      );
      return this.extractData(response);
    } catch (error) {
      throw this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Extract data from API response wrapper
   */
  private extractData<T>(response: AxiosResponse<APIResponse<T>>): T {
    const { data: responseData } = response;

    if (!responseData.success) {
      throw new Error(responseData.error?.message || 'API request failed');
    }

    if (responseData.data === undefined) {
      throw new Error('Response data is missing');
    }

    return responseData.data;
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown, method: string, endpoint: string): APIError {
    const apiError = ErrorHandler.normalize(error);
    
    this.logger.error('API operation failed', {
      method,
      endpoint,
      status: apiError.status,
      code: apiError.code,
      message: apiError.message,
    });

    return apiError;
  }

  /**
   * Generate unique request ID for correlation
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Set authentication token for requests
   */
  public setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.logger.debug('Authentication token set');
  }

  /**
   * Remove authentication token
   */
  public clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
    this.logger.debug('Authentication token cleared');
  }

  /**
   * Update base URL for the client
   */
  public setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
    this.logger.info('Base URL updated', { baseURL });
  }

  /**
   * Get current request statistics
   */
  public getRequestStats(): {
    activeRequests: number;
    oldestRequestAge: number | null;
  } {
    const now = Date.now();
    const activeRequests = this.requestTracker.size;
    let oldestRequestAge: number | null = null;

    if (activeRequests > 0) {
      const oldestRequest = Math.min(
        ...Array.from(this.requestTracker.values()).map(ctx => ctx.startTime)
      );
      oldestRequestAge = now - oldestRequest;
    }

    return {
      activeRequests,
      oldestRequestAge,
    };
  }

  /**
   * Health check for the API service
   */
  public async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await this.client.get('/health', {
        timeout: timeoutConfig.realtime,
      });
      
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.warn('Health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date(),
      };
    }
  }
}