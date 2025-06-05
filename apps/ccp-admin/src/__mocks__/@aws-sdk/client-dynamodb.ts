export class DynamoDBClient {
  constructor(_config?: any) {}
  
  send = jest.fn().mockResolvedValue({});
  destroy = jest.fn();
}

export const mockDynamoDBClient = new DynamoDBClient();
