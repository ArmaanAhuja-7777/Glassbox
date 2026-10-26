import type { BuildInfo } from '@flowcanvas/graph-model';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

export interface AppOptions {
  readonly buildInfo: BuildInfo;
  readonly logger?: FastifyServerOptions['logger'];
}

// Log fields that may carry secrets. Values are replaced before a log line is written.
export const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.secret',
  '*.token',
  '*.apiKey',
];

export function buildApp({ buildInfo, logger = true }: AppOptions): FastifyInstance {
  const app = Fastify({
    logger:
      logger === false ? false : { ...(logger === true ? {} : logger), redact: REDACTED_LOG_PATHS },
  });

  app.get('/health', () => ({
    status: 'ok',
    version: buildInfo.version,
    commit: buildInfo.commit,
  }));

  return app;
}
