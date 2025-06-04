/**
 * @fileoverview Unit tests for BaseAPIService
 * @module services/api/__tests__/base.api
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BaseAPIService } from '../base.api';
import { ErrorHandler, APIError, NetworkError } from '../../errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config service and logger
const mockConfigService = {
  get: jest.fn(),
  set: jest.fn(),
  watch: jest.fn(),
} as any;

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  createChild: jest.fn().mockReturnThis(),
} as any;

// Test implementation of BaseAPIService
class TestAPIService extends BaseAPIService {
  constructor() {
    super(mockConfigService, mockLogger, 'https://api.test.com');
  }

  public async testGet<T>(endpoint: string): Promise<T> {
    return this.get<T>(endpoint);
  }

  public async testPost<T, D>(endpoint: string, data: D): Promise<T> {
    return this.post<T, D>(endpoint, data);
  }

  public async testPut<T, D>(endpoint: string, data: D): Promise<T> {
    return this.put<T, D>(endpoint, data);
  }

  public async testPatch<T, D>(endpoint: string, data: D): Promise<T> {
    return this.patch<T, D>(endpoint, data);
  }

  public async testDelete<T>(endpoint: string): Promise<T> {
    return this.delete<T>(endpoint);
  }

  public async testGetPaginated<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.getPaginated<T>(endpoint, params);
  }

  public async testUploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    return this.uploadFile<T>(endpoint, file, onProgress);
  }

  public async testExecuteBulk<T, D>(endpoint: string, data: D): Promise<T> {
    return this.executeBulk<T, D>(endpoint, data);
  }

  public async testExecuteAnalytics<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.executeAnalytics<T>(endpoint, params);
  }
}

describe('BaseAPIService', () => {
  let service: TestAPIService;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      defaults: {
        headers: {
          common: {},
        },
        baseURL: '',
      },
    } as any;

    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create service instance
    service = new TestAPIService();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 30000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }),
      });
    });

    it('should set up request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    const mockSuccessResponse = {
      data: {
        success: true,
        data: { id: '123', name: 'Test' },
        timestamp: new Date().toISOString(),
        requestId: 'req_123',
      },
    } as AxiosResponse;

    describe('GET requests', () => {
      it('should make GET request and extract data', async () => {
        mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse);

        const result = await service.testGet('/test');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
        expect(result).toEqual({ id: '123', name: 'Test' });
      });

      it('should handle GET request errors', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.get.mockRejectedValue(error);

        await expect(service.testGet('/test')).rejects.toThrow(APIError);
      });
    });

    describe('POST requests', () => {
      it('should make POST request with data', async () => {
        const requestData = { name: 'New Test' };
        mockAxiosInstance.post.mockResolvedValue(mockSuccessResponse);

        const result = await service.testPost('/test', requestData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData, undefined);
        expect(result).toEqual({ id: '123', name: 'Test' });
      });

      it('should handle POST request errors', async () => {
        const error = new Error('Validation error');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(service.testPost('/test', {})).rejects.toThrow(APIError);
      });
    });

    describe('PUT requests', () => {
      it('should make PUT request with data', async () => {
        const requestData = { name: 'Updated Test' };
        mockAxiosInstance.put.mockResolvedValue(mockSuccessResponse);

        const result = await service.testPut('/test/123', requestData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/123', requestData, undefined);
        expect(result).toEqual({ id: '123', name: 'Test' });
      });
    });

    describe('PATCH requests', () => {
      it('should make PATCH request with data', async () => {
        const requestData = { name: 'Patched Test' };
        mockAxiosInstance.patch.mockResolvedValue(mockSuccessResponse);

        const result = await service.testPatch('/test/123', requestData);

        expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/123', requestData, undefined);
        expect(result).toEqual({ id: '123', name: 'Test' });
      });
    });

    describe('DELETE requests', () => {
      it('should make DELETE request', async () => {
        const deleteResponse = {
          data: {
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.delete.mockResolvedValue(deleteResponse);

        const result = await service.testDelete('/test/123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/123', undefined);
        expect(result).toBeNull();
      });
    });
  });

  describe('specialized methods', () => {
    describe('getPaginated', () => {
      it('should make paginated GET request with params', async () => {
        const paginatedResponse = {
          data: {
            success: true,
            data: {
              items: [{ id: '1' }, { id: '2' }],
              total: 2,
              page: 1,
              pageSize: 10,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.get.mockResolvedValue(paginatedResponse);

        const params = { page: 1, pageSize: 10 };
        const result = await service.testGetPaginated('/test', params);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
          params: expect.objectContaining(params),
        });
        expect(result).toEqual(expect.objectContaining({
          items: [{ id: '1' }, { id: '2' }],
          total: 2,
        }));
      });
    });

    describe('uploadFile', () => {
      it('should upload file with FormData', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const uploadResponse = {
          data: {
            success: true,
            data: { fileId: 'file_123', url: 'https://cdn.test.com/file_123' },
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.post.mockResolvedValue(uploadResponse);

        const result = await service.testUploadFile('/upload', file);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/upload',
          expect.any(FormData),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'multipart/form-data',
            }),
            timeout: 300000, // File operation timeout
          })
        );
        expect(result).toEqual({ fileId: 'file_123', url: 'https://cdn.test.com/file_123' });
      });

      it('should call progress callback during upload', async () => {
        const file = new File(['test content'], 'test.txt');
        const progressCallback = jest.fn();
        const uploadResponse = {
          data: {
            success: true,
            data: { fileId: 'file_123' },
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.post.mockImplementation((url, data, config) => {
          // Simulate upload progress
          if (config?.onUploadProgress) {
            config.onUploadProgress({ loaded: 50, total: 100 } as any);
            config.onUploadProgress({ loaded: 100, total: 100 } as any);
          }
          return Promise.resolve(uploadResponse);
        });

        await service.testUploadFile('/upload', file, progressCallback);

        expect(progressCallback).toHaveBeenCalledWith(50);
        expect(progressCallback).toHaveBeenCalledWith(100);
      });
    });

    describe('executeBulk', () => {
      it('should execute bulk operation with extended timeout', async () => {
        const bulkData = { operations: [{ action: 'create' }, { action: 'update' }] };
        const bulkResponse = {
          data: {
            success: true,
            data: { total: 2, successful: 2, failed: 0 },
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.post.mockResolvedValue(bulkResponse);

        const result = await service.testExecuteBulk('/bulk', bulkData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/bulk',
          bulkData,
          expect.objectContaining({
            timeout: 600000, // Bulk operation timeout
          })
        );
        expect(result).toEqual({ total: 2, successful: 2, failed: 0 });
      });
    });

    describe('executeAnalytics', () => {
      it('should execute analytics query with analytics timeout', async () => {
        const params = { timeRange: { start: '2024-01-01', end: '2024-01-31' } };
        const analyticsResponse = {
          data: {
            success: true,
            data: { metrics: [{ date: '2024-01-01', value: 100 }] },
            timestamp: new Date().toISOString(),
            requestId: 'req_123',
          },
        } as AxiosResponse;

        mockAxiosInstance.get.mockResolvedValue(analyticsResponse);

        const result = await service.testExecuteAnalytics('/analytics', params);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          '/analytics',
          expect.objectContaining({
            params: expect.objectContaining(params),
            timeout: 60000, // Analytics timeout
          })
        );
        expect(result).toEqual({ metrics: [{ date: '2024-01-01', value: 100 }] });
      });
    });
  });

  describe('error handling', () => {
    it('should normalize and re-throw errors', async () => {
      const originalError = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(originalError);

      await expect(service.testGet('/test')).rejects.toThrow(APIError);
    });

    it('should handle API response errors', async () => {
      const errorResponse = {
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
          timestamp: new Date().toISOString(),
          requestId: 'req_123',
        },
      } as AxiosResponse;

      mockAxiosInstance.get.mockResolvedValue(errorResponse);

      await expect(service.testGet('/test')).rejects.toThrow('Invalid input data');
    });

    it('should handle missing response data', async () => {
      const incompleteResponse = {
        data: {
          success: true,
          // Missing data field
          timestamp: new Date().toISOString(),
          requestId: 'req_123',
        },
      } as AxiosResponse;

      mockAxiosInstance.get.mockResolvedValue(incompleteResponse);

      await expect(service.testGet('/test')).rejects.toThrow('Response data is missing');
    });
  });

  describe('authentication methods', () => {
    it('should set authentication token', () => {
      const token = 'Bearer test-token-123';
      
      service.setAuthToken(token);
      
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should clear authentication token', () => {
      service.setAuthToken('test-token');
      service.clearAuthToken();
      
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('configuration methods', () => {
    it('should update base URL', () => {
      const newBaseURL = 'https://api.new.com';
      
      service.setBaseURL(newBaseURL);
      
      expect(mockAxiosInstance.defaults.baseURL).toBe(newBaseURL);
    });
  });

  describe('utility methods', () => {
    it('should return request statistics', () => {
      const stats = service.getRequestStats();
      
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('oldestRequestAge');
      expect(typeof stats.activeRequests).toBe('number');
    });

    it('should perform health check', async () => {
      const healthResponse = {
        status: 200,
        data: { status: 'healthy' },
      } as AxiosResponse;

      mockAxiosInstance.get.mockResolvedValue(healthResponse);

      const result = await service.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', {
        timeout: 5000,
      });
      expect(result).toEqual({
        status: 'healthy',
        timestamp: expect.any(Date),
      });
    });

    it('should handle health check failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Health check failed'));

      const result = await service.healthCheck();

      expect(result).toEqual({
        status: 'unhealthy',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('request correlation', () => {
    it('should add request ID to headers', () => {
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      
      const config = {
        headers: {},
        method: 'GET',
        url: '/test',
      } as AxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should setup response interceptor', () => {
      // Check if response interceptor exists
      const responseInterceptorCalls = mockAxiosInstance.interceptors.response.use.mock.calls;
      expect(responseInterceptorCalls.length).toBeGreaterThan(0);
      
      // Verify that a response interceptor function was passed
      const responseInterceptor = responseInterceptorCalls[0][0];
      expect(typeof responseInterceptor).toBe('function');
    });
  });
});