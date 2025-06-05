import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Cog6ToothIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Switch } from '@headlessui/react';

/**
 * Module interface
 */
interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'core' | 'integration' | 'analytics' | 'communication' | 'utility';
  status: 'available' | 'deprecated' | 'beta' | 'coming-soon';
  dependencies: string[];
  author: string;
  lastUpdated: string;
  downloadCount: number;
  rating: number;
  tags: string[];
  // Configuration properties
  enabled?: boolean;
  installed?: boolean;
  configuration?: Record<string, any>;
  hasConfiguration?: boolean;
  loadPriority?: number;
  loadStrategy?: 'eager' | 'lazy' | 'on-demand';
}

/**
 * Module configuration view type
 */
type ViewMode = 'catalog' | 'installed' | 'configuration';

/**
 * Dependency check result
 */
interface DependencyCheck {
  moduleId: string;
  satisfied: boolean;
  missing?: string[] | undefined;
  conflicts?: string[] | undefined;
}

/**
 * Mock modules data with configuration state
 */
const modules: Module[] = [
  {
    id: 'ccp-core',
    name: 'CCP Core',
    description: 'Essential Contact Control Panel functionality with agent state management, call controls, and queue statistics.',
    version: '1.2.0',
    category: 'core',
    status: 'available',
    dependencies: [],
    author: 'Amazon Connect Team',
    lastUpdated: '2024-01-15',
    downloadCount: 1250,
    rating: 4.9,
    tags: ['core', 'essential', 'agent-controls'],
    enabled: true,
    installed: true,
    hasConfiguration: true,
    loadPriority: 1,
    loadStrategy: 'eager',
    configuration: {
      maxConcurrentCalls: 3,
      enableCallRecording: true,
      defaultAgentState: 'available'
    }
  },
  {
    id: 'customer-info',
    name: 'Customer Information',
    description: 'Display customer profile data, contact history, and screen pop functionality for incoming calls.',
    version: '1.1.0',
    category: 'core',
    status: 'available',
    dependencies: ['ccp-core'],
    author: 'Amazon Connect Team',
    lastUpdated: '2024-01-12',
    downloadCount: 980,
    rating: 4.7,
    tags: ['customer-data', 'screen-pop', 'crm'],
    enabled: true,
    installed: true,
    hasConfiguration: true,
    loadPriority: 2,
    loadStrategy: 'eager',
    configuration: {
      displayFormat: 'compact',
      showContactHistory: true,
      maxHistoryItems: 50
    }
  },
  {
    id: 'case-management',
    name: 'Case Management',
    description: 'Create, update, and track customer service cases directly from the CCP interface.',
    version: '1.0.5',
    category: 'utility',
    status: 'available',
    dependencies: ['ccp-core', 'customer-info'],
    author: 'Amazon Connect Team',
    lastUpdated: '2024-01-10',
    downloadCount: 756,
    rating: 4.5,
    tags: ['case-tracking', 'ticketing', 'workflow'],
    enabled: false,
    installed: true,
    hasConfiguration: true,
    loadPriority: 5,
    loadStrategy: 'lazy',
    configuration: {
      autoCreateCase: false,
      defaultCasePriority: 'medium',
      requireDescription: true
    }
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Integrated knowledge base search and article suggestions based on call context and customer data.',
    version: '1.0.2',
    category: 'utility',
    status: 'available',
    dependencies: ['ccp-core'],
    author: 'Amazon Connect Team',
    lastUpdated: '2024-01-08',
    downloadCount: 432,
    rating: 4.3,
    tags: ['knowledge', 'search', 'articles', 'help'],
    enabled: true,
    installed: true,
    hasConfiguration: true,
    loadPriority: 4,
    loadStrategy: 'on-demand',
    configuration: {
      searchResultLimit: 10,
      enableAutoSuggest: true,
      suggestionThreshold: 0.7
    }
  },
  {
    id: 'salesforce-integration',
    name: 'Salesforce Integration',
    description: 'Deep integration with Salesforce CRM including automatic case creation and contact sync.',
    version: '2.1.0',
    category: 'integration',
    status: 'available',
    dependencies: ['ccp-core', 'customer-info'],
    author: 'Partner Solutions',
    lastUpdated: '2024-01-14',
    downloadCount: 654,
    rating: 4.6,
    tags: ['salesforce', 'crm', 'integration', 'sync'],
    enabled: false,
    installed: false,
    hasConfiguration: true,
    loadPriority: 6,
    loadStrategy: 'lazy',
    configuration: {
      orgUrl: '',
      apiVersion: '58.0',
      syncInterval: 300000
    }
  },
  {
    id: 'analytics-dashboard',
    name: 'Real-time Analytics',
    description: 'Live dashboard showing queue metrics, agent performance, and customer satisfaction scores.',
    version: '1.3.0',
    category: 'analytics',
    status: 'available',
    dependencies: ['ccp-core'],
    author: 'Analytics Team',
    lastUpdated: '2024-01-13',
    downloadCount: 342,
    rating: 4.8,
    tags: ['analytics', 'dashboard', 'metrics', 'real-time'],
    enabled: true,
    installed: true,
    hasConfiguration: true,
    loadPriority: 3,
    loadStrategy: 'eager',
    configuration: {
      refreshInterval: 30000,
      enableAlerts: true,
      retentionDays: 30
    }
  },
  {
    id: 'voice-analytics',
    name: 'Voice Analytics',
    description: 'Advanced voice analytics with sentiment analysis, keyword detection, and call scoring.',
    version: '0.9.0',
    category: 'analytics',
    status: 'beta',
    dependencies: ['ccp-core'],
    author: 'AI Research Team',
    lastUpdated: '2024-01-16',
    downloadCount: 123,
    rating: 4.2,
    tags: ['voice', 'ai', 'sentiment', 'beta'],
    enabled: false,
    installed: false,
    hasConfiguration: true,
    loadPriority: 7,
    loadStrategy: 'on-demand',
    configuration: {
      enableSentiment: true,
      enableKeywords: true,
      confidenceThreshold: 0.8
    }
  },
  {
    id: 'chat-widget',
    name: 'Chat Widget',
    description: 'Multi-channel chat support with emoji reactions, file sharing, and typing indicators.',
    version: '2.0.0',
    category: 'communication',
    status: 'coming-soon',
    dependencies: ['ccp-core'],
    author: 'Communication Team',
    lastUpdated: '2024-01-01',
    downloadCount: 0,
    rating: 0,
    tags: ['chat', 'messaging', 'multi-channel', 'coming-soon'],
    enabled: false,
    installed: false,
    hasConfiguration: true,
    loadPriority: 8,
    loadStrategy: 'lazy',
    configuration: {
      maxFileSize: 10485760,
      enableEmoji: true,
      typingIndicators: true
    }
  },
];

