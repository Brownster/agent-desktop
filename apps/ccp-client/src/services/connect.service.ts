/**
 * @fileoverview Amazon Connect Streams API integration service
 * @module services/connect
 */

import { useAgentStore, type AgentInfo, type AgentState, type UnavailableReason } from '@/store/agent.store';
import { useContactStore, type Contact, type ContactConnection, type ContactType, type ContactState } from '@/store/contact.store';
import { useQueueStore } from '@/store/queue.store';
import type { Logger } from '@agent-desktop/logging';
import * as connectRTC from 'amazon-connect-rtc-js';
import type { AudioConfiguration } from '@agent-desktop/types';
import ChatService from './chat.service';

/**
 * View contact event interface
 */
interface ViewContactEvent {
  contactId: string;
  contactData?: {
    attributes?: Record<string, string>;
    customerEndpoint?: {
      type: string;
      phoneNumber?: string;
    };
  };
}

/**
 * Agent configuration interface
 */
interface AgentConfiguration {
  username: string;
  agentStates: ConnectAgentState[];
  permissions: string[];
  routingProfile: {
    routingProfileId: string;
    name: string;
    queues: Array<{
      queueId: string;
      name: string;
    }>;
  };
}

/**
 * Agent state change event interface
 */
interface AgentStateChangeEvent {
  agent: ConnectAgent;
  oldState: ConnectAgentState;
  newState: ConnectAgentState;
}

/**
 * Routing profile change event interface
 */
interface RoutingProfileChangeEvent {
  agent: ConnectAgent;
  oldRoutingProfile: {
    routingProfileId: string;
    name: string;
  };
  newRoutingProfile: {
    routingProfileId: string;
    name: string;
  };
}

/**
 * Mute toggle event interface
 */
interface MuteToggleEvent {
  muted: boolean;
  connection?: ConnectConnection;
}

/**
 * Connect endpoint interface
 */
interface ConnectEndpoint {
  type: 'phone_number' | 'agent' | 'queue';
  phoneNumber?: string;
  agentId?: string;
  queueId?: string;
  endpointId?: string;
}

/**
 * Connect contact status interface
 */
interface ConnectContactStatus {
  type: 'incoming' | 'connecting' | 'connected' | 'hold' | 'ended';
  timestamp: Date;
}

/**
 * Connect queue interface
 */
interface ConnectQueue {
  queueId: string;
  name: string;
  queueARN?: string;
}

/**
 * Connect connection state interface
 */
interface ConnectConnectionState {
  type: 'init' | 'connecting' | 'connected' | 'hold' | 'disconnected';
  timestamp: Date;
}

/**
 * Audio device manager interface
 */
interface AudioDeviceManager {
  setDevices(devices: {
    speaker?: string;
    microphone?: string;
  }): void;
  getDevices(): {
    speaker: string;
    microphone: string;
  };
  getMicrophoneDevices(): Array<{
    deviceId: string;
    label: string;
  }>;
  getSpeakerDevices(): Array<{
    deviceId: string;
    label: string;
  }>;
}

// Amazon Connect Streams types
declare global {
  interface Window {
    connect: {
      core: {
        initCCP: (container: HTMLElement, config: CCPInitConfig) => void;
        onInitialized: (callback: () => void) => void;
        onViewContact: (callback: (event: ViewContactEvent) => void) => void;
        terminate: () => void;
      };
      agent: (callback: (agent: ConnectAgent) => void) => void;
      contact: (callback: (contact: ConnectContact) => void) => void;
      AudioDeviceManager: AudioDeviceManager;
    };
  }
}

/**
 * CCP initialization configuration
 */
export interface CCPInitConfig {
  ccpUrl: string;
  loginPopup?: boolean;
  loginPopupAutoClose?: boolean;
  loginOptions?: {
    autoClose?: boolean;
    height?: number;
    width?: number;
    top?: number;
    left?: number;
  };
  region?: string;
  softphone?: {
    allowFramedSoftphone?: boolean;
    disableRingtone?: boolean;
    ringtoneUrl?: string;
  };
  chat?: {
    enabled?: boolean;
  };
  task?: {
    enabled?: boolean;
  };
}

/**
 * Connect Agent interface
 */
