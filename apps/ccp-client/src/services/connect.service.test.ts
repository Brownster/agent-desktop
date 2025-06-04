/**
 * @fileoverview Tests for ConnectService class
 * @module services/connect
 */

import { ConnectService, type CCPInitConfig } from './connect.service';
import { useAgentStore } from '../store/agent.store';
import { useContactStore } from '../store/contact.store';
import { useQueueStore } from '../store/queue.store';
import type { Logger } from '@agent-desktop/logging';
import { SoftphoneRTCSession } from 'amazon-connect-rtc-js';

// Mock the stores
jest.mock('../store/agent.store');
jest.mock('../store/contact.store');
jest.mock('../store/queue.store');
jest.mock('amazon-connect-rtc-js');

// Mock logger
const mockLogger = {
  createChild: jest.fn().mockReturnThis(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

// Mock Connect objects
const mockConnectAgent = {
  getState: jest.fn(),
  getStateDuration: jest.fn().mockReturnValue(3600),
  getPermissions: jest.fn().mockReturnValue(['outboundCall', 'transfer']),
  getConfiguration: jest.fn(),
  getAgentStates: jest.fn(),
  getRoutingProfile: jest.fn(),
  getName: jest.fn().mockReturnValue('Test Agent'),
  getExtension: jest.fn().mockReturnValue('1001'),
  isSoftphoneEnabled: jest.fn().mockReturnValue(true),
  setState: jest.fn(),
  connect: jest.fn(),
  onStateChange: jest.fn(),
  onRoutingProfileChange: jest.fn(),
  onContactPending: jest.fn(),
  onOffline: jest.fn(),
  onError: jest.fn(),
  onAfterContactWork: jest.fn(),
  onMuteToggle: jest.fn(),
};

const mockConnectContact = {
  getContactId: jest.fn().mockReturnValue('contact-123'),
  getOriginalContactId: jest.fn().mockReturnValue('contact-123'),
  getType: jest.fn().mockReturnValue('voice'),
  getStatus: jest.fn(),
  getStatusDuration: jest.fn().mockReturnValue(30),
  getQueue: jest.fn(),
  getQueueTimestamp: jest.fn().mockReturnValue(new Date()),
  getConnections: jest.fn().mockReturnValue([]),
  getInitialConnection: jest.fn(),
  getActiveInitialConnection: jest.fn(),
  getThirdPartyConnections: jest.fn().mockReturnValue([]),
  getSingleActiveThirdPartyConnection: jest.fn(),
  getAttributes: jest.fn().mockReturnValue({ CustomerName: 'John Doe' }),
  isSoftphoneCall: jest.fn().mockReturnValue(true),
  isInbound: jest.fn().mockReturnValue(true),
  isConnected: jest.fn().mockReturnValue(false),
  accept: jest.fn(),
  destroy: jest.fn(),
  notifyIssue: jest.fn(),
  addConnection: jest.fn(),
  toggleActiveConnections: jest.fn(),
  conferenceConnections: jest.fn(),
  onRefresh: jest.fn(),
  onIncoming: jest.fn(),
  onConnecting: jest.fn(),
  onPending: jest.fn(),
  onAccepted: jest.fn(),
  onMissed: jest.fn(),
  onEnded: jest.fn(),
  onDestroy: jest.fn(),
  onACW: jest.fn(),
  onConnected: jest.fn(),
};

const mockConnectConnection = {
  getConnectionId: jest.fn().mockReturnValue('conn-123'),
  getEndpoint: jest.fn(),
  getState: jest.fn(),
  getStateDuration: jest.fn().mockReturnValue(60),
  getType: jest.fn().mockReturnValue('inbound'),
  isInitialConnection: jest.fn().mockReturnValue(true),
  isInbound: jest.fn().mockReturnValue(true),
  isConnected: jest.fn().mockReturnValue(true),
  isConnecting: jest.fn().mockReturnValue(false),
  isOnHold: jest.fn().mockReturnValue(false),
  hold: jest.fn(),
  resume: jest.fn(),
  destroy: jest.fn(),
  sendDigits: jest.fn(),
  onRefresh: jest.fn(),
  onConnecting: jest.fn(),
  onConnected: jest.fn(),
  onEnded: jest.fn(),
  onDestroy: jest.fn(),
  onHold: jest.fn(),
  onUnhold: jest.fn(),
};

// Mock global window.connect
const mockConnect = {
  core: {
    initCCP: jest.fn(),
    onInitialized: jest.fn(),
    onViewContact: jest.fn(),
    terminate: jest.fn(),
  },
  agent: jest.fn(),
  contact: jest.fn(),
  AudioDeviceManager: {
    setDevices: jest.fn(),
    getDevices: jest.fn(),
    getMicrophoneDevices: jest.fn(),
    getSpeakerDevices: jest.fn(),
  },
};

// Mock stores
const mockAgentStore = {
  setInitialized: jest.fn(),
  setAgent: jest.fn(),
  setConnectionStatus: jest.fn(),
  setState: jest.fn(),
  setChangingState: jest.fn(),
  reset: jest.fn(),
};

const mockContactStore = {
  addContact: jest.fn(),
  updateContact: jest.fn(),
  removeContact: jest.fn(),
  setActiveContact: jest.fn(),
  updateConnection: jest.fn(),
  setAccepting: jest.fn(),
  setEnding: jest.fn(),
  reset: jest.fn(),
  contacts: [],
};

const mockQueueStore = {
  reset: jest.fn(),
};

describe('ConnectService', () => {
  let connectService: ConnectService;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup global mocks
    (window as any).connect = mockConnect;

    // Setup store mocks
    (useAgentStore as any).getState = jest.fn().mockReturnValue(mockAgentStore);
    (useContactStore as any).getState = jest.fn().mockReturnValue(mockContactStore);
    (useQueueStore as any).getState = jest.fn().mockReturnValue(mockQueueStore);

    // Create service instance
    connectService = new ConnectService(mockLogger);

    // Create mock container
    mockContainer = document.createElement('div');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create a logger child with ConnectService context', () => {
      expect(mockLogger.createChild).toHaveBeenCalledWith('ConnectService');
    });

    it('should initialize with correct default state', () => {
      expect(connectService.isInitialized()).toBe(false);
    });
  });

  describe('initializeCCP', () => {
    const mockConfig: CCPInitConfig = {
      ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      loginPopup: true,
      region: 'us-east-1',
    };

    it('should initialize CCP with provided config', async () => {
      // Setup initialization callback to be called
      mockConnect.core.onInitialized.mockImplementation((callback) => {
        setTimeout(callback, 0);
      });

      await connectService.initializeCCP(mockContainer, mockConfig);

      expect(mockConnect.core.initCCP).toHaveBeenCalledWith(mockContainer, mockConfig);
      expect(mockConnect.core.onInitialized).toHaveBeenCalled();
      expect(mockConnect.agent).toHaveBeenCalled();
      expect(mockConnect.contact).toHaveBeenCalled();
    });

    it('should log initialization start', async () => {
      mockConnect.core.onInitialized.mockImplementation((callback) => {
        setTimeout(callback, 0);
      });

      await connectService.initializeCCP(mockContainer, mockConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing Amazon Connect CCP',
        { config: mockConfig }
      );
    });

    it('should disable framed softphone when audio mode is vdi', async () => {
      await connectService.initializeCCP(mockContainer, mockConfig, { mode: 'vdi' });

      expect(mockConnect.core.initCCP).toHaveBeenCalledWith(
        mockContainer,
        expect.objectContaining({
          softphone: expect.objectContaining({ allowFramedSoftphone: false }),
        })
      );
    });

    it('should setup VDI audio when mode is vdi', async () => {
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((cb) => {
        agentCallback = cb;
      });

      const setupSpy = jest.spyOn<any, any>(connectService as any, 'setupVDIAudio');

      await connectService.initializeCCP(mockContainer, mockConfig, { mode: 'vdi' });

      agentCallback!(mockConnectAgent);

      expect(setupSpy).toHaveBeenCalled();
    });

    it('should initialize SoftphoneRTCSession on agent refresh in VDI mode', async () => {
      let firstAgentCallback: (agent: any) => void;
      let refreshCallback: () => void;

      // First call for initializeCCP
      mockConnect.agent.mockImplementationOnce((cb) => {
        firstAgentCallback = cb;
      });
      // Second call inside setupVDIAudio
      mockConnect.agent.mockImplementationOnce((cb) => {
        cb(mockConnectAgent);
      });

      mockConnectAgent.onRefresh.mockImplementation((cb) => {
        refreshCallback = cb;
      });

      await connectService.initializeCCP(mockContainer, mockConfig, { mode: 'vdi' });

      firstAgentCallback!(mockConnectAgent);
      refreshCallback!();

      expect(SoftphoneRTCSession).toHaveBeenCalledWith(mockConnect);
    });

    it.skip('should handle initialization errors', async () => {
      const error = new Error('CCP initialization failed');
      mockConnect.core.initCCP.mockImplementation(() => {
        throw error;
      });

      await expect(
        connectService.initializeCCP(mockContainer, mockConfig)
      ).rejects.toThrow('CCP initialization failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize Amazon Connect CCP',
        { error }
      );
      expect(mockAgentStore.setConnectionStatus).toHaveBeenCalledWith(
        false,
        'Failed to initialize CCP'
      );
    });

    it('should setup event listeners on successful initialization', async () => {
      let initCallback: () => void;
      mockConnect.core.onInitialized.mockImplementation((callback) => {
        initCallback = callback;
      });

      connectService.initializeCCP(mockContainer, mockConfig);
      initCallback!();

      expect(mockConnect.core.onViewContact).toHaveBeenCalled();
      expect(mockAgentStore.setInitialized).toHaveBeenCalledWith(true);
    });
  });

  describe('Agent Event Handling', () => {
    beforeEach(() => {
      // Setup mock agent configuration
      mockConnectAgent.getConfiguration.mockReturnValue({
        username: 'test-agent',
        agentStates: [{ name: 'Available', type: 'routable' }],
        permissions: ['outboundCall', 'transfer'],
        routingProfile: {
          routingProfileId: 'rp-123',
          name: 'Test Profile',
          queues: [{ queueId: 'q-123', name: 'Test Queue' }],
        },
      });

      mockConnectAgent.getRoutingProfile.mockReturnValue({
        routingProfileId: 'rp-123',
        name: 'Test Profile',
        queues: [{ queueId: 'q-123', name: 'Test Queue' }],
      });

      mockConnectAgent.getState.mockReturnValue({
        name: 'Available',
        type: 'routable',
      });
    });

    it('should setup agent event listeners when agent callback is triggered', () => {
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      expect(mockConnectAgent.onStateChange).toHaveBeenCalled();
      expect(mockConnectAgent.onRoutingProfileChange).toHaveBeenCalled();
      expect(mockConnectAgent.onOffline).toHaveBeenCalled();
      expect(mockConnectAgent.onError).toHaveBeenCalled();
      expect(mockConnectAgent.onMuteToggle).toHaveBeenCalled();
    });

    it('should update agent info in store', () => {
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      expect(mockAgentStore.setAgent).toHaveBeenCalledWith({
        agentId: 'test-agent',
        name: 'Test Agent',
        extension: '1001',
        routingProfile: {
          name: 'Test Profile',
          routingProfileId: 'rp-123',
          queues: [{ queueId: 'q-123', name: 'Test Queue' }],
        },
        permissions: {
          canMakeOutbound: true,
          canTransfer: true,
          canConference: false,
          canMonitor: false,
          canRecord: false,
        },
      });
      expect(mockAgentStore.setConnectionStatus).toHaveBeenCalledWith(true);
    });

    it('should handle agent state changes', () => {
      let agentCallback: (agent: any) => void;
      let stateChangeCallback: (stateChange: any) => void;

      // Clear the mock to reset previous calls
      mockAgentStore.setState.mockClear();

      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      mockConnectAgent.onStateChange.mockImplementation((callback) => {
        stateChangeCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      // Update the mock to return the new state when called
      mockConnectAgent.getState.mockReturnValue({
        name: 'Unavailable',
        type: 'not_routable',
      });

      // Trigger state change
      stateChangeCallback!({
        agent: mockConnectAgent,
        oldState: { name: 'Available', type: 'routable' },
        newState: { name: 'Unavailable', type: 'not_routable' },
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Agent state changed',
        { oldState: 'Available', newState: 'Unavailable' }
      );
      expect(mockAgentStore.setState).toHaveBeenLastCalledWith('Unavailable');
    });

    it('should handle agent offline events', () => {
      let agentCallback: (agent: any) => void;
      let offlineCallback: () => void;

      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      mockConnectAgent.onOffline.mockImplementation((callback) => {
        offlineCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);
      offlineCallback!();

      expect(mockLogger.warn).toHaveBeenCalledWith('Agent went offline');
      expect(mockAgentStore.setConnectionStatus).toHaveBeenCalledWith(
        false,
        'Agent offline'
      );
    });

    it('should handle agent errors', () => {
      let agentCallback: (agent: any) => void;
      let errorCallback: (error: Error) => void;

      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      mockConnectAgent.onError.mockImplementation((callback) => {
        errorCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      const testError = new Error('Test error');
      errorCallback!(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Agent error occurred',
        { message: 'Test error', stack: testError.stack }
      );
      expect(mockAgentStore.setConnectionStatus).toHaveBeenCalledWith(
        false,
        'Agent error'
      );
    });
  });

  describe('Contact Event Handling', () => {
    beforeEach(() => {
      mockConnectContact.getQueue.mockReturnValue({
        queueId: 'q-123',
        name: 'Test Queue',
      });

      mockConnectContact.getInitialConnection.mockReturnValue(mockConnectConnection);
      
      mockConnectConnection.getEndpoint.mockReturnValue({
        type: 'phone_number',
        phoneNumber: '+1234567890',
      });
    });

    it('should setup contact event listeners when contact callback is triggered', () => {
      let contactCallback: (contact: any) => void;
      mockConnect.contact.mockImplementation((callback) => {
        contactCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      contactCallback!(mockConnectContact);

      expect(mockConnectContact.onIncoming).toHaveBeenCalled();
      expect(mockConnectContact.onConnecting).toHaveBeenCalled();
      expect(mockConnectContact.onAccepted).toHaveBeenCalled();
      expect(mockConnectContact.onConnected).toHaveBeenCalled();
      expect(mockConnectContact.onEnded).toHaveBeenCalled();
      expect(mockConnectContact.onDestroy).toHaveBeenCalled();
      expect(mockConnectContact.onACW).toHaveBeenCalled();
      expect(mockConnectContact.onMissed).toHaveBeenCalled();
      expect(mockConnectContact.onRefresh).toHaveBeenCalled();
    });

    it('should handle incoming contact', () => {
      let contactCallback: (contact: any) => void;
      let incomingCallback: () => void;

      mockConnect.contact.mockImplementation((callback) => {
        contactCallback = callback;
      });

      mockConnectContact.onIncoming.mockImplementation((callback) => {
        incomingCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      contactCallback!(mockConnectContact);
      incomingCallback!();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Contact incoming',
        { contactId: 'contact-123' }
      );
      expect(mockContactStore.addContact).toHaveBeenCalled();
    });

    it('should handle contact accepted', () => {
      let contactCallback: (contact: any) => void;
      let acceptedCallback: () => void;

      mockConnect.contact.mockImplementation((callback) => {
        contactCallback = callback;
      });

      mockConnectContact.onAccepted.mockImplementation((callback) => {
        acceptedCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      contactCallback!(mockConnectContact);
      acceptedCallback!();

      expect(mockContactStore.updateContact).toHaveBeenCalledWith(
        'contact-123',
        expect.objectContaining({
          state: 'connected',
          startTime: expect.any(Date),
        })
      );
      expect(mockContactStore.setActiveContact).toHaveBeenCalledWith('contact-123');
    });

    it('should handle contact destroyed', () => {
      let contactCallback: (contact: any) => void;
      let destroyCallback: () => void;

      mockConnect.contact.mockImplementation((callback) => {
        contactCallback = callback;
      });

      mockConnectContact.onDestroy.mockImplementation((callback) => {
        destroyCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      contactCallback!(mockConnectContact);
      destroyCallback!();

      expect(mockContactStore.removeContact).toHaveBeenCalledWith('contact-123');
    });
  });

  describe('Public API Methods', () => {
    beforeEach(() => {
      // Setup agent
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);
    });

    describe('changeAgentState', () => {
      it('should change agent state successfully', async () => {
        await connectService.changeAgentState('Available');

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Changing agent state',
          { state: 'Available', reason: undefined }
        );
        expect(mockAgentStore.setChangingState).toHaveBeenCalledWith(true);
        expect(mockConnectAgent.setState).toHaveBeenCalledWith({
          name: 'Available',
          type: 'routable',
        });
      });

      it('should handle unavailable state with reason', async () => {
        const reason = { name: 'Lunch', label: 'Lunch Break' };
        await connectService.changeAgentState('Unavailable', reason);

        expect(mockConnectAgent.setState).toHaveBeenCalledWith({
          name: 'Lunch',
          type: 'not_routable',
          agentStateARN: 'Lunch',
        });
      });

      it('should throw error when agent not initialized', async () => {
        const serviceWithoutAgent = new ConnectService(mockLogger);

        await expect(serviceWithoutAgent.changeAgentState('Available'))
          .rejects.toThrow('Agent not initialized');
      });

      it('should handle agent state change errors', async () => {
        const error = new Error('State change failed');
        mockConnectAgent.setState.mockImplementation(() => {
          throw error;
        });

        await expect(connectService.changeAgentState('Available'))
          .rejects.toThrow('State change failed');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to change agent state',
          { error }
        );
        expect(mockAgentStore.setChangingState).toHaveBeenCalledWith(false);
      });
    });

    describe('acceptContact', () => {
      it('should accept contact successfully', async () => {
        // Add contact to active contacts
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        await connectService.acceptContact('contact-123');

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Accepting contact',
          { contactId: 'contact-123' }
        );
        expect(mockContactStore.setAccepting).toHaveBeenCalledWith(true);
        expect(mockConnectContact.accept).toHaveBeenCalled();
      });

      it('should throw error for non-existent contact', async () => {
        await expect(connectService.acceptContact('non-existent'))
          .rejects.toThrow('Contact non-existent not found');
      });

      it('should handle contact accept errors', async () => {
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        const error = new Error('Accept failed');
        mockConnectContact.accept.mockImplementation(() => {
          throw error;
        });

        await expect(connectService.acceptContact('contact-123'))
          .rejects.toThrow('Accept failed');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to accept contact',
          { contactId: 'contact-123', error }
        );
        expect(mockContactStore.setAccepting).toHaveBeenCalledWith(false);
      });
    });

    describe('endContact', () => {
      it('should end contact successfully', async () => {
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        await connectService.endContact('contact-123');

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Ending contact',
          { contactId: 'contact-123' }
        );
        expect(mockContactStore.setEnding).toHaveBeenCalledWith(true);
        expect(mockConnectContact.destroy).toHaveBeenCalled();
      });

      it('should throw error for non-existent contact', async () => {
        await expect(connectService.endContact('non-existent'))
          .rejects.toThrow('Contact non-existent not found');
      });
    });

    describe('toggleHold', () => {
      beforeEach(() => {
        mockConnectContact.getConnections.mockReturnValue([mockConnectConnection]);
      });

      it('should hold connection when not on hold', async () => {
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        mockConnectConnection.isOnHold.mockReturnValue(false);

        await connectService.toggleHold('contact-123', 'conn-123');

        expect(mockConnectConnection.hold).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Toggling hold',
          { contactId: 'contact-123', connectionId: 'conn-123', onHold: false }
        );
      });

      it('should resume connection when on hold', async () => {
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        mockConnectConnection.isOnHold.mockReturnValue(true);

        await connectService.toggleHold('contact-123', 'conn-123');

        expect(mockConnectConnection.resume).toHaveBeenCalled();
      });

      it('should throw error for non-existent connection', async () => {
        const serviceAny = connectService as any;
        serviceAny.activeContacts.set('contact-123', mockConnectContact);

        await expect(connectService.toggleHold('contact-123', 'non-existent'))
          .rejects.toThrow('Connection non-existent not found');
      });
    });
  });

  describe('State Mapping', () => {
    describe('mapConnectStateToAgentState', () => {
      let agentCallback: (agent: any) => void;

      beforeEach(() => {
        mockConnect.agent.mockImplementation((callback) => {
          agentCallback = callback;
        });

        connectService.initializeCCP(mockContainer, {
          ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
        });
      });

      it('should map routable to Available', () => {
        mockConnectAgent.getState.mockReturnValue({
          name: 'Available',
          type: 'routable',
        });

        agentCallback!(mockConnectAgent);

        expect(mockAgentStore.setState).toHaveBeenCalledWith('Available');
      });

      it('should map not_routable to Unavailable', () => {
        mockConnectAgent.getState.mockReturnValue({
          name: 'Break',
          type: 'not_routable',
        });

        agentCallback!(mockConnectAgent);

        expect(mockAgentStore.setState).toHaveBeenCalledWith('Unavailable');
      });

      it('should map offline to Offline', () => {
        mockConnectAgent.getState.mockReturnValue({
          name: 'Offline',
          type: 'offline',
        });

        agentCallback!(mockConnectAgent);

        expect(mockAgentStore.setState).toHaveBeenCalledWith('Offline');
      });

      it('should default unknown types to Offline', () => {
        mockConnectAgent.getState.mockReturnValue({
          name: 'Unknown',
          type: 'unknown',
        });

        agentCallback!(mockConnectAgent);

        expect(mockAgentStore.setState).toHaveBeenCalledWith('Offline');
      });
    });
  });

  describe('terminate', () => {
    it('should terminate CCP and reset stores', () => {
      connectService.terminate();

      expect(mockConnect.core.terminate).toHaveBeenCalled();
      expect(mockAgentStore.reset).toHaveBeenCalled();
      expect(mockContactStore.reset).toHaveBeenCalled();
      expect(mockQueueStore.reset).toHaveBeenCalled();
      expect(connectService.isInitialized()).toBe(false);
    });

    it('should handle termination errors gracefully', () => {
      const error = new Error('Termination failed');
      mockConnect.core.terminate.mockImplementation(() => {
        throw error;
      });

      connectService.terminate();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to terminate CCP',
        { error }
      );
    });

    it('should handle missing connect object', () => {
      (window as any).connect = undefined;

      expect(() => connectService.terminate()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle agent info update errors', () => {
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      mockConnectAgent.getConfiguration.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update agent info',
        { error: expect.any(Error) }
      );
    });

    it('should handle agent state update errors', () => {
      let agentCallback: (agent: any) => void;
      mockConnect.agent.mockImplementation((callback) => {
        agentCallback = callback;
      });

      mockConnectAgent.getState.mockImplementation(() => {
        throw new Error('State error');
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      agentCallback!(mockConnectAgent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update agent state',
        { error: expect.any(Error) }
      );
    });
  });

  describe('View Contact Events', () => {
    it('should handle view contact events', () => {
      let viewContactCallback: (event: any) => void;
      let initCallback: () => void;

      mockConnect.core.onInitialized.mockImplementation((callback) => {
        initCallback = callback;
      });

      mockConnect.core.onViewContact.mockImplementation((callback) => {
        viewContactCallback = callback;
      });

      connectService.initializeCCP(mockContainer, {
        ccpUrl: 'https://test.awsapps.com/connect/ccp-v2',
      });

      initCallback!();

      const viewContactEvent = {
        contactId: 'contact-123',
        contactData: {
          attributes: { CustomerName: 'John Doe' },
          customerEndpoint: {
            type: 'phone_number',
            phoneNumber: '+1234567890',
          },
        },
      };

      viewContactCallback!(viewContactEvent);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'View contact event received',
        {
          contactId: 'contact-123',
          attributes: { CustomerName: 'John Doe' },
        }
      );
    });
  });
});