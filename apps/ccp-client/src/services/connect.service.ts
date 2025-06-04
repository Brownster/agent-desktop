/**
 * @fileoverview Amazon Connect Streams API integration service
 * @module services/connect
 */

import { useAgentStore, type AgentInfo, type AgentState, type UnavailableReason } from '@/store/agent.store';
import { useContactStore, type Contact, type ContactConnection, type ContactType, type ContactState } from '@/store/contact.store';
import { useQueueStore } from '@/store/queue.store';
import type { Logger } from '@agent-desktop/logging';

// Amazon Connect Streams types (simplified)
declare global {
  interface Window {
    connect: {
      core: {
        initCCP: (container: HTMLElement, config: CCPInitConfig) => void;
        onInitialized: (callback: () => void) => void;
        onViewContact: (callback: (event: any) => void) => void;
        terminate: () => void;
      };
      agent: (callback: (agent: ConnectAgent) => void) => void;
      contact: (callback: (contact: ConnectContact) => void) => void;
      AudioDeviceManager: any;
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
  getConfiguration(): any;
  getAgentStates(): ConnectAgentState[];
  getRoutingProfile(): any;
  getName(): string;
  getExtension(): string;
  isSoftphoneEnabled(): boolean;
  setState(state: ConnectAgentState, options?: any): void;
  connect(endpoint: any, options?: any): void;
  onStateChange(callback: (agentStateChange: any) => void): void;
  onRoutingProfileChange(callback: (routingProfileChange: any) => void): void;
  onContactPending(callback: (agent: ConnectAgent) => void): void;
  onOffline(callback: (agent: ConnectAgent) => void): void;
  onError(callback: (agent: ConnectAgent) => void): void;
  onAfterContactWork(callback: (agent: ConnectAgent) => void): void;
  onMuteToggle(callback: (obj: any) => void): void;
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
  getType(): string;
  getStatus(): any;
  getStatusDuration(): number;
  getQueue(): any;
  getQueueTimestamp(): Date;
  getConnections(): ConnectConnection[];
  getInitialConnection(): ConnectConnection;
  getActiveInitialConnection(): ConnectConnection;
  getThirdPartyConnections(): ConnectConnection[];
  getSingleActiveThirdPartyConnection(): ConnectConnection;
  getAttributes(): { [key: string]: any };
  isSoftphoneCall(): boolean;
  isInbound(): boolean;
  isConnected(): boolean;
  accept(): void;
  destroy(): void;
  notifyIssue(issueCode: string, description: string, endpointARN: string): void;
  addConnection(endpoint: any): void;
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
  getEndpoint(): any;
  getState(): any;
  getStateDuration(): number;
  getType(): string;
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
  private isInitialized = false;
  private ccpContainer: HTMLElement | null = null;
  private agent: ConnectAgent | null = null;
  private activeContacts = new Map<string, ConnectContact>();

  constructor(logger: Logger) {
    this.logger = logger.createChild('ConnectService');
  }

  /**
   * Initialize the Amazon Connect CCP
   */
  async initializeCCP(container: HTMLElement, config: CCPInitConfig): Promise<void> {
    this.logger.info('Initializing Amazon Connect CCP', { config });
    
    try {
      this.ccpContainer = container;
      
      // Initialize CCP
      window.connect.core.initCCP(container, config);
      
      // Set up initialization callback
      window.connect.core.onInitialized(() => {
        this.logger.info('Amazon Connect CCP initialized successfully');
        this.isInitialized = true;
        this.setupEventListeners();
        useAgentStore.getState().setInitialized(true);
      });

      // Set up agent event listener
      window.connect.agent((agent: ConnectAgent) => {
        this.agent = agent;
        this.setupAgentEventListeners(agent);
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
    window.connect.core.onViewContact((event: any) => {
      this.logger.debug('View contact event received', { event });
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
    agent.onStateChange((stateChange: any) => {
      this.logger.debug('Agent state changed', { stateChange });
      this.updateAgentState(agent);
    });

    // Routing profile changes
    agent.onRoutingProfileChange((profileChange: any) => {
      this.logger.debug('Agent routing profile changed', { profileChange });
      this.updateAgentInfo(agent);
    });

    // Agent offline
    agent.onOffline(() => {
      this.logger.warn('Agent went offline');
      useAgentStore.getState().setConnectionStatus(false, 'Agent offline');
    });

    // Agent errors
    agent.onError((error: any) => {
      this.logger.error('Agent error occurred', { error });
      useAgentStore.getState().setConnectionStatus(false, 'Agent error');
    });

    // Mute toggle
    agent.onMuteToggle((obj: any) => {
      this.logger.debug('Agent mute toggled', { obj });
      // Update mute state in active contacts
      this.updateActiveMuteState(obj.muted);
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
          queues: routingProfile?.queues || [],
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
  }

  /**
   * Handle contact ACW
   */
  private handleContactACW(contact: ConnectContact): void {
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
        queueId: queue?.queueId || 'unknown',
        name: queue?.name || 'Unknown Queue',
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
        type: endpoint?.type || 'phone_number',
        phoneNumber: endpoint?.phoneNumber,
        agentId: endpoint?.agentId,
        queueId: endpoint?.queueId,
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
          name: reason?.name || 'Unavailable', 
          type: 'not_routable',
          agentStateARN: reason?.name 
        };
      case 'Offline':
        return { name: 'Offline', type: 'offline' };
      default:
        return { name: 'Offline', type: 'offline' };
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.isInitialized;
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
      
      this.isInitialized = false;
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