interface ConnectAgent {
  getState(): ConnectAgentState;
  getStateDuration(): number;
  getPermissions(): string[];
  getConfiguration(): AgentConfiguration;
  getAgentStates(): ConnectAgentState[];
  getRoutingProfile(): {
    routingProfileId: string;
    name: string;
    queues: Array<{
      queueId: string;
      name: string;
    }>;
  };
  getName(): string;
  getExtension(): string;
  isSoftphoneEnabled(): boolean;
  setState(state: ConnectAgentState, options?: { enqueueNext?: boolean }): void;
  connect(endpoint: ConnectEndpoint, options?: { queueARN?: string }): void;
  onStateChange(callback: (agentStateChange: AgentStateChangeEvent) => void): void;
  onRoutingProfileChange(callback: (routingProfileChange: RoutingProfileChangeEvent) => void): void;
  onContactPending(callback: (agent: ConnectAgent) => void): void;
  onOffline(callback: (agent: ConnectAgent) => void): void;
  onError(callback: (error: Error) => void): void;
  onAfterContactWork(callback: (agent: ConnectAgent) => void): void;
  onMuteToggle(callback: (event: MuteToggleEvent) => void): void;
}

/**
 * Connect Agent State interface
 */
interface ConnectAgentState {
  name: string;
  type: string;
  agentStateARN?: string;
}

/**
 * Connect Contact interface
 */
interface ConnectContact {
  getContactId(): string;
  getOriginalContactId(): string;
  getType(): 'voice' | 'chat' | 'task';
  getStatus(): ConnectContactStatus;
  getStatusDuration(): number;
  getQueue(): ConnectQueue;
  getQueueTimestamp(): Date;
  getConnections(): ConnectConnection[];
  getConnectionData?(): {
    chatDetails?: {
      participantToken: string;
      participantId: string;
    };
  };
  getInitialConnection(): ConnectConnection;
  getActiveInitialConnection(): ConnectConnection;
  getThirdPartyConnections(): ConnectConnection[];
  getSingleActiveThirdPartyConnection(): ConnectConnection;
  getAttributes(): Record<string, string | number | boolean>;
  isSoftphoneCall(): boolean;
  isInbound(): boolean;
  isConnected(): boolean;
  accept(): void;
  destroy(): void;
  notifyIssue(issueCode: string, description: string, endpointARN: string): void;
  addConnection(endpoint: ConnectEndpoint): void;
  toggleActiveConnections(): void;
  conferenceConnections(): void;
  onRefresh(callback: (contact: ConnectContact) => void): void;
  onIncoming(callback: (contact: ConnectContact) => void): void;
  onConnecting(callback: (contact: ConnectContact) => void): void;
  onPending(callback: (contact: ConnectContact) => void): void;
  onAccepted(callback: (contact: ConnectContact) => void): void;
  onMissed(callback: (contact: ConnectContact) => void): void;
  onEnded(callback: (contact: ConnectContact) => void): void;
  onDestroy(callback: (contact: ConnectContact) => void): void;
  onACW(callback: (contact: ConnectContact) => void): void;
  onConnected(callback: (contact: ConnectContact) => void): void;
}

/**
 * Connect Connection interface
 */
interface ConnectConnection {
  getConnectionId(): string;
  getEndpoint(): ConnectEndpoint;
  getState(): ConnectConnectionState;
  getStateDuration(): number;
  getType(): 'inbound' | 'outbound' | 'monitoring';
  isInitialConnection(): boolean;
  isInbound(): boolean;
  isConnected(): boolean;
  isConnecting(): boolean;
  isOnHold(): boolean;
  hold(): void;
  resume(): void;
  destroy(): void;
  sendDigits(digits: string): void;
  onRefresh(callback: (connection: ConnectConnection) => void): void;
  onConnecting(callback: (connection: ConnectConnection) => void): void;
  onConnected(callback: (connection: ConnectConnection) => void): void;
  onEnded(callback: (connection: ConnectConnection) => void): void;
  onDestroy(callback: (connection: ConnectConnection) => void): void;
  onHold(callback: (connection: ConnectConnection) => void): void;
  onUnhold(callback: (connection: ConnectConnection) => void): void;
}

/**
 * Amazon Connect service class
 */
