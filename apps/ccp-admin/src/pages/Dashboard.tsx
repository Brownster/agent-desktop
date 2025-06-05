import React, { useMemo } from 'react';
import type {
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
} from 'react';
import { subDays, formatDistanceToNow } from 'date-fns';
import {
  UserGroupIcon,
  CubeIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAnalyticsDashboard, useAuditLogs } from '@/services';

/**
 * Stat card interface
 */
interface StatCard {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;
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
 * Dashboard page component
 */
function Dashboard(): React.ReactElement {
  const timeRange = useMemo(
    () => ({
      start: subDays(new Date(), 7),
      end: new Date(),
    }),
    []
  );

  const { data: dashboard } = useAnalyticsDashboard(timeRange);
  const { data: auditLogs } = useAuditLogs({ page: 1, pageSize: 4 });

  const stats: StatCard[] = useMemo(
    () => [
      {
        name: 'Total Customers',
        value: dashboard?.summary.totalCustomers ?? 0,
        change: dashboard ? `${dashboard.summary.trends.customers}%` : undefined,
        changeType: dashboard
          ? dashboard.summary.trends.customers >= 0
            ? 'increase'
            : 'decrease'
          : 'neutral',
        icon: UserGroupIcon,
      },
      {
        name: 'Active Customers',
        value: dashboard?.summary.activeCustomers ?? 0,
        icon: CubeIcon,
      },
      {
        name: 'Total Contacts',
        value: dashboard?.summary.totalContacts ?? 0,
        change: dashboard ? `${dashboard.summary.trends.contacts}%` : undefined,
        changeType: dashboard
          ? dashboard.summary.trends.contacts >= 0
            ? 'increase'
            : 'decrease'
          : 'neutral',
        icon: ServerIcon,
      },
      {
        name: 'System Uptime',
        value: dashboard ? `${dashboard.summary.systemUptime}%` : 'N/A',
        icon: ChartBarIcon,
        changeType: 'neutral',
      },
    ],
    [dashboard]
  );

  const recentActivity: ActivityItem[] = useMemo(() => {
    return (
      auditLogs?.items.map(log => ({
        id: log.id,
        type:
          log.action.includes('create') || log.action.includes('add')
            ? 'created'
            : log.action.includes('update')
              ? 'updated'
              : log.action.includes('delete')
                ? 'deleted'
                : 'deployed',
        title: log.action,
        description: `${log.resource_type} ${log.resource_id}`,
        timestamp: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }),
        user: log.user_name,
      })) ?? []
    );
  }, [auditLogs]);

  return (
    <div className='space-y-8'>
      {/* Page header */}
      <div>
        <h2 className='text-3xl font-bold text-gray-900'>Dashboard</h2>
        <p className='mt-2 text-gray-600'>
          Monitor your Amazon Connect CCP configurations and system health
        </p>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map(stat => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className='card p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <IconComponent className='h-8 w-8 text-connect-600' />
                </div>
                <div className='ml-4 flex-1'>
                  <p className='text-sm font-medium text-gray-500 truncate'>{stat.name}</p>
                  <p className='text-2xl font-semibold text-gray-900'>{stat.value}</p>
                  {stat.change && (
                    <p
                      className={`text-sm ${
                        stat.changeType === 'increase'
                          ? 'text-success-600'
                          : stat.changeType === 'decrease'
                            ? 'text-error-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {stat.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        {/* System alerts */}
        <div className='card'>
          <div className='p-6 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>System Alerts</h3>
            <p className='mt-1 text-sm text-gray-500'>Current system status and alerts</p>
          </div>
          <div className='p-6 space-y-4'>
            <div className='flex items-center p-3 bg-success-50 rounded-lg'>
              <CheckCircleIcon className='h-5 w-5 text-success-400' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-success-800'>All systems operational</p>
                <p className='text-sm text-success-600'>No critical issues detected</p>
              </div>
            </div>

            <div className='flex items-center p-3 bg-warning-50 rounded-lg'>
              <ExclamationTriangleIcon className='h-5 w-5 text-warning-400' />
              <div className='ml-3'>
                <p className='text-sm font-medium text-warning-800'>Scheduled maintenance</p>
                <p className='text-sm text-warning-600'>
                  Database maintenance scheduled for tomorrow at 2 AM UTC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className='card'>
          <div className='p-6 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Recent Activity</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Latest configuration changes and deployments
            </p>
          </div>
          <div className='divide-y divide-gray-200'>
            {recentActivity.map(activity => (
              <div key={activity.id} className='p-6'>
                <div className='flex items-start'>
                  <div
                    className={`
                    flex-shrink-0 h-2 w-2 mt-2 rounded-full
                    ${
                      activity.type === 'created'
                        ? 'bg-success-400'
                        : activity.type === 'updated'
                          ? 'bg-warning-400'
                          : activity.type === 'deployed'
                            ? 'bg-connect-400'
                            : 'bg-error-400'
                    }
                  `}
                  />
                  <div className='ml-4 flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{activity.title}</p>
                    <p className='text-sm text-gray-600 mt-1'>{activity.description}</p>
                    <p className='text-xs text-gray-400 mt-2'>
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
      <div className='card'>
        <div className='p-6 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900'>Quick Actions</h3>
          <p className='mt-1 text-sm text-gray-500'>Common tasks and shortcuts</p>
        </div>
        <div className='p-6'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <button className='btn-primary'>Create Customer</button>
            <button className='btn-secondary'>Deploy Configuration</button>
            <button className='btn-outline'>View Analytics</button>
            <button className='btn-ghost'>System Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
