/**
 * @fileoverview Integration tests for API Provider
 * @module providers/__tests__/APIProvider.integration
 */

import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { APIProvider, APIContext } from '../APIProvider';
import { CustomerAPIService } from '../../services/api/customers.api';
import { ModuleAPIService } from '../../services/api/modules.api';
import { AnalyticsAPIService } from '../../services/api/analytics.api';
import { AdminWebSocketService } from '../../services/websocket/websocket.service';

// Mock API services
jest.mock('../../services/api/customers.api');
jest.mock('../../services/api/modules.api');
jest.mock('../../services/api/analytics.api');
jest.mock('../../services/websocket/websocket.service');

const MockedCustomerAPIService = CustomerAPIService as jest.MockedClass<typeof CustomerAPIService>;
const MockedModuleAPIService = ModuleAPIService as jest.MockedClass<typeof ModuleAPIService>;
const MockedAnalyticsAPIService = AnalyticsAPIService as jest.MockedClass<
  typeof AnalyticsAPIService
>;
const MockedWebSocketService = AdminWebSocketService as jest.MockedClass<
  typeof AdminWebSocketService
>;

// Test component that uses API context
const TestComponent: React.FC = () => {
  const { customerAPI, modulesAPI, analyticsAPI, websocket, isConnected, connect, disconnect } =
    useContext(APIContext);

  return (
    <div>
      <div data-testid='connection-status'>{isConnected ? 'Connected' : 'Disconnected'}</div>
      <button data-testid='connect-btn' onClick={() => connect('ws://localhost:8080')}>
        Connect
      </button>
      <button data-testid='disconnect-btn' onClick={disconnect}>
        Disconnect
      </button>
      <div data-testid='customer-api'>{customerAPI ? 'Available' : 'Not Available'}</div>
      <div data-testid='modules-api'>{modulesAPI ? 'Available' : 'Not Available'}</div>
      <div data-testid='analytics-api'>{analyticsAPI ? 'Available' : 'Not Available'}</div>
      <div data-testid='websocket'>{websocket ? 'Available' : 'Not Available'}</div>
    </div>
  );
};

