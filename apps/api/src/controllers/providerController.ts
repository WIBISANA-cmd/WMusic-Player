import { Request, Response, NextFunction } from 'express';
import { ApiResponse, MediaProviderMetadata } from '@music/shared';
import { mediaProviderRegistry } from '../providers/MediaProviderRegistry';

export class ProviderController {
  async getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = mediaProviderRegistry.getAllProvidersMetadata();
      const response: ApiResponse<MediaProviderMetadata[]> = {
        success: true,
        data: providers,
        meta: {
          total: providers.length,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const providerController = new ProviderController();
