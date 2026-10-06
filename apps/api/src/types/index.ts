import { Request } from 'express';
import { Track, StreamInfo } from '@music/shared';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface StreamRequestContext {
  trackId: string;
  quality?: string;
  range?: string;
}

export type { Track, StreamInfo };