/**
 * Check module dependencies
 */
function checkDependencies(moduleId: string, enabledModules: string[]): DependencyCheck {
  const module = modules.find(m => m.id === moduleId);
  if (!module) {
    return { moduleId, satisfied: false, missing: ['Module not found'] };
  }

  const missing = module.dependencies.filter(dep => !enabledModules.includes(dep));
  
  return {
    moduleId,
    satisfied: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  } as DependencyCheck;
}

/**
 * Get modules that depend on a given module
 */
function getDependentModules(moduleId: string): string[] {
  return modules
    .filter(m => m.dependencies.includes(moduleId))
    .map(m => m.id);
}

/**
 * Calculate load order based on dependencies and priority
 */
function calculateLoadOrder(enabledModuleIds: string[]): string[] {
  const enabledModules = modules.filter(m => enabledModuleIds.includes(m.id));
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(moduleId: string) {
    if (visiting.has(moduleId)) {
      throw new Error(`Circular dependency detected: ${moduleId}`);
    }
    if (visited.has(moduleId)) return;

    visiting.add(moduleId);
    const module = enabledModules.find(m => m.id === moduleId);
    if (module) {
      module.dependencies.forEach(dep => {
        if (enabledModuleIds.includes(dep)) {
          visit(dep);
        }
      });
    }
    visiting.delete(moduleId);
    visited.add(moduleId);
    sorted.push(moduleId);
  }

  enabledModules
    .sort((a, b) => (a.loadPriority || 999) - (b.loadPriority || 999))
    .forEach(module => visit(module.id));

  return sorted;
}

/**
 * Category badge component
 */
