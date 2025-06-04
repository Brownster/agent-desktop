/**
 * @fileoverview Queue statistics dashboard component
 * @module components/QueueDashboard
 */

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useQueueStore } from '@/store/queue.store';
import type { QueueDashboard } from '@/store/queue.store';

/**
 * Queue statistic metric interface
 */
interface QueueMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'warning' | 'critical';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

/**
 * Queue dashboard props
 */
interface QueueDashboardProps {
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

/**
 * Metric card component
 */
interface MetricCardProps {
  metric: QueueMetric;
  compact?: boolean;
}

function MetricCard({ metric, compact = false }: MetricCardProps): React.ReactElement {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClasses = () => {
    switch (metric.status) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getValueClasses = () => {
    switch (metric.status) {
      case 'warning':
        return 'text-yellow-900';
      case 'critical':
        return 'text-red-900';
      default:
        return 'text-gray-900';
    }
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      if (metric.unit === 'duration') {
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      if (metric.unit === 'percentage') {
        return `${value}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const calculatePercentageChange = (): number | null => {
    if (typeof metric.value === 'number' && typeof metric.previousValue === 'number' && metric.previousValue !== 0) {
      return Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100);
    }
    return null;
  };

  const percentageChange = calculatePercentageChange();

  return (
    <div className={clsx(
      'relative p-4 border rounded-lg transition-all duration-200 hover:shadow-md',
      getStatusClasses(),
      compact ? 'p-3' : 'p-4'
    )}>
      {metric.status === 'critical' && (
        <div className="absolute -top-1 -right-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className={clsx(
            'flex items-center justify-center rounded-lg',
            metric.status === 'critical' ? 'bg-red-100' : 
            metric.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100',
            compact ? 'h-8 w-8' : 'h-10 w-10'
          )}>
            <metric.icon className={clsx(
              metric.status === 'critical' ? 'text-red-600' : 
              metric.status === 'warning' ? 'text-yellow-600' : 'text-blue-600',
              compact ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
          <div>
            <div className={clsx(
              'font-medium',
              getValueClasses(),
              compact ? 'text-lg' : 'text-2xl'
            )}>
              {formatValue(metric.value)}
              {metric.unit && !['duration', 'percentage'].includes(metric.unit) && (
                <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
              )}
            </div>
            <div className={clsx(
              'text-gray-600',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {metric.label}
            </div>
          </div>
        </div>
        
        {!compact && (metric.trend || percentageChange !== null) && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            {percentageChange !== null && (
              <span className={clsx(
                'text-xs font-medium',
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {percentageChange > 0 ? '+' : ''}{percentageChange}%
              </span>
            )}
          </div>
        )}
      </div>
      
      {!compact && metric.description && (
        <div className="mt-2 text-xs text-gray-500">
          {metric.description}
        </div>
      )}
    </div>
  );
}

/**
 * Queue list component
 */

interface QueueListProps {
  queues: QueueDashboard[];
  compact?: boolean;
}

function QueueList({ queues, compact = false }: QueueListProps): React.ReactElement {
  return (
    <div className="space-y-2">
      {queues.map((queue) => (
        <div
          key={queue.queueId}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex-1">
            <div className={clsx(
              'font-medium text-gray-900',
              compact ? 'text-sm' : 'text-base'
            )}>
              {queue.name}
            </div>
            <div className="text-xs text-gray-500">
              Queue • {queue.stats.onlineAgents} agents
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">{queue.stats.contactsInQueue}</div>
              <div className="text-xs text-gray-500">Waiting</div>
            </div>
            
            <div className="text-center">
              <div className={clsx(
                'font-medium',
                queue.stats.longestWaitTime > 300 ? 'text-red-600' : 
                queue.stats.longestWaitTime > 120 ? 'text-yellow-600' : 'text-gray-900'
              )}>
                {Math.floor(queue.stats.longestWaitTime / 60)}:{(queue.stats.longestWaitTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Longest</div>
            </div>
            
            <div className={clsx(
              'h-2 w-2 rounded-full',
              queue.stats.availableAgents > 0 ? 'bg-green-400' : 'bg-red-400'
            )} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Queue dashboard component
 */
function QueueDashboard({
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000,
  className,
}: QueueDashboardProps): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const queueStats = useQueueStore((state) => state.queues);

  /**
   * Manual refresh handler
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Auto refresh effect
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  /**
   * Get queue metrics
   */
  const getQueueMetrics = (): QueueMetric[] => {
    if (!queueStats || queueStats.length === 0) {
      return [];
    }

    // Aggregate metrics across all queues
    const totalContactsInQueue = queueStats.reduce((sum, q) => sum + q.stats.contactsInQueue, 0);
    const totalAvailableAgents = queueStats.reduce((sum, q) => sum + q.stats.availableAgents, 0);
    const avgWaitTime = queueStats.reduce((sum, q) => sum + q.stats.averageWaitTime, 0) / queueStats.length;
    const longestWait = Math.max(...queueStats.map(q => q.stats.longestWaitTime));
    const avgServiceLevel = queueStats.reduce((sum, q) => sum + q.stats.serviceLevel.percentage, 0) / queueStats.length;

    return [
      {
        id: 'calls-waiting',
        label: 'Calls Waiting',
        value: totalContactsInQueue,
        icon: PhoneIcon,
        status: totalContactsInQueue > 10 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Total calls waiting across all queues',
      },
      {
        id: 'avg-wait-time',
        label: 'Avg Wait Time',
        value: Math.round(avgWaitTime),
        unit: 'duration',
        icon: ClockIcon,
        status: avgWaitTime > 300 ? 'critical' : avgWaitTime > 120 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Average time customers wait before connecting',
      },
      {
        id: 'agents-available',
        label: 'Agents Available',
        value: totalAvailableAgents,
        icon: UserGroupIcon,
        status: totalAvailableAgents < 2 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Agents ready to take calls',
      },
      {
        id: 'chat-queue',
        label: 'Chats in Queue',
        value: Math.floor(totalContactsInQueue * 0.3), // Approximate chat portion
        icon: ChatBubbleLeftRightIcon,
        status: totalContactsInQueue > 5 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Chat conversations waiting for agents',
      },
      {
        id: 'service-level',
        label: 'Service Level',
        value: Math.round(avgServiceLevel),
        unit: 'percentage',
        icon: ChartBarIcon,
        status: avgServiceLevel < 80 ? 'critical' : avgServiceLevel < 90 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Calls answered within target time',
      },
      {
        id: 'longest-wait',
        label: 'Longest Wait',
        value: longestWait,
        unit: 'duration',
        icon: ExclamationTriangleIcon,
        status: longestWait > 600 ? 'critical' : longestWait > 300 ? 'warning' : 'normal',
        trend: 'neutral',
        description: 'Customer waiting the longest',
      },
    ];
  };

  const metrics = getQueueMetrics();
  const queues = queueStats || [];

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Queue Statistics</h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={clsx(
                'p-1 rounded-md transition-colors',
                isRefreshing 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              )}
              title="Refresh statistics"
            >
              <ArrowPathIcon className={clsx('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.slice(0, 6).map((metric) => (
            <MetricCard key={metric.id} metric={metric} compact={true} />
          ))}
        </div>

        {/* Critical Alerts */}
        {metrics.some(m => m.status === 'critical') && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Critical Alerts</span>
            </div>
            <div className="space-y-1">
              {metrics
                .filter(m => m.status === 'critical')
                .map((metric) => (
                  <div key={metric.id} className="text-sm text-red-700">
                    • {metric.label}: {typeof metric.value === 'number' ? metric.value : metric.value}
                    {metric.unit === 'duration' && ' (exceeds threshold)'}
                    {metric.unit === 'percentage' && '% (below target)'}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Queue Details */}
        {queues.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
              Queue Details ({queues.length})
            </h4>
            <QueueList queues={queues} compact={true} />
          </div>
        )}

        {/* No Data State */}
        {metrics.length === 0 && queues.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No queue statistics available
            <div className="text-xs mt-1">
              Connect to view real-time queue data
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueDashboard;