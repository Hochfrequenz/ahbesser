import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthFacade } from './auth.facade';

/**
 * Attach the user's access token to calls to our own backend API — and only those, so the token
 * is never sent to third-party hosts (ahbicht, bedingungsbaum, …).
 */
export const apiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // The generated client concatenates `rootUrl + '/api/...'` verbatim, so an APP_API_URL with a
  // trailing slash yields `https://host//api/...`. Accept that verbatim form as well as the
  // normalized one, or such a deployment would silently send protected calls without a token.
  const apiUrl = environment.apiUrl;
  const root = [`${apiUrl}/api`, `${apiUrl.replace(/\/+$/, '')}/api`].find(candidate =>
    req.url.startsWith(`${candidate}/`)
  );
  if (!root) {
    return next(req);
  }
  // Public endpoints (see the backend's api-auth.ts) must not depend on a token: exact match on
  // the URL without query string / fragment.
  const path = req.url.split(/[?#]/, 1)[0];
  if (path === `${root}/datenstand` || path === `${root}/health`) {
    return next(req);
  }
  return inject(AuthFacade)
    .getAccessToken()
    .pipe(
      switchMap(token =>
        next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)
      )
    );
};
