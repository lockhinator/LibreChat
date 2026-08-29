import { logger } from '@librechat/data-schemas';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    _id?: { toString(): string };
    email?: string;
  };
}

interface DeveloperAccessConfig {
  bridgeUrl: string;
  bridgeKey: string;
}

export function createDeveloperAccessHandler(config: DeveloperAccessConfig) {
  return async function getDeveloperAccess(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const userId = req.user?.id ?? req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ error: 'Authenticated user identity is missing' });
    }

    try {
      const response = await fetch(`${config.bridgeUrl}/internal/key`, {
        headers: {
          Authorization: `Bearer ${config.bridgeKey}`,
          'X-LibreChat-User-ID': userId,
          'X-LibreChat-User-Email': req.user?.email ?? '',
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        throw new Error(`Bridge returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      res.set({
        'Cache-Control': 'no-store, private',
        Pragma: 'no-cache',
      });
      return res.status(200).json(payload);
    } catch (error) {
      logger.error('[getDeveloperAccess] Failed to retrieve developer credential', {
        userId,
        error,
      });
      return res.status(502).json({ error: 'Unable to retrieve developer API access' });
    }
  };
}
