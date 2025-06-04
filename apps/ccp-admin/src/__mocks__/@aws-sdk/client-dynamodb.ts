export class DynamoDBClient {
  constructor(config?: any) {}
  
  send = jest.fn().mockResolvedValue({});
  destroy = jest.fn();
}

export const mockDynamoDBClient = new DynamoDBClient();