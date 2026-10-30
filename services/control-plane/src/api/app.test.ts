import { describe, expect, it, vi } from 'vitest';
import { createApi } from './app.js';
import { redact } from './redact.js';

// A canary: if this ever appears in a response or a log line, a secret has leaked.
const CANARY_URL =
  'postgresql://neondb_owner:canary-Pa55word@ep-canary-pooler.example.neon.tech/neondb';

describe('API', () => {
  it('answers /api/health', async () => {
    const response = await createApi().request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'control-plane' });
  });

  it('pings the database through the injected query', async () => {
    const query = vi.fn().mockResolvedValue([{ ok: 1 }]);
    let clock = 1000;
    const api = createApi({ query, now: () => (clock += 12) });
    const response = await api.request('/api/db/ping', {}, { DATABASE_URL: CANARY_URL });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ database: 'ok', roundTripMs: 12 });
    expect(query).toHaveBeenCalledWith(CANARY_URL, 'select 1 as ok');
  });

  it('says how to fix a missing DATABASE_URL', async () => {
    const response = await createApi().request('/api/db/ping', {}, {});
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      database: 'not configured',
      fix: 'Set the DATABASE_URL secret',
    });
  });

  it('never leaks the connection string when the database fails', async () => {
    const log = vi.fn();
    const query = vi.fn().mockRejectedValue(new Error(`could not connect to ${CANARY_URL}`));
    const api = createApi({ query, log });
    const response = await api.request('/api/db/ping', {}, { DATABASE_URL: CANARY_URL });

    expect(response.status).toBe(503);
    const body = await response.text();
    const logged = log.mock.calls.flat().join('\n');
    for (const leak of [CANARY_URL, 'canary-Pa55word']) {
      expect(body).not.toContain(leak);
      expect(logged).not.toContain(leak);
    }
    expect(logged).toContain('postgresql://[redacted]');
  });

  it('answers unknown API paths with JSON 404', async () => {
    const response = await createApi().request('/api/nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not found' });
  });
});

describe('redact', () => {
  it('removes connection strings and bearer tokens', () => {
    expect(redact(`at ${CANARY_URL} with Bearer abc.def-123`)).toBe(
      'at postgresql://[redacted] with Bearer [redacted]',
    );
  });
});
