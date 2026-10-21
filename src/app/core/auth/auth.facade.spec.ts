import { TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { firstValueFrom, Observable, Subject, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthFacade, POST_LOGIN_TARGET_KEY } from './auth.facade';
import { AUTH_IS_DEVELOPMENT, MSAL_CLIENT } from './msal.tokens';

type MockAuth0 = {
  isAuthenticated$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  user$: Observable<{ email?: string; name?: string; sub?: string } | null>;
  loginWithRedirect: jest.Mock;
  logout: jest.Mock;
  getAccessTokenSilently: jest.Mock;
};

type MockMsal = {
  getAllAccounts: jest.Mock;
  getActiveAccount: jest.Mock;
  setActiveAccount: jest.Mock;
  initialize: jest.Mock;
  handleRedirectPromise: jest.Mock;
  loginRedirect: jest.Mock;
  logoutRedirect: jest.Mock;
  acquireTokenSilent: jest.Mock;
  acquireTokenRedirect: jest.Mock;
};

function makeAuth0(overrides: Partial<MockAuth0> = {}): MockAuth0 {
  return {
    isAuthenticated$: of(false),
    isLoading$: of(false),
    user$: of(null),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    getAccessTokenSilently: jest.fn().mockReturnValue(of('auth0-token')),
    ...overrides,
  };
}

function makeMsal(overrides: Partial<MockMsal> = {}): MockMsal {
  return {
    getAllAccounts: jest.fn().mockReturnValue([]),
    getActiveAccount: jest.fn().mockReturnValue(null),
    setActiveAccount: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    handleRedirectPromise: jest.fn().mockResolvedValue(null),
    loginRedirect: jest.fn().mockResolvedValue(undefined),
    logoutRedirect: jest.fn().mockResolvedValue(undefined),
    acquireTokenSilent: jest.fn().mockResolvedValue({ accessToken: 'msal-token' }),
    acquireTokenRedirect: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createFacade(
  isDevelopment: boolean,
  auth0: MockAuth0 = makeAuth0(),
  msal: MockMsal = makeMsal()
): { facade: AuthFacade; auth0: MockAuth0; msal: MockMsal } {
  TestBed.configureTestingModule({
    providers: [
      AuthFacade,
      { provide: AuthService, useValue: auth0 },
      { provide: MSAL_CLIENT, useValue: msal },
      { provide: AUTH_IS_DEVELOPMENT, useValue: isDevelopment },
    ],
  });
  return { facade: TestBed.inject(AuthFacade), auth0, msal };
}

describe('AuthFacade', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('development stub', () => {
    it('reports authenticated without touching either SDK', async () => {
      const msal = makeMsal();
      const { facade } = createFacade(true, makeAuth0(), msal);

      await expect(firstValueFrom(facade.isAuthenticated$)).resolves.toBe(true);
      await expect(firstValueFrom(facade.isLoading$)).resolves.toBe(false);
      expect(msal.getAllAccounts).not.toHaveBeenCalled();
    });

    it('emits the local development user', async () => {
      const { facade } = createFacade(true);
      const user = await firstValueFrom(facade.user$);
      expect(user).toMatchObject({ email: 'local@development.com', provider: 'dev' });
    });

    it('initializeMsal is a no-op in development', async () => {
      const msal = makeMsal();
      const { facade } = createFacade(true, makeAuth0(), msal);
      await facade.initializeMsal();
      expect(msal.initialize).not.toHaveBeenCalled();
    });

    it('login() does not trigger a real provider redirect', () => {
      const { facade, auth0, msal } = createFacade(true);
      facade.login('microsoft');
      facade.login('auth0');
      expect(msal.loginRedirect).not.toHaveBeenCalled();
      expect(auth0.loginWithRedirect).not.toHaveBeenCalled();
    });

    it('logout() does not trigger a real provider redirect', () => {
      const { facade, auth0, msal } = createFacade(true);
      facade.logout();
      expect(auth0.logout).not.toHaveBeenCalled();
      expect(msal.logoutRedirect).not.toHaveBeenCalled();
    });
  });

  describe('authentication state (production)', () => {
    it('is false when neither provider has a session', async () => {
      const { facade } = createFacade(false);
      await expect(firstValueFrom(facade.isAuthenticated$)).resolves.toBe(false);
    });

    it('is true when Auth0 reports a session', async () => {
      const { facade } = createFacade(false, makeAuth0({ isAuthenticated$: of(true) }));
      await expect(firstValueFrom(facade.isAuthenticated$)).resolves.toBe(true);
    });

    it('is true when MSAL has an account (even if Auth0 does not), after init', async () => {
      const msal = makeMsal({
        getAllAccounts: jest.fn().mockReturnValue([{ username: 'a@b.de' }]),
      });
      const { facade } = createFacade(false, makeAuth0({ isAuthenticated$: of(false) }), msal);
      // MSAL state is only read after initialize(); before init it must not be queried.
      await facade.initializeMsal();
      await expect(firstValueFrom(facade.isAuthenticated$)).resolves.toBe(true);
    });
  });

  describe('recognising a session', () => {
    it('reports authenticated from MSAL without waiting for Auth0 to answer', async () => {
      // Auth0's isAuthenticated$ is gated behind its own loading check and emits NOTHING until
      // that resolves. A cached Microsoft account must not be held hostage to it.
      const auth0Pending = new Subject<boolean>();
      const msal = makeMsal({
        getAllAccounts: jest.fn().mockReturnValue([{ username: 'e@hf.de' }]),
      });
      const { facade } = createFacade(
        false,
        makeAuth0({ isAuthenticated$: auth0Pending.asObservable() }),
        msal
      );

      const seen: boolean[] = [];
      const sub = facade.isAuthenticated$.subscribe(value => seen.push(value));
      await facade.initializeMsal();

      expect(seen).toEqual([true]);
      sub.unsubscribe();
    });

    it('still reports anonymous only once both providers have answered', async () => {
      const auth0Pending = new Subject<boolean>();
      const { facade } = createFacade(
        false,
        makeAuth0({ isAuthenticated$: auth0Pending.asObservable() })
      );

      const seen: boolean[] = [];
      const sub = facade.isAuthenticated$.subscribe(value => seen.push(value));
      // Neither has said yes; nothing may be reported yet, or the guard would bounce a user whose
      // session check simply has not finished.
      expect(seen).toEqual([]);

      auth0Pending.next(false);
      expect(seen).toEqual([false]);
      sub.unsubscribe();
    });
  });

  describe('login', () => {
    it('routes login("auth0") to Auth0 and records the active provider', () => {
      const { facade, auth0 } = createFacade(false);
      facade.login('auth0');
      expect(auth0.loginWithRedirect).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('ahb.activeAuthProvider')).toBe('auth0');
    });

    it('passes the target to Auth0 as appState when provided', () => {
      const { facade, auth0 } = createFacade(false);
      facade.login('auth0', '/search');
      expect(auth0.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ appState: { target: '/search' } })
      );
    });

    it('routes login("microsoft") to MSAL with the configured scopes', () => {
      const { facade, msal } = createFacade(false);
      facade.login('microsoft');
      expect(msal.loginRedirect).toHaveBeenCalledTimes(1);
      expect(msal.loginRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ scopes: ['openid', 'profile', 'email'] })
      );
      expect(localStorage.getItem('ahb.activeAuthProvider')).toBe('microsoft');
    });

    it('stashes the target for Microsoft so the callback can restore it', () => {
      const { facade } = createFacade(false);
      facade.login('microsoft', '/ahb/UTILMD');
      expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBe('/ahb/UTILMD');
    });

    it('clears a stale Microsoft target when signing in with Auth0', () => {
      sessionStorage.setItem(POST_LOGIN_TARGET_KEY, '/stale');
      const { facade, auth0 } = createFacade(false);
      facade.login('auth0', '/search');
      expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBeNull();
      expect(auth0.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ appState: { target: '/search' } })
      );
    });

    it('clears a stale Microsoft target when no new target is given', () => {
      sessionStorage.setItem(POST_LOGIN_TARGET_KEY, '/stale');
      const { facade } = createFacade(false);
      facade.login('microsoft');
      expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBeNull();
    });

    it('refuses an off-site target rather than stashing it for Microsoft', () => {
      const { facade, msal } = createFacade(false);
      facade.login('microsoft', 'https://evil.example/phish');
      expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBeNull();
      // The sign-in still proceeds; only the hostile destination is dropped.
      expect(msal.loginRedirect).toHaveBeenCalledTimes(1);
    });

    it('refuses an off-site target rather than handing it to Auth0', () => {
      const { facade, auth0 } = createFacade(false);
      facade.login('auth0', '//evil.example');
      expect(auth0.loginWithRedirect).toHaveBeenCalledWith(undefined);
    });

    it('treats a bare "/" target as no target at all', () => {
      const { facade, auth0 } = createFacade(false);
      facade.login('auth0', '/');
      expect(auth0.loginWithRedirect).toHaveBeenCalledWith(undefined);
    });
  });

  describe('logout', () => {
    it('logs out via MSAL when an MSAL account exists (independent of the persisted key)', async () => {
      const msal = makeMsal({
        getAllAccounts: jest.fn().mockReturnValue([{ username: 'e@hf.de' }]),
      });
      const { facade, auth0 } = createFacade(false, makeAuth0(), msal);
      await facade.initializeMsal();
      // No ACTIVE_PROVIDER_KEY set on purpose — the live MSAL session must still drive logout.
      facade.logout();
      expect(msal.logoutRedirect).toHaveBeenCalledTimes(1);
      expect(auth0.logout).not.toHaveBeenCalled();
    });

    it('logs out via Auth0 when there is no MSAL account', () => {
      const { facade, msal, auth0 } = createFacade(false);
      localStorage.setItem('ahb.activeAuthProvider', 'microsoft'); // stale key must not mislead
      facade.logout();
      expect(auth0.logout).toHaveBeenCalledTimes(1);
      expect(msal.logoutRedirect).not.toHaveBeenCalled();
    });
  });

  describe('user resolution', () => {
    it('emits the Microsoft user when MSAL has an account, even without the active-provider key', async () => {
      const account = { username: 'e@hf.de', name: 'E', localAccountId: 'id' };
      const msal = makeMsal({
        getAllAccounts: jest.fn().mockReturnValue([account]),
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const { facade } = createFacade(false, makeAuth0(), msal);
      await facade.initializeMsal();
      const user = await firstValueFrom(facade.user$);
      expect(user).toMatchObject({ email: 'e@hf.de', provider: 'microsoft' });
    });

    it('emits the Auth0 user when only Auth0 has a session', async () => {
      const { facade } = createFacade(
        false,
        makeAuth0({ user$: of({ email: 'x@y.de', name: 'X', sub: 'auth0|1' }) })
      );
      const user = await firstValueFrom(facade.user$);
      expect(user).toMatchObject({ email: 'x@y.de', provider: 'auth0' });
    });
  });

  describe('initializeMsal (production)', () => {
    it('is idempotent: repeated calls initialize MSAL and process the redirect only once', async () => {
      const msal = makeMsal();
      const { facade } = createFacade(false, makeAuth0(), msal);
      await Promise.all([facade.initializeMsal(), facade.initializeMsal()]);
      await facade.initializeMsal();
      expect(msal.initialize).toHaveBeenCalledTimes(1);
      expect(msal.handleRedirectPromise).toHaveBeenCalledTimes(1);
    });

    it('initializes MSAL, processes the redirect, and flips the auth state', async () => {
      const account = {
        username: 'employee@hochfrequenz.de',
        name: 'Employee',
        localAccountId: 'x',
      };
      const accounts: unknown[] = [];
      const msal = makeMsal({
        handleRedirectPromise: jest.fn().mockResolvedValue({ account }),
        getAllAccounts: jest.fn(() => accounts),
      });
      const { facade } = createFacade(false, makeAuth0(), msal);

      // Simulate MSAL registering the account after a successful redirect.
      (msal.setActiveAccount as jest.Mock).mockImplementation(() => accounts.push(account));

      await facade.initializeMsal();

      expect(msal.initialize).toHaveBeenCalledTimes(1);
      expect(msal.handleRedirectPromise).toHaveBeenCalledTimes(1);
      // Must suppress MSAL's navigate-back so our callback route owns post-login routing.
      expect(msal.handleRedirectPromise).toHaveBeenCalledWith({ navigateToLoginRequestUrl: false });
      expect(msal.setActiveAccount).toHaveBeenCalledWith(account);
      await expect(firstValueFrom(facade.isAuthenticated$)).resolves.toBe(true);
    });
  });

  describe('getAccessToken', () => {
    const AUDIENCE = 'https://host/mcp';
    const SCOPE = 'api://abc/access_as_user';
    const account = { username: 'e@hf.de', name: 'E', localAccountId: 'id' };
    const auth0User = { sub: 'a', email: 'a@b.c' };
    const env = environment as { auth0Audience?: string; entraApiScope?: string };

    async function msalFacade(msalOverrides: Partial<MockMsal> = {}, auth0 = makeAuth0()) {
      const msal = makeMsal({
        getAllAccounts: jest.fn().mockReturnValue([account]),
        ...msalOverrides,
      });
      const created = createFacade(false, auth0, msal);
      await created.facade.initializeMsal();
      return created;
    }

    /** Resolves to 'pending' if the observable neither emits nor errors within a short time. */
    function settleOrPending(obs: Observable<string | null>): Promise<unknown> {
      return Promise.race([
        firstValueFrom(obs).then(
          value => ({ value }),
          (error: unknown) => ({ error })
        ),
        new Promise(resolve => setTimeout(() => resolve('pending'), 50)),
      ]);
    }

    beforeEach(() => {
      env.auth0Audience = AUDIENCE;
      env.entraApiScope = SCOPE;
    });

    afterEach(() => {
      delete env.auth0Audience;
      delete env.entraApiScope;
      window.history.replaceState(null, '', '/');
    });

    it('emits null under the development stub without calling either SDK', async () => {
      const { facade, auth0, msal } = createFacade(true);
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBeNull();
      expect(auth0.getAccessTokenSilently).not.toHaveBeenCalled();
      expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('returns the Auth0 token for the configured audience', async () => {
      const { facade, auth0 } = createFacade(false, makeAuth0({ user$: of(auth0User) }));
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBe('auth0-token');
      expect(auth0.getAccessTokenSilently).toHaveBeenCalledWith({
        authorizationParams: { audience: AUDIENCE },
      });
    });

    it('emits null for an Auth0 user when no audience is configured', async () => {
      delete env.auth0Audience;
      const { facade, auth0 } = createFacade(false, makeAuth0({ user$: of(auth0User) }));
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBeNull();
      expect(auth0.getAccessTokenSilently).not.toHaveBeenCalled();
    });

    it('returns the MSAL token for the configured scope', async () => {
      const { facade, msal } = await msalFacade();
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBe('msal-token');
      expect(msal.acquireTokenSilent).toHaveBeenCalledWith({ scopes: [SCOPE], account });
    });

    it('emits null for a Microsoft user when no scope is configured', async () => {
      delete env.entraApiScope;
      const { facade, msal } = await msalFacade();
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBeNull();
      expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('emits null when anonymous without calling either SDK', async () => {
      const { facade, auth0, msal } = createFacade(false);
      await facade.initializeMsal();
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBeNull();
      expect(auth0.getAccessTokenSilently).not.toHaveBeenCalled();
      expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('uses the live Microsoft session despite a stale auth0 provider hint', async () => {
      localStorage.setItem('ahb.activeAuthProvider', 'auth0');
      const { facade, auth0 } = await msalFacade({}, makeAuth0({ user$: of(null) }));
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBe('msal-token');
      expect(auth0.getAccessTokenSilently).not.toHaveBeenCalled();
    });

    it('breaks a both-signed-in tie with the hint, like resolveUser', async () => {
      localStorage.setItem('ahb.activeAuthProvider', 'auth0');
      const { facade } = await msalFacade({}, makeAuth0({ user$: of(auth0User) }));
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBe('auth0-token');
    });

    describe('when Microsoft needs interaction', () => {
      const interactionRequired = () =>
        jest
          .fn()
          .mockRejectedValue(
            new InteractionRequiredAuthError('interaction_required', 'test-correlation-id')
          );

      beforeEach(() => window.history.replaceState(null, '', '/some/page?x=1'));

      it('redirects once to sign in, stashes the return target and never settles', async () => {
        const { facade, msal } = await msalFacade({ acquireTokenSilent: interactionRequired() });
        await expect(settleOrPending(facade.getAccessToken())).resolves.toBe('pending');
        expect(msal.acquireTokenRedirect).toHaveBeenCalledWith({ scopes: [SCOPE], account });
        expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBe('/some/page?x=1');
      });

      it('shares a single redirect between concurrent requests', async () => {
        const { facade, msal } = await msalFacade({ acquireTokenSilent: interactionRequired() });
        await Promise.all([
          settleOrPending(facade.getAccessToken()),
          settleOrPending(facade.getAccessToken()),
        ]);
        expect(msal.acquireTokenRedirect).toHaveBeenCalledTimes(1);
      });

      it('errors when the redirect itself fails, and retries on a later call', async () => {
        const failure = new Error('redirect failed');
        const { facade, msal } = await msalFacade({
          acquireTokenSilent: interactionRequired(),
          acquireTokenRedirect: jest.fn().mockRejectedValue(failure),
        });
        await expect(firstValueFrom(facade.getAccessToken())).rejects.toBe(failure);
        await expect(firstValueFrom(facade.getAccessToken())).rejects.toBe(failure);
        expect(msal.acquireTokenRedirect).toHaveBeenCalledTimes(2);
      });
    });

    describe('redirect-loop guard', () => {
      const KEY = 'ahb.apiReauthAt';
      const NOW = 1_700_000_000_000;
      const interactionError = new InteractionRequiredAuthError('interaction_required', 'cid');
      let nowSpy: jest.SpyInstance;

      beforeEach(() => {
        nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
        window.history.replaceState(null, '', '/some/page?x=1');
      });

      afterEach(() => nowSpy.mockRestore());

      it('refuses to redirect again within 60s and surfaces the original error', async () => {
        sessionStorage.setItem(KEY, String(NOW - 30_000));
        const { facade, msal } = await msalFacade({
          acquireTokenSilent: jest.fn().mockRejectedValue(interactionError),
        });
        await expect(firstValueFrom(facade.getAccessToken())).rejects.toBe(interactionError);
        expect(msal.acquireTokenRedirect).not.toHaveBeenCalled();
        // The refusal is not memoised: once the window has passed, a later call redirects.
        nowSpy.mockReturnValue(NOW + 120_000);
        await settleOrPending(facade.getAccessToken());
        expect(msal.acquireTokenRedirect).toHaveBeenCalledTimes(1);
      });

      it('redirects and stores a fresh timestamp when the previous one is stale', async () => {
        sessionStorage.setItem(KEY, String(NOW - 61_000));
        const { facade, msal } = await msalFacade({
          acquireTokenSilent: jest.fn().mockRejectedValue(interactionError),
        });
        await expect(settleOrPending(facade.getAccessToken())).resolves.toBe('pending');
        expect(msal.acquireTokenRedirect).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem(KEY)).toBe(String(NOW));
      });

      it('clears the timestamp after a successful silent fetch', async () => {
        sessionStorage.setItem(KEY, String(NOW - 1_000));
        const { facade } = await msalFacade();
        await expect(firstValueFrom(facade.getAccessToken())).resolves.toBe('msal-token');
        expect(sessionStorage.getItem(KEY)).toBeNull();
      });

      it('removes a stale post-login target when redirecting from the root', async () => {
        window.history.replaceState(null, '', '/');
        sessionStorage.setItem(POST_LOGIN_TARGET_KEY, '/old/place');
        const { facade, msal } = await msalFacade({
          acquireTokenSilent: jest.fn().mockRejectedValue(interactionError),
        });
        await settleOrPending(facade.getAccessToken());
        expect(msal.acquireTokenRedirect).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem(POST_LOGIN_TARGET_KEY)).toBeNull();
      });
    });

    it('propagates an Auth0 token failure to the caller', async () => {
      const failure = new Error('login_required');
      const { facade } = createFacade(
        false,
        makeAuth0({
          user$: of(auth0User),
          getAccessTokenSilently: jest.fn().mockReturnValue(throwError(() => failure)),
        })
      );
      await expect(firstValueFrom(facade.getAccessToken())).rejects.toBe(failure);
    });

    it('does not ask MSAL for a token before initializeMsal() has run', async () => {
      const msal = makeMsal({ getAllAccounts: jest.fn().mockReturnValue([account]) });
      const { facade } = createFacade(false, makeAuth0(), msal);
      await expect(firstValueFrom(facade.getAccessToken())).resolves.toBeNull();
      expect(msal.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('errors on a generic MSAL failure without redirecting', async () => {
      const failure = new Error('boom');
      const { facade, msal } = await msalFacade({
        acquireTokenSilent: jest.fn().mockRejectedValue(failure),
      });
      await expect(firstValueFrom(facade.getAccessToken())).rejects.toBe(failure);
      expect(msal.acquireTokenRedirect).not.toHaveBeenCalled();
    });
  });
});
