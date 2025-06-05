import ChatService from './chat.service';
import { useContactStore } from '../store/contact.store';
import type { Logger } from '@agent-desktop/logging';
import { connect } from 'amazon-connect-chat-js';

jest.mock('../store/contact.store');

const mockLogger = {
  createChild: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const mockContactStore = {
  updateContact: jest.fn(),
  addChatMessage: jest.fn(),
  setChatTyping: jest.fn(),
};

(useContactStore as any).getState = jest.fn(() => mockContactStore);

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start a session and update contact', async () => {
    const service = new ChatService(mockLogger);
    await service.startSession({
      contactId: 'c1',
      participantToken: 'token',
      participantId: 'p1',
    });
    expect(mockContactStore.updateContact).toHaveBeenCalledWith('c1', expect.any(Object));
  });

  it('should send a message', async () => {
    const service = new ChatService(mockLogger);
    await service.startSession({ contactId: 'c1', participantToken: 't', participantId: 'p1' });
    const spy = jest.spyOn((service as any).session!, 'sendMessage');
    await service.sendMessage('hi');
    expect(spy).toHaveBeenCalledWith({ contentType: 'text/plain', message: 'hi' });
  });

  it('should handle incoming messages', async () => {
    const service = new ChatService(mockLogger);
    await service.startSession({ contactId: 'c1', participantToken: 't', participantId: 'p1' });
    const session = (service as any).session!;
    session.emit('message', { Id: '1', Content: 'hello', ParticipantRole: 'CUSTOMER' });
    expect(mockContactStore.addChatMessage).toHaveBeenCalled();
  });
});
