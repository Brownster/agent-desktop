export type ChatEventHandler = (event: any) => void;

export interface ChatSessionConfig {
  chatDetails: {
    contactId: string;
    participantId: string;
    participantToken: string;
  };
  options?: { region?: string };
  type: string;
  websocketManager?: unknown;
}

export class ChatSession {
  private handlers: Record<string, ChatEventHandler[]> = {};

  constructor(public config: ChatSessionConfig) {}

  async connect(): Promise<{ connectCalled: boolean; connectSuccess: boolean }> {
    return { connectCalled: true, connectSuccess: true };
  }

  async sendMessage(_params: { contentType: string; message: string }): Promise<{ data: { Id: string; AbsoluteTime: string } }> {
    const id = Date.now().toString();
    return { data: { Id: id, AbsoluteTime: new Date().toISOString() } };
  }

  async sendAttachment(_params: { attachment: File }): Promise<{ data: { attachmentId: string } }> {
    return { data: { attachmentId: Date.now().toString() } };
  }

  onMessage(handler: ChatEventHandler): void {
    this.on('message', handler);
  }

  onTyping(handler: ChatEventHandler): void {
    this.on('typing', handler);
  }

  onConnectionBroken(handler: ChatEventHandler): void {
    this.on('connectionBroken', handler);
  }

  onConnectionEstablished(handler: ChatEventHandler): void {
    this.on('connectionEstablished', handler);
  }

  onEnded(handler: ChatEventHandler): void {
    this.on('ended', handler);
  }

  private on(event: string, handler: ChatEventHandler): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  emit(event: string, data?: any): void {
    for (const handler of this.handlers[event] ?? []) {
      handler({ data, chatDetails: this.config.chatDetails });
    }
  }
}

export const connect = {
  ChatSession: {
    SessionTypes: {
      AGENT: 'AGENT',
      CUSTOMER: 'CUSTOMER',
    },
    create(config: ChatSessionConfig): ChatSession {
      return new ChatSession(config);
    },
  },
};
