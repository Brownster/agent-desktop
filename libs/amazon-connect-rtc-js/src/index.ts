export type RTCEventHandler = (...args: unknown[]) => void;

export class SoftphoneRTCSession {
  private handlers: Record<string, RTCEventHandler[]> = {};

  constructor(public connect: unknown) {}

  on(event: string, handler: RTCEventHandler): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  off(event: string, handler: RTCEventHandler): void {
    this.handlers[event] = this.handlers[event]?.filter((h) => h !== handler) ?? [];
  }

  emit(event: string, ...args: unknown[]): void {
    for (const handler of this.handlers[event] ?? []) {
      handler(...args);
    }
  }
}