describe('APIProvider Integration Tests', () => {
  let mockCustomerAPI: jest.Mocked<CustomerAPIService>;
  let mockModulesAPI: jest.Mocked<ModuleAPIService>;
  let mockAnalyticsAPI: jest.Mocked<AnalyticsAPIService>;
  let mockWebSocket: jest.Mocked<AdminWebSocketService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockCustomerAPI = {
      getCustomers: jest.fn(),
      getCustomer: jest.fn(),
      createCustomer: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
      getCustomerModules: jest.fn(),
      enableModule: jest.fn(),
      disableModule: jest.fn(),
      validateCustomerConfig: jest.fn(),
      getCustomerIntegrations: jest.fn(),
      createIntegration: jest.fn(),
      testIntegration: jest.fn(),
      getCustomerMetrics: jest.fn(),
      getCustomerUsage: jest.fn(),
      getCustomerActivity: jest.fn(),
      bulkUpdateCustomers: jest.fn(),
      exportCustomers: jest.fn(),
      importCustomers: jest.fn(),
    } as any;

    mockModulesAPI = {
      getModules: jest.fn(),
      getModule: jest.fn(),
      createModule: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn(),
      getModuleDependencies: jest.fn(),
      validateModule: jest.fn(),
      deployModule: jest.fn(),
      getModuleMetrics: jest.fn(),
      getModuleHealth: jest.fn(),
    } as any;

    mockAnalyticsAPI = {
      getOverview: jest.fn(),
      getMetrics: jest.fn(),
      getUsageStats: jest.fn(),
      getPerformanceData: jest.fn(),
      getUserActivity: jest.fn(),
      getSystemHealth: jest.fn(),
      exportReport: jest.fn(),
      getCustomReport: jest.fn(),
      scheduleReport: jest.fn(),
      getReportHistory: jest.fn(),
    } as any;

    mockWebSocket = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      isConnected: jest.fn(),
    } as any;

    // Mock constructors
    MockedCustomerAPIService.mockImplementation(() => mockCustomerAPI);
    MockedModuleAPIService.mockImplementation(() => mockModulesAPI);
    MockedAnalyticsAPIService.mockImplementation(() => mockAnalyticsAPI);
    MockedWebSocketService.mockImplementation(() => mockWebSocket);
  });

  describe('Provider initialization', () => {
    it('should provide API service instances to consumers', () => {
      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      expect(screen.getByTestId('customer-api')).toHaveTextContent('Available');
      expect(screen.getByTestId('modules-api')).toHaveTextContent('Available');
      expect(screen.getByTestId('analytics-api')).toHaveTextContent('Available');
      expect(screen.getByTestId('websocket')).toHaveTextContent('Available');
    });

    it('should initialize with disconnected WebSocket state', () => {
      mockWebSocket.isConnected.mockReturnValue(false);

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    });

    it('should create single instances of API services', () => {
      const TestMultipleConsumers: React.FC = () => {
        const context1 = useContext(APIContext);
        const context2 = useContext(APIContext);

        return (
          <div data-testid='same-instance'>
            {context1.customerAPI === context2.customerAPI ? 'Same' : 'Different'}
          </div>
        );
      };

      render(
        <APIProvider>
          <TestMultipleConsumers />
        </APIProvider>
      );

      expect(screen.getByTestId('same-instance')).toHaveTextContent('Same');
    });
  });

  describe('WebSocket connection management', () => {
    it('should handle WebSocket connection', async () => {
      mockWebSocket.connect.mockResolvedValue(undefined);
      mockWebSocket.isConnected.mockReturnValue(true);

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      await act(async () => {
        connectBtn.click();
      });

      await waitFor(() => {
        expect(mockWebSocket.connect).toHaveBeenCalledWith('ws://localhost:8080');
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });

    it('should handle WebSocket disconnection', async () => {
      mockWebSocket.isConnected.mockReturnValue(false);

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      const disconnectBtn = screen.getByTestId('disconnect-btn');

      await act(async () => {
        disconnectBtn.click();
      });

      expect(mockWebSocket.disconnect).toHaveBeenCalled();
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    });

    it('should handle WebSocket connection errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockWebSocket.connect.mockRejectedValue(new Error('Connection failed'));

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      await act(async () => {
        connectBtn.click();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to connect to WebSocket:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Real-time data synchronization', () => {
    it('should handle real-time customer updates', async () => {
      const mockSubscribe = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockWebSocket.subscribe.mockReturnValue(mockUnsubscribe);
      mockWebSocket.isConnected.mockReturnValue(true);

      const CustomerUpdateComponent: React.FC = () => {
        const { websocket } = useContext(APIContext);

        React.useEffect(() => {
          if (websocket) {
            return websocket.subscribe('customer_update', mockSubscribe);
          }
        }, [websocket]);

        return <div data-testid='customer-updates'>Listening for updates</div>;
      };

      render(
        <APIProvider>
          <CustomerUpdateComponent />
        </APIProvider>
      );

      expect(screen.getByTestId('customer-updates')).toBeInTheDocument();
      expect(mockWebSocket.subscribe).toHaveBeenCalledWith('customer_update', mockSubscribe);
    });

    it('should handle real-time module status updates', async () => {
      const mockSubscribe = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockWebSocket.subscribe.mockReturnValue(mockUnsubscribe);

      const ModuleStatusComponent: React.FC = () => {
        const { websocket } = useContext(APIContext);

        React.useEffect(() => {
          if (websocket) {
            return websocket.subscribe('module_status', mockSubscribe);
          }
        }, [websocket]);

        return <div data-testid='module-status'>Monitoring modules</div>;
      };

      render(
        <APIProvider>
          <ModuleStatusComponent />
        </APIProvider>
      );

      expect(mockWebSocket.subscribe).toHaveBeenCalledWith('module_status', mockSubscribe);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle API service initialization errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      MockedCustomerAPIService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      expect(() => {
        render(
          <APIProvider>
            <TestComponent />
          </APIProvider>
        );
      }).not.toThrow();

      consoleError.mockRestore();
    });

    it('should provide fallback services when initialization fails', () => {
      MockedCustomerAPIService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      // Should still provide modules and analytics APIs
      expect(screen.getByTestId('modules-api')).toHaveTextContent('Available');
      expect(screen.getByTestId('analytics-api')).toHaveTextContent('Available');
    });

    it('should handle WebSocket service initialization errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      MockedWebSocketService.mockImplementation(() => {
        throw new Error('WebSocket service initialization failed');
      });

      render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      // Should still render without crashing
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Context usage outside provider', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('APIContext must be used within an APIProvider');

      consoleError.mockRestore();
    });
  });

  describe('Performance and memory management', () => {
    it('should not recreate API instances on re-renders', () => {
      const { rerender } = render(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      const initialCustomerAPICallCount = MockedCustomerAPIService.mock.calls.length;
      const initialModulesAPICallCount = MockedModuleAPIService.mock.calls.length;
      const initialAnalyticsAPICallCount = MockedAnalyticsAPIService.mock.calls.length;

      rerender(
        <APIProvider>
          <TestComponent />
        </APIProvider>
      );

      expect(MockedCustomerAPIService.mock.calls.length).toBe(initialCustomerAPICallCount);
      expect(MockedModuleAPIService.mock.calls.length).toBe(initialModulesAPICallCount);
      expect(MockedAnalyticsAPIService.mock.calls.length).toBe(initialAnalyticsAPICallCount);
    });

    it('should cleanup WebSocket subscriptions on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocket.subscribe.mockReturnValue(mockUnsubscribe);

      const SubscriptionComponent: React.FC = () => {
        const { websocket } = useContext(APIContext);

        React.useEffect(() => {
          if (websocket) {
            return websocket.subscribe('test', () => {});
          }
        }, [websocket]);

        return <div>Subscription component</div>;
      };

      const { unmount } = render(
        <APIProvider>
          <SubscriptionComponent />
        </APIProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('API service integration', () => {
    it('should properly integrate with Customer API service', async () => {
      const mockCustomers = {
        items: [{ customer_id: '1', name: 'Test Customer' }],
        total: 1,
        page: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false,
        summary: { totalActive: 1, totalInactive: 0, totalByPlan: {} },
      };

      mockCustomerAPI.getCustomers.mockResolvedValue(mockCustomers);

      const CustomerListComponent: React.FC = () => {
        const { customerAPI } = useContext(APIContext);
        const [customers, setCustomers] = React.useState<any>(null);

        React.useEffect(() => {
          customerAPI?.getCustomers().then(setCustomers);
        }, [customerAPI]);

        return (
          <div data-testid='customer-list'>
            {customers ? `${customers.items.length} customers` : 'Loading...'}
          </div>
        );
      };

      render(
        <APIProvider>
          <CustomerListComponent />
        </APIProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('customer-list')).toHaveTextContent('1 customers');
      });

      expect(mockCustomerAPI.getCustomers).toHaveBeenCalled();
    });

    it('should properly integrate with Modules API service', async () => {
      const mockModules = {
        modules: [{ module_id: 'mod_1', name: 'Test Module' }],
        total: 1,
        available: [],
      };

      mockModulesAPI.getModules.mockResolvedValue(mockModules);

      const ModuleListComponent: React.FC = () => {
        const { modulesAPI } = useContext(APIContext);
        const [modules, setModules] = React.useState<any>(null);

        React.useEffect(() => {
          modulesAPI?.getModules().then(setModules);
        }, [modulesAPI]);

        return (
          <div data-testid='module-list'>
            {modules ? `${modules.modules.length} modules` : 'Loading...'}
          </div>
        );
      };

      render(
        <APIProvider>
          <ModuleListComponent />
        </APIProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('module-list')).toHaveTextContent('1 modules');
      });

      expect(mockModulesAPI.getModules).toHaveBeenCalled();
    });

    it('should properly integrate with Analytics API service', async () => {
      const mockAnalytics = {
        totalCustomers: 100,
        activeConnections: 25,
        systemHealth: 'healthy',
        uptime: 99.9,
      };

      mockAnalyticsAPI.getOverview.mockResolvedValue(mockAnalytics);

      const AnalyticsComponent: React.FC = () => {
        const { analyticsAPI } = useContext(APIContext);
        const [analytics, setAnalytics] = React.useState<any>(null);

        React.useEffect(() => {
          analyticsAPI?.getOverview().then(setAnalytics);
        }, [analyticsAPI]);

        return (
          <div data-testid='analytics'>
            {analytics ? `${analytics.totalCustomers} total customers` : 'Loading...'}
          </div>
        );
      };

      render(
        <APIProvider>
          <AnalyticsComponent />
        </APIProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('analytics')).toHaveTextContent('100 total customers');
      });

      expect(mockAnalyticsAPI.getOverview).toHaveBeenCalled();
    });
  });
});
