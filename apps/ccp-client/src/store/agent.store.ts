/**
 * @fileoverview Agent state management store
 * @module store/agent
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Agent state types matching Amazon Connect states
 */
export type AgentState = 
  | 'Available'
  | 'Unavailable'
  | 'AfterContactWork'
  | 'Offline';

/**
 * Unavailable reason types
 */
export interface UnavailableReason {
  name: string;
  label: string;
  color?: string;
}

/**
 * Agent information
 */
export interface AgentInfo {
  agentId: string;
  name: string;
  extension?: string;
  routingProfile: {
    name: string;
    routingProfileId: string;
    queues: Array<{
      queueId: string;
      name: string;
      priority: number;
      delay: number;
    }>;
  };
  permissions: {
    canMakeOutbound: boolean;
    canTransfer: boolean;
    canConference: boolean;
    canMonitor: boolean;
    canRecord: boolean;
  };
}

/**
 * Agent statistics
 */
export interface AgentStats {
  contactsHandled: number;
  averageHandleTime: number;
  timeInCurrentState: number;
  totalLoginTime: number;
  totalAvailableTime: number;
  totalUnavailableTime: number;
  totalAcwTime: number;
}

/**
 * Agent store state interface
 */
interface AgentStoreState {
  // Agent information
  agent: AgentInfo | null;
  
  // Current state
  currentState: AgentState;
  stateStartTime: Date | null;
  unavailableReason: UnavailableReason | null;
  
  // Available unavailable reasons
  unavailableReasons: UnavailableReason[];
  
  // Statistics
  stats: AgentStats;
  
  // Connection status
  isConnected: boolean;
  isInitialized: boolean;
  connectionError: string | null;
  
  // Loading states
  isChangingState: boolean;
  
  // Actions
  setAgent: (agent: AgentInfo) => void;
  setState: (state: AgentState, reason?: UnavailableReason) => void;
  setUnavailableReasons: (reasons: UnavailableReason[]) => void;
  updateStats: (stats: Partial<AgentStats>) => void;
  setConnectionStatus: (connected: boolean, error?: string) => void;
  setInitialized: (initialized: boolean) => void;
  setChangingState: (changing: boolean) => void;
  reset: () => void;
}

/**
 * Default unavailable reasons
 */
const DEFAULT_UNAVAILABLE_REASONS: UnavailableReason[] = [
  { name: 'Break', label: 'Break', color: '#8b5cf6' },
  { name: 'Lunch', label: 'Lunch', color: '#f59e0b' },
  { name: 'Training', label: 'Training', color: '#3b82f6' },
  { name: 'Meeting', label: 'Meeting', color: '#10b981' },
  { name: 'Coaching', label: 'Coaching', color: '#f97316' },
  { name: 'Technical Issues', label: 'Technical Issues', color: '#ef4444' },
];

/**
 * Initial agent statistics
 */
const INITIAL_STATS: AgentStats = {
  contactsHandled: 0,
  averageHandleTime: 0,
  timeInCurrentState: 0,
  totalLoginTime: 0,
  totalAvailableTime: 0,
  totalUnavailableTime: 0,
  totalAcwTime: 0,
};

/**
 * Agent store with Zustand
 */
export const useAgentStore = create<AgentStoreState>()(
  subscribeWithSelector(
    immer((set, _get) => ({
      // Initial state
      agent: null,
      currentState: 'Offline',
      stateStartTime: null,
      unavailableReason: null,
      unavailableReasons: DEFAULT_UNAVAILABLE_REASONS,
      stats: INITIAL_STATS,
      isConnected: false,
      isInitialized: false,
      connectionError: null,
      isChangingState: false,

      // Actions
      setAgent: (agent: AgentInfo) =>
        set((state) => {
          state.agent = agent;
        }),

      setState: (newState: AgentState, reason?: UnavailableReason) =>
        set((state) => {
          const previousState = state.currentState;
          const now = new Date();
          
          // Update time in previous state
          if (state.stateStartTime) {
            const timeInPreviousState = now.getTime() - state.stateStartTime.getTime();
            
            switch (previousState) {
              case 'Available':
                state.stats.totalAvailableTime += timeInPreviousState;
                break;
              case 'Unavailable':
                state.stats.totalUnavailableTime += timeInPreviousState;
                break;
              case 'AfterContactWork':
                state.stats.totalAcwTime += timeInPreviousState;
                break;
            }
          }
          
          // Set new state
          state.currentState = newState;
          state.stateStartTime = now;
          state.unavailableReason = newState === 'Unavailable' ? reason || null : null;
          state.isChangingState = false;
        }),

      setUnavailableReasons: (reasons: UnavailableReason[]) =>
        set((state) => {
          state.unavailableReasons = reasons;
        }),

      updateStats: (newStats: Partial<AgentStats>) =>
        set((state) => {
          Object.assign(state.stats, newStats);
        }),

      setConnectionStatus: (connected: boolean, error?: string) =>
        set((state) => {
          state.isConnected = connected;
          state.connectionError = error || null;
          
          if (!connected) {
            state.currentState = 'Offline';
            state.stateStartTime = null;
            state.unavailableReason = null;
          }
        }),

      setInitialized: (initialized: boolean) =>
        set((state) => {
          state.isInitialized = initialized;
        }),

      setChangingState: (changing: boolean) =>
        set((state) => {
          state.isChangingState = changing;
        }),

      reset: () =>
        set((state) => {
          state.agent = null;
          state.currentState = 'Offline';
          state.stateStartTime = null;
          state.unavailableReason = null;
          state.stats = { ...INITIAL_STATS };
          state.isConnected = false;
          state.isInitialized = false;
          state.connectionError = null;
          state.isChangingState = false;
        }),
    }))
  )
);

/**
 * Selectors for commonly used combinations
 */
export const useAgentState = () => useAgentStore((state) => ({
  currentState: state.currentState,
  unavailableReason: state.unavailableReason,
  stateStartTime: state.stateStartTime,
  isChangingState: state.isChangingState,
}));

export const useAgentInfo = () => useAgentStore((state) => state.agent);

export const useAgentStats = () => useAgentStore((state) => state.stats);

export const useConnectionStatus = () => useAgentStore((state) => ({
  isConnected: state.isConnected,
  isInitialized: state.isInitialized,
  connectionError: state.connectionError,
}));

/**
 * Helper function to get state color
 */
export const getStateColor = (state: AgentState, reason?: UnavailableReason): string => {
  switch (state) {
    case 'Available':
      return '#10b981'; // green
    case 'Unavailable':
      return reason?.color || '#ef4444'; // red or custom color
    case 'AfterContactWork':
      return '#f59e0b'; // yellow
    case 'Offline':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
};

/**
 * Helper function to get state display label
 */
export const getStateLabel = (state: AgentState, reason?: UnavailableReason): string => {
  switch (state) {
    case 'Available':
      return 'Available';
    case 'Unavailable':
      return reason?.label || 'Unavailable';
    case 'AfterContactWork':
      return 'After Contact Work';
    case 'Offline':
      return 'Offline';
    default:
      return state;
  }
};