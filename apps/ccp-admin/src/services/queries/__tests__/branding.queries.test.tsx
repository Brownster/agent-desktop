/**
 * @fileoverview Tests for branding query hooks
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadAsset } from '../branding.queries';
import { assetsAPI } from '../../api/assets.api';

jest.mock('../../api/assets.api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('branding query hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads asset successfully', async () => {
    (assetsAPI.uploadAsset as jest.Mock).mockResolvedValue({ url: 's3://logo.png' });
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUploadAsset(), { wrapper });
    act(() => {
      result.current.mutate({ file: new File(['a'], 'logo.png') });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.url).toBe('s3://logo.png');
  });
});
