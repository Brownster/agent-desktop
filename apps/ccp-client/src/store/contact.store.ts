/**
 * @fileoverview Contact state management store
 * @module store/contact
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Contact types
 */
export type ContactType = 'voice' | 'chat' | 'task';

/**
 * Contact states
 */
export type ContactState = 
  | 'incoming'
  | 'connecting'
  | 'connected'
  | 'hold'
  | 'ended'
  | 'error';

/**
 * Connection types
 */
export type ConnectionType = 'inbound' | 'outbound' | 'monitoring';

/**
 * Contact connection information
 */
export interface ContactConnection {
  connectionId: string;
  type: ConnectionType;
  state: ContactState;
  endpoint?: {
    type: 'phone_number' | 'agent' | 'queue';
    phoneNumber?: string;
    agentId?: string;
    queueId?: string;
  };
  isOnHold: boolean;
  isMuted: boolean;
  startTime?: Date;
  endTime?: Date;
  duration: number;
}

/**
 * Contact attributes
 */
export interface ContactAttributes {
  [key: string]: string | number | boolean;
}

/**
 * Contact information
 */
export interface Contact {
  contactId: string;
  type: ContactType;
  state: ContactState;
  
  // Basic information
  queue: {
    queueId: string;
    name: string;
  };
  
  // Customer information
  customer: {
    phoneNumber?: string;
    name?: string;
    email?: string;
  };
  
  // Contact attributes
  attributes: ContactAttributes;
  
  // Connections (can have multiple for conference calls)
  connections: ContactConnection[];
  
  // Timing information
  queueTime?: number;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  
  // Call specific
  recording?: {
    isRecording: boolean;
    canStart: boolean;
    canStop: boolean;
    canPause: boolean;
  };
  
  // Chat specific
  chatSession?: {
    messages: ChatMessage[];
    isTyping: boolean;
    canSendMessage: boolean;
  };
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  type: 'message' | 'event' | 'system';
  sender: 'agent' | 'customer' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    participantId?: string;
    participantRole?: string;
    contentType?: string;
  };
}

/**
 * Quick connect destination
 */
export interface QuickConnect {
  name: string;
  type: 'agent' | 'queue' | 'phone_number';
  destination: string;
  description?: string;
}

/**
 * Contact store state interface
 */
interface ContactStoreState {
  // Active contacts
  contacts: Contact[];
  activeContactId: string | null;
  
  // Quick connects
  quickConnects: QuickConnect[];
  
  // UI state
  isDialpadOpen: boolean;
  selectedTransferDestination: QuickConnect | null;
  
  // Loading states
  isAccepting: boolean;
  isEnding: boolean;
  isTransferring: boolean;
  isConferencing: boolean;
  
  // Actions
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  removeContact: (contactId: string) => void;
  setActiveContact: (contactId: string | null) => void;
  
  // Connection actions
  updateConnection: (contactId: string, connectionId: string, updates: Partial<ContactConnection>) => void;
  addConnection: (contactId: string, connection: ContactConnection) => void;
  removeConnection: (contactId: string, connectionId: string) => void;
  
  // Chat actions
  addChatMessage: (contactId: string, message: ChatMessage) => void;
  setChatTyping: (contactId: string, isTyping: boolean) => void;
  
  // Quick connects
  setQuickConnects: (quickConnects: QuickConnect[]) => void;
  
  // UI actions
  setDialpadOpen: (open: boolean) => void;
  setTransferDestination: (destination: QuickConnect | null) => void;
  
  // Loading states
  setAccepting: (accepting: boolean) => void;
  setEnding: (ending: boolean) => void;
  setTransferring: (transferring: boolean) => void;
  setConferencing: (conferencing: boolean) => void;
  
  // Utility
  reset: () => void;
}

/**
 * Contact store with Zustand
 */
