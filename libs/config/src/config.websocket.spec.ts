import { ConfigWebSocketService } from './config.websocket';
import { ConfigSource, type ConfigChangeEvent } from './config.service';

describe('ConfigWebSocketService queue', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    createChild: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should drop oldest messages when queue limit is reached', () => {
    const service: any = new ConfigWebSocketService({ maxQueueSize: 2 }, mockLogger as any);

    const createEvent = (key: string): ConfigChangeEvent => ({
      key,
      oldValue: null,
      newValue: key,
      source: ConfigSource.OVERRIDE,
      timestamp: new Date(),
    });

    service.notifyConfigChange('cust', createEvent('k1'));
    service.notifyConfigChange('cust', createEvent('k2'));
    service.notifyConfigChange('cust', createEvent('k3'));
    service.notifyConfigChange('cust', createEvent('k4'));

    const queue = service.messageQueue as any[];
    const keys = queue.map(m => (m.payload as any).change.key);
    expect(queue.length).toBe(2);
    expect(keys).toEqual(['k3', 'k4']);
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
  });
});
