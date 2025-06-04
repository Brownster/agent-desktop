/**
 * @fileoverview Agent status control component
 * @module components/AgentStatus
 */

import React, { useState } from 'react';
import { 
  ChevronDownIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { formatDuration } from '@/utils/time';
import { 
  useAgentStore, 
  useAgentState, 
  useAgentInfo,
  getStateColor,
  getStateLabel,
  type AgentState,
  type UnavailableReason,
} from '@/store/agent.store';

/**
 * Agent status component props
 */
interface AgentStatusProps {
  onStateChange?: (state: AgentState, reason?: UnavailableReason) => void;
  className?: string;
}

/**
 * Agent status indicator and control component
 */
function AgentStatus({ onStateChange, className }: AgentStatusProps): React.ReactElement {
  const agent = useAgentInfo();
  const { currentState, unavailableReason, stateStartTime, isChangingState } = useAgentState();
  const { unavailableReasons } = useAgentStore();
  
  const [stateTime, setStateTime] = useState(0);

  // Update state duration every second
  React.useEffect(() => {
    if (!stateStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - stateStartTime.getTime()) / 1000);
      setStateTime(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [stateStartTime]);

  /**
   * Handle state change
   */
  const handleStateChange = (newState: AgentState, reason?: UnavailableReason) => {
    if (onStateChange) {
      onStateChange(newState, reason);
    }
  };

  /**
   * Get the current state color
   */
  const stateColor = getStateColor(currentState, unavailableReason);
  
  /**
   * Get the current state label
   */
  const stateLabel = getStateLabel(currentState, unavailableReason);

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Agent Information */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <UserIcon className="h-8 w-8 text-gray-400" />
              <div 
                className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: stateColor }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {agent?.name || 'Unknown Agent'}
            </p>
            {agent?.extension && (
              <p className="text-xs text-gray-500">
                Ext: {agent.extension}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* State Controls */}
      <div className="p-4">
        <Menu as="div" className="relative">
          <Menu.Button 
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-connect-500 focus:ring-offset-2',
              isChangingState && 'opacity-50 cursor-not-allowed'
            )}
            style={{ 
              borderColor: stateColor,
              color: stateColor,
            }}
            disabled={isChangingState}
          >
            <div className="flex items-center space-x-2">
              <div 
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: stateColor }}
              />
              <span>{stateLabel}</span>
              {isChangingState && (
                <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </Menu.Button>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none">
              <div className="py-1">
                {/* Available */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        'w-full flex items-center px-3 py-2 text-sm',
                        active ? 'bg-gray-100' : '',
                        currentState === 'Available' ? 'text-status-available font-medium' : 'text-gray-700'
                      )}
                      onClick={() => handleStateChange('Available')}
                    >
                      <div className="h-2 w-2 bg-status-available rounded-full mr-2" />
                      Available
                    </button>
                  )}
                </Menu.Item>

                {/* Unavailable Reasons */}
                {unavailableReasons.map((reason) => (
                  <Menu.Item key={reason.name}>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'w-full flex items-center px-3 py-2 text-sm',
                          active ? 'bg-gray-100' : '',
                          currentState === 'Unavailable' && unavailableReason?.name === reason.name
                            ? 'font-medium'
                            : 'text-gray-700'
                        )}
                        style={{
                          color: currentState === 'Unavailable' && unavailableReason?.name === reason.name
                            ? reason.color
                            : undefined
                        }}
                        onClick={() => handleStateChange('Unavailable', reason)}
                      >
                        <div 
                          className="h-2 w-2 rounded-full mr-2"
                          style={{ backgroundColor: reason.color }}
                        />
                        {reason.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}

                {/* Offline */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        'w-full flex items-center px-3 py-2 text-sm',
                        active ? 'bg-gray-100' : '',
                        currentState === 'Offline' ? 'text-status-offline font-medium' : 'text-gray-700'
                      )}
                      onClick={() => handleStateChange('Offline')}
                    >
                      <div className="h-2 w-2 bg-status-offline rounded-full mr-2" />
                      Offline
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* State Duration */}
        {stateStartTime && (
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>
              {formatDuration(stateTime)} in {stateLabel}
            </span>
          </div>
        )}
      </div>

      {/* Routing Profile */}
      {agent?.routingProfile && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">Routing Profile</div>
            <div className="mt-1">{agent.routingProfile.name}</div>
            {agent.routingProfile.queues.length > 0 && (
              <div className="mt-1">
                <span className="font-medium">Queues:</span>{' '}
                {agent.routingProfile.queues.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentStatus;