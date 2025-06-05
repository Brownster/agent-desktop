export class SoftphoneRTCSession {
  public connect: unknown;
  private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(connect: unknown) {
    this.connect = connect;
  }

  on = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  });

  emit(event: string, ...args: unknown[]): void {
    for (const handler of this.handlers[event] ?? []) {
      handler(...args);
    }
  }
}
