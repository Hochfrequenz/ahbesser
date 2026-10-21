import { Injectable, inject } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { BehaviorSubject, combineLatest, defer, merge, Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AUTH_IS_DEVELOPMENT, MSAL_CLIENT } from './msal.tokens';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './safe-storage';
import { safeInternalTarget } from './safe-target';

export type AuthProviderId = 'auth0' | 'microsoft';

export interface AuthUser {
  email?: string;
  name?: string;
  sub?: string;
  provider: AuthProviderId | 'dev';
}

const ACTIVE_PROVIDER_KEY = 'ahb.activeAuthProvider';

/** sessionStorage key holding when we last redirected to Microsoft for re-authentication (ms). */
const REAUTH_AT_KEY = 'ahb.apiReauthAt';

/** Within this window a second re-auth redirect is refused, to break redirect loops. */
const REAUTH_LOOP_WINDOW_MS = 60_000;

/** sessionStorage key holding the route the user was heading to before being asked to sign in. */
export const POST_LOGIN_TARGET_KEY = 'ahb.postLoginTarget';

const DEV_USER: AuthUser = {
  email: 'local@development.com',
  name: 'Local Development User',
  sub: 'local-development',
  provider: 'dev',
};

/**
 * Single seam over the two independent identity providers (Auth0 and Microsoft Entra ID via
 * MSAL). Guards and components depend on this facade, never on a specific SDK, so a user may be
 * signed in through either provider. In development it short-circuits to a stub user, exactly as
 * the previous inline `isDevelopment` checks did.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly auth0 = inject(Auth0Service);
  private readonly msal = inject(MSAL_CLIENT);
  private readonly isDevelopment = inject(AUTH_IS_DEVELOPMENT);

  /** MSAL has no reactive auth state, so we track it ourselves and refresh it on init/login. */
  private readonly msalAuthenticated$ = new BehaviorSubject<boolean>(false);

  /** In-flight MSAL initialization, shared across callers so init/redirect handling runs once. */
  private initialization?: Promise<void>;

  /** In-flight redirect to Microsoft sign-in, shared so concurrent API calls trigger only one. */
  private reauthRedirect?: Promise<never>;

  readonly isAuthenticated$: Observable<boolean>;
  readonly isLoading$: Observable<boolean>;
  readonly user$: Observable<AuthUser | null>;

  constructor() {
    if (this.isDevelopment) {
      this.isAuthenticated$ = of(true);
      this.isLoading$ = of(false);
      this.user$ = of(DEV_USER);
      return;
    }

    // Do NOT read msal.getAllAccounts() here: MSAL throws if queried before initialize().
    // The state starts false and is set in initializeMsal(), run by the app initializer.
    // A definitive "yes" from either provider must not wait on the other. combineLatest alone
    // emits nothing until BOTH have reported, and Auth0's isAuthenticated$ is gated behind its own
    // loading check — so a Hochfrequenz employee with a cached Microsoft account would sit behind
    // Auth0's session round trip before being recognised, penalising exactly the audience the
    // second provider exists for. "No" still requires both to have answered, so nothing reports
    // anonymous while a check is still in flight.
    this.isAuthenticated$ = merge(
      this.auth0.isAuthenticated$.pipe(filter(authed => authed)),
      this.msalAuthenticated$.pipe(filter(authed => authed)),
      combineLatest([this.auth0.isAuthenticated$, this.msalAuthenticated$]).pipe(
        map(([auth0Authed, msalAuthed]) => auth0Authed || msalAuthed)
      )
    ).pipe(distinctUntilChanged());

    this.isLoading$ = this.auth0.isLoading$;

    this.user$ = combineLatest([this.auth0.user$, this.msalAuthenticated$]).pipe(
      map(([auth0User, msalAuthed]) => this.resolveUser(auth0User, msalAuthed))
    );
  }

  /**
   * Start a sign-in with the chosen provider, optionally returning the user to `target` afterwards.
   *
   * Every caller passes a user-influenced value here (`?target=…` from the guard, `router.url` from
   * the header), so the target is sanitized once, in this one place, rather than at each call site
   * where the checks could drift apart or be forgotten. A hostile target is dropped, but the
   * sign-in itself still proceeds — the user asked to log in, and only their destination was bad.
   */
  login(provider: AuthProviderId, target?: string): void {
    // In the dev stub the user is already "signed in"; never fire a real provider redirect
    // (keeps the "stub unless ?realauth=1" contract).
    if (this.isDevelopment) {
      return;
    }
    safeStorageSet(localStorage, ACTIVE_PROVIDER_KEY, provider);

    // safeInternalTarget collapses anything unsafe (and anything absent) to '/', which is also
    // the app root — i.e. "no particular destination", so there is nothing worth carrying.
    const safe = safeInternalTarget(target);
    const resolved = safe === '/' ? undefined : safe;

    if (provider === 'auth0') {
      // Auth0 restores its own target from appState. Clear the Microsoft key so a target stashed
      // by an abandoned Microsoft attempt can't leak into this session's callback.
      safeStorageRemove(sessionStorage, POST_LOGIN_TARGET_KEY);
      this.auth0.loginWithRedirect(resolved ? { appState: { target: resolved } } : undefined);
    } else {
      // MSAL's redirect response carries no app-level state, so the target rides in sessionStorage
      // and is re-validated by the callback route before it navigates.
      if (resolved) {
        safeStorageSet(sessionStorage, POST_LOGIN_TARGET_KEY, resolved);
      } else {
        safeStorageRemove(sessionStorage, POST_LOGIN_TARGET_KEY);
      }
      void this.msal.loginRedirect({ scopes: environment.entraScopes });
    }
  }

  logout(): void {
    if (this.isDevelopment) {
      return;
    }
    safeStorageRemove(localStorage, ACTIVE_PROVIDER_KEY);
    // Derive the effective provider from the live MSAL session rather than the persisted hint:
    // a cached Microsoft account keeps `isAuthenticated$` true, so it must drive logout even when
    // the key is missing or stale (otherwise the user gets stuck in a "can't log out" loop).
    if (this.msalAuthenticated$.value) {
      void this.msal.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
    } else {
      this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }

  /**
   * Access token for the backend API, from the provider of the current user — exactly the one
   * `user$` reports, so the tie-break and the "anonymous" case cannot drift from what the UI shows.
   * `user$` only emits once Auth0 has finished loading, which also keeps us from asking Auth0 for a
   * token while it is still processing its redirect callback.
   *
   * Emits `null` — meaning "send no token" — under the dev stub, when signed out, or when the
   * audience/scope for the user's provider is not configured; the API then answers 401, which is
   * loud rather than silent.
   *
   * Failure handling differs by provider: Microsoft `interaction_required` triggers one redirect to
   * sign in again; an Auth0 failure (`login_required`, `missing_refresh_token`) errors the request
   * and the user recovers by logging in again.
   */
  getAccessToken(): Observable<string | null> {
    if (this.isDevelopment) {
      return of(null);
    }
    return this.user$.pipe(
      take(1),
      switchMap((user): Observable<string | null> => {
        if (user?.provider === 'microsoft') {
          const account = this.msalAccount();
          const scope = environment.entraApiScope;
          return account && scope ? defer(() => this.acquireMsalToken(account, scope)) : of(null);
        }
        if (user?.provider === 'auth0') {
          const audience = environment.auth0Audience;
          return audience
            ? this.auth0
                .getAccessTokenSilently({ authorizationParams: { audience } })
                .pipe(map(token => token ?? null))
            : of(null);
        }
        return of(null);
      })
    );
  }

  private async acquireMsalToken(account: AccountInfo, scope: string): Promise<string> {
    try {
      const result = await this.msal.acquireTokenSilent({ scopes: [scope], account });
      safeStorageRemove(sessionStorage, REAUTH_AT_KEY);
      return result.accessToken;
    } catch (error) {
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw error;
      }
      // A page load fires several API calls at once; they must share ONE redirect, or MSAL rejects
      // the later ones with `interaction_in_progress` and those surface as spurious HTTP errors.
      this.reauthRedirect ??= this.redirectToMicrosoft(account, scope, error);
      return this.reauthRedirect;
    }
  }

  /**
   * The silent path cannot renew the session (e.g. refresh token expired): send the user through
   * Microsoft sign-in again, returning them to where they were. The page navigates away, so on
   * success the returned promise never settles — resolving or rejecting would fire a spurious API
   * request / error right before the redirect.
   *
   * Loop guard: if we already redirected less than a minute ago and the silent path still needs
   * interaction, redirecting again would loop forever, so the original error is surfaced instead.
   */
  private redirectToMicrosoft(
    account: AccountInfo,
    scope: string,
    cause: InteractionRequiredAuthError
  ): Promise<never> {
    const lastAt = Number(safeStorageGet(sessionStorage, REAUTH_AT_KEY));
    if (Number.isFinite(lastAt) && lastAt > 0 && Date.now() - lastAt < REAUTH_LOOP_WINDOW_MS) {
      return Promise.reject(cause).catch((error: unknown) => {
        this.reauthRedirect = undefined; // do not memoise the refusal
        throw error;
      });
    }
    safeStorageSet(sessionStorage, REAUTH_AT_KEY, String(Date.now()));
    const target = safeInternalTarget(window.location.pathname + window.location.search);
    // Mirror login(): never leave a stale target behind when there is nothing to carry.
    if (target !== '/') {
      safeStorageSet(sessionStorage, POST_LOGIN_TARGET_KEY, target);
    } else {
      safeStorageRemove(sessionStorage, POST_LOGIN_TARGET_KEY);
    }
    return this.msal.acquireTokenRedirect({ scopes: [scope], account }).then(
      () => new Promise<never>(() => undefined),
      (error: unknown) => {
        // No redirect happened, so it must not count against the loop guard.
        safeStorageRemove(sessionStorage, REAUTH_AT_KEY);
        this.reauthRedirect = undefined; // allow a later attempt to retry
        throw error;
      }
    );
  }

  /**
   * Initialize MSAL and process any pending redirect response. Both the app initializer and the
   * MSAL callback route call this on the redirect round-trip, so it is idempotent: the in-flight
   * promise is cached and reused (and cleared on failure so a later call can retry). No-op under
   * the development stub.
   */
  initializeMsal(): Promise<void> {
    if (this.isDevelopment) {
      return Promise.resolve();
    }
    if (!this.initialization) {
      this.initialization = this.doInitializeMsal().catch(error => {
        this.initialization = undefined;
        throw error;
      });
    }
    return this.initialization;
  }

  private async doInitializeMsal(): Promise<void> {
    await this.msal.initialize();
    // navigateToLoginRequestUrl: false — we own post-login routing (MsalCallbackComponent). Left
    // at the default (true), MSAL navigates back to whichever URL loginRedirect was called from
    // (the landing page, or any page the header button was used on), overriding our own redirect
    // to the stashed target. Still load-bearing now that the /login chooser is gone.
    const result = await this.msal.handleRedirectPromise({ navigateToLoginRequestUrl: false });
    if (result?.account) {
      this.msal.setActiveAccount(result.account);
    }
    this.msalAuthenticated$.next(this.msal.getAllAccounts().length > 0);
  }

  /** The live Microsoft account, if any — never read before `initializeMsal()` has run. */
  private msalAccount(): AccountInfo | null {
    return this.msalAuthenticated$.value
      ? (this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0] ?? null)
      : null;
  }

  private resolveUser(
    auth0User:
      { email?: string | null; name?: string | null; sub?: string | null } | null | undefined,
    msalAuthed: boolean
  ): AuthUser | null {
    // Resolve from the actual sessions present, not the persisted hint: a live MSAL account must
    // surface a user even if the active-provider key was cleared or never written.
    const account = msalAuthed ? this.msalAccount() : null;
    const microsoftUser: AuthUser | null = account
      ? {
          email: account.username,
          name: account.name ?? undefined,
          sub: account.localAccountId,
          provider: 'microsoft',
        }
      : null;
    const auth0Resolved: AuthUser | null = auth0User
      ? {
          email: auth0User.email ?? undefined,
          name: auth0User.name ?? undefined,
          sub: auth0User.sub ?? undefined,
          provider: 'auth0',
        }
      : null;

    if (microsoftUser && auth0Resolved) {
      // Both signed in (unusual): let the persisted hint break the tie, defaulting to Microsoft.
      return safeStorageGet(localStorage, ACTIVE_PROVIDER_KEY) === 'auth0'
        ? auth0Resolved
        : microsoftUser;
    }
    return microsoftUser ?? auth0Resolved;
  }
}
