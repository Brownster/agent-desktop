/**
 * @fileoverview React Query hooks for module-related API operations
 * @module services/queries/modules
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { ModuleAPIService } from '../api/modules.api';
import { ErrorHandler } from '../errors';
import { cacheKeys, queryConfig } from '../config/api.config';
import type { ModuleFilters, PaginatedResponse } from '../types';
import type {
  ModuleCatalogResponse,
  ModuleInfo,
  ModuleCategory,
  ModuleDependency,
  ModuleDependencyCheck,
  BulkOperationResponse,
} from '../types/responses.types';
import type { ModuleConfig } from '@agent-desktop/types';

/**
 * Module API service instance
 */
const moduleAPI = new ModuleAPIService();

/**
 * Hook for fetching module catalog with categories and filtering
 */
export function useModuleCatalog(
  filters?: ModuleFilters,
  options?: UseQueryOptions<ModuleCatalogResponse>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, filters],
    queryFn: () => moduleAPI.getModuleCatalog(filters),
    staleTime: queryConfig.defaultStaleTime * 2, // Module catalog changes less frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching individual module details
 */
export function useModule(
  moduleId: string,
  options?: UseQueryOptions<ModuleInfo>
) {
  return useQuery({
    queryKey: cacheKeys.module(moduleId),
    queryFn: () => moduleAPI.getModule(moduleId),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime * 2, // Module details change less frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module categories
 */
export function useModuleCategories(
  options?: UseQueryOptions<readonly ModuleCategory[]>
) {
  return useQuery({
    queryKey: cacheKeys.moduleCategories,
    queryFn: () => moduleAPI.getModuleCategories(),
    staleTime: queryConfig.defaultStaleTime * 4, // Categories change very infrequently
    gcTime: queryConfig.defaultGcTime * 2,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching featured modules
 */
export function useFeaturedModules(
  options?: UseQueryOptions<readonly ModuleInfo[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, 'featured'],
    queryFn: () => moduleAPI.getFeaturedModules(),
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching popular modules
 */
export function usePopularModules(
  limit = 10,
  options?: UseQueryOptions<readonly ModuleInfo[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, 'popular', limit],
    queryFn: () => moduleAPI.getPopularModules(limit),
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching recently updated modules
 */
export function useRecentModules(
  limit = 10,
  options?: UseQueryOptions<readonly ModuleInfo[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, 'recent', limit],
    queryFn: () => moduleAPI.getRecentModules(limit),
    staleTime: queryConfig.defaultStaleTime / 2, // Recent modules change more frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for searching modules
 */
export function useSearchModules(
  query: string,
  filters?: Omit<ModuleFilters, 'search'>,
  options?: UseQueryOptions<PaginatedResponse<ModuleInfo>>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, 'search', query, filters],
    queryFn: () => moduleAPI.searchModules(query, filters),
    enabled: !!query && query.trim().length > 0,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching modules by category
 */
export function useModulesByCategory(
  categoryId: string,
  filters?: Omit<ModuleFilters, 'category'>,
  options?: UseQueryOptions<PaginatedResponse<ModuleInfo>>
) {
  return useQuery({
    queryKey: [...cacheKeys.modules, 'category', categoryId, filters],
    queryFn: () => moduleAPI.getModulesByCategory(categoryId, filters),
    enabled: !!categoryId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module dependencies
 */
export function useModuleDependencies(
  moduleId: string,
  options?: UseQueryOptions<readonly ModuleDependency[]>
) {
  return useQuery({
    queryKey: cacheKeys.moduleDependencies(moduleId),
    queryFn: () => moduleAPI.getModuleDependencies(moduleId),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime * 2, // Dependencies change less frequently
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching modules that depend on a specific module
 */
export function useModuleDependents(
  moduleId: string,
  options?: UseQueryOptions<readonly ModuleInfo[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.module(moduleId), 'dependents'],
    queryFn: () => moduleAPI.getModuleDependents(moduleId),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime * 2,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for checking module dependency resolution
 */
export function useCheckDependencyResolution(
  moduleId: string,
  targetCustomerId?: string,
  options?: UseQueryOptions<readonly ModuleDependencyCheck[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.moduleDependencies(moduleId), 'check', targetCustomerId],
    queryFn: () => moduleAPI.checkDependencyResolution(moduleId, targetCustomerId),
    enabled: !!moduleId,
    staleTime: 30000, // Dependency checks are more dynamic
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module installation statistics
 */
export function useModuleStats(
  moduleId: string,
  options?: UseQueryOptions<{
    installCount: number;
    activeInstallations: number;
    rating: number;
    reviewCount: number;
    downloadCount: number;
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.module(moduleId), 'stats'],
    queryFn: () => moduleAPI.getModuleStats(moduleId),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module version history
 */
export function useModuleVersions(
  moduleId: string,
  options?: UseQueryOptions<readonly {
    version: string;
    releaseDate: Date;
    changelog: string;
    downloadCount: number;
    status: 'stable' | 'beta' | 'deprecated';
  }[]>
) {
  return useQuery({
    queryKey: [...cacheKeys.module(moduleId), 'versions'],
    queryFn: () => moduleAPI.getModuleVersions(moduleId),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime * 2,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module reviews
 */
export function useModuleReviews(
  moduleId: string,
  page = 1,
  pageSize = 10,
  options?: UseQueryOptions<PaginatedResponse<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    userId: string;
    userName: string;
    createdAt: Date;
    helpful: number;
  }>>
) {
  return useQuery({
    queryKey: [...cacheKeys.module(moduleId), 'reviews', page, pageSize],
    queryFn: () => moduleAPI.getModuleReviews(moduleId, page, pageSize),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for fetching module compatibility information
 */
export function useModuleCompatibility(
  moduleId: string,
  version?: string,
  options?: UseQueryOptions<{
    coreVersion: string;
    minimumVersion: string;
    maximumVersion?: string;
    deprecated: boolean;
    warnings: readonly string[];
    recommendations: readonly string[];
  }>
) {
  return useQuery({
    queryKey: [...cacheKeys.module(moduleId), 'compatibility', version],
    queryFn: () => moduleAPI.getModuleCompatibility(moduleId, version),
    enabled: !!moduleId,
    staleTime: queryConfig.defaultStaleTime * 2,
    gcTime: queryConfig.defaultGcTime,
    retry: queryConfig.retry,
    ...options,
  });
}

/**
 * Hook for submitting module review
 */
export function useSubmitModuleReview(
  options?: UseMutationOptions<
    void,
    unknown,
    {
      moduleId: string;
      review: {
        rating: number;
        title: string;
        comment: string;
        userId: string;
      };
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, review }) => 
      moduleAPI.submitModuleReview(moduleId, review),
    onSuccess: (_, { moduleId }) => {
      // Invalidate module reviews and stats
      queryClient.invalidateQueries({ 
        queryKey: [...cacheKeys.module(moduleId), 'reviews'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...cacheKeys.module(moduleId), 'stats'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: cacheKeys.module(moduleId) 
      });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to submit module review:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for reporting module issues
 */
export function useReportModuleIssue(
  options?: UseMutationOptions<
    { issueId: string },
    unknown,
    {
      moduleId: string;
      issue: {
        type: 'bug' | 'feature' | 'security' | 'documentation' | 'other';
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        userId: string;
        environment?: Record<string, unknown>;
      };
    }
  >
) {
  return useMutation({
    mutationFn: ({ moduleId, issue }) => 
      moduleAPI.reportModuleIssue(moduleId, issue),
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to report module issue:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for bulk module operations
 */
export function useBulkModuleOperations(
  options?: UseMutationOptions<
    BulkOperationResponse<ModuleConfig>,
    unknown,
    Array<{
      moduleId: string;
      customerId: string;
      operation: 'install' | 'uninstall' | 'update' | 'enable' | 'disable';
      config?: Partial<ModuleConfig>;
    }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operations) => moduleAPI.bulkModuleOperations(operations),
    onSuccess: (_, operations) => {
      // Invalidate relevant customer module queries
      const customerIds = [...new Set(operations.map(op => op.customerId))];
      
      for (const customerId of customerIds) {
        queryClient.invalidateQueries({ 
          queryKey: cacheKeys.customerModules(customerId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: cacheKeys.customer(customerId) 
        });
      }

      // Invalidate module stats for affected modules
      const moduleIds = [...new Set(operations.map(op => op.moduleId))];
      
      for (const moduleId of moduleIds) {
        queryClient.invalidateQueries({ 
          queryKey: [...cacheKeys.module(moduleId), 'stats'] 
        });
      }

      // Invalidate module catalog
      queryClient.invalidateQueries({ queryKey: cacheKeys.modules });
    },
    onError: (error) => {
      const apiError = ErrorHandler.normalize(error);
      console.error('Failed to execute bulk module operations:', apiError);
    },
    ...options,
  });
}

/**
 * Hook for invalidating module-related queries
 * Useful for manual cache invalidation after external changes
 */
export function useInvalidateModuleQueries() {
  const queryClient = useQueryClient();

  const invalidateModule = useCallback((moduleId: string) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.module(moduleId) });
  }, [queryClient]);

  const invalidateModuleCatalog = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.modules });
  }, [queryClient]);

  const invalidateModuleCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.moduleCategories });
  }, [queryClient]);

  const invalidateAllModuleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.modules });
    queryClient.invalidateQueries({ queryKey: cacheKeys.moduleCategories });
  }, [queryClient]);

  return {
    invalidateModule,
    invalidateModuleCatalog,
    invalidateModuleCategories,
    invalidateAllModuleQueries,
  };
}