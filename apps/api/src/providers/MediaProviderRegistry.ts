import { MediaProvider, MediaProviderMetadata, MediaProviderType } from './media-provider';
import { LocalMediaProvider } from './local-media-provider';
import { S3MediaProvider } from './S3MediaProvider';
import { AuthorizedCdnMediaProvider } from './AuthorizedCdnMediaProvider';
import { YouTubeMediaProvider } from './YouTubeMediaProvider';
import { logger } from '../utils/logger';

export class MediaProviderRegistry {
  private providers = new Map<string, MediaProvider>();
  private defaultProviderId: string = 'local-storage';

  constructor() {
    this.register(new LocalMediaProvider());
    this.register(new S3MediaProvider());
    this.register(new AuthorizedCdnMediaProvider());
    this.register(new YouTubeMediaProvider());
  }

  register(provider: MediaProvider): void {
    // Explicit architectural invariant: disallow unauthorized YouTube scrapers
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

  getProvider(providerId?: string): MediaProvider {
    if (providerId && this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    // Also check by type (e.g. 'local', 's3')
    if (providerId) {
      for (const provider of this.providers.values()) {
        if (provider.type === providerId) {
          return provider;
        }
      }
    }

    const defaultProvider = this.providers.get(this.defaultProviderId);
    if (!defaultProvider) {
      throw new Error('Default media provider is not available');
    }
    return defaultProvider;
  }

  getActiveProvider(): MediaProvider {
    return this.getProvider();
  }

  getProviderByType(type: MediaProviderType): MediaProvider | undefined {
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
