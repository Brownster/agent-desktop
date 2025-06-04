/**
 * @fileoverview Queue statistics and real-time metrics store
 * @module store/queue
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Queue statistics interface
 */
export interface QueueStats {
  queueId: string;
  name: string;
  
  // Current metrics
  contactsInQueue: number;
  longestWaitTime: number;
  availableAgents: number;
  onlineAgents: number;
  totalAgents: number;
  
  // Performance metrics
  serviceLevel: {
    threshold: number; // seconds
    percentage: number;
  };
  
  // Historical data (last 24 hours)
  contactsHandled: number;
  contactsAbandoned: number;
  averageHandleTime: number;
  averageWaitTime: number;
  
  // Real-time updates
  lastUpdated: Date;
}

/**
 * Agent availability in queue
 */
export interface QueueAgent {
  agentId: string;
  name: string;
  state: 'Available' | 'Unavailable' | 'AfterContactWork' | 'Offline';
  stateTime: number; // seconds in current state
  extension?: string;
}

/**
 * Contact waiting in queue
 */
export interface QueuedContact {
  contactId: string;
  customerNumber?: string;
  waitTime: number; // seconds
  priority: number;
  attributes: Record<string, string>;
}

/**
 * Real-time queue dashboard data
 */
export interface QueueDashboard {
  queueId: string;
  name: string;
  stats: QueueStats;
  agents: QueueAgent[];
  queuedContacts: QueuedContact[];
  isLoading: boolean;
  lastError?: string;
}

/**
 * Queue store state interface
 */
interface QueueStoreState {
  // Queue data
  queues: QueueDashboard[];
  selectedQueueId: string | null;
  
  // Real-time updates
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // UI state
  isRefreshing: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  
  // Actions
  setQueues: (queues: QueueDashboard[]) => void;
  updateQueue: (queueId: string, updates: Partial<QueueDashboard>) => void;
  updateQueueStats: (queueId: string, stats: Partial<QueueStats>) => void;
  setSelectedQueue: (queueId: string | null) => void;
  
  // Agent management
  updateQueueAgents: (queueId: string, agents: QueueAgent[]) => void;
  updateAgent: (queueId: string, agentId: string, updates: Partial<QueueAgent>) => void;
  
  // Contact management
  updateQueuedContacts: (queueId: string, contacts: QueuedContact[]) => void;
  addQueuedContact: (queueId: string, contact: QueuedContact) => void;
  removeQueuedContact: (queueId: string, contactId: string) => void;
  
  // Connection status
  setConnected: (connected: boolean) => void;
  setLastUpdate: (date: Date) => void;
  
  // UI actions
  setRefreshing: (refreshing: boolean) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Utility
  reset: () => void;
}

/**
 * Default refresh interval (30 seconds)
 */
const DEFAULT_REFRESH_INTERVAL = 30000;

/**
 * Queue store with Zustand
 */
