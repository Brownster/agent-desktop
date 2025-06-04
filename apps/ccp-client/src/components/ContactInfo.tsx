/**
 * @fileoverview Contact information panel component
 * @module components/ContactInfo
 */

import React from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  MapPinIcon,
  TagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useActiveContact } from '@/store/contact.store';
import type { Contact } from '@/store/contact.store';

/**
 * Contact info component props
 */
interface ContactInfoProps {
  className?: string;
}

/**
 * Contact attribute display component
 */
interface ContactAttributeItemProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string | null | undefined;
  type?: 'default' | 'phone' | 'email' | 'url';
  priority?: 'high' | 'medium' | 'low';
}

function ContactAttributeItem({
  icon: Icon,
  label,
  value,
  type = 'default',
  priority = 'medium',
}: ContactAttributeItemProps): React.ReactElement | null {
  if (!value) return null;

  const priorityClasses = {
    high: 'border-l-red-400 bg-red-50',
    medium: 'border-l-blue-400 bg-blue-50',
    low: 'border-l-gray-400 bg-gray-50',
  };

  const renderValue = () => {
    switch (type) {
      case 'phone':
        return (
          <a 
            href={`tel:${value}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        );
      case 'email':
        return (
          <a 
            href={`mailto:${value}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        );
      case 'url':
        return (
          <a 
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        );
      default:
        return <span className="text-gray-900">{value}</span>;
    }
  };

  return (
    <div className={clsx(
      'flex items-start space-x-3 p-3 border-l-4 rounded-r-md',
      priorityClasses[priority]
    )}>
      <Icon className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </div>
        <div className="mt-1 text-sm">
          {renderValue()}
        </div>
      </div>
    </div>
  );
}

/**
 * Contact timeline item component
 */
interface ContactTimelineItemProps {
  timestamp: string;
  event: string;
  details?: string;
}

function ContactTimelineItem({
  timestamp,
  event,
  details,
}: ContactTimelineItemProps): React.ReactElement {
  return (
    <div className="flex space-x-3 pb-3">
      <div className="flex-shrink-0">
        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500">{timestamp}</div>
        <div className="text-sm font-medium text-gray-900">{event}</div>
        {details && (
          <div className="text-sm text-gray-600">{details}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Contact information panel component
 */
function ContactInfo({ className }: ContactInfoProps): React.ReactElement {
  const activeContact = useActiveContact();

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get contact attributes for display
   */
  const getContactAttributes = (contact: Contact) => {
    const attributes: Array<{
      name: string;
      value: string;
      type?: 'default' | 'phone' | 'email' | 'url';
      icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }> = [];

    // Primary phone
    if (contact.customer?.phoneNumber) {
      attributes.push({
        name: 'Phone',
        value: formatPhoneNumber(contact.customer.phoneNumber),
        type: 'phone',
        icon: PhoneIcon,
      });
    }

    // Customer email
    if (contact.customer?.email) {
      attributes.push({
        name: 'Email',
        value: contact.customer.email,
        type: 'email',
        icon: EnvelopeIcon,
      });
    }

    // Customer name
    if (contact.customer?.name) {
      attributes.push({
        name: 'Name',
        value: contact.customer.name,
        icon: UserIcon,
      });
    }

    // Customer attributes
    if (contact.attributes) {
      Object.entries(contact.attributes).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          let type: 'default' | 'phone' | 'email' | 'url' = 'default';
          let icon = TagIcon;

          // Determine type and icon based on attribute name
          if (key.toLowerCase().includes('email')) {
            type = 'email';
            icon = EnvelopeIcon;
          } else if (key.toLowerCase().includes('phone')) {
            type = 'phone';
            icon = PhoneIcon;
          } else if (key.toLowerCase().includes('company')) {
            icon = BuildingOfficeIcon;
          } else if (key.toLowerCase().includes('address')) {
            icon = MapPinIcon;
          }

          attributes.push({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: String(value),
            type,
            icon,
          });
        }
      });
    }

    return attributes;
  };

  /**
   * Get contact timeline events
   */
  const getContactTimeline = (contact: Contact) => {
    const timeline = [];

    // Contact initiated
    timeline.push({
      timestamp: new Date(contact.startTime || Date.now()).toLocaleTimeString(),
      event: 'Contact Initiated',
      details: `${contact.type} contact from ${contact.customer?.phoneNumber || 'unknown'}`,
    });

    // State changes
    if (contact.state === 'connected') {
      timeline.push({
        timestamp: new Date().toLocaleTimeString(),
        event: 'Call Connected',
        details: `Duration: ${contact.startTime ? formatDuration(Math.floor((Date.now() - contact.startTime.getTime()) / 1000)) : '0:00'}`,
      });
    }

    return timeline;
  };

  if (!activeContact) {
    return (
      <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="text-center text-gray-500 text-sm py-8">
            No active contact
          </div>
        </div>
      </div>
    );
  }

  const contactAttributes = getContactAttributes(activeContact);
  const contactTimeline = getContactTimeline(activeContact);

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>

        {/* Contact Header */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {activeContact.customer?.phoneNumber ? 
                  formatPhoneNumber(activeContact.customer.phoneNumber) : 
                  activeContact.customer?.name || 'Unknown Caller'
                }
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {activeContact.type} Contact • {activeContact.state}
              </div>
              {activeContact.queue && (
                <div className="text-xs text-gray-600 mt-1">
                  Queue: {activeContact.queue.name}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {activeContact.state === 'connected' && activeContact.startTime && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDuration(Math.floor((Date.now() - activeContact.startTime.getTime()) / 1000))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Attributes */}
        {contactAttributes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
              Customer Details
            </h4>
            <div className="space-y-2">
              {contactAttributes.map((attr, index) => (
                <ContactAttributeItem
                  key={index}
                  icon={attr.icon || TagIcon}
                  label={attr.name}
                  value={attr.value}
                  type={attr.type || 'default'}
                  priority="medium"
                />
              ))}
            </div>
          </div>
        )}

        {/* Contact Priority/Flags */}
        {activeContact.attributes?.priority === 'high' && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">High Priority Contact</span>
            </div>
          </div>
        )}

        {/* Contact Timeline */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
            Contact Timeline
          </h4>
          <div className="space-y-2">
            {contactTimeline.map((item, index) => (
              <ContactTimelineItem
                key={index}
                timestamp={item.timestamp}
                event={item.event}
                details={item.details}
              />
            ))}
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <CalendarDaysIcon className="h-3 w-3 mr-1" />
              Schedule
            </button>
            <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <TagIcon className="h-3 w-3 mr-1" />
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactInfo;