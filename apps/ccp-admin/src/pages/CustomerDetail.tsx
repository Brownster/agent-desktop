import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

/**
 * Mock customer detail data
 */
const customerDetails = {
  'cust-001': {
    id: 'cust-001',
    name: 'Acme Corporation',
    companyName: 'Acme Corp',
    status: 'active' as const,
    environment: 'production' as const,
    domain: 'acme-corp.connect.example.com',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    lastDeployment: '2024-01-15',
    branding: {
      primaryColor: '#1e40af',
      secondaryColor: '#374151',
      fontFamily: 'Inter, sans-serif',
      theme: 'light',
      applicationTitle: 'Acme Contact Center',
      companyName: 'Acme Corporation',
    },
    modules: [
      {
        id: 'ccp-core',
        name: 'CCP Core',
        enabled: true,
        position: 'sidebar',
        priority: 1,
        version: '1.2.0',
        settings: {
          showQueueStats: true,
          enableRecordingControls: true,
        },
      },
      {
        id: 'customer-info',
        name: 'Customer Information',
        enabled: true,
        position: 'main',
        priority: 2,
        version: '1.1.0',
        settings: {
          dataSources: ['connect-profiles', 'external-crm'],
          screenPopEnabled: true,
        },
      },
      {
        id: 'case-management',
        name: 'Case Management',
        enabled: true,
        position: 'sidebar',
        priority: 3,
        version: '1.0.5',
        settings: {
          autoCreateCase: false,
          defaultPriority: 'medium',
        },
      },
      {
        id: 'knowledge-base',
        name: 'Knowledge Base',
        enabled: false,
        position: 'popup',
        priority: 4,
        version: '1.0.2',
        settings: {
          searchEnabled: true,
          suggestionsEnabled: false,
        },
      },
    ],
    features: {
      recordingControls: true,
      screenSharing: false,
      fileUploads: true,
      chatFunctionality: true,
      supervisorMonitoring: true,
      analyticsDashboard: true,
      customScripts: false,
      thirdPartyIntegrations: true,
      advancedRouting: true,
      realTimeReporting: true,
      voiceAnalytics: false,
      sentimentAnalysis: false,
    },
    deployment: {
      environment: 'production',
      region: 'us-east-1',
      cdnDistribution: 'dist-acme-001',
      sslCertificate: 'cert-acme-001',
      customDomains: ['contact.acme-corp.com'],
    },
  },
};

/**
 * Customer detail page component
 */
function CustomerDetail(): React.ReactElement {
  const { customerId } = useParams<{ customerId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'features' | 'deployment'>('overview');

  // Get customer data (in real app, this would be from API)
  const customer = customerId ? customerDetails[customerId as keyof typeof customerDetails] : null;

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Customer not found</h3>
        <p className="mt-2 text-gray-600">The requested customer could not be found.</p>
        <Link to="/customers" className="btn-primary mt-4">
          Back to Customers
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'modules', name: 'Modules' },
    { id: 'features', name: 'Features' },
    { id: 'deployment', name: 'Deployment' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/customers" className="hover:text-gray-700">
          Customers
        </Link>
        <span>/</span>
        <span className="text-gray-900">{customer.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.companyName} • {customer.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="btn-outline">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="btn-primary">
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Deploy
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full ${
              customer.status === 'active' ? 'bg-success-400' : 
              customer.status === 'pending' ? 'bg-warning-400' : 'bg-gray-400'
            }`} />
            <span className="ml-2 text-sm font-medium text-gray-900">
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>

        <div className="card p-6">
          <div className="text-2xl font-semibold text-gray-900">
            {customer.modules.filter(m => m.enabled).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Active Modules</p>
        </div>

        <div className="card p-6">
          <div className="text-sm font-medium text-gray-900">
            {customer.environment.charAt(0).toUpperCase() + customer.environment.slice(1)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Environment</p>
        </div>

        <div className="card p-6">
          <div className="text-sm font-medium text-gray-900">
            {customer.lastDeployment}
          </div>
          <p className="text-xs text-gray-500 mt-1">Last Deployment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-connect-500 text-connect-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Basic information */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer ID</label>
                  <p className="text-sm text-gray-900">{customer.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Name</label>
                  <p className="text-sm text-gray-900">{customer.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Domain</label>
                  <p className="text-sm text-gray-900">{customer.domain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{customer.createdAt}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">{customer.updatedAt}</p>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Branding</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Title</label>
                  <p className="text-sm text-gray-900">{customer.branding.applicationTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Theme</label>
                  <p className="text-sm text-gray-900">{customer.branding.theme}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-4 w-4 rounded border border-gray-300"
                      style={{ backgroundColor: customer.branding.primaryColor }}
                    />
                    <span className="text-sm text-gray-900">{customer.branding.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Font Family</label>
                  <p className="text-sm text-gray-900">{customer.branding.fontFamily}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Module Configuration</h3>
              <button className="btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Module
              </button>
            </div>

            <div className="grid gap-4">
              {customer.modules.map((module) => (
                <div key={module.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`h-3 w-3 rounded-full ${
                          module.enabled ? 'bg-success-400' : 'bg-gray-400'
                        }`} />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{module.name}</h4>
                          <p className="text-sm text-gray-500">
                            {module.id} • v{module.version} • {module.position} • Priority {module.priority}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-connect-600 hover:bg-connect-50 rounded">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded">
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {Object.keys(module.settings).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Settings</h5>
                        <div className="space-y-1">
                          {Object.entries(module.settings).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-gray-600">{key}</span>
                              <span className="text-gray-900 font-mono">
                                {typeof value === 'boolean' ? value.toString() : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(customer.features).map(([key, enabled]) => (
                <div key={key} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${
                      enabled ? 'bg-success-400' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Deployment Configuration</h3>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">Environment Details</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Environment</label>
                    <p className="text-sm text-gray-900">{customer.deployment.environment}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Region</label>
                    <p className="text-sm text-gray-900">{customer.deployment.region}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CDN Distribution</label>
                    <p className="text-sm text-gray-900">{customer.deployment.cdnDistribution}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">SSL Certificate</label>
                    <p className="text-sm text-gray-900">{customer.deployment.sslCertificate}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">Custom Domains</h4>
                </div>
                <div className="p-6">
                  {customer.deployment.customDomains.length > 0 ? (
                    <div className="space-y-2">
                      {customer.deployment.customDomains.map((domain, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-900">{domain}</span>
                          <span className="badge-success">Active</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No custom domains configured</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDetail;