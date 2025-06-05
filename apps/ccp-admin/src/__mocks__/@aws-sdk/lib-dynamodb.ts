export class DynamoDBDocumentClient {
  static from = jest.fn().mockReturnValue(new DynamoDBDocumentClient());

  constructor(_client?: any, _translateConfig?: any) {}
  
  send = jest.fn().mockResolvedValue({});
  destroy = jest.fn();
}

export class GetCommand {
  constructor(_input: any) {}
}

export class PutCommand {
  constructor(_input: any) {}
}

export class UpdateCommand {
  constructor(_input: any) {}
}

export class DeleteCommand {
  constructor(_input: any) {}
}

export class QueryCommand {
  constructor(_input: any) {}
}

export class ScanCommand {
  constructor(_input: any) {}
}
