/**
 * @fileoverview Modules API service for module catalog and management
 * @module services/api/modules
 */

import type { ModuleConfig } from '@agent-desktop/types';
import { BaseAPIService } from './base.api';
import type {
  ModuleFilters,
  PaginatedResponse,
} from '../types';
import type {
  ModuleCatalogResponse,
  ModuleInfo,
  ModuleCategory,
  ModuleDependency,
  ModuleDependencyCheck,
  BulkOperationResponse,
} from '../types/responses.types';

/**
 * Module API service for managing the module catalog and installations
 * Provides functionality for browsing, installing, and managing modules
 */
export class ModuleAPIService extends BaseAPIService {
  private readonly baseEndpoint = '/api/v1/modules';

  /**
   * Get module catalog with categories and filtering
   */
  async getModuleCatalog(filters?: ModuleFilters): Promise<ModuleCatalogResponse> {
    this.logger.info('Fetching module catalog', { filters });

    const params = this.buildModuleFilters(filters);
    
    return this.getPaginated<ModuleInfo>(this.baseEndpoint, params)
      .then(async (response) => {
        // Enhance response with categories and featured modules
        const [categories, featured] = await Promise.all([
          this.getModuleCategories(),
          this.getFeaturedModules(),
        ]);

        return {
          ...response,
          categories,
          featured,
        } as ModuleCatalogResponse;
      });
  }

  /**
   * Get detailed information about a specific module
   */
  async getModule(moduleId: string): Promise<ModuleInfo> {
    this.logger.info('Fetching module details', { moduleId });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.get<ModuleInfo>(`${this.baseEndpoint}/${moduleId}`);
  }

  /**
   * Get module categories for filtering and navigation
   */
  async getModuleCategories(): Promise<readonly ModuleCategory[]> {
    this.logger.info('Fetching module categories');

    return this.get<readonly ModuleCategory[]>(`${this.baseEndpoint}/categories`);
  }

  /**
   * Get featured modules for homepage display
   */
  async getFeaturedModules(): Promise<readonly ModuleInfo[]> {
    this.logger.info('Fetching featured modules');

    return this.get<readonly ModuleInfo[]>(`${this.baseEndpoint}/featured`);
  }

  /**
   * Get popular modules based on installation count and ratings
   */
  async getPopularModules(limit = 10): Promise<readonly ModuleInfo[]> {
    this.logger.info('Fetching popular modules', { limit });

    return this.get<readonly ModuleInfo[]>(
      `${this.baseEndpoint}/popular`,
      { params: { limit } }
    );
  }

  /**
   * Get recently updated modules
   */
  async getRecentModules(limit = 10): Promise<readonly ModuleInfo[]> {
    this.logger.info('Fetching recent modules', { limit });

    return this.get<readonly ModuleInfo[]>(
      `${this.baseEndpoint}/recent`,
      { params: { limit } }
    );
  }

  /**
   * Search modules by name, description, or tags
   */
  async searchModules(
    query: string,
    filters?: Omit<ModuleFilters, 'search'>
  ): Promise<PaginatedResponse<ModuleInfo>> {
    this.logger.info('Searching modules', { query, filters });

    if (!query?.trim()) {
      throw new Error('Search query is required');
    }

    const params = {
      search: query.trim(),
      ...this.buildModuleFilters(filters),
    };

    return this.getPaginated<ModuleInfo>(`${this.baseEndpoint}/search`, params);
  }

  /**
   * Get modules by category
   */
  async getModulesByCategory(
    categoryId: string,
    filters?: Omit<ModuleFilters, 'category'>
  ): Promise<PaginatedResponse<ModuleInfo>> {
    this.logger.info('Fetching modules by category', { categoryId, filters });

    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const params = {
      category: categoryId,
      ...this.buildModuleFilters(filters),
    };

    return this.getPaginated<ModuleInfo>(this.baseEndpoint, params);
  }

  /**
   * Get module dependencies
   */
  async getModuleDependencies(moduleId: string): Promise<readonly ModuleDependency[]> {
    this.logger.info('Fetching module dependencies', { moduleId });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.get<readonly ModuleDependency[]>(
      `${this.baseEndpoint}/${moduleId}/dependencies`
    );
  }

  /**
   * Get modules that depend on a specific module
   */
  async getModuleDependents(moduleId: string): Promise<readonly ModuleInfo[]> {
    this.logger.info('Fetching module dependents', { moduleId });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.get<readonly ModuleInfo[]>(
      `${this.baseEndpoint}/${moduleId}/dependents`
    );
  }

  /**
   * Check if module dependencies can be resolved
   */
  async checkDependencyResolution(
    moduleId: string,
    targetCustomerId?: string
  ): Promise<readonly ModuleDependencyCheck[]> {
    this.logger.info('Checking dependency resolution', { 
      moduleId, 
      targetCustomerId,
    });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    const params = targetCustomerId ? { customerId: targetCustomerId } : {};

    return this.get<readonly ModuleDependencyCheck[]>(
      `${this.baseEndpoint}/${moduleId}/dependencies/check`,
      { params }
    );
  }

  /**
   * Get module installation statistics
   */
  async getModuleStats(moduleId: string): Promise<{
    installCount: number;
    activeInstallations: number;
    rating: number;
    reviewCount: number;
    downloadCount: number;
  }> {
    this.logger.info('Fetching module statistics', { moduleId });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.get<{
      installCount: number;
      activeInstallations: number;
      rating: number;
      reviewCount: number;
      downloadCount: number;
    }>(`${this.baseEndpoint}/${moduleId}/stats`);
  }