export class ConnectService {
  private logger: Logger;
  private initialized = false;
  private ccpContainer: HTMLElement | null = null;
  private agent: ConnectAgent | null = null;
  private activeContacts = new Map<string, ConnectContact>();
  private audioConfig: AudioConfiguration | undefined;
  private rtcSession: connectRTC.SoftphoneRTCSession | null = null;
  private chatService: ChatService | null = null;

  constructor(logger: Logger) {
    this.logger = logger.createChild('ConnectService');
  }

  /**
   * Initialize the Amazon Connect CCP
   */
  async initializeCCP(
    container: HTMLElement,
    config: CCPInitConfig,
    customerAudioConfig?: AudioConfiguration
  ): Promise<void> {
    this.logger.info('Initializing Amazon Connect CCP', {
      config,
      customerAudioConfig,
    });
    this.audioConfig = customerAudioConfig;
    
    try {
      this.ccpContainer = container;
      
      const streamsConfig: CCPInitConfig = {
        ...config,
        softphone: {
          ...config.softphone,
          allowFramedSoftphone:
            this.audioConfig?.mode !== 'vdi',
        },
      };

      // Initialize CCP
      window.connect.core.initCCP(container, streamsConfig);
      
      // Set up initialization callback
      window.connect.core.onInitialized(() => {
        this.logger.info('Amazon Connect CCP initialized successfully');
        this.initialized = true;
        this.setupEventListeners();
        useAgentStore.getState().setInitialized(true);
      });

      // Set up agent event listener
      window.connect.agent((agent: ConnectAgent) => {
        this.agent = agent;
        this.setupAgentEventListeners(agent);
        if (this.audioConfig?.mode === 'vdi') {
          this.setupVDIAudio();
        } else {
          this.logger.info(
            `Audio mode set to "${this.audioConfig?.mode || 'local'}". Using default Streams softphone.`
          );
        }
      });

      // Set up contact event listener
      window.connect.contact((contact: ConnectContact) => {
        this.setupContactEventListeners(contact);
      });

    } catch (error) {
      this.logger.error('Failed to initialize Amazon Connect CCP', { error });
      useAgentStore.getState().setConnectionStatus(false, 'Failed to initialize CCP');
      throw error;
    }
  }

  /**
   * Set up general event listeners
   */
  private setupEventListeners(): void {
    this.logger.debug('Setting up Amazon Connect event listeners');

    // Handle view contact events for screen pop
    window.connect.core.onViewContact((event: ViewContactEvent) => {
      this.logger.debug('View contact event received', { 
        contactId: event.contactId,
        attributes: event.contactData?.attributes 
      });
      // Handle screen pop logic here
    });
  }

  /**
   * Set up agent-specific event listeners
   */
  private setupAgentEventListeners(agent: ConnectAgent): void {
    this.logger.debug('Setting up agent event listeners');

    // Initial agent setup
    this.updateAgentInfo(agent);
    this.updateAgentState(agent);

    // Agent state changes
    agent.onStateChange((stateChange: AgentStateChangeEvent) => {
      this.logger.debug('Agent state changed', { 
        oldState: stateChange.oldState.name,
        newState: stateChange.newState.name 
      });
      this.updateAgentState(agent);
    });

    // Routing profile changes
    agent.onRoutingProfileChange((profileChange: RoutingProfileChangeEvent) => {
      this.logger.debug('Agent routing profile changed', { 
        oldProfile: profileChange.oldRoutingProfile.name,
        newProfile: profileChange.newRoutingProfile.name 
      });
      this.updateAgentInfo(agent);
    });

    // Agent offline
    agent.onOffline(() => {
      this.logger.warn('Agent went offline');
      useAgentStore.getState().setConnectionStatus(false, 'Agent offline');
    });

    // Agent errors
    agent.onError((error: Error) => {
      this.logger.error('Agent error occurred', { 
        message: error.message,
        stack: error.stack 
      });
      useAgentStore.getState().setConnectionStatus(false, 'Agent error');
    });

    // Mute toggle
    agent.onMuteToggle((event: MuteToggleEvent) => {
      this.logger.debug('Agent mute toggled', { 
        muted: event.muted,
        connectionId: event.connection?.getConnectionId() 
      });
      // Update mute state in active contacts
      this.updateActiveMuteState(event.muted);
    });
  }

