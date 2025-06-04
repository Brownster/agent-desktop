/**
 * @fileoverview Tests for AgentStatus component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentStatus from './AgentStatus';
import { useAgentStore } from '@/store/agent.store';

// Mock the agent store
jest.mock('@/store/agent.store', () => ({
  useAgentStore: jest.fn(),
  useAgentInfo: jest.fn(),
  useAgentState: jest.fn(),
  getStateColor: jest.fn(),
  getStateLabel: jest.fn(),
}));

// Mock the time utility
jest.mock('@/utils/time', () => ({
  formatDuration: jest.fn((seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
}));

const mockUseAgentStore = useAgentStore as jest.MockedFunction<typeof useAgentStore>;
const mockUseAgentInfo = require('@/store/agent.store').useAgentInfo;
const mockUseAgentState = require('@/store/agent.store').useAgentState;
const mockGetStateColor = require('@/store/agent.store').getStateColor;
const mockGetStateLabel = require('@/store/agent.store').getStateLabel;

describe('AgentStatus', () => {
  const mockAgent = {
    agentId: 'test-agent',
    name: 'Test Agent',
    extension: '1234',
    routingProfile: {
      name: 'Basic Routing Profile',
      routingProfileId: 'test-profile',
      queues: [
        { queueId: 'queue1', name: 'Support Queue', priority: 1, delay: 0 },
        { queueId: 'queue2', name: 'Sales Queue', priority: 2, delay: 0 },
      ],
    },
    permissions: {
      canMakeOutbound: true,
      canTransfer: true,
      canConference: true,
      canMonitor: false,
      canRecord: true,
    },
  };

  const mockAgentState = {
    currentState: 'Available',
    unavailableReason: null,
    stateStartTime: new Date('2024-01-01T12:00:00Z'),
    isChangingState: false,
  };

  const mockUnavailableReasons = [
    { name: 'Break', label: 'Break', color: '#f59e0b' },
    { name: 'Lunch', label: 'Lunch', color: '#10b981' },
    { name: 'Training', label: 'Training', color: '#3b82f6' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAgentInfo.mockReturnValue(mockAgent);
    mockUseAgentState.mockReturnValue(mockAgentState);
    mockUseAgentStore.mockReturnValue({
      unavailableReasons: mockUnavailableReasons,
    });
    mockGetStateColor.mockReturnValue('#10b981');
    mockGetStateLabel.mockReturnValue('Available');

    // Mock timers for duration updates
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:05:00Z')); // 5 minutes after state start
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render agent information correctly', () => {
    render(<AgentStatus />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Ext: 1234')).toBeInTheDocument();
  });

  it('should display current agent state', () => {
    render(<AgentStatus />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('should display routing profile information', () => {
    render(<AgentStatus />);
    
    expect(screen.getByText('Routing Profile')).toBeInTheDocument();
    expect(screen.getByText('Basic Routing Profile')).toBeInTheDocument();
    expect(screen.getByText('Queues: 2')).toBeInTheDocument();
  });

  it('should show state duration when state start time is available', () => {
    render(<AgentStatus />);
    
    // Should show duration since stateStartTime
    expect(screen.getByText(/in Available/)).toBeInTheDocument();
  });

  it('should call onStateChange when a state is selected', () => {
    const mockOnStateChange = jest.fn();
    render(<AgentStatus onStateChange={mockOnStateChange} />);
    
    // Click the state dropdown
    const stateButton = screen.getByRole('button', { name: /Available/i });
    fireEvent.click(stateButton);
    
    // Click on Available option (should be visible in the dropdown)
    const availableOption = screen.getByRole('button', { name: /Available/ });
    fireEvent.click(availableOption);
    
    expect(mockOnStateChange).toHaveBeenCalledWith('Available');
  });

  it('should display unavailable reasons in dropdown', () => {
    render(<AgentStatus />);
    
    // Click the state dropdown
    const stateButton = screen.getByRole('button', { name: /Available/i });
    fireEvent.click(stateButton);
    
    // Check that unavailable reasons are displayed
    expect(screen.getByText('Break')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should handle unavailable state with reason', () => {
    const unavailableState = {
      ...mockAgentState,
      currentState: 'Unavailable',
      unavailableReason: { name: 'Break', label: 'Break', color: '#f59e0b' },
    };
    
    mockUseAgentState.mockReturnValue(unavailableState);
    mockGetStateLabel.mockReturnValue('Break');
    mockGetStateColor.mockReturnValue('#f59e0b');
    
    render(<AgentStatus />);
    
    expect(screen.getByText('Break')).toBeInTheDocument();
  });

  it('should disable state button when changing state', () => {
    const changingState = {
      ...mockAgentState,
      isChangingState: true,
    };
    
    mockUseAgentState.mockReturnValue(changingState);
    
    render(<AgentStatus />);
    
    const stateButton = screen.getByRole('button', { name: /Available/i });
    expect(stateButton).toBeDisabled();
  });

  it('should handle missing agent information gracefully', () => {
    mockUseAgentInfo.mockReturnValue(null);
    
    render(<AgentStatus />);
    
    expect(screen.getByText('Unknown Agent')).toBeInTheDocument();
  });

  it('should not display routing profile section when not available', () => {
    const agentWithoutProfile = {
      ...mockAgent,
      routingProfile: null,
    };
    
    mockUseAgentInfo.mockReturnValue(agentWithoutProfile);
    
    render(<AgentStatus />);
    
    expect(screen.queryByText('Routing Profile')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<AgentStatus className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should call onStateChange with unavailable reason', () => {
    const mockOnStateChange = jest.fn();
    render(<AgentStatus onStateChange={mockOnStateChange} />);
    
    // Click the state dropdown
    const stateButton = screen.getByRole('button', { name: /Available/i });
    fireEvent.click(stateButton);
    
    // Click on Break option
    const breakOption = screen.getByText('Break');
    fireEvent.click(breakOption);
    
    expect(mockOnStateChange).toHaveBeenCalledWith('Unavailable', {
      name: 'Break',
      label: 'Break',
      color: '#f59e0b',
    });
  });
});