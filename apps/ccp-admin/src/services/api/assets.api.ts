import { BaseAPIService } from './base.api';

export interface AssetUploadResult {
  url: string;
}

export class AssetsAPIService extends BaseAPIService {
  private readonly baseEndpoint = '/assets';

  async uploadAsset(file: File): Promise<AssetUploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.post<AssetUploadResult>(`${this.baseEndpoint}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  }
}

export const assetsAPI = new AssetsAPIService();