export const useContactStore = create<ContactStoreState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      contacts: [],
      activeContactId: null,
      quickConnects: [],
      isDialpadOpen: false,
      selectedTransferDestination: null,
      isAccepting: false,
      isEnding: false,
      isTransferring: false,
      isConferencing: false,

      // Contact management
      addContact: (contact: Contact) =>
        set((state) => {
          state.contacts.push(contact);
          
          // Auto-select as active if it's the only contact
          if (state.contacts.length === 1) {
            state.activeContactId = contact.contactId;
          }
        }),

      updateContact: (contactId: string, updates: Partial<Contact>) =>
        set((state) => {
          const contactIndex = state.contacts.findIndex(c => c.contactId === contactId);
          if (contactIndex >= 0) {
            Object.assign(state.contacts[contactIndex], updates);
          }
        }),

      removeContact: (contactId: string) =>
        set((state) => {
          state.contacts = state.contacts.filter(c => c.contactId !== contactId);
          
          // Clear active contact if it was removed
          if (state.activeContactId === contactId) {
            state.activeContactId = state.contacts.length > 0 ? state.contacts[0].contactId : null;
          }
        }),

      setActiveContact: (contactId: string | null) =>
        set((state) => {
          state.activeContactId = contactId;
        }),

      // Connection management
      updateConnection: (contactId: string, connectionId: string, updates: Partial<ContactConnection>) =>
        set((state) => {
          const contact = state.contacts.find(c => c.contactId === contactId);
          if (contact) {
            const connectionIndex = contact.connections.findIndex(c => c.connectionId === connectionId);
            if (connectionIndex >= 0) {
              Object.assign(contact.connections[connectionIndex], updates);
            }
          }
        }),

      addConnection: (contactId: string, connection: ContactConnection) =>
        set((state) => {
          const contact = state.contacts.find(c => c.contactId === contactId);
          if (contact) {
            contact.connections.push(connection);
          }
        }),

      removeConnection: (contactId: string, connectionId: string) =>
        set((state) => {
          const contact = state.contacts.find(c => c.contactId === contactId);
          if (contact) {
            contact.connections = contact.connections.filter(c => c.connectionId !== connectionId);
          }
        }),

      // Chat management
      addChatMessage: (contactId: string, message: ChatMessage) =>
        set((state) => {
          const contact = state.contacts.find(c => c.contactId === contactId);
          if (contact?.chatSession) {
            contact.chatSession.messages.push(message);
          }
        }),

      setChatTyping: (contactId: string, isTyping: boolean) =>
        set((state) => {
          const contact = state.contacts.find(c => c.contactId === contactId);
          if (contact?.chatSession) {
            contact.chatSession.isTyping = isTyping;
          }
        }),

      // Quick connects
      setQuickConnects: (quickConnects: QuickConnect[]) =>
        set((state) => {
          state.quickConnects = quickConnects;
        }),

      // UI actions
      setDialpadOpen: (open: boolean) =>
        set((state) => {
          state.isDialpadOpen = open;
        }),

      setTransferDestination: (destination: QuickConnect | null) =>
        set((state) => {
          state.selectedTransferDestination = destination;
        }),

      // Loading states
      setAccepting: (accepting: boolean) =>
        set((state) => {
          state.isAccepting = accepting;
        }),

      setEnding: (ending: boolean) =>
        set((state) => {
          state.isEnding = ending;
        }),

      setTransferring: (transferring: boolean) =>
        set((state) => {
          state.isTransferring = transferring;
        }),

      setConferencing: (conferencing: boolean) =>
        set((state) => {
          state.isConferencing = conferencing;
        }),

      reset: () =>
        set((state) => {
          state.contacts = [];
          state.activeContactId = null;
          state.quickConnects = [];
          state.isDialpadOpen = false;
          state.selectedTransferDestination = null;
          state.isAccepting = false;
          state.isEnding = false;
          state.isTransferring = false;
          state.isConferencing = false;
        }),
    }))
  )
);

/**
 * Selectors for commonly used data
 */
export const useActiveContact = () => useContactStore((state) => {
  const activeId = state.activeContactId;
  return activeId ? state.contacts.find(c => c.contactId === activeId) : null;
});

export const useContactCount = () => useContactStore((state) => state.contacts.length);

export const useVoiceContacts = () => useContactStore((state) => 
  state.contacts.filter(c => c.type === 'voice')
);

export const useChatContacts = () => useContactStore((state) => 
  state.contacts.filter(c => c.type === 'chat')
);

export const useTaskContacts = () => useContactStore((state) => 
  state.contacts.filter(c => c.type === 'task')
);

/**
 * Helper functions
 */
export const getContactDuration = (contact: Contact): number => {
  if (contact.startTime) {
    const endTime = contact.endTime || new Date();
    return Math.floor((endTime.getTime() - contact.startTime.getTime()) / 1000);
  }
  return 0;
};

export const getConnectionDuration = (connection: ContactConnection): number => {
  if (connection.startTime) {
    const endTime = connection.endTime || new Date();
    return Math.floor((endTime.getTime() - connection.startTime.getTime()) / 1000);
  }
  return 0;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};