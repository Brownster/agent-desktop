import { DynamoDBConfigStore } from './config.store';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
      ddbMock.on(ScanCommand).resolves({ Items: mockItems, Count: mockItems.length });

      const result = await store.listCustomerConfigs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockItems);
        expect(result.data.length).toBe(2);
      }
      expect(ddbMock).toHaveReceivedCommandWith(ScanCommand, {
        TableName: tableName,
        FilterExpression: "begins_with(PK, :pk_prefix) AND SK = :sk_value",
        ExpressionAttributeValues: {
          ":pk_prefix": "CUSTOMER#",
          ":sk_value": "CONFIG",
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Listing all customer configurations');
      expect(mockLogger.info).toHaveBeenCalledWith('Customer configurations listed successfully', { count: mockItems.length });
    });

    it('should return an empty list if no configurations are found', async () => {
      ddbMock.on(ScanCommand).resolves({ Items: [], Count: 0 });

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
       ddbMock.on(ScanCommand).resolves({ Items: undefined, Count: 0 });

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
      ddbMock.on(ScanCommand).rejects(dbError);

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
    const mockCustomerId = 'custModGet123';
    const mockModuleId = 'mod1';
    const mockModule: ModuleConfig = {
      module_id: mockModuleId,
      name: 'Test Module 1',
      version: '1.0',
      settings: { enabled: true },
    };
    const mockCustomerConfig: CustomerConfig = {
      customer_id: mockCustomerId,
      version: 1,
      modules: [mockModule, { module_id: 'mod2', name: 'Other Module', version: '1.0', settings: {} }],
      name: 'Customer For Module Test',
      region: 'eu-central-1',
      integrations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should retrieve a specific module configuration from a customer config', async () => {
      // Mock getCustomerConfig to return the mockCustomerConfig
      ddbMock.on(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({ Item: mockCustomerConfig });

      const result = await store.getModuleConfig(mockCustomerId, mockModuleId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockModule);
      }
      // Ensure getCustomerConfig was called
      expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Getting module configuration', { customerId: mockCustomerId, moduleId: mockModuleId });
    });

    it('should return failure if the module is not found in customer config', async () => {
      ddbMock.on(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({ Item: mockCustomerConfig }); // Customer config exists

      const result = await store.getModuleConfig(mockCustomerId, 'nonExistentModule');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Module configuration not found: nonExistentModule');
      }
      expect(mockLogger.warn).toHaveBeenCalledWith('Module configuration not found for customer', { customerId: mockCustomerId, moduleId: 'nonExistentModule' });
    });

    it('should return failure if customer configuration itself is not found', async () => {
      // Mock getCustomerConfig to simulate customer not found
      ddbMock.on(GetCommand, {
        TableName: tableName,
        Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
      }).resolves({ Item: undefined });

      const result = await store.getModuleConfig(mockCustomerId, mockModuleId);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Check message from getModuleConfig, which wraps the error from getCustomerConfig
        expect(result.error.message).toContain('Failed to retrieve customer config for module fetching');
        expect(result.error.message).toContain('Customer configuration not found');
      }
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to get customer configuration while trying to get module config',
        expect.objectContaining({ customerId: mockCustomerId, moduleId: mockModuleId, error: 'Customer configuration not found' })
      );
    });

    it('should return failure if customer config has no modules array', async () => {
       const customerConfigNoModules: Partial<CustomerConfig> = { // Use Partial for easier mocking
         customer_id: mockCustomerId,
         version: 1,
         // modules: undefined, // Explicitly undefined or missing
         name: 'Customer No Modules',
       };
       ddbMock.on(GetCommand, {
         TableName: tableName,
         Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' },
       }).resolves({ Item: customerConfigNoModules as CustomerConfig }); // Cast as CustomerConfig

       const result = await store.getModuleConfig(mockCustomerId, mockModuleId);

       expect(result.success).toBe(false);
       if (!result.success) {
           expect(result.error.message).toBe(`Module configuration not found: ${mockModuleId}`);
       }
    });

    it('should return failure if getCustomerConfig returns a DynamoDB error', async () => {
      const dbError = new Error('DynamoDB error on getCustomerConfig');
      ddbMock.on(GetCommand).rejects(dbError); // getCustomerConfig fails

      const result = await store.getModuleConfig(mockCustomerId, mockModuleId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to retrieve customer config for module fetching');
        expect(result.error.message).toContain(dbError.message);
      }
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to get customer configuration while trying to get module config',
        expect.objectContaining({ customerId: mockCustomerId, moduleId: mockModuleId, error: dbError.message })
      );
    });
  });
  describe('saveModuleConfig', () => {
    const mockCustomerId = 'custModSave123';
    const existingModuleId = 'modExist';
    const newModuleId = 'modNew';

    const mockExistingModule: ModuleConfig = {
      module_id: existingModuleId, name: 'Existing Module', version: '1.0', settings: { data: 'old' }
    };
    const mockNewModule: ModuleConfig = {
      module_id: newModuleId, name: 'New Module', version: '1.0', settings: { data: 'new' }
    };
    const updatedExistingModule: ModuleConfig = {
      module_id: existingModuleId, name: 'Existing Module Updated', version: '1.1', settings: { data: 'updated' }
    };

    const baseCustomerConfig: CustomerConfig = {
      customer_id: mockCustomerId, version: 1, modules: [mockExistingModule],
      name: 'Customer For Module Save', region: 'eu-west-1', integrations: {},
      createdAt: new Date(), updatedAt: new Date()
    };

    beforeEach(() => {
       // Reset mocks for GetCommand and PutCommand for customer configs before each test in this suite
       ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } }).resolves(undefined); // Default to not found
       ddbMock.on(PutCommand, { TableName: tableName }).resolves({}); // Default to success
    });

    it('should add a new module to an existing customer config', async () => {
      // Mock getCustomerConfig to return a config
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(baseCustomerConfig)) }); // Deep copy

      const result = await store.saveModuleConfig(mockCustomerId, mockNewModule);

      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
        TableName: tableName,
        Item: expect.objectContaining({
          PK: `CUSTOMER#${mockCustomerId}`,
          modules: expect.arrayContaining([
            expect.objectContaining(mockExistingModule),
            expect.objectContaining(mockNewModule)
          ]),
          updatedAt: expect.any(String),
        }),
      });
      const putItem = ddbMock.commandCalls(PutCommand)[0].args[0].input.Item;
      expect(putItem.modules.length).toBe(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Saving module configuration', expect.objectContaining({ customerId: mockCustomerId, moduleId: newModuleId }));
    });

    it('should update an existing module in a customer config', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(baseCustomerConfig)) }); // Deep copy

      const result = await store.saveModuleConfig(mockCustomerId, updatedExistingModule);

      expect(result.success).toBe(true);
      const putArgs = ddbMock.commandCalls(PutCommand)[0].args[0].input;
       expect(putArgs.Item.PK).toBe(`CUSTOMER#${mockCustomerId}`);
       expect(putArgs.Item.modules.length).toBe(1);
       expect(putArgs.Item.modules[0]).toEqual(updatedExistingModule); // Check the updated module
       expect(putArgs.Item.updatedAt).toEqual(expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('Module configuration saved successfully by updating customer config', expect.objectContaining({ customerId: mockCustomerId, moduleId: existingModuleId }));
    });

    it('should add a module if customer config has no modules array initially', async () => {
       const configNoModules: CustomerConfig = {
           ...baseCustomerConfig,
           modules: undefined as any, // Simulate modules array not existing
       };
       ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
           .resolves({ Item: JSON.parse(JSON.stringify(configNoModules)) });

       const result = await store.saveModuleConfig(mockCustomerId, mockNewModule);
       expect(result.success).toBe(true);
       const putArgs = ddbMock.commandCalls(PutCommand)[0].args[0].input;
       expect(putArgs.Item.modules.length).toBe(1);
       expect(putArgs.Item.modules[0]).toEqual(mockNewModule);
    });

    it('should return failure if getCustomerConfig fails', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: undefined }); // Simulate customer not found

      const result = await store.saveModuleConfig(mockCustomerId, mockNewModule);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Failed to retrieve customer config for module saving');
      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to get customer configuration while trying to save module config', expect.anything());
    });

    it('should return failure if saveCustomerConfig fails', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(baseCustomerConfig)) }); // get succeeds
      const saveError = new Error('Failed to save updated config');
      ddbMock.on(PutCommand, { TableName: tableName }).rejects(saveError); // save fails

      const result = await store.saveModuleConfig(mockCustomerId, mockNewModule);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Failed to save customer config after module update');
      expect(result.error.message).toContain(saveError.message);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save customer configuration after updating module', expect.anything());
    });
  });
  describe('deleteModuleConfig', () => {
    const mockCustomerId = 'custModDel123';
    const moduleToDeleteId = 'modDel';
    const otherModuleId = 'modOther';

    const mockModuleToDelete: ModuleConfig = {
      module_id: moduleToDeleteId, name: 'Module To Delete', version: '1.0', settings: {}
    };
    const mockOtherModule: ModuleConfig = {
      module_id: otherModuleId, name: 'Other Module', version: '1.0', settings: {}
    };

    const customerConfigWithModule: CustomerConfig = {
      customer_id: mockCustomerId, version: 1, modules: [mockModuleToDelete, mockOtherModule],
      name: 'Customer For Module Delete', region: 'us-east-2', integrations: {},
      createdAt: new Date(), updatedAt: new Date()
    };
     const customerConfigWithoutModule: CustomerConfig = {
       customer_id: mockCustomerId, version: 1, modules: [mockOtherModule],
       name: 'Customer For Module Delete', region: 'us-east-2', integrations: {},
       createdAt: new Date(), updatedAt: new Date()
     };


    beforeEach(() => {
       // Reset mocks for GetCommand and PutCommand for customer configs before each test in this suite
       ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } }).resolves(undefined); // Default to not found
       ddbMock.on(PutCommand, { TableName: tableName }).resolves({}); // Default to success
    });

    it('should successfully delete a module from a customer config', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(customerConfigWithModule)) }); // Deep copy

      const result = await store.deleteModuleConfig(mockCustomerId, moduleToDeleteId);

      expect(result.success).toBe(true);
      expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
        TableName: tableName,
        Item: expect.objectContaining({
          PK: `CUSTOMER#${mockCustomerId}`,
          modules: [expect.objectContaining(mockOtherModule)], // Only other module should remain
          updatedAt: expect.any(String),
        }),
      });
      const putItem = ddbMock.commandCalls(PutCommand)[0].args[0].input.Item;
      expect(putItem.modules.length).toBe(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting module configuration', expect.objectContaining({ customerId: mockCustomerId, moduleId: moduleToDeleteId }));
    });

    it('should return success if module to delete is not found (idempotency)', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(customerConfigWithoutModule)) }); // Config doesn't have the module

      const result = await store.deleteModuleConfig(mockCustomerId, moduleToDeleteId);

      expect(result.success).toBe(true);
      // Ensure PutCommand was NOT called as no change should be made
      expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
      expect(mockLogger.warn).toHaveBeenCalledWith('Module to delete was not found in customer configuration', { customerId: mockCustomerId, moduleId: moduleToDeleteId });
    });

    it('should return success if customer config has no modules array (idempotency)', async () => {
       const configNoModules: CustomerConfig = { ...customerConfigWithoutModule, modules: undefined as any };
       ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
           .resolves({ Item: JSON.parse(JSON.stringify(configNoModules)) });

       const result = await store.deleteModuleConfig(mockCustomerId, moduleToDeleteId);
       expect(result.success).toBe(true);
       expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
       expect(mockLogger.warn).toHaveBeenCalledWith('Modules array does not exist, cannot delete module', { customerId: mockCustomerId, moduleId: moduleToDeleteId });
    });

    it('should return failure if getCustomerConfig fails', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: undefined }); // Simulate customer not found

      const result = await store.deleteModuleConfig(mockCustomerId, moduleToDeleteId);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Failed to retrieve customer config for module deletion');
      expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
    });

    it('should return failure if saveCustomerConfig fails after deleting module', async () => {
      ddbMock.on(GetCommand, { TableName: tableName, Key: { PK: `CUSTOMER#${mockCustomerId}`, SK: 'CONFIG' } })
        .resolves({ Item: JSON.parse(JSON.stringify(customerConfigWithModule)) }); // get succeeds
      const saveError = new Error('Failed to save after delete');
      ddbMock.on(PutCommand, { TableName: tableName }).rejects(saveError); // save fails

      const result = await store.deleteModuleConfig(mockCustomerId, moduleToDeleteId);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Failed to save customer config after module deletion');
      expect(result.error.message).toContain(saveError.message);
    });
  });
});
