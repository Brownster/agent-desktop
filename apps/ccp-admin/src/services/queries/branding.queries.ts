/**
 * @fileoverview React Query hooks for branding API operations
 * @module services/queries/branding
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { brandingAPI, type ThemePreset, type BrandingValidationResult, type AssetUploadResponse } from '../api/branding.api';
import type { BrandingConfig } from '@/pages/Branding';

/**
 * Query keys for branding operations
 */
export const brandingKeys = {
  all: ['branding'] as const,
  configs: () => [...brandingKeys.all, 'configs'] as const,
  config: (customerId: string) => [...brandingKeys.configs(), customerId] as const,
  presets: () => [...brandingKeys.all, 'presets'] as const,
  presetsList: (filters: Record<string, any>) => [...brandingKeys.presets(), 'list', filters] as const,
  analytics: (customerId: string) => [...brandingKeys.all, 'analytics', customerId] as const,
  history: (customerId: string) => [...brandingKeys.all, 'history', customerId] as const,
};

/**
 * Hook to get branding configuration for a customer
 */
export function useBrandingConfig(
  customerId: string,
  options?: UseQueryOptions<BrandingConfig, Error>
) {
  return useQuery({
    queryKey: brandingKeys.config(customerId),
    queryFn: () => brandingAPI.getBrandingConfig(customerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to update branding configuration
 */
export function useUpdateBrandingConfig(
  options?: UseMutationOptions<
    BrandingConfig,
    Error,
    { customerId: string; config: Partial<BrandingConfig> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, config }) => 
      brandingAPI.updateBrandingConfig(customerId, config),
    onSuccess: (data, variables) => {
      // Update the specific customer's config in cache
      queryClient.setQueryData(
        brandingKeys.config(variables.customerId),
        data
      );
      
      // Invalidate configs list
      queryClient.invalidateQueries({
        queryKey: brandingKeys.configs(),
      });
    },
    ...options,
  });
}

/**
 * Hook to validate branding configuration
 */
export function useValidateBrandingConfig(
  options?: UseMutationOptions<BrandingValidationResult, Error, BrandingConfig>
) {
  return useMutation({
    mutationFn: (config) => brandingAPI.validateBrandingConfig(config),
    ...options,
  });
}

/**
 * Hook to get theme presets
 */
export function useThemePresets(
  filters?: {
    category?: ThemePreset['category'];
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  },
  options?: UseQueryOptions<{
    presets: ThemePreset[];
    total: number;
    hasMore: boolean;
  }, Error>
) {
  return useQuery({
    queryKey: brandingKeys.presetsList(filters || {}),
    queryFn: () => brandingAPI.getThemePresets(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to create theme preset
 */
export function useCreateThemePreset(
  options?: UseMutationOptions<
    ThemePreset,
    Error,
    Omit<ThemePreset, 'id' | 'createdAt' | 'updatedAt'>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preset) => brandingAPI.createThemePreset(preset),
    onSuccess: () => {
      // Invalidate presets list to refetch
      queryClient.invalidateQueries({
        queryKey: brandingKeys.presets(),
      });
    },
    ...options,
  });
}

/**
 * Hook to update theme preset
 */
export function useUpdateThemePreset(
  options?: UseMutationOptions<
    ThemePreset,
    Error,
    { presetId: string; updates: Partial<ThemePreset> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ presetId, updates }) => 
      brandingAPI.updateThemePreset(presetId, updates),
    onSuccess: () => {
      // Invalidate presets list to refetch
      queryClient.invalidateQueries({
        queryKey: brandingKeys.presets(),
      });
    },
    ...options,
  });
}

/**
 * Hook to delete theme preset
 */
export function useDeleteThemePreset(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (presetId) => brandingAPI.deleteThemePreset(presetId),
    onSuccess: () => {
      // Invalidate presets list to refetch
      queryClient.invalidateQueries({
        queryKey: brandingKeys.presets(),
      });
    },
    ...options,
  });
}

/**
 * Hook to upload asset
 */