  /**
   * Get module version history
   */
  async getModuleVersions(moduleId: string): Promise<readonly {
    version: string;
    releaseDate: Date;
    changelog: string;
    downloadCount: number;
    status: 'stable' | 'beta' | 'deprecated';
  }[]> {
    this.logger.info('Fetching module versions', { moduleId });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.get<readonly {
      version: string;
      releaseDate: Date;
      changelog: string;
      downloadCount: number;
      status: 'stable' | 'beta' | 'deprecated';
    }[]>(`${this.baseEndpoint}/${moduleId}/versions`);
  }

  /**
   * Submit module review and rating
   */
  async submitModuleReview(
    moduleId: string,
    review: {
      rating: number;
      title: string;
      comment: string;
      userId: string;
    }
  ): Promise<void> {
    this.logger.info('Submitting module review', { 
      moduleId,
      rating: review.rating,
      userId: review.userId,
    });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    this.validateModuleReview(review);

    return this.post<void>(
      `${this.baseEndpoint}/${moduleId}/reviews`,
      review
    );
  }

  /**
   * Get module reviews with pagination
   */
  async getModuleReviews(
    moduleId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    userId: string;
    userName: string;
    createdAt: Date;
    helpful: number;
  }>> {
    this.logger.info('Fetching module reviews', { 
      moduleId, 
      page, 
      pageSize,
    });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    return this.getPaginated<{
      id: string;
      rating: number;
      title: string;
      comment: string;
      userId: string;
      userName: string;
      createdAt: Date;
      helpful: number;
    }>(`${this.baseEndpoint}/${moduleId}/reviews`, { page, pageSize });
  }

  /**
   * Report module issue or bug
   */
  async reportModuleIssue(
    moduleId: string,
    issue: {
      type: 'bug' | 'feature' | 'security' | 'documentation' | 'other';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      userId: string;
      environment?: Record<string, unknown>;
    }
  ): Promise<{ issueId: string }> {
    this.logger.info('Reporting module issue', { 
      moduleId,
      type: issue.type,
      severity: issue.severity,
      userId: issue.userId,
    });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    this.validateModuleIssue(issue);

    return this.post<{ issueId: string }>(
      `${this.baseEndpoint}/${moduleId}/issues`,
      issue
    );
  }

  /**
   * Get compatibility information for module versions
   */
  async getModuleCompatibility(
    moduleId: string,
    version?: string
  ): Promise<{
    coreVersion: string;
    minimumVersion: string;
    maximumVersion?: string;
    deprecated: boolean;
    warnings: readonly string[];
    recommendations: readonly string[];
  }> {
    this.logger.info('Fetching module compatibility', { 
      moduleId, 
      version,
    });

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    const params = version ? { version } : {};

    return this.get<{
      coreVersion: string;
      minimumVersion: string;
      maximumVersion?: string;
      deprecated: boolean;
      warnings: readonly string[];
      recommendations: readonly string[];
    }>(`${this.baseEndpoint}/${moduleId}/compatibility`, { params });
  }

  /**
   * Bulk operations on modules (install, uninstall, update)
   */
  async bulkModuleOperations(
    operations: Array<{
      moduleId: string;
      customerId: string;
      operation: 'install' | 'uninstall' | 'update' | 'enable' | 'disable';
      config?: Partial<ModuleConfig>;
    }>
  ): Promise<BulkOperationResponse<ModuleConfig>> {
    this.logger.info('Executing bulk module operations', {
      operationCount: operations.length,
    });

    return this.executeBulk<BulkOperationResponse<ModuleConfig>>(
      `${this.baseEndpoint}/bulk`,
      { operations }
    );
  }

  /**
   * Build query parameters from module filters
   */
  private buildModuleFilters(filters?: ModuleFilters): Record<string, unknown> {
    if (!filters) return {};

    return {
      category: filters.category,
      status: filters.status,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
  }

  /**
   * Validate module review submission
   */
  private validateModuleReview(review: {
    rating: number;
    title: string;
    comment: string;
    userId: string;
  }): void {
    if (!review.rating || review.rating < 1 || review.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!review.title?.trim()) {
      throw new Error('Review title is required');
    }

    if (review.title.length > 100) {
      throw new Error('Review title must be 100 characters or less');
    }

    if (!review.comment?.trim()) {
      throw new Error('Review comment is required');
    }

    if (review.comment.length > 1000) {
      throw new Error('Review comment must be 1000 characters or less');
    }

    if (!review.userId?.trim()) {
      throw new Error('User ID is required');
    }
  }

  /**
   * Validate module issue report
   */
  private validateModuleIssue(issue: {
    type: string;
    title: string;
    description: string;
    severity: string;
    userId: string;
  }): void {
    const validTypes = ['bug', 'feature', 'security', 'documentation', 'other'];
    if (!validTypes.includes(issue.type)) {
      throw new Error(`Invalid issue type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(issue.severity)) {
      throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
    }

    if (!issue.title?.trim()) {
      throw new Error('Issue title is required');
    }

    if (issue.title.length > 200) {
      throw new Error('Issue title must be 200 characters or less');
    }

    if (!issue.description?.trim()) {
      throw new Error('Issue description is required');
    }

    if (issue.description.length > 5000) {
      throw new Error('Issue description must be 5000 characters or less');
    }

    if (!issue.userId?.trim()) {
      throw new Error('User ID is required');
    }
  }
}