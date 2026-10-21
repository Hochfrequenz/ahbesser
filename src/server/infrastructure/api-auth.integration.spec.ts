/**
 * @jest-environment node
 *
 * HTTP-level test of the `/api` bearer guard with real signed tokens. Uses HS256 with a shared
 * secret so no JWKS server is needed (same approach as mcp/auth.integration.spec.ts).
 */
import crypto from 'crypto';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { auth } from 'express-oauth2-jwt-bearer';
import { requireApiAuth } from './api-auth';

const SECRET = 'test-shared-secret';
const ISSUER = 'https://issuer-a.example.com/';
const AUDIENCE = 'https://host/mcp';

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: Record<string, unknown>, secret = SECRET): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

const claims = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  iss: ISSUER,
  aud: AUDIENCE,
  sub: 'user-1',
  iat: nowSeconds(),
  exp: nowSeconds() + 3600,
  ...overrides,
});

describe('/api bearer guard (real middleware, HTTP)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(done => {
    const env = { MCP_AUTH0_ISSUER_BASE_URL: ISSUER, MCP_AUTH0_AUDIENCE: AUDIENCE };
    const validators = new Map([
      [
        ISSUER,
        auth({ issuer: ISSUER, audience: AUDIENCE, secret: SECRET, tokenSigningAlg: 'HS256' }),
      ],
    ]);
    const app = express();
    app.get('/version', (_req, res) => res.send('ok')); // public, registered like in server.ts
    app.use('/api', requireApiAuth(env, validators), (_req, res) => res.json({ ok: true }));

    server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll(done => {
    server.close(() => done());
  });

  const get = (path: string, token?: string): Promise<Response> =>
    fetch(
      `${baseUrl}${path}`,
      token ? { headers: { authorization: `Bearer ${token}` } } : undefined
    );

  it('rejects a request without Authorization', async () => {
    expect((await get('/api/x')).status).toBe(401);
  });

  it('accepts a valid token', async () => {
    expect((await get('/api/x', sign(claims()))).status).toBe(200);
  });

  it('rejects a wrong audience', async () => {
    expect((await get('/api/x', sign(claims({ aud: 'https://other/aud' })))).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const token = sign(claims({ iat: nowSeconds() - 7200, exp: nowSeconds() - 3600 }));
    expect((await get('/api/x', token)).status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    expect((await get('/api/x', sign(claims(), 'another-secret'))).status).toBe(401);
  });

  it('rejects an unknown issuer', async () => {
    const token = sign(claims({ iss: 'https://evil.example.com/' }));
    expect((await get('/api/x', token)).status).toBe(401);
  });

  it('keeps routes outside /api public', async () => {
    expect((await get('/version')).status).toBe(200);
  });

  it('keeps /api/health and /api/datenstand public', async () => {
    expect((await get('/api/health')).status).toBe(200);
    expect((await get('/api/datenstand')).status).toBe(200);
  });

  it('does not treat case variants of public paths as public', async () => {
    expect((await get('/api/HEALTH')).status).toBe(401);
  });
});
