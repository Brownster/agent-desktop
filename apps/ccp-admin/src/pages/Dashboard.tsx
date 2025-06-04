import React from 'react';
import {
  UserGroupIcon,
  CubeIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Stat card interface
 */
interface StatCard {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Recent activity interface
 */
interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'deployed';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

/**
 * Dashboard stats data
 */
const stats: StatCard[] = [
  {
    name: 'Total Customers',
    value: 24,
    change: '+12%',
    changeType: 'increase',
    icon: UserGroupIcon,
  },
  {
    name: 'Active Modules',
    value: 8,
    change: '+2',
    changeType: 'increase',
    icon: CubeIcon,
  },
  {
    name: 'Deployments',
    value: 156,
    change: '+23%',
    changeType: 'increase',
    icon: ServerIcon,
  },
  {
    name: 'System Health',
    value: '99.9%',
    change: 'Stable',
    changeType: 'neutral',
    icon: ChartBarIcon,
  },
];

/**
 * Recent activity data
 */
const recentActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'created',
    title: 'New customer configuration',
    description: 'Customer "Acme Corp" configuration created with 5 modules',
    timestamp: '2 hours ago',
    user: 'John Smith',
  },
  {
    id: '2',
    type: 'updated',
    title: 'Module configuration updated',
    description: 'Customer Info module updated for "TechStart Inc"',
    timestamp: '4 hours ago',
    user: 'Sarah Johnson',
  },
  {
    id: '3',
    type: 'deployed',
    title: 'Configuration deployed',
    description: 'Production deployment completed for "Global Solutions"',
    timestamp: '6 hours ago',
    user: 'Mike Chen',
  },
  {
    id: '4',
    type: 'deleted',
    title: 'Configuration removed',
    description: 'Removed unused module configuration for "StartupXYZ"',
    timestamp: '8 hours ago',
    user: 'Lisa Wang',
  },
];

/**
 * Dashboard page component
 */
function Dashboard(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Monitor your Amazon Connect CCP configurations and system health
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <IconComponent className="h-8 w-8 text-connect-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className={`text-sm ${
                      stat.changeType === 'increase' 
                        ? 'text-success-600' 
                        : stat.changeType === 'decrease'
                        ? 'text-error-600'
                        : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* System alerts */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Current system status and alerts
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center p-3 bg-success-50 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-success-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-success-800">
                  All systems operational
                </p>
                <p className="text-sm text-success-600">
                  No critical issues detected
                </p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-warning-50 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-warning-800">
                  Scheduled maintenance
                </p>
                <p className="text-sm text-warning-600">
                  Database maintenance scheduled for tomorrow at 2 AM UTC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Latest configuration changes and deployments
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6">
                <div className="flex items-start">
                  <div className={`
                    flex-shrink-0 h-2 w-2 mt-2 rounded-full
                    ${activity.type === 'created' ? 'bg-success-400' :
                      activity.type === 'updated' ? 'bg-warning-400' :
                      activity.type === 'deployed' ? 'bg-connect-400' :
                      'bg-error-400'
                    }
                  `} />
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {activity.timestamp} by {activity.user}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Common tasks and shortcuts
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="btn-primary">
              Create Customer
            </button>
            <button className="btn-secondary">
              Deploy Configuration
            </button>
            <button className="btn-outline">
              View Analytics
            </button>
            <button className="btn-ghost">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;