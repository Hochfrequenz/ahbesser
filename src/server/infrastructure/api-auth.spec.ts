/**
 * @jest-environment node
 */
import type { NextFunction, Request, Response } from 'express';
import { requireApiAuth } from './api-auth';

const AUTH0 = {
  MCP_AUTH0_ISSUER_BASE_URL: 'https://issuer.example.com/',
  MCP_AUTH0_AUDIENCE: 'https://host/mcp',
};

function run(guard: ReturnType<typeof requireApiAuth>, path = '/ahb/FV2510/55001') {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  guard({ headers: {}, path } as Request, res, next);
  return { res, next };
}

describe('requireApiAuth', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('lets requests through, with a warning, when explicitly disabled and no provider is set', () => {
    const { next } = run(requireApiAuth({ API_AUTH_DISABLED: 'true' }));
    expect(next).toHaveBeenCalledWith();
    expect(console.warn).toHaveBeenCalled();
  });

  it.each([
    {},
    { ENVIRONMENT: 'docker' },
    { ENVIRONMENT: 'production' },
    { API_AUTH_DISABLED: 'false' },
    { API_AUTH_DISABLED: '1' },
  ])('refuses to start without a provider and without the explicit opt-out: %j', env => {
    expect(() => requireApiAuth(env)).toThrow(/API_AUTH_DISABLED/);
  });

  it('enforces auth as soon as a provider is configured, even if the opt-out is set', () => {
    const { res, next } = run(requireApiAuth({ ...AUTH0, API_AUTH_DISABLED: 'true' }));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it.each(['/health', '/datenstand'])('keeps %s public when auth is enforced', path => {
    const { next } = run(requireApiAuth(AUTH0), path);
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['/health/x', '/datenstand/', '/formate', '/'])('does not make %s public', path => {
    const { res, next } = run(requireApiAuth(AUTH0), path);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('propagates a partially configured provider as a startup error', () => {
    expect(() => requireApiAuth({ MCP_AUTH0_AUDIENCE: 'https://host/mcp' })).toThrow(
      /partially configured/
    );
  });
});
