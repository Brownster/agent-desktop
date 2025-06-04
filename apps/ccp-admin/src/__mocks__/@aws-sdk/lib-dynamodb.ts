export class DynamoDBDocumentClient {
  static from = jest.fn().mockReturnValue(new DynamoDBDocumentClient());
  
  constructor(client?: any, translateConfig?: any) {}
  
  send = jest.fn().mockResolvedValue({});
  destroy = jest.fn();
}

export class GetCommand {
  constructor(input: any) {}
}

export class PutCommand {
  constructor(input: any) {}
}

export class UpdateCommand {
  constructor(input: any) {}
}

export class DeleteCommand {
  constructor(input: any) {}
}

export class QueryCommand {
  constructor(input: any) {}
}

export class ScanCommand {
  constructor(input: any) {}
}