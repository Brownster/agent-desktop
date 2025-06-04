import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  ServerIcon,
  BellIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

/**
 * Settings section interface
 */
interface SettingsSection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Settings sections configuration
 */
const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Basic application settings and preferences',
    icon: Cog6ToothIcon,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Authentication, authorization, and security policies',
    icon: ShieldCheckIcon,
  },
  {
    id: 'system',
    name: 'System',
    description: 'Infrastructure and deployment configuration',
    icon: ServerIcon,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Email alerts and notification preferences',
    icon: BellIcon,
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Admin users and access control',
    icon: UserGroupIcon,
  },
  {
    id: 'audit',
    name: 'Audit & Compliance',
    description: 'Logging, audit trails, and compliance settings',
    icon: DocumentTextIcon,
  },
];

/**
 * Settings page component
 */
function Settings(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General settings
    applicationName: 'CCP Admin Dashboard',
    defaultEnvironment: 'development',
    enableAnalytics: true,
    enableTelemetry: false,
    
    // Security settings
    sessionTimeout: 60,
    enforceStrongPasswords: true,
    enableTwoFactor: false,
    allowedDomains: ['*.example.com', '*.acme-corp.com'],
    
    // System settings
    defaultRegion: 'us-east-1',
    backupRetention: 30,
    autoDeployment: false,
    maintenanceWindow: '02:00-04:00 UTC',
    
    // Notification settings
    emailNotifications: true,
    deploymentAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    notificationEmail: 'admin@example.com',
    
    // Audit settings
    enableAuditLogging: true,
    auditRetention: 365,
    logLevel: 'info',
    exportEnabled: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In real app, this would save to API
    console.log('Saving settings:', settings);
    // Show success toast
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="mt-2 text-gray-600">
          Configure system preferences and administrative options
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Settings navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-connect-50 text-connect-700 border-r-2 border-connect-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className={`mr-3 h-5 w-5 ${
                    activeSection === section.id ? 'text-connect-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings content */}
        <div className="lg:col-span-3">
          <div className="card">
            {activeSection === 'general' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Basic application configuration and preferences
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Application Name
                    </label>
                    <input
                      type="text"
                      className="input mt-1"
                      value={settings.applicationName}
                      onChange={(e) => handleSettingChange('applicationName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Default Environment
                    </label>
                    <select
                      className="input mt-1"
                      value={settings.defaultEnvironment}
                      onChange={(e) => handleSettingChange('defaultEnvironment', e.target.value)}
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableAnalytics"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.enableAnalytics}
                        onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                      />
                      <label htmlFor="enableAnalytics" className="ml-2 block text-sm text-gray-900">
                        Enable Analytics
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTelemetry"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.enableTelemetry}
                        onChange={(e) => handleSettingChange('enableTelemetry', e.target.checked)}
                      />
                      <label htmlFor="enableTelemetry" className="ml-2 block text-sm text-gray-900">
                        Enable Telemetry
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Authentication and authorization configuration
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      min="15"
                      max="480"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enforceStrongPasswords"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.enforceStrongPasswords}
                        onChange={(e) => handleSettingChange('enforceStrongPasswords', e.target.checked)}
                      />
                      <label htmlFor="enforceStrongPasswords" className="ml-2 block text-sm text-gray-900">
                        Enforce Strong Passwords
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.enableTwoFactor}
                        onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                      />
                      <label htmlFor="enableTwoFactor" className="ml-2 block text-sm text-gray-900">
                        Enable Two-Factor Authentication
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Allowed Domains
                    </label>
                    <textarea
                      className="input mt-1"
                      rows={3}
                      value={settings.allowedDomains.join('\n')}
                      onChange={(e) => handleSettingChange('allowedDomains', e.target.value.split('\n').filter(d => d.trim()))}
                      placeholder="*.example.com&#10;*.acme-corp.com"
                    />
                    <p className="mt-1 text-sm text-gray-500">One domain per line. Use * for wildcards.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Infrastructure and deployment configuration
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Default AWS Region
                    </label>
                    <select
                      className="input mt-1"
                      value={settings.defaultRegion}
                      onChange={(e) => handleSettingChange('defaultRegion', e.target.value)}
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">Europe (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Backup Retention (days)
                    </label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={settings.backupRetention}
                      onChange={(e) => handleSettingChange('backupRetention', parseInt(e.target.value))}
                      min="7"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Maintenance Window
                    </label>
                    <input
                      type="text"
                      className="input mt-1"
                      value={settings.maintenanceWindow}
                      onChange={(e) => handleSettingChange('maintenanceWindow', e.target.value)}
                      placeholder="02:00-04:00 UTC"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoDeployment"
                      className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                      checked={settings.autoDeployment}
                      onChange={(e) => handleSettingChange('autoDeployment', e.target.checked)}
                    />
                    <label htmlFor="autoDeployment" className="ml-2 block text-sm text-gray-900">
                      Enable Automatic Deployment
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure email alerts and notifications
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      className="input mt-1"
                      value={settings.notificationEmail}
                      onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                        Enable Email Notifications
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="deploymentAlerts"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.deploymentAlerts}
                        onChange={(e) => handleSettingChange('deploymentAlerts', e.target.checked)}
                      />
                      <label htmlFor="deploymentAlerts" className="ml-2 block text-sm text-gray-900">
                        Deployment Alerts
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="systemAlerts"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.systemAlerts}
                        onChange={(e) => handleSettingChange('systemAlerts', e.target.checked)}
                      />
                      <label htmlFor="systemAlerts" className="ml-2 block text-sm text-gray-900">
                        System Alerts
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="weeklyReports"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.weeklyReports}
                        onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                      />
                      <label htmlFor="weeklyReports" className="ml-2 block text-sm text-gray-900">
                        Weekly Reports
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage admin users and access control
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">User Management</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      User management features will be available in a future update.
                    </p>
                    <button className="btn-primary mt-4">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'audit' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Audit & Compliance</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure logging and audit trail settings
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Log Level
                    </label>
                    <select
                      className="input mt-1"
                      value={settings.logLevel}
                      onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                    >
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Audit Log Retention (days)
                    </label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={settings.auditRetention}
                      onChange={(e) => handleSettingChange('auditRetention', parseInt(e.target.value))}
                      min="30"
                      max="2555"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableAuditLogging"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.enableAuditLogging}
                        onChange={(e) => handleSettingChange('enableAuditLogging', e.target.checked)}
                      />
                      <label htmlFor="enableAuditLogging" className="ml-2 block text-sm text-gray-900">
                        Enable Audit Logging
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="exportEnabled"
                        className="h-4 w-4 text-connect-600 focus:ring-connect-500 border-gray-300 rounded"
                        checked={settings.exportEnabled}
                        onChange={(e) => handleSettingChange('exportEnabled', e.target.checked)}
                      />
                      <label htmlFor="exportEnabled" className="ml-2 block text-sm text-gray-900">
                        Enable Audit Export
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;