  /**
   * Set up contact-specific event listeners
   */
  private setupContactEventListeners(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    this.logger.debug('Setting up contact event listeners', { contactId });

    this.activeContacts.set(contactId, contact);

    // Contact incoming
    contact.onIncoming(() => {
      this.logger.info('Contact incoming', { contactId });
      this.handleContactIncoming(contact);
    });

    // Contact connecting
    contact.onConnecting(() => {
      this.logger.info('Contact connecting', { contactId });
      this.handleContactConnecting(contact);
    });

    // Contact accepted
    contact.onAccepted(() => {
      this.logger.info('Contact accepted', { contactId });
      this.handleContactAccepted(contact);
    });

    // Contact connected
    contact.onConnected(() => {
      this.logger.info('Contact connected', { contactId });
      this.handleContactConnected(contact);
    });

    // Contact ended
    contact.onEnded(() => {
      this.logger.info('Contact ended', { contactId });
      this.handleContactEnded(contact);
    });

    // Contact destroyed
    contact.onDestroy(() => {
      this.logger.info('Contact destroyed', { contactId });
      this.handleContactDestroyed(contact);
    });

    // Contact ACW
    contact.onACW(() => {
      this.logger.info('Contact in ACW', { contactId });
      this.handleContactACW(contact);
    });

    // Contact missed
    contact.onMissed(() => {
      this.logger.warn('Contact missed', { contactId });
      this.handleContactMissed(contact);
    });

    // Contact refresh
    contact.onRefresh(() => {
      this.updateContactState(contact);
    });
  }

  /**
   * Update agent information in store
   */
  private updateAgentInfo(agent: ConnectAgent): void {
    try {
      const config = agent.getConfiguration();
      const routingProfile = agent.getRoutingProfile();
      const permissions = agent.getPermissions();

      const agentInfo: AgentInfo = {
        agentId: config.username || 'unknown',
        name: agent.getName() || 'Unknown Agent',
        extension: agent.getExtension(),
        routingProfile: {
          name: routingProfile?.name || 'Unknown',
          routingProfileId: routingProfile?.routingProfileId || 'unknown',
          queues: (routingProfile?.queues || []).map(queue => ({
            ...queue,
            priority: 1,
            delay: 0
          })),
        },
        permissions: {
          canMakeOutbound: permissions.includes('outboundCall'),
          canTransfer: permissions.includes('transfer'),
          canConference: permissions.includes('conference'),
          canMonitor: permissions.includes('monitor'),
          canRecord: permissions.includes('record'),
        },
      };

      useAgentStore.getState().setAgent(agentInfo);
      useAgentStore.getState().setConnectionStatus(true);

    } catch (error) {
      this.logger.error('Failed to update agent info', { error });
    }
  }

  /**
   * Update agent state in store
   */
  private updateAgentState(agent: ConnectAgent): void {
    try {
      const state = agent.getState();
      const agentState = this.mapConnectStateToAgentState(state);
      
      useAgentStore.getState().setState(agentState);

    } catch (error) {
      this.logger.error('Failed to update agent state', { error });
    }
  }