export function useUploadAsset(
  options?: UseMutationOptions<
    AssetUploadResponse,
    Error,
    {
      file: File;
      options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'auto' | 'png' | 'jpg' | 'svg';
      };
    }
  >
) {
  return useMutation({
    mutationFn: ({ file, options: uploadOptions }) => 
      brandingAPI.uploadAsset(file, uploadOptions),
    ...options,
  });
}

/**
 * Hook to delete asset
 */
export function useDeleteAsset(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId) => brandingAPI.deleteAsset(publicId),
    onSuccess: () => {
      // Invalidate all branding configs as they might reference the deleted asset
      queryClient.invalidateQueries({
        queryKey: brandingKeys.configs(),
      });
    },
    ...options,
  });
}

/**
 * Hook to generate CSS from branding configuration
 */
export function useGenerateCSS(
  options?: UseMutationOptions<string, Error, BrandingConfig>
) {
  return useMutation({
    mutationFn: (config) => brandingAPI.generateCSS(config),
    ...options,
  });
}

/**
 * Hook to preview branding configuration
 */
export function usePreviewBranding(
  options?: UseMutationOptions<
    { previewUrl: string; expiresAt: string },
    Error,
    BrandingConfig
  >
) {
  return useMutation({
    mutationFn: (config) => brandingAPI.previewBranding(config),
    ...options,
  });
}

/**
 * Hook to export branding configuration
 */
export function useExportBrandingConfig(
  options?: UseMutationOptions<
    Blob,
    Error,
    { customerId: string; format: 'json' | 'css' | 'zip' }
  >
) {
  return useMutation({
    mutationFn: ({ customerId, format }) => 
      brandingAPI.exportBrandingConfig(customerId, format),
    ...options,
  });
}

/**
 * Hook to import branding configuration
 */
export function useImportBrandingConfig(
  options?: UseMutationOptions<
    { config: BrandingConfig; validation: BrandingValidationResult },
    Error,
    { customerId: string; file: File }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, file }) => 
      brandingAPI.importBrandingConfig(customerId, file),
    onSuccess: (data, variables) => {
      // Update the config in cache if validation passed
      if (data.validation.valid) {
        queryClient.setQueryData(
          brandingKeys.config(variables.customerId),
          data.config
        );
      }
      
      // Invalidate configs list
      queryClient.invalidateQueries({
        queryKey: brandingKeys.configs(),
      });
    },
    ...options,
  });
}

/**
 * Hook to get branding analytics
 */
export function useBrandingAnalytics(
  customerId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  },
  options?: UseQueryOptions<{
    usage: {
      totalPageViews: number;
      uniqueUsers: number;
      averageSessionDuration: number;
    };
    assets: {
      logoViews: number;
      assetDownloads: number;
      storageUsed: number;
    };
    performance: {
      loadTime: number;
      cssSize: number;
      assetSize: number;
    };
    feedback: {
      brandingRating: number;
      userComments: Array<{
        comment: string;
        rating: number;
        timestamp: string;
      }>;
    };
  }, Error>
) {
  return useQuery({
    queryKey: brandingKeys.analytics(customerId),
    queryFn: () => brandingAPI.getBrandingAnalytics(customerId, params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

/**
 * Hook to get branding configuration history
 */
export function useBrandingHistory(
  customerId: string,
  params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  },
  options?: UseQueryOptions<{
    history: Array<{
      id: string;
      config: BrandingConfig;
      changedBy: string;
      changedAt: string;
      changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
      }>;
      version: number;
    }>;
    total: number;
    hasMore: boolean;
  }, Error>
) {
  return useQuery({
    queryKey: brandingKeys.history(customerId),
    queryFn: () => brandingAPI.getBrandingHistory(customerId, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to restore branding configuration from history
 */
export function useRestoreBrandingConfig(
  options?: UseMutationOptions<
    BrandingConfig,
    Error,
    { customerId: string; versionId: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, versionId }) => 
      brandingAPI.restoreBrandingConfig(customerId, versionId),
    onSuccess: (data, variables) => {
      // Update the config in cache
      queryClient.setQueryData(
        brandingKeys.config(variables.customerId),
        data
      );
      
      // Invalidate history to refetch
      queryClient.invalidateQueries({
        queryKey: brandingKeys.history(variables.customerId),
      });
    },
    ...options,
  });
}