function CategoryBadge({ category }: { category: Module['category'] }): React.ReactElement {
  const styles = {
    core: 'badge-primary',
    integration: 'badge-success',
    analytics: 'badge-warning',
    communication: 'badge-error',
    utility: 'badge-gray',
  };

  return (
    <span className={`badge ${styles[category]}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Module['status'] }): React.ReactElement {
  const styles = {
    available: 'badge-success',
    deprecated: 'badge-error',
    beta: 'badge-warning',
    'coming-soon': 'badge-gray',
  };

  const labels = {
    available: 'Available',
    deprecated: 'Deprecated',
    beta: 'Beta',
    'coming-soon': 'Coming Soon',
  };

  return (
    <span className={`badge ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/**
 * Star rating component
 */
function StarRating({ rating }: { rating: number }): React.ReactElement {
  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

function ModuleConfigModal({ module, onClose }: { module: Module | null; onClose: () => void }): React.ReactElement | null {
  if (!module) return null;
  return (
    <Dialog open={!!module} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <Dialog.Panel className="relative bg-white rounded-md shadow-lg max-w-md w-full p-6">
        <Dialog.Title className="text-lg font-medium">Configure {module.name}</Dialog.Title>
        <div className="mt-4 space-y-1 text-sm">
          {Object.entries(module.configuration || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{key}</span>
              <span className="font-mono text-gray-900">{String(value)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button onClick={onClose} className="btn-primary">Save</button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

/**
 * Modules page component
 */
function Modules(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Module['category'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Module['status'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('installed');
  const [moduleList, setModuleList] = useState<Module[]>(modules);
  const [configModule, setConfigModule] = useState<Module | null>(null);
  const enabledCount = moduleList.filter(m => m.enabled).length;
  const installedCount = moduleList.filter(m => m.installed).length;
  const loadOrder = calculateLoadOrder(
    moduleList.filter(m => m.enabled).map(m => m.id)
  );

  // Filter modules based on search, category, and status
  const filteredModules = moduleList.filter((module) => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || module.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const displayModules = filteredModules.filter(m =>
    viewMode === 'installed' ? m.installed : true
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Module Management</h2>
          <p className="mt-2 text-gray-600">
            Browse and manage available modules for Amazon Connect CCP
          </p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Module
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              viewMode === 'catalog' ? 'border-connect-600 text-connect-600' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setViewMode('catalog')}
          >
            Catalog
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              viewMode === 'installed' ? 'border-connect-600 text-connect-600' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setViewMode('installed')}
          >
            Installed ({installedCount})
          </button>
        </nav>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        {viewMode === 'catalog'
          ? 'Browse and install available modules'
          : 'Manage installed modules and their configurations'}
      </p>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search modules, descriptions, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="lg:w-48">
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Module['category'] | 'all')}
            >
              <option value="all">All Categories</option>
              <option value="core">Core</option>
              <option value="integration">Integration</option>
              <option value="analytics">Analytics</option>
              <option value="communication">Communication</option>
              <option value="utility">Utility</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="lg:w-48">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Module['status'] | 'all')}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="beta">Beta</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {filteredModules.length} of {moduleList.length} modules
        </span>
        <span>
          {moduleList.filter(m => m.status === 'available').length} available,{' '}
          {moduleList.filter(m => m.status === 'beta').length} beta,{' '}
          {moduleList.filter(m => m.status === 'coming-soon').length} coming soon
        </span>
        <span>{enabledCount} enabled, {installedCount} installed</span>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {displayModules.map((module) => (
          <div key={module.id} className="card-hover">
            {/* Module header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                    <span className="text-sm text-gray-500">v{module.version}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{module.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <CategoryBadge category={module.category} />
                  <StatusBadge status={module.status} />
                </div>
              </div>
            </div>

            {/* Module content */}
            <div className="p-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                {module.description}
              </p>

              {/* Dependencies */}
              {module.dependencies.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Dependencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.dependencies.map((dep) => (
                      <span key={dep} className="badge-gray text-xs">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {module.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="badge-gray text-xs">
                      #{tag}
                    </span>
                  ))}
                  {module.tags.length > 4 && (
                    <span className="text-xs text-gray-400">
                      +{module.tags.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <StarRating rating={module.rating} />
                  <span>{module.downloadCount.toLocaleString()} installs</span>
                </div>
                <span>Updated {module.lastUpdated}</span>
              </div>

              {/* Author */}
              <div className="mt-2 text-xs text-gray-500">
                by {module.author}
              </div>
            </div>

            {/* Module actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={module.enabled}
                  onChange={() =>
                    setModuleList(prev =>
                      prev.map(m =>
                        m.id === module.id ? { ...m, enabled: !m.enabled } : m
                      )
                    )
                  }
                  className={`${
                    module.enabled ? 'bg-connect-600' : 'bg-gray-300'
                  } relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                  <span className="sr-only">Enable module</span>
                  <span
                    className={`${
                      module.enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </Switch>
                <button
                  className="p-2 text-gray-400 hover:text-connect-600 hover:bg-white rounded"
                  onClick={() => setConfigModule(module)}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              </div>
              
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  module.status === 'available'
                    ? 'bg-connect-600 text-white hover:bg-connect-700'
                    : module.status === 'beta'
                    ? 'bg-warning-600 text-white hover:bg-warning-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={module.status !== 'available' && module.status !== 'beta'}
              >
                {module.status === 'available' ? 'Install' :
                 module.status === 'beta' ? 'Try Beta' :
                 module.status === 'coming-soon' ? 'Coming Soon' :
                 'Deprecated'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {displayModules.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No modules are currently available.'
            }
          </p>
        </div>
      )}

      {/* Load order */}
      {displayModules.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Module Load Order</h3>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            {loadOrder.map(id => (
              <li key={id}>{id}</li>
            ))}
          </ol>
        </div>
      )}
      <ModuleConfigModal module={configModule} onClose={() => setConfigModule(null)} />
    </div>
  );
}

export default Modules;

export type { Module, ViewMode, DependencyCheck };