  /**
   * Map Connect agent state to our AgentState type
   */
  private mapConnectStateToAgentState(connectState: ConnectAgentState): AgentState {
    switch (connectState.type) {
      case 'routable':
        return 'Available';
      case 'not_routable':
        return 'Unavailable';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  }

  /**
   * Handle incoming contact
   */
  private handleContactIncoming(contact: ConnectContact): void {
    const contactData = this.mapConnectContactToContact(contact);
    useContactStore.getState().addContact(contactData);
  }

  /**
   * Handle connecting contact
   */
  private handleContactConnecting(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().updateContact(contactId, {
      state: 'connecting',
    });
  }

  /**
   * Handle accepted contact
   */
  private handleContactAccepted(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().updateContact(contactId, {
      state: 'connected',
      startTime: new Date(),
    });
    useContactStore.getState().setActiveContact(contactId);

    if (contact.getType() === 'chat') {
      try {
        const data = contact.getConnectionData?.();
        const token = data?.chatDetails?.participantToken;
        const participantId = data?.chatDetails?.participantId ?? 'agent';
        if (token) {
          if (!this.chatService) {
            this.chatService = new ChatService(this.logger);
          }
          void this.chatService.startSession({
            contactId,
            participantToken: token,
            participantId,
            region: (window as any).connect?.region || 'us-east-1',
          });
        }
      } catch (err) {
        this.logger.error('Failed to start chat session', { contactId, err });
      }
    }
  }

  /**
   * Handle connected contact
   */
  private handleContactConnected(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().updateContact(contactId, {
      state: 'connected',
    });
    this.updateContactConnections(contact);
  }

  /**
   * Handle ended contact
   */
  private handleContactEnded(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().updateContact(contactId, {
      state: 'ended',
      endTime: new Date(),
    });
  }

  /**
   * Handle destroyed contact
   */
  private handleContactDestroyed(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().removeContact(contactId);
    this.activeContacts.delete(contactId);
    if (contact.getType() === 'chat') {
      this.chatService?.endSession();
      this.chatService = null;
    }
  }

  /**
   * Handle contact ACW
   */
  private handleContactACW(_contact: ConnectContact): void {
    useAgentStore.getState().setState('AfterContactWork');
  }

  /**
   * Handle missed contact
   */
  private handleContactMissed(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    useContactStore.getState().updateContact(contactId, {
      state: 'ended',
    });
  }

  /**
   * Update contact state from Connect contact
   */
  private updateContactState(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    const contactData = this.mapConnectContactToContact(contact);
    useContactStore.getState().updateContact(contactId, contactData);
    this.updateContactConnections(contact);
  }

  /**
   * Update contact connections
   */
  private updateContactConnections(contact: ConnectContact): void {
    const contactId = contact.getContactId();
    const connections = contact.getConnections();
    
    const mappedConnections = connections.map(conn => this.mapConnectConnectionToConnection(conn));
    
    useContactStore.getState().updateContact(contactId, {
      connections: mappedConnections,
    });
  }

  /**
   * Update mute state for active contacts
   */
  private updateActiveMuteState(muted: boolean): void {
    const { contacts } = useContactStore.getState();
    
    contacts.forEach(contact => {
      contact.connections.forEach(connection => {
        useContactStore.getState().updateConnection(
          contact.contactId,
          connection.connectionId,
          { isMuted: muted }
        );
      });
    });
  }

  /**
   * Map Connect contact to our Contact type
   */
  private mapConnectContactToContact(contact: ConnectContact): Contact {
    const queue = contact.getQueue();
    const attributes = contact.getAttributes();
    const connections = contact.getConnections();

    // Determine contact type
    let type: ContactType = 'voice';
    if (contact.getType() === 'chat') type = 'chat';
    if (contact.getType() === 'task') type = 'task';

    // Determine contact state
    let state: ContactState = 'incoming';
    if (contact.isConnected()) state = 'connected';

    // Extract customer information
    const initialConnection = contact.getInitialConnection();
    const endpoint = initialConnection?.getEndpoint();
    
    return {
      contactId: contact.getContactId(),
      type,
      state,
      queue: {
        queueId: queue?.queueId ?? 'unknown',
        name: queue?.name ?? 'Unknown Queue',
      },
      customer: {
        phoneNumber: endpoint?.phoneNumber,
        name: attributes?.CustomerName,
        email: attributes?.CustomerEmail,
      },
      attributes,
      connections: connections.map(conn => this.mapConnectConnectionToConnection(conn)),
      duration: contact.getStatusDuration() || 0,
      queueTime: contact.getQueueTimestamp() ? 
        Date.now() - contact.getQueueTimestamp().getTime() : undefined,
    };
  }

  /**
   * Map Connect connection to our ContactConnection type
   */
  private mapConnectConnectionToConnection(connection: ConnectConnection): ContactConnection {
    const endpoint = connection.getEndpoint();
    
    return {
      connectionId: connection.getConnectionId(),
      type: connection.isInbound() ? 'inbound' : 'outbound',
      state: connection.isConnected() ? 'connected' : 'connecting',
      endpoint: {
        type: endpoint?.type ?? 'phone_number',
        ...(endpoint?.phoneNumber && { phoneNumber: endpoint.phoneNumber }),
        ...(endpoint?.agentId && { agentId: endpoint.agentId }),
        ...(endpoint?.queueId && { queueId: endpoint.queueId }),
      },
      isOnHold: connection.isOnHold(),
      isMuted: false, // Will be updated by mute events
      duration: connection.getStateDuration() || 0,
    };
  }

  /**
   * Public API methods
   */

  /**
   * Change agent state
   */
  async changeAgentState(state: AgentState, reason?: UnavailableReason): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    this.logger.info('Changing agent state', { state, reason });
    useAgentStore.getState().setChangingState(true);

    try {
      const connectState = this.mapAgentStateToConnectState(state, reason);
      this.agent.setState(connectState);
    } catch (error) {
      this.logger.error('Failed to change agent state', { error });
      useAgentStore.getState().setChangingState(false);
      throw error;
    }
  }

