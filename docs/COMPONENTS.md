# Component Documentation

This document provides comprehensive documentation for all React components in the Amazon Connect Agent Desktop application.

## 📋 Table of Contents

- [Overview](#overview)
- [Services](#services)
- [Call Controls](#call-controls)
- [Contact Information Panel](#contact-information-panel)
- [DTMF Dialpad](#dtmf-dialpad)
- [Chat Interface](#chat-interface)
- [Queue Dashboard](#queue-dashboard)
- [Agent Status](#agent-status)
- [Component Guidelines](#component-guidelines)

---

## 🎯 Overview

The Agent Desktop uses a modular component architecture where each component is:
- **Self-contained**: Manages its own state and side effects
- **Reusable**: Can be used across different parts of the application
- **Accessible**: Follows WCAG 2.1 AA guidelines
- **Type-safe**: Fully typed with TypeScript
- **Tested**: Comprehensive unit and integration tests

### Component Structure
```
src/
├── components/
│   ├── AgentStatus.tsx      # Agent state management ✅
│   ├── CallControls.tsx     # Call control buttons ✅
│   ├── ContactInfo.tsx      # Customer information panel ✅
│   ├── Dialpad.tsx          # DTMF dialpad ✅
│   ├── ChatInterface.tsx    # Chat messaging ✅
│   ├── QueueDashboard.tsx   # Queue statistics ✅
│   └── shared/              # Shared UI components
├── services/
│   └── connect.service.ts   # Amazon Connect integration ✅
└── store/                   # State management
```

---

## 🔧 Services

### ConnectService

**File**: `src/services/connect.service.ts`

#### Purpose
Core service for Amazon Connect Streams API integration, providing comprehensive CCP (Contact Control Panel) functionality for managing agent states, contacts, and real-time communication.

#### Features
- **CCP Initialization**: Secure iframe-based Connect CCP integration
- **Agent Management**: State changes, routing profiles, permissions
- **Contact Lifecycle**: Complete contact handling from incoming to ACW
- **Real-time Events**: Live event processing for state changes
- **Error Handling**: Comprehensive error recovery and logging

#### Key Capabilities

##### Agent State Management
- **State Transitions**: Available, Unavailable, After Contact Work, Offline
- **Reason Codes**: Support for unavailable reason codes
- **Routing Profiles**: Dynamic routing profile updates
- **Permissions**: Granular permission checking (transfer, conference, etc.)

##### Contact Handling
- **Multi-channel Support**: Voice, chat, and task contacts
- **Contact Events**: Incoming, connecting, connected, ended, destroyed
- **Connection Management**: Hold, resume, transfer, conference operations
- **DTMF Support**: Dual-tone multi-frequency signal transmission

##### Integration Points
```typescript
interface ConnectServiceIntegration {
  // Agent store integration
  agentState: AgentState;
  agentInfo: AgentInfo;
  
  // Contact store integration  
  activeContacts: Contact[];
  contactState: ContactState;
  
  // Queue store integration
  queueStats: QueueStats;
}
```

#### API Methods

##### Core Operations
```typescript
// Initialize CCP
async initializeCCP(container: HTMLElement, config: CCPInitConfig): Promise<void>

// Agent state management
async changeAgentState(state: AgentState, reason?: UnavailableReason): Promise<void>

// Contact operations
async acceptContact(contactId: string): Promise<void>
async endContact(contactId: string): Promise<void>
async toggleHold(contactId: string, connectionId: string): Promise<void>

// Utility methods
isInitialized(): boolean
terminate(): void
```

#### Testing Coverage

**Test File**: `src/services/connect.service.test.ts`

The ConnectService has comprehensive test coverage including:

##### Test Categories
1. **Constructor Tests** - Service initialization and logger setup
2. **CCP Initialization** - Amazon Connect CCP setup and configuration  
3. **Agent Event Handling** - State changes, routing updates, error handling
4. **Contact Event Handling** - Complete contact lifecycle testing
5. **Public API Methods** - All service methods with success/error scenarios
6. **State Mapping** - Connect state to application state conversions
7. **Error Handling** - Comprehensive error scenarios and recovery
8. **Integration Tests** - Store integration and real-time updates

##### Test Statistics
- **36 Tests Passing** ✅
- **1 Test Skipped** (complex async error scenario)
- **Coverage Areas**: Constructor, initialization, agent events, contact events, API methods, state mapping, termination, error handling

##### Mock Strategy
```typescript
// Comprehensive mocking of Amazon Connect APIs
window.connect = {
  core: { initCCP, onInitialized, onViewContact, terminate },
  agent: mockAgentCallback,
  contact: mockContactCallback,
  AudioDeviceManager: mockAudioManager
};

// Store mocking with Zustand
useAgentStore.getState = jest.fn().mockReturnValue(mockAgentStore);
useContactStore.getState = jest.fn().mockReturnValue(mockContactStore);
useQueueStore.getState = jest.fn().mockReturnValue(mockQueueStore);
```

##### Key Test Scenarios
- **CCP initialization** with various configurations
- **Agent state transitions** across all supported states
- **Contact lifecycle events** from incoming to destruction
- **Error handling** for network failures and API errors
- **Store integration** for real-time state synchronization
- **Event callback** registration and triggering
- **Service termination** and cleanup processes

#### Implementation Notes

##### Security Considerations
- **iframe Sandboxing**: Secure CCP iframe integration
- **CORS Handling**: Proper cross-origin configuration
- **Authentication**: Amazon Connect SSO integration
- **Data Encryption**: All communication encrypted in transit

##### Performance Optimizations
- **Event Debouncing**: Prevents excessive state updates
- **Memory Management**: Proper cleanup of event listeners
- **Connection Pooling**: Efficient WebSocket management
- **Error Recovery**: Automatic reconnection strategies

##### VDI Compatibility
- **Audio Optimization**: Optimized for virtual desktop environments
- **Citrix Integration**: Tested with Citrix XenApp/XenDesktop
- **VMware Compatibility**: Support for VMware Horizon
- **AWS WorkSpaces**: Native AWS WorkSpaces optimization

##### Audio Configuration
- **Local**: Standard browser WebRTC audio path
- **Mobile Browser**: Optimized for mobile device constraints
- **VDI**: Uses amazon-connect-rtc-js for media offload

#### Integration Example
```typescript
import { ConnectService } from '@/services/connect.service';
import { Logger } from '@agent-desktop/logging';

// Initialize service
const logger = new Logger({ context: 'CCP' });
const connectService = new ConnectService(logger);

// Setup CCP
await connectService.initializeCCP(ccpContainer, {
  ccpUrl: 'https://myinstance.awsapps.com/connect/ccp-v2',
  loginPopup: true,
  region: 'us-east-1',
  softphone: {
    allowFramedSoftphone: true,
    disableRingtone: false,
  },
});

// Handle agent state changes
await connectService.changeAgentState('Available');

// Handle incoming contacts
await connectService.acceptContact(contactId);
```

---

## 📞 Call Controls

**File**: `src/components/CallControls.tsx`

### Purpose
Provides comprehensive call control functionality for voice, chat, and task contacts with support for all Amazon Connect operations.

### Features
- **Multi-state Management**: Handles incoming, connected, hold, and ended states
- **Visual Feedback**: Animated buttons with loading and pulse effects
- **Advanced Operations**: Transfer, conference, hold, mute capabilities
- **Accessibility**: Full keyboard navigation and screen reader support
- **Context Awareness**: Adapts UI based on contact type and state

### Props Interface
```typescript
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
```

### Usage Example
```tsx
import CallControls from '@/components/CallControls';

function ContactCenter() {
  const handleAccept = (contactId: string) => {
    // Accept incoming call logic
  };

  const handleTransfer = (contactId: string) => {
    // Initiate transfer workflow
  };

  return (
    <CallControls
      onAccept={handleAccept}
      onTransfer={handleTransfer}
      className="w-full max-w-md"
    />
  );
}
```

### Key Components

#### CallControlButton
Individual button component with multiple variants:
- **Primary**: Main action buttons (accept, call)
- **Secondary**: Standard operations (hold, mute)
- **Success**: Positive actions (accept)
- **Danger**: Destructive actions (end call, decline)
- **Warning**: Caution actions (hold state)

### States Handled
1. **No Active Contact**: Shows "Make Call" option
2. **Incoming Call**: Accept/Decline buttons with pulse animation
3. **Connected Call**: Full control panel with hold, mute, transfer, conference
4. **Chat/Task Contacts**: Simplified end contact functionality

### Integration
- **Store Integration**: Uses `useActiveContact` hook from contact store
- **Real-time Updates**: Responds to contact state changes
- **Error Handling**: Graceful handling of failed operations

---

## 👤 Contact Information Panel

**File**: `src/components/ContactInfo.tsx`

### Purpose
Displays comprehensive customer information, interaction history, and contact metadata with real-time updates.

### Features
- **Dynamic Attributes**: Automatically detects and formats contact attributes
- **Timeline View**: Chronological interaction history
- **Priority Indicators**: Visual flags for high-priority contacts
- **Real-time Duration**: Live call duration tracking
- **Contextual Actions**: Quick actions for scheduling and notes

### Props Interface
```typescript
interface ContactInfoProps {
  className?: string;
}
```

### Usage Example
```tsx
import ContactInfo from '@/components/ContactInfo';

function AgentWorkspace() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ContactInfo className="lg:col-span-1" />
      {/* Other components */}
    </div>
  );
}
```

### Key Features

#### Contact Header
- **Customer Identification**: Phone number, name, or "Unknown Caller"
- **Contact Type Badge**: Voice, chat, or task indicator
- **Queue Information**: Current queue assignment
- **Duration Tracking**: Real-time call duration display

#### Attribute Display
Supports multiple attribute types with automatic formatting:
- **Phone Numbers**: E.164 format with click-to-call
- **Email Addresses**: Mailto links
- **URLs**: External link handling
- **Custom Fields**: Dynamic field display with icons

#### Timeline Events
- **Contact Initiated**: When contact started
- **State Changes**: Connection, hold, transfer events
- **Historical Data**: Previous interaction summary

#### Priority Handling
- **High Priority Contacts**: Red alert styling
- **VIP Customers**: Special designation
- **Escalation Flags**: Visual priority indicators

### Integration
- **Contact Store**: Real-time contact data from `useActiveContact`
- **Auto-formatting**: Phone numbers, dates, durations
- **Responsive Design**: Adapts to different screen sizes

---

## 📞 DTMF Dialpad

**File**: `src/components/Dialpad.tsx`

### Purpose
Interactive dialpad for DTMF tone generation and phone number input with support for both dialing and in-call DTMF operations.

### Features
- **Audio Generation**: Real dual-tone multi-frequency (DTMF) audio
- **Keyboard Support**: Full keyboard input for efficiency
- **Call Initiation**: Direct calling from number input
- **DTMF During Calls**: Send tones during active calls
- **Audio Controls**: Enable/disable tone playback

### Props Interface
```typescript
interface DialpadProps {
  onDigitPressed?: (digit: string) => void;
  onCall?: (number: string) => void;
  onDTMF?: (digit: string) => void;
  disabled?: boolean;
  showCallButton?: boolean;
  className?: string;
}
```

### Usage Example
```tsx
import Dialpad from '@/components/Dialpad';

function CommunicationPanel() {
  const handleDTMF = (digit: string) => {
    // Send DTMF tone to active call
    connectService.sendDTMF(digit);
  };

  const handleCall = (number: string) => {
    // Initiate outbound call
    connectService.makeCall(number);
  };

  return (
    <Dialpad
      onDTMF={handleDTMF}
      onCall={handleCall}
      className="max-w-sm mx-auto"
    />
  );
}
```

### Key Features

#### DTMF Audio Generation
```typescript
const DTMF_FREQUENCIES = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};
```

#### Dialpad Layout
Standard 3x4 grid with letters:
- **Row 1**: 1, 2 (ABC), 3 (DEF)
- **Row 2**: 4 (GHI), 5 (JKL), 6 (MNO)
- **Row 3**: 7 (PQRS), 8 (TUV), 9 (WXYZ)
- **Row 4**: *, 0 (+), #

#### Operating Modes
1. **Dialing Mode**: No active contact - shows number input and call button
2. **DTMF Mode**: Active call - sends tones to current call

#### Audio Features
- **Web Audio API**: Modern browser audio generation
- **Tone Duration**: 150ms standard DTMF timing
- **Volume Control**: Adjustable audio output
- **Audio Toggle**: Disable for silent operation

### Integration
- **Contact State**: Automatically switches modes based on active contact
- **Keyboard Events**: Global keyboard listener for efficiency
- **Accessibility**: Full keyboard navigation and screen reader support

---

## 💬 Chat Interface

**File**: `src/components/ChatInterface.tsx`

### Purpose
Full-featured chat interface for real-time customer messaging with support for file attachments, typing indicators, and message status tracking.

### Features
- **Real-time Messaging**: Live chat with instant delivery
- **File Attachments**: Support for documents, images, and files
- **Message Status**: Sent, delivered, read indicators
- **Typing Indicators**: Show when customer is typing
- **Rich Text Support**: Formatting and emoji support
- **Message History**: Scrollable chat history

### Props Interface
```typescript
interface ChatInterfaceProps {
  onSendMessage?: (message: string, attachments?: File[]) => Promise<void>;
  onTypingIndicator?: (isTyping: boolean) => void;
  onEscalateToVoice?: () => void;
  className?: string;
}
```

### Usage Example
```tsx
import ChatInterface from '@/components/ChatInterface';

function CustomerService() {
  const handleSendMessage = async (message: string, attachments?: File[]) => {
    // Send message to customer
    await chatService.sendMessage(activeContactId, message, attachments);
  };

  const handleEscalate = () => {
    // Escalate chat to voice call
    connectService.escalateToVoice(activeContactId);
  };

  return (
    <ChatInterface
      onSendMessage={handleSendMessage}
      onEscalateToVoice={handleEscalate}
      className="h-96"
    />
  );
}
```

### Key Features

#### Message Types
```typescript
interface ChatMessage {
  id: string;
  contactId: string;
  content: string;
  timestamp: Date;
  sender: 'customer' | 'agent' | 'system';
  messageType: 'text' | 'attachment' | 'system';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: ChatAttachment[];
}
```

#### Message Status Indicators
- **Sending**: Spinner animation
- **Sent**: Single checkmark
- **Delivered**: Double checkmark (gray)
- **Read**: Double checkmark (blue)
- **Failed**: Error icon with retry option

#### File Attachment Support
- **Supported Types**: PDF, DOC, DOCX, JPG, PNG, TXT
- **Size Limits**: Configurable per customer
- **Preview**: Attachment preview before sending
- **Progress**: Upload progress indicators

#### Typing Indicators
- **Agent Typing**: Timeout-based typing detection
- **Customer Typing**: Real-time typing status
- **Visual Indicator**: Animated dots for typing status

### Message Formatting
- **Auto-linking**: Automatic URL detection and linking
- **Line Breaks**: Support for multi-line messages
- **Timestamps**: Relative and absolute time display
- **Message Grouping**: Consecutive messages from same sender

### Integration
- **WebSocket**: Real-time message delivery
- **File Upload**: Secure file upload service
- **Contact Store**: Integration with active contact state

---

## 📊 Queue Dashboard

**File**: `src/components/QueueDashboard.tsx`

### Purpose
Real-time queue statistics and performance monitoring with comprehensive metrics display and alerting capabilities.

### Features
- **Live Metrics**: Real-time queue statistics
- **Performance KPIs**: Service level, wait times, agent availability
- **Alert System**: Visual alerts for threshold breaches
- **Historical Data**: Trend analysis and historical performance
- **Multi-queue View**: Aggregated statistics across queues

### Props Interface
```typescript
interface QueueDashboardProps {
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}
```

### Usage Example
```tsx
import QueueDashboard from '@/components/QueueDashboard';

function SupervisorView() {
  const handleRefresh = async () => {
    // Manually refresh queue data
    await queueService.refreshStats();
  };

  return (
    <QueueDashboard
      onRefresh={handleRefresh}
      autoRefresh={true}
      refreshInterval={30000}
      className="h-full"
    />
  );
}
```

### Key Metrics

#### Core KPIs
```typescript
interface QueueMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'warning' | 'critical';
  icon: React.ComponentType;
  description?: string;
}
```

#### Tracked Metrics
1. **Calls Waiting**: Total contacts in all queues
2. **Average Wait Time**: Customer wait time across queues
3. **Agents Available**: Ready agents across all queues
4. **Service Level**: Percentage meeting SLA thresholds
5. **Longest Wait**: Customer waiting the longest
6. **Chat Queue**: Active chat conversations

#### Status Thresholds
- **Normal**: Green indicators, within acceptable ranges
- **Warning**: Yellow indicators, approaching thresholds
- **Critical**: Red indicators, exceeding thresholds

### Visual Components

#### Metric Cards
- **Compact View**: Essential metrics in small cards
- **Detailed View**: Full metrics with trends and descriptions
- **Status Colors**: Color-coded based on performance
- **Trend Indicators**: Up/down arrows for performance trends

#### Queue List
- **Individual Queues**: Per-queue detailed statistics
- **Agent Counts**: Online vs available agents
- **Wait Times**: Formatted duration display
- **Status Indicators**: Green/red availability dots

#### Alert System
- **Critical Alerts**: Prominent display of urgent issues
- **Alert Details**: Specific threshold violations
- **Auto-refresh**: Real-time alert updates

### Integration
- **Queue Store**: Real-time data from `useQueueStore`
- **Auto-refresh**: Configurable refresh intervals
- **WebSocket**: Live data streaming for instant updates

---

## 👨‍💼 Agent Status

**File**: `src/components/AgentStatus.tsx`

### Purpose
Agent state management and availability controls with comprehensive status tracking and reason code support.

### Features
- **State Management**: Available, unavailable, after contact work
- **Reason Codes**: Configurable unavailable reasons
- **Manual State Changes**: Agent-controlled status updates
- **Status History**: Track status change history
- **Extension Display**: Agent extension and routing info

### Key States
- **Available**: Ready to receive contacts
- **Unavailable**: Not available with reason codes
- **After Contact Work (ACW)**: Post-call work period
- **Offline**: Not logged into the system

### Integration
- **Agent Store**: Real-time agent state management
- **Amazon Connect**: Direct integration with Connect agent state
- **Automatic Updates**: System-driven state changes

---

## 🎨 Component Guidelines

### Design Principles

#### Consistency
- **Color Palette**: Consistent use of theme colors
- **Typography**: Standardized font sizes and weights
- **Spacing**: Uniform padding and margin system
- **Icons**: Consistent icon library (Heroicons)

#### Accessibility
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG 2.1 AA compliant contrast ratios
- **Focus Management**: Proper focus indicators and management

#### Performance
- **Lazy Loading**: Components load only when needed
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large data sets
- **Optimistic Updates**: Immediate UI feedback

### Code Standards

#### TypeScript
```typescript
// Always use explicit return types
function ComponentName(props: ComponentProps): React.ReactElement {
  // Component implementation
}

// Use strict prop interfaces
interface ComponentProps {
  required: string;
  optional?: number;
  children?: React.ReactNode;
}
```

#### State Management
```typescript
// Use Zustand for global state
const useComponentStore = create<ComponentState>((set, get) => ({
  // State and actions
}));

// Use useState for local component state
const [localState, setLocalState] = useState<StateType>(initialValue);
```

#### Event Handling
```typescript
// Use useCallback for event handlers
const handleClick = useCallback((event: MouseEvent) => {
  // Handle click
}, [dependencies]);

// Use proper event types
const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
  // Handle key press
}, []);
```

### Testing Guidelines

#### Unit Tests
```typescript
// Test component rendering
test('renders component correctly', () => {
  render(<Component {...defaultProps} />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

// Test user interactions
test('handles user interaction', async () => {
  const mockHandler = jest.fn();
  render(<Component onAction={mockHandler} />);
  
  await userEvent.click(screen.getByRole('button'));
  expect(mockHandler).toHaveBeenCalledWith(expectedArgs);
});
```

#### Integration Tests
```typescript
// Test component integration with stores
test('integrates with store correctly', () => {
  const { result } = renderHook(() => useComponentStore());
  // Test store integration
});
```

### Performance Optimization

#### React.memo Usage
```typescript
const ExpensiveComponent = React.memo<ComponentProps>(
  ({ prop1, prop2 }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison logic if needed
    return prevProps.prop1 === nextProps.prop1;
  }
);
```

#### useCallback and useMemo
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize event handlers
const handleEvent = useCallback((event) => {
  // Handle event
}, [dependencies]);
```

### Documentation Standards

#### JSDoc Comments
```typescript
/**
 * Component description
 * @param props - Component props
 * @returns React element
 */
function Component(props: ComponentProps): React.ReactElement {
  // Implementation
}
```

#### README Files
Each component should have:
- Purpose and use cases
- Props interface documentation
- Usage examples
- Integration notes
- Testing guidelines

---

## 🔄 Future Enhancements

### Planned Improvements
1. **Virtual Scrolling**: For large chat histories
2. **Offline Support**: Service worker integration
3. **Voice Commands**: Voice-controlled navigation
4. **Advanced Themes**: More customization options
5. **Component Library**: Standalone component package

### Performance Targets
- **Load Time**: <200ms initial component render
- **Memory Usage**: <50MB total application memory
- **Bundle Size**: <500KB per component chunk
- **Accessibility**: 100% WCAG 2.1 AA compliance

---

*This documentation is updated regularly as components evolve. Last updated: January 2024*