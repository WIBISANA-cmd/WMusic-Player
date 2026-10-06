import { IMediaProvider, MediaProviderMetadata, MediaProviderType } from '@music/shared';
import { LocalMediaProvider } from './LocalMediaProvider';
import { S3MediaProvider } from './S3MediaProvider';
import { AuthorizedCdnMediaProvider } from './AuthorizedCdnMediaProvider';
import { logger } from '../utils/logger';

export class MediaProviderRegistry {
  private providers = new Map<string, IMediaProvider>();
  private defaultProviderId: string = 'provider-local-storage';

  constructor() {
    this.register(new LocalMediaProvider());
    this.register(new S3MediaProvider());
    this.register(new AuthorizedCdnMediaProvider());
  }

  register(provider: IMediaProvider): void {
    // Explicit architectural check: disallow unauthorized YouTube scrapers
    if (provider.id.includes('youtube-scrape') || provider.id.includes('youtube-extract')) {
      throw new Error(
        'Policy violation: Direct YouTube audio extraction/scraping is prohibited by architectural rule. Only official iframe/embed players are supported.'
      );
    }

    this.providers.set(provider.id, provider);
    logger.info('Registered media provider', {
      providerId: provider.id,
      name: provider.name,
      type: provider.type
    });
  }

  getProvider(providerId?: string): IMediaProvider {
    if (providerId && this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    const defaultProvider = this.providers.get(this.defaultProviderId);
    if (!defaultProvider) {
      throw new Error('Default media provider is not available');
    }
    return defaultProvider;
  }

  getProviderByType(type: MediaProviderType): IMediaProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.type === type) {
        return provider;
      }
    }
    return undefined;
  }

  getAllProvidersMetadata(): MediaProviderMetadata[] {
    const list: MediaProviderMetadata[] = [];
    for (const provider of this.providers.values()) {
      list.push({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        description: `Handles streaming via ${provider.name}`,
        capabilities: provider.capabilities,
        isConfigured: true
      });
    }
    return list;
  }
}

export const mediaProviderRegistry = new MediaProviderRegistry();
