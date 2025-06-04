/**
 * @fileoverview Branding API service for managing custom themes and styling
 * @module services/api/branding
 */

import { BaseAPIService } from './base.api';
import type { BrandingConfig } from '@/pages/Branding';

/**
 * Branding theme preset interface
 */
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  category: 'built-in' | 'community' | 'custom';
  author?: string;
  downloads?: number;
  rating?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Asset upload response interface
 */
export interface AssetUploadResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  cdnUrl: string;
}

/**
 * Branding validation result interface
 */
export interface BrandingValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Branding API service class
 */
export class BrandingAPIService extends BaseAPIService {
  protected baseEndpoint = '/branding';

  /**
   * Get current branding configuration for a customer
   */
  async getBrandingConfig(customerId: string): Promise<BrandingConfig> {
    const response = await this.get<BrandingConfig>(`${this.baseEndpoint}/${customerId}`);
    return response.data;
  }

  /**
   * Update branding configuration for a customer
   */
  async updateBrandingConfig(
    customerId: string, 
    config: Partial<BrandingConfig>
  ): Promise<BrandingConfig> {
    const response = await this.put<BrandingConfig>(
      `${this.baseEndpoint}/${customerId}`,
      config
    );
    return response.data;
  }

  /**
   * Validate branding configuration
   */
  async validateBrandingConfig(config: BrandingConfig): Promise<BrandingValidationResult> {
    const response = await this.post<BrandingValidationResult>(
      `${this.baseEndpoint}/validate`,
      config
    );
    return response.data;
  }

  /**
   * Get available theme presets
   */
  async getThemePresets(params?: {
    category?: ThemePreset['category'];
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    presets: ThemePreset[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.get<{
      presets: ThemePreset[];
      total: number;
      hasMore: boolean;
    }>(`${this.baseEndpoint}/presets`, { params });
    return response.data;
  }

  /**
   * Create custom theme preset
   */
  async createThemePreset(preset: Omit<ThemePreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThemePreset> {
    const response = await this.post<ThemePreset>(`${this.baseEndpoint}/presets`, preset);
    return response.data;
  }

  /**
   * Update theme preset
   */
  async updateThemePreset(
    presetId: string, 
    updates: Partial<ThemePreset>
  ): Promise<ThemePreset> {
    const response = await this.put<ThemePreset>(
      `${this.baseEndpoint}/presets/${presetId}`,
      updates
    );
    return response.data;
  }

  /**
   * Delete theme preset
   */
  async deleteThemePreset(presetId: string): Promise<void> {
    await this.delete(`${this.baseEndpoint}/presets/${presetId}`);
  }

  /**
   * Upload logo or asset file
   */
  async uploadAsset(
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'auto' | 'png' | 'jpg' | 'svg';
    }
  ): Promise<AssetUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
    }

    const response = await this.post<AssetUploadResponse>(
      `${this.baseEndpoint}/assets/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for file upload
      }
    );
    return response.data;
  }

  /**
   * Delete uploaded asset
   */
  async deleteAsset(publicId: string): Promise<void> {
    await this.delete(`${this.baseEndpoint}/assets/${publicId}`);
  }

  /**
   * Generate CSS from branding configuration
   */
  async generateCSS(config: BrandingConfig): Promise<string> {
    const response = await this.post<{ css: string }>(
      `${this.baseEndpoint}/generate-css`,
      config
    );
    return response.data.css;
  }

  /**
   * Preview branding configuration
   */
  async previewBranding(config: BrandingConfig): Promise<{
    previewUrl: string;
    expiresAt: string;
  }> {
    const response = await this.post<{
      previewUrl: string;
      expiresAt: string;
    }>(`${this.baseEndpoint}/preview`, config);
    return response.data;
  }

  /**
   * Export branding configuration
   */
  async exportBrandingConfig(customerId: string, format: 'json' | 'css' | 'zip'): Promise<Blob> {
    const response = await this.get<Blob>(
      `${this.baseEndpoint}/${customerId}/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Import branding configuration
   */
  async importBrandingConfig(
    customerId: string,
    file: File
  ): Promise<{
    config: BrandingConfig;
    validation: BrandingValidationResult;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.post<{
      config: BrandingConfig;
      validation: BrandingValidationResult;
    }>(`${this.baseEndpoint}/${customerId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get branding analytics
   */
  async getBrandingAnalytics(customerId: string, params?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }): Promise<{
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
  }> {
    const response = await this.get<{
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
    }>(`${this.baseEndpoint}/${customerId}/analytics`, { params });
    return response.data;
  }

  /**
   * Get branding configuration history
   */
  async getBrandingHistory(customerId: string, params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
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
  }> {
    const response = await this.get<{
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
    }>(`${this.baseEndpoint}/${customerId}/history`, { params });
    return response.data;
  }

  /**
   * Restore branding configuration from history
   */
  async restoreBrandingConfig(
    customerId: string,
    versionId: string
  ): Promise<BrandingConfig> {
    const response = await this.post<BrandingConfig>(
      `${this.baseEndpoint}/${customerId}/restore/${versionId}`
    );
    return response.data;
  }
}

// Export singleton instance
export const brandingAPI = new BrandingAPIService();