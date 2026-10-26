import { buildApp } from './app.js';
import { readBuildInfo } from './build-info.js';

const port = Number(process.env.PORT ?? 8080);
// Loopback by default so a dev server is never exposed on the local network; containers set HOST=0.0.0.0.
const host = process.env.HOST ?? '127.0.0.1';

const app = buildApp({ buildInfo: readBuildInfo() });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error, 'control plane failed to start');
  process.exit(1);
}
