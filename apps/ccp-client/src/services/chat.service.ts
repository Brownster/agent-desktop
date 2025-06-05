/**
 * @fileoverview Chat service wrapping Amazon Connect ChatJS
 * @module services/chat
 */

import { useContactStore, type ChatMessage } from '@/store/contact.store';
import type { Logger } from '@agent-desktop/logging';
import { connect, ChatSession, type ChatSessionConfig } from 'amazon-connect-chat-js';

interface StartSessionParams {
  contactId: string;
  participantToken: string;
  participantId: string;
  region?: string;
}

/**
 * Chat service managing ChatSession lifecycle
 */
export class ChatService {
  private logger: Logger;
  private session: ChatSession | null = null;
  private contactId: string | null = null;

  constructor(logger: Logger) {
    this.logger = logger.createChild('ChatService');
  }

  /** Start a new chat session */
  async startSession(params: StartSessionParams): Promise<void> {
    const { contactId, participantToken, participantId, region } = params;
    this.logger.info('Starting chat session', { contactId });
    this.contactId = contactId;

    const config: ChatSessionConfig = {
      chatDetails: {
        contactId,
        participantId,
        participantToken,
      },
      options: { region },
      type: connect.ChatSession.SessionTypes.AGENT,
      websocketManager: (window as any).connect?.core?.getWebSocketManager?.(),
    };

    this.session = connect.ChatSession.create(config);
    this.setupEventHandlers();
    await this.session.connect();
    useContactStore.getState().updateContact(contactId, {
      chatSession: { messages: [], isTyping: false, canSendMessage: true },
    });
  }

  /** Resume an existing chat session */
  async resumeSession(params: StartSessionParams): Promise<void> {
    await this.startSession(params);
  }

  /** End the chat session */
  async endSession(): Promise<void> {
    if (!this.session || !this.contactId) return;
    this.logger.info('Ending chat session', { contactId: this.contactId });
    this.session.emit('ended');
    this.session = null;
    this.contactId = null;
  }

  /** Send a text message */
  async sendMessage(message: string): Promise<void> {
    if (!this.session || !this.contactId) return;
    await this.session.sendMessage({ contentType: 'text/plain', message });
  }

  /** Send attachment */
  async sendAttachment(file: File): Promise<void> {
    if (!this.session || !this.contactId) return;
    await this.session.sendAttachment({ attachment: file });
  }

  private setupEventHandlers(): void {
    if (!this.session || !this.contactId) return;
    const contactId = this.contactId;
    this.session.onMessage(event => {
      const message = this.mapEventToMessage(event);
      useContactStore.getState().addChatMessage(contactId, message);
    });
    this.session.onTyping(event => {
      const isTyping = event.data?.ParticipantRole === 'CUSTOMER';
      useContactStore.getState().setChatTyping(contactId, isTyping);
    });
    this.session.onConnectionBroken(() => {
      this.logger.warn('Chat connection lost', { contactId });
    });
    this.session.onConnectionEstablished(() => {
      this.logger.info('Chat connection established', { contactId });
    });
    this.session.onEnded(() => {
      this.logger.info('Chat session ended', { contactId });
    });
  }

  private mapEventToMessage(event: any): ChatMessage {
    return {
      id: event.data?.Id ?? Date.now().toString(),
      type: 'message',
      sender: event.data?.ParticipantRole === 'AGENT' ? 'agent' : 'customer',
      content: event.data?.Content ?? '',
      timestamp: event.data?.AbsoluteTime ? new Date(event.data.AbsoluteTime) : new Date(),
      metadata: {
        participantId: event.data?.ParticipantId,
        participantRole: event.data?.ParticipantRole,
        contentType: event.data?.ContentType,
      },
    };
  }
}

export default ChatService;
