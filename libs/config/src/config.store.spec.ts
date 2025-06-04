import { DynamoDBConfigStore } from './config.store';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest'; // For expect(mock).toHaveReceivedCommand()
import { success, failure } from '@agent-desktop/types';
import type { CustomerConfig, ModuleConfig } from '@agent-desktop/types';
import type { Logger } from '@agent-desktop/logging';

// Mock Logger
const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  createChild: jest.fn().mockReturnThis(), // Return itself for chained calls
};

describe('DynamoDBConfigStore', () => {
  let store: DynamoDBConfigStore;
  const ddbMock = mockClient(DynamoDBDocumentClient);
  const tableName = 'test-config-table';

  beforeEach(() => {
    ddbMock.reset();
    store = new DynamoDBConfigStore(tableName, mockLogger);
    // Clear mock logger calls before each test
    (mockLogger.debug as jest.Mock).mockClear();
    (mockLogger.info as jest.Mock).mockClear();
    (mockLogger.warn as jest.Mock).mockClear();
    (mockLogger.error as jest.Mock).mockClear();
  });

  describe('getCustomerConfig', () => {
    it('should retrieve and return a customer configuration', async () => {
      const mockCustomerId = 'cust123';
      const mockConfig: CustomerConfig = {
        customer_id: mockCustomerId,
        version: 1,
        modules: [],
        // other necessary fields for CustomerConfig
        name: 'Test Customer',
        region: 'us-east-1',
        integrations: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ddbMock.on(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({ Item: mockConfig });

      const result = await store.getCustomerConfig(mockCustomerId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockConfig);
      }
      expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Getting customer configuration', { customerId: mockCustomerId });
    });

    it('should return a failure if customer configuration is not found', async () => {
      const mockCustomerId = 'cust404';
      ddbMock.on(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({ Item: undefined }); // Simulate item not found

      const result = await store.getCustomerConfig(mockCustomerId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Customer configuration not found');
      }
      expect(mockLogger.warn).toHaveBeenCalledWith('Customer configuration not found', { customerId: mockCustomerId });
    });

    it('should return a failure on DynamoDB error', async () => {
      const mockCustomerId = 'custErr';
      const dbError = new Error('DynamoDB blew up');
      ddbMock.on(GetCommand).rejects(dbError);

      const result = await store.getCustomerConfig(mockCustomerId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(dbError);
      }
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get customer configuration from DynamoDB',
        expect.objectContaining({ customerId: mockCustomerId, error: dbError.message })
      );
    });
  });

  describe('saveCustomerConfig', () => {
    const mockCustomerId = 'custSave123';
    const mockConfig: CustomerConfig = {
      customer_id: mockCustomerId,
      version: 1,
      modules: [{ module_id: 'mod1', name: 'Module 1', version: '1.0', settings: {} }],
      name: 'Test Customer Save',
      region: 'us-west-2',
      integrations: { crm: 'salesforce' },
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'), // This will be overridden
    };

    it('should successfully save a customer configuration', async () => {
      ddbMock.on(PutCommand).resolves({}); // Simulate successful put

      const result = await store.saveCustomerConfig(mockConfig);

      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
        TableName: tableName,
        Item: expect.objectContaining({
          PK: `CUSTOMER#${mockCustomerId}`,
          SK: 'CONFIG',
          customer_id: mockCustomerId,
          version: 1,
          name: 'Test Customer Save',
          updatedAt: expect.any(String), // Check that updatedAt is being set
        }),
      });
      // Verify the updatedAt is close to now
      const actualItem = ddbMock.commandCalls(PutCommand)[0].args[0].input.Item;
      expect(new Date().getTime() - new Date(actualItem.updatedAt).getTime()).toBeLessThan(2000); // Within 2 seconds
      expect(mockLogger.info).toHaveBeenCalledWith('Saving customer configuration',
        expect.objectContaining({ customerId: mockCustomerId })
      );
    });

    it('should return a failure on DynamoDB error during save', async () => {
      const dbError = new Error('DynamoDB save blew up');
      ddbMock.on(PutCommand).rejects(dbError);

      const result = await store.saveCustomerConfig(mockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(dbError);
      }
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save customer configuration to DynamoDB',
        expect.objectContaining({ customerId: mockCustomerId, error: dbError.message })
      );
    });
  });
  describe('deleteCustomerConfig', () => {
    const mockCustomerId = 'custDelete123';

    it('should successfully delete a customer configuration', async () => {
      ddbMock.on(DeleteCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({}); // Simulate successful delete

      const result = await store.deleteCustomerConfig(mockCustomerId);

      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(DeleteCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting customer configuration', { customerId: mockCustomerId });
      expect(mockLogger.info).toHaveBeenCalledWith('Customer configuration deleted successfully', { customerId: mockCustomerId });
    });

    it('should return a failure on DynamoDB error during delete', async () => {
      const dbError = new Error('DynamoDB delete blew up');
      ddbMock.on(DeleteCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).rejects(dbError);

      const result = await store.deleteCustomerConfig(mockCustomerId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(dbError);
      }
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete customer configuration from DynamoDB',
        expect.objectContaining({ customerId: mockCustomerId, error: dbError.message })
      );
    });

    // Note: The DynamoDB DeleteCommand itself doesn't typically return an error
    // if the item to be deleted doesn't exist. It's an idempotent operation.
    // So, a "not found" case for delete is usually handled as a success by the SDK.
    // If specific "not found" behavior before attempting delete was required,
    // it would need a preceding GetCommand, which is not current implementation.
  });
  describe('listCustomerConfigs', () => {
    const mockConfig1: CustomerConfig = {
      customer_id: 'custLis1', version: 1, modules: [], name: 'List Customer 1',
      region: 'us-east-1', integrations: {}, createdAt: new Date(), updatedAt: new Date(),
    };
    const mockConfig2: CustomerConfig = {
      customer_id: 'custLis2', version: 1, modules: [], name: 'List Customer 2',
      region: 'us-west-2', integrations: {}, createdAt: new Date(), updatedAt: new Date(),
    };

    it('should return a list of customer configurations', async () => {
      const mockItems = [mockConfig1, mockConfig2];
      ddbMock.on(QueryCommand).resolves({ Items: mockItems, Count: mockItems.length });

      const result = await store.listCustomerConfigs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockItems);
        expect(result.data.length).toBe(2);
      }
      expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'SK = :sk',
        ExpressionAttributeValues: {
          ':sk': 'CONFIG',
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Listing all customer configurations');
      expect(mockLogger.info).toHaveBeenCalledWith('Customer configurations listed successfully', { count: mockItems.length });
    });

    it('should return an empty list if no configurations are found', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [], Count: 0 });

      const result = await store.listCustomerConfigs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        expect(result.data.length).toBe(0);
      }
      expect(mockLogger.info).toHaveBeenCalledWith('Customer configurations listed successfully', { count: 0 });
    });

    it('should return success with an empty list if Items is undefined in response (as per current code handling)', async () => {
       // This test reflects the current implementation detail where `!Items` leads to `success([])`
       ddbMock.on(QueryCommand).resolves({ Items: undefined, Count: 0 });

       const result = await store.listCustomerConfigs();

       expect(result.success).toBe(true);
       if (result.success) {
           expect(result.data).toEqual([]);
       }
       expect(mockLogger.warn).toHaveBeenCalledWith('No customer configurations found or error in scan operation that resulted in no Items array.');
       expect(mockLogger.info).toHaveBeenCalledWith('Customer configurations listed successfully', { count: 0 });
    });

    it('should return a failure on DynamoDB error during scan', async () => {
      const dbError = new Error('DynamoDB scan blew up');
      ddbMock.on(QueryCommand).rejects(dbError);

      const result = await store.listCustomerConfigs();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(dbError);
      }
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list customer configurations from DynamoDB',
        expect.objectContaining({ error: dbError.message })
      );
    });
  });
  describe('getModuleConfig', () => {
    const customerId = 'custModGet123';
    const moduleId = 'mod1';
    const mockModule: ModuleConfig = { module_id: moduleId, name: 'M1', version: '1', settings: {} } as any;

    it('should retrieve a module', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleId}` } }).resolves({ Item: mockModule });

      const result = await store.getModuleConfig(customerId, moduleId);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(mockModule);
      expect(ddbMock).toHaveReceivedCommandWith(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleId}` } });
    });

    it('should return failure when not found', async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      const result = await store.getModuleConfig(customerId, moduleId);
      expect(result.success).toBe(false);
    });

    it('should handle DynamoDB errors', async () => {
      const err = new Error('dberror');
      ddbMock.on(GetCommand).rejects(err);
      const result = await store.getModuleConfig(customerId, moduleId);
      expect(result.success).toBe(false);
      expect(result.error).toBe(err);
    });
  });

  describe('saveModuleConfig', () => {
    const customerId = 'custSave';
    const moduleConfig: ModuleConfig = { module_id: 'm1', name: 'm1', version: '1', settings: {} } as any;

    it('should save module config', async () => {
      ddbMock.on(PutCommand).resolves({});
      const result = await store.saveModuleConfig(customerId, moduleConfig);
      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(PutCommand, { TableName: tableName, Item: expect.objectContaining({ PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleConfig.module_id}` }) });
    });

    it('should fail on DynamoDB error', async () => {
      const err = new Error('dberr');
      ddbMock.on(PutCommand).rejects(err);
      const result = await store.saveModuleConfig(customerId, moduleConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBe(err);
    });
  });

  describe('deleteModuleConfig', () => {
    const customerId = 'custDel';
    const moduleId = 'm1';

    it('should delete module', async () => {
      ddbMock.on(DeleteCommand).resolves({});
      const result = await store.deleteModuleConfig(customerId, moduleId);
      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(DeleteCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${customerId}`, SK: `MODULE#${moduleId}` } });
    });

    it('should handle DynamoDB error', async () => {
      const err = new Error('db');
      ddbMock.on(DeleteCommand).rejects(err);
      const result = await store.deleteModuleConfig(customerId, moduleId);
      expect(result.success).toBe(false);
      expect(result.error).toBe(err);
    });
  });
});