export const useQueueStore = create<QueueStoreState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      queues: [],
      selectedQueueId: null,
      isConnected: false,
      lastUpdate: null,
      isRefreshing: false,
      autoRefresh: true,
      refreshInterval: DEFAULT_REFRESH_INTERVAL,

      // Queue management
      setQueues: (queues: QueueDashboard[]) =>
        set((state) => {
          state.queues = queues;
          state.lastUpdate = new Date();
          
          // Auto-select first queue if none selected
          if (!state.selectedQueueId && queues.length > 0) {
            state.selectedQueueId = queues[0].queueId;
          }
        }),

      updateQueue: (queueId: string, updates: Partial<QueueDashboard>) =>
        set((state) => {
          const queueIndex = state.queues.findIndex(q => q.queueId === queueId);
          if (queueIndex >= 0) {
            Object.assign(state.queues[queueIndex], updates);
            state.lastUpdate = new Date();
          }
        }),

      updateQueueStats: (queueId: string, stats: Partial<QueueStats>) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            Object.assign(queue.stats, stats);
            queue.stats.lastUpdated = new Date();
            state.lastUpdate = new Date();
          }
        }),

      setSelectedQueue: (queueId: string | null) =>
        set((state) => {
          state.selectedQueueId = queueId;
        }),

      // Agent management
      updateQueueAgents: (queueId: string, agents: QueueAgent[]) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            queue.agents = agents;
            
            // Update agent counts in stats
            queue.stats.totalAgents = agents.length;
            queue.stats.onlineAgents = agents.filter(a => a.state !== 'Offline').length;
            queue.stats.availableAgents = agents.filter(a => a.state === 'Available').length;
            queue.stats.lastUpdated = new Date();
            
            state.lastUpdate = new Date();
          }
        }),

      updateAgent: (queueId: string, agentId: string, updates: Partial<QueueAgent>) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            const agentIndex = queue.agents.findIndex(a => a.agentId === agentId);
            if (agentIndex >= 0) {
              Object.assign(queue.agents[agentIndex], updates);
              
              // Recalculate agent counts
              queue.stats.onlineAgents = queue.agents.filter(a => a.state !== 'Offline').length;
              queue.stats.availableAgents = queue.agents.filter(a => a.state === 'Available').length;
              queue.stats.lastUpdated = new Date();
              
              state.lastUpdate = new Date();
            }
          }
        }),

      // Contact management
      updateQueuedContacts: (queueId: string, contacts: QueuedContact[]) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            queue.queuedContacts = contacts;
            
            // Update contact counts and wait times
            queue.stats.contactsInQueue = contacts.length;
            queue.stats.longestWaitTime = contacts.length > 0 
              ? Math.max(...contacts.map(c => c.waitTime))
              : 0;
            queue.stats.lastUpdated = new Date();
            
            state.lastUpdate = new Date();
          }
        }),

      addQueuedContact: (queueId: string, contact: QueuedContact) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            queue.queuedContacts.push(contact);
            
            // Update stats
            queue.stats.contactsInQueue = queue.queuedContacts.length;
            queue.stats.longestWaitTime = Math.max(queue.stats.longestWaitTime, contact.waitTime);
            queue.stats.lastUpdated = new Date();
            
            state.lastUpdate = new Date();
          }
        }),

      removeQueuedContact: (queueId: string, contactId: string) =>
        set((state) => {
          const queue = state.queues.find(q => q.queueId === queueId);
          if (queue) {
            queue.queuedContacts = queue.queuedContacts.filter(c => c.contactId !== contactId);
            
            // Recalculate stats
            queue.stats.contactsInQueue = queue.queuedContacts.length;
            queue.stats.longestWaitTime = queue.queuedContacts.length > 0
              ? Math.max(...queue.queuedContacts.map(c => c.waitTime))
              : 0;
            queue.stats.lastUpdated = new Date();
            
            state.lastUpdate = new Date();
          }
        }),

      // Connection status
      setConnected: (connected: boolean) =>
        set((state) => {
          state.isConnected = connected;
        }),

      setLastUpdate: (date: Date) =>
        set((state) => {
          state.lastUpdate = date;
        }),

      // UI actions
      setRefreshing: (refreshing: boolean) =>
        set((state) => {
          state.isRefreshing = refreshing;
        }),

      setAutoRefresh: (autoRefresh: boolean) =>
        set((state) => {
          state.autoRefresh = autoRefresh;
        }),

      setRefreshInterval: (interval: number) =>
        set((state) => {
          state.refreshInterval = interval;
        }),

      reset: () =>
        set((state) => {
          state.queues = [];
          state.selectedQueueId = null;
          state.isConnected = false;
          state.lastUpdate = null;
          state.isRefreshing = false;
          state.autoRefresh = true;
          state.refreshInterval = DEFAULT_REFRESH_INTERVAL;
        }),
    }))
  )
);

/**
 * Selectors for commonly used data
 */
export const useSelectedQueue = () => useQueueStore((state) => {
  const selectedId = state.selectedQueueId;
  return selectedId ? state.queues.find(q => q.queueId === selectedId) : null;
});

export const useQueueStats = (queueId?: string) => useQueueStore((state) => {
  const targetId = queueId || state.selectedQueueId;
  const queue = targetId ? state.queues.find(q => q.queueId === targetId) : null;
  return queue?.stats || null;
});

export const useQueueAgents = (queueId?: string) => useQueueStore((state) => {
  const targetId = queueId || state.selectedQueueId;
  const queue = targetId ? state.queues.find(q => q.queueId === targetId) : null;
  return queue?.agents || [];
});

export const useQueuedContacts = (queueId?: string) => useQueueStore((state) => {
  const targetId = queueId || state.selectedQueueId;
  const queue = targetId ? state.queues.find(q => q.queueId === targetId) : null;
  return queue?.queuedContacts || [];
});

/**
 * Helper functions
 */
export const calculateServiceLevel = (
  contactsHandled: number,
  contactsWithinThreshold: number
): number => {
  if (contactsHandled === 0) return 0;
  return Math.round((contactsWithinThreshold / contactsHandled) * 100);
};

export const formatWaitTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

export const getServiceLevelColor = (percentage: number): string => {
  if (percentage >= 80) return '#10b981'; // green
  if (percentage >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};