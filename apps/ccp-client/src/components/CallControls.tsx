/**
 * @fileoverview Call control buttons component
 * @module components/CallControls
 */

import React, { useState } from 'react';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  PauseIcon,
  PlayIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  PlusIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { useActiveContact } from '@/store/contact.store';
import type { Contact, ContactConnection } from '@/store/contact.store';

/**
 * Call controls component props
 */
interface CallControlsProps {
  onAccept?: (contactId: string) => void;
  onDecline?: (contactId: string) => void;
  onEnd?: (contactId: string) => void;
  onHold?: (contactId: string, connectionId: string) => void;
  onMute?: (contactId: string) => void;
  onTransfer?: (contactId: string) => void;
  onConference?: (contactId: string) => void;
  onMakeCall?: () => void;
  className?: string;
}

/**
 * Call control button component
 */
interface CallControlButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  pulse?: boolean;
  className?: string;
}

function CallControlButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  loading = false,
  pulse = false,
  className,
}: CallControlButtonProps): React.ReactElement {
  const baseClasses = 'relative flex flex-col items-center justify-center p-3 rounded-lg font-medium text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-connect-600 text-white hover:bg-connect-700 focus:ring-connect-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  };

  const pulseClasses = pulse ? 'animate-call-pulse' : '';

  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], pulseClasses, className)}
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Icon className={clsx('h-5 w-5 mb-1', loading && 'opacity-0')} />
      <span className={clsx('text-xs', loading && 'opacity-0')}>{label}</span>
    </button>
  );
}

/**
 * Call controls component
 */
function CallControls({
  onAccept,
  onDecline,
  onEnd,
  onHold,
  onMute,
  onTransfer,
  onConference,
  onMakeCall,
  className,
}: CallControlsProps): React.ReactElement {
  const activeContact = useActiveContact();
  const [isMuted, setIsMuted] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isConferencing, setIsConferencing] = useState(false);

  /**
   * Get the primary connection for the active contact
   */
  const getPrimaryConnection = (contact: Contact): ContactConnection | null => {
    return contact.connections.find(c => c.type === 'inbound' || c.type === 'outbound') || null;
  };

  /**
   * Handle accept call
   */
  const handleAccept = () => {
    if (activeContact && onAccept) {
      onAccept(activeContact.contactId);
    }
  };

  /**
   * Handle decline call
   */
  const handleDecline = () => {
    if (activeContact && onDecline) {
      onDecline(activeContact.contactId);
    }
  };

  /**
   * Handle end call
   */
  const handleEnd = () => {
    if (activeContact && onEnd) {
      onEnd(activeContact.contactId);
    }
  };

  /**
   * Handle hold/resume
   */
  const handleHold = () => {
    if (activeContact && onHold) {
      const primaryConnection = getPrimaryConnection(activeContact);
      if (primaryConnection) {
        onHold(activeContact.contactId, primaryConnection.connectionId);
      }
    }
  };

  /**
   * Handle mute toggle
   */
  const handleMute = () => {
    if (activeContact && onMute) {
      onMute(activeContact.contactId);
      setIsMuted(!isMuted);
    }
  };

  /**
   * Handle transfer
   */
  const handleTransfer = () => {
    if (activeContact && onTransfer) {
      setIsTransferring(true);
      onTransfer(activeContact.contactId);
      // Reset loading state after operation
      setTimeout(() => setIsTransferring(false), 2000);
    }
  };

  /**
   * Handle conference
   */
  const handleConference = () => {
    if (activeContact && onConference) {
      setIsConferencing(true);
      onConference(activeContact.contactId);
      // Reset loading state after operation
      setTimeout(() => setIsConferencing(false), 2000);
    }
  };

  /**
   * Check if contact is on hold
   */
  const isOnHold = activeContact ? 
    getPrimaryConnection(activeContact)?.isOnHold || false : false;

  /**
   * Check if we can show call controls
   */
  const showCallControls = activeContact?.type === 'voice';

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Call Controls</h3>
        
        {/* No Active Contact */}
        {!activeContact && (
          <div className="space-y-4">
            <div className="text-center text-gray-500 text-sm py-8">
              No active contact
            </div>
            {onMakeCall && (
              <CallControlButton
                icon={PhoneIcon}
                label="Make Call"
                onClick={onMakeCall}
                variant="primary"
                className="w-full"
              />
            )}
          </div>
        )}

        {/* Incoming Call */}
        {activeContact?.state === 'incoming' && showCallControls && (
          <div className="grid grid-cols-2 gap-3">
            <CallControlButton
              icon={PhoneIcon}
              label="Accept"
              onClick={handleAccept}
              variant="success"
              pulse={true}
            />
            <CallControlButton
              icon={PhoneXMarkIcon}
              label="Decline"
              onClick={handleDecline}
              variant="danger"
            />
          </div>
        )}

        {/* Active Call Controls */}
        {(activeContact?.state === 'connected' || activeContact?.state === 'hold') && showCallControls && (
          <div className="space-y-4">
            {/* Primary Controls */}
            <div className="grid grid-cols-3 gap-3">
              <CallControlButton
                icon={isOnHold ? PlayIcon : PauseIcon}
                label={isOnHold ? 'Resume' : 'Hold'}
                onClick={handleHold}
                variant={isOnHold ? 'warning' : 'secondary'}
              />
              <CallControlButton
                icon={isMuted ? MicrophoneIcon : SpeakerXMarkIcon}
                label={isMuted ? 'Unmute' : 'Mute'}
                onClick={handleMute}
                variant={isMuted ? 'warning' : 'secondary'}
              />
              <CallControlButton
                icon={PhoneXMarkIcon}
                label="End Call"
                onClick={handleEnd}
                variant="danger"
              />
            </div>

            {/* Advanced Controls */}
            <div className="grid grid-cols-2 gap-3">
              <CallControlButton
                icon={ArrowRightOnRectangleIcon}
                label="Transfer"
                onClick={handleTransfer}
                variant="secondary"
                loading={isTransferring}
              />
              <CallControlButton
                icon={UserGroupIcon}
                label="Conference"
                onClick={handleConference}
                variant="secondary"
                loading={isConferencing}
              />
            </div>

            {/* Additional Options */}
            <div className="pt-2 border-t border-gray-200">
              <Menu as="div" className="relative">
                <Menu.Button className="w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                  <EllipsisVerticalIcon className="h-4 w-4 mr-1" />
                  More Options
                </Menu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              'w-full flex items-center px-3 py-2 text-sm',
                              active ? 'bg-gray-100' : '',
                              'text-gray-700'
                            )}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Participant
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              'w-full flex items-center px-3 py-2 text-sm',
                              active ? 'bg-gray-100' : '',
                              'text-gray-700'
                            )}
                          >
                            Start Recording
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        )}

        {/* Chat/Task Controls */}
        {activeContact && !showCallControls && (
          <div className="space-y-3">
            <div className="text-center text-gray-600 text-sm">
              {activeContact.type === 'chat' ? 'Chat Contact' : 'Task Contact'}
            </div>
            <CallControlButton
              icon={PhoneXMarkIcon}
              label={activeContact.type === 'chat' ? 'End Chat' : 'Complete Task'}
              onClick={handleEnd}
              variant="danger"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CallControls;