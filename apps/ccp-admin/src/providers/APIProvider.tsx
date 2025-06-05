/**
 * @fileoverview API Provider for React Query and WebSocket setup
 * @module providers/APIProvider
 */

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryConfig, environmentConfig } from '../services/config/api.config';
import { useWebSocketConnection } from '../services/websocket';
import { ErrorHandler } from '../services/errors';
import { createLogger } from '@agent-desktop/logging';

const errorLogger = createLogger('ccp-admin:api-error-boundary');

/**
 * Create React Query client with custom configuration
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryConfig.defaultStaleTime,
        gcTime: queryConfig.defaultGcTime,
        retry: queryConfig.retry,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        onError: error => {
          const apiError = ErrorHandler.normalize(error);
          console.error('Mutation error:', apiError.toJSON());
        },
      },
    },
  });
}

/**
 * WebSocket connection manager component
 */
function WebSocketManager({ children }: { children: React.ReactNode }) {
  const { connect, disconnect, connectionState, isConnected } = useWebSocketConnection();
  const [hasInitializedConnection, setHasInitializedConnection] = useState(false);

  // Auto-connect on mount
  useEffect(() => {
    if (!hasInitializedConnection) {
      connect().catch(error => {
        console.warn('Failed to connect to WebSocket:', error);
        // Don't throw - allow app to continue without WebSocket
      });
      setHasInitializedConnection(true);
    }
  }, [connect, hasInitializedConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Show connection status in development
  useEffect(() => {
    if (environmentConfig.isDevelopment) {
      console.info(`WebSocket connection state: ${connectionState}`);
    }
  }, [connectionState]);

  return <>{children}</>;
}

/**
 * Error boundary for API-related errors
 */
class APIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static override getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo);

    // Log to external service in production
    if (environmentConfig.isProduction) {
      try {
        errorLogger.logError(error, 'Unhandled error in APIErrorBoundary', {
          errorInfo,
        });
      } catch (loggingError) {
        console.error('Failed to log error to external service:', loggingError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-8 w-8 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-lg font-medium text-gray-900'>Something went wrong</h2>
                <p className='text-sm text-gray-500'>
                  An unexpected error occurred while loading the application.
                </p>
              </div>
            </div>

            {environmentConfig.isDevelopment && this.state.error && (
              <div className='mt-4 p-3 bg-gray-50 rounded-md'>
                <details className='text-sm'>
                  <summary className='cursor-pointer font-medium text-gray-700'>
                    Error Details
                  </summary>
                  <pre className='mt-2 text-xs text-gray-600 whitespace-pre-wrap'>
                    {this.state.error.stack}
                  </pre>
                </details>
              </div>
            )}

            <div className='mt-6'>
              <button
                type='button'
                className='w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Connection status indicator component
 */
function ConnectionStatusIndicator() {
  const { connectionState, isConnected } = useWebSocketConnection();
  const [showIndicator, setShowIndicator] = useState(false);

  // Only show indicator when disconnected or reconnecting
  useEffect(() => {
    setShowIndicator(!isConnected && connectionState !== 'disconnected');
  }, [isConnected, connectionState]);

  if (!showIndicator) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting...',
          icon: <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>,
        };
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          text: 'Reconnecting...',
          icon: <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>,
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Connection Error',
          icon: (
            <svg className='h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          ),
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  if (!statusConfig) return null;

  return (
    <div className='fixed top-4 right-4 z-50'>
      <div
        className={`${statusConfig.color} text-white px-3 py-2 rounded-md shadow-lg flex items-center space-x-2 text-sm`}
      >
        {statusConfig.icon}
        <span>{statusConfig.text}</span>
      </div>
    </div>
  );
}

/**
 * Main API Provider component
 * Sets up React Query, WebSocket connections, and error handling
 */
export function APIProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <APIErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WebSocketManager>
          {children}
          <ConnectionStatusIndicator />

          {/* Toast notifications */}
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              className: 'text-sm',
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
                duration: 6000,
              },
              loading: {
                iconTheme: {
                  primary: '#6B7280',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          {/* React Query DevTools (development only) */}
          {environmentConfig.enableDevtools && (
            <ReactQueryDevtools
              initialIsOpen={false}
              position='bottom-right'
              toggleButtonProps={{
                style: {
                  bottom: '20px',
                  right: '20px',
                },
              }}
            />
          )}
        </WebSocketManager>
      </QueryClientProvider>
    </APIErrorBoundary>
  );
}

/**
 * Hook for accessing the query client
 */
export function useAPIProvider() {
  const queryClient = useQueryClient();
  const webSocket = useWebSocketConnection();

  return {
    queryClient,
    webSocket,
    isOnline: webSocket.isConnected,
  };
}