  /**
   * Accept incoming contact
   */
  async acceptContact(contactId: string): Promise<void> {
    const contact = this.activeContacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    this.logger.info('Accepting contact', { contactId });
    useContactStore.getState().setAccepting(true);

    try {
      contact.accept();
    } catch (error) {
      this.logger.error('Failed to accept contact', { contactId, error });
      useContactStore.getState().setAccepting(false);
      throw error;
    }
  }

  /**
   * End contact
   */
  async endContact(contactId: string): Promise<void> {
    const contact = this.activeContacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    this.logger.info('Ending contact', { contactId });
    useContactStore.getState().setEnding(true);

    try {
      contact.destroy();
    } catch (error) {
      this.logger.error('Failed to end contact', { contactId, error });
      useContactStore.getState().setEnding(false);
      throw error;
    }
  }

  /**
   * Hold/unhold connection
   */
  async toggleHold(contactId: string, connectionId: string): Promise<void> {
    const contact = this.activeContacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    const connections = contact.getConnections();
    const connection = connections.find(c => c.getConnectionId() === connectionId);
    
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    this.logger.info('Toggling hold', { contactId, connectionId, onHold: connection.isOnHold() });

    try {
      if (connection.isOnHold()) {
        connection.resume();
      } else {
        connection.hold();
      }
    } catch (error) {
      this.logger.error('Failed to toggle hold', { contactId, connectionId, error });
      throw error;
    }
  }

  /**
   * Map our AgentState to Connect agent state
   */
  private mapAgentStateToConnectState(state: AgentState, reason?: UnavailableReason): ConnectAgentState {
    switch (state) {
      case 'Available':
        return { name: 'Available', type: 'routable' };
      case 'Unavailable':
        return { 
          name: reason?.name ?? 'Unavailable', 
          type: 'not_routable',
          agentStateARN: reason?.name ?? 'Unavailable'
        };
      case 'Offline':
        return { name: 'Offline', type: 'offline' };
      default:
        return { name: 'Offline', type: 'offline' };
    }
  }

  private setupVDIAudio(): void {
    this.logger.info('Setting up VDI audio mode using amazon-connect-rtc-js.');

    if (this.rtcSession) return;

    connect.agent((agent: ConnectAgent) => {
      agent.onRefresh(async () => {
        try {
          if (this.audioConfig?.mode === 'vdi' && !this.rtcSession) {
            this.logger.info('Agent refreshed, initializing RTC session for VDI.');
            this.rtcSession = new connectRTC.SoftphoneRTCSession(connect);
            this.rtcSession.on('error', (error: unknown) => {
              this.logger.error('RTC Session Error', { error });
            });
            this.rtcSession.on('warn', (warning: unknown) => {
              this.logger.warn('RTC Session Warning', { warning });
            });
            this.logger.info('SoftphoneRTCSession initialized for VDI audio.');
          }
        } catch (err) {
          this.logger.error('Failed to initialize SoftphoneRTCSession for VDI', {
            err,
          });
        }
      });
    });
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Terminate the CCP connection
   */
  terminate(): void {
    this.logger.info('Terminating Amazon Connect CCP');
    
    try {
      if (window.connect?.core?.terminate) {
        window.connect.core.terminate();
      }
      
      this.initialized = false;
      this.agent = null;
      this.activeContacts.clear();
      
      // Reset stores
      useAgentStore.getState().reset();
      useContactStore.getState().reset();
      useQueueStore.getState().reset();

    } catch (error) {
      this.logger.error('Failed to terminate CCP', { error });
    }
  }
}