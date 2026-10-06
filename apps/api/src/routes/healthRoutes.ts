import { Router } from 'express';
import { mediaProviderRegistry } from '../providers/MediaProviderRegistry';

const router = Router();

router.get('/', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'music-api',
    memory: {
      rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
      heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(1)
    },
    providers: mediaProviderRegistry.getAllProvidersMetadata().map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      canStream: p.capabilities.canStream
    }))
  });
});

export const healthRoutes = router;
