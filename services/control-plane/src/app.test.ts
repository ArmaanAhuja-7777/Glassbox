import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const buildInfo = { version: '0.1.0', commit: '7e59ec1a2b3c' };
let app: ReturnType<typeof buildApp> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /health', () => {
  it('returns status, version and commit', async () => {
    app = buildApp({ buildInfo, logger: false });
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', version: '0.1.0', commit: '7e59ec1a2b3c' });
  });

  it('returns 404 for unknown routes', async () => {
    app = buildApp({ buildInfo, logger: false });
    const response = await app.inject({ method: 'GET', url: '/nope' });
    expect(response.statusCode).toBe(404);
  });
});

describe('logging', () => {
  it('never writes secret values to the log', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    app = buildApp({ buildInfo, logger: { stream } });
    await app.ready();

    app.log.info(
      { config: { token: 'CANARY-TOKEN-123', apiKey: 'CANARY-KEY-456' } },
      'loaded config',
    );
    await app.inject({
      method: 'GET',
      url: '/health',
      headers: { authorization: 'Bearer CANARY-AUTH-789' },
    });

    const output = lines.join('');
    expect(output).toContain('loaded config');
    expect(output).not.toMatch(/CANARY-/);
  });
});
