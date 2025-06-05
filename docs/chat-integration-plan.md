# Chat Integration Plan

This document outlines the steps required to replace the temporary demo messages in `ChatInterface` with real chat messaging powered by Amazon Connect.

## 1. Remove Demo Message Initialization
The `ChatInterface` component currently seeds three sample messages whenever a chat contact becomes active:

```tsx
useEffect(() => {
  if (activeContact?.type === 'chat') {
    setMessages([
      { id: '1', contactId: activeContact.contactId, content: 'Hello, I need help with my account', timestamp: new Date(Date.now() - 300000), sender: 'customer', messageType: 'text', status: 'read' },
      { id: '2', contactId: activeContact.contactId, content: 'Customer connected to chat', timestamp: new Date(Date.now() - 299000), sender: 'system', messageType: 'system' },
      { id: '3', contactId: activeContact.contactId, content: 'Hi! I\'d be happy to help you with your account. Can you please provide me with your account number?', timestamp: new Date(Date.now() - 240000), sender: 'agent', messageType: 'text', status: 'read' },
    ]);
  }
}, [activeContact]);
```

These messages should be removed so that chat history is driven entirely by data from Amazon Connect.

## 2. Implement ChatService
Create a dedicated `ChatService` that wraps Amazon Connect Streams chat APIs. Responsibilities include:

- Managing `connect.ChatSession` lifecycle (init, resume, end)
- Sending messages and attachments via `ChatSession.sendMessage`
- Listening for `chat.onMessage`, `chat.onTyping`, `chat.onConnectionLost`, and other events
- Mapping participant events to the application's `ChatMessage` type
- Exposing methods to start or resume a session given a contact or participant token

This service should integrate with the existing `ConnectService` for contact lifecycle events.

## 3. Update ConnectService
Extend `ConnectService` to initialize a `ChatService` instance whenever a chat contact is detected. This requires:

- Detecting chat contacts in `setupContactEventListeners`
- Retrieving the participant token using the Connect Streams API (`contact.getConnectionData()`)
- Passing this token to `ChatService.startSession`
- Subscribing to message and typing events to update the contact store

## 4. Persist Messages in the Contact Store
Modify `useContactStore` so that each contact's `chatSession.messages` array reflects messages from `ChatService`. Add actions for `addChatMessage` and `setChatTyping` if they do not already exist.

`ChatInterface` should read `messages` and `isTyping` from the store instead of its local state. This ensures real-time updates across components.

## 5. Backend Integration
Amazon Connect chat uses the Participant Service APIs which require signed AWS credentials. Provide a lightweight backend (e.g., Lambda or API Gateway) that returns a valid participant token for the agent. The backend should also persist chat transcripts if long‑term storage is required.

Steps:
1. Create an endpoint to call `StartChatContact`/`CreateParticipantConnection` and return the participant token.
2. The frontend fetches this token when a chat contact is accepted and passes it to `ChatService`.
3. Optionally store messages in a database or S3 for historical retrieval.

## 6. UI Enhancements
- Show loading indicators while the chat session is being established.
- Display connection errors and retry options if the chat service disconnects.
- Provide an export or download transcript feature leveraging the persisted history.

## 7. Testing
- Unit tests for `ChatService` to verify message parsing and reconnection logic.
- Integration tests using mocked Streams APIs to simulate incoming chat messages and typing indicators.
- End-to-end tests that start a chat contact and ensure messages appear in the UI.

## 8. Documentation
Update `COMPONENTS.md` and the README with usage details for the new chat flow, including backend prerequisites and environment variables needed for the participant service.

