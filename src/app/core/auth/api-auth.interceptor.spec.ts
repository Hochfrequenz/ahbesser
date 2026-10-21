import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { AuthFacade } from './auth.facade';

describe('apiAuthInterceptor', () => {
  const originalApiUrl = environment.apiUrl;
  let getAccessToken: jest.Mock<Observable<string | null>, []>;
  let http: HttpClient;
  let controller: HttpTestingController;

  function setup(): void {
    getAccessToken = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: { getAccessToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    environment.apiUrl = 'https://app.example';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    TestBed.resetTestingModule();
  });

  it('attaches the bearer token to API calls', () => {
    setup();
    getAccessToken.mockReturnValue(of('abc'));
    http.get('https://app.example/api/ahb/FV2510/55001').subscribe();
    const req = controller.expectOne('https://app.example/api/ahb/FV2510/55001');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    controller.verify();
  });

  it('sends no Authorization header when there is no token', () => {
    setup();
    getAccessToken.mockReturnValue(of(null));
    http.get('https://app.example/api/ahb/FV2510/55001').subscribe();
    const req = controller.expectOne('https://app.example/api/ahb/FV2510/55001');
    expect(req.request.headers.has('Authorization')).toBe(false);
    controller.verify();
  });

  it('never attaches the token to a foreign host', () => {
    setup();
    http.get('https://other.example/api/x').subscribe();
    const req = controller.expectOne('https://other.example/api/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getAccessToken).not.toHaveBeenCalled();
    controller.verify();
  });

  it('leaves non-API paths of our own host alone', () => {
    setup();
    http.get('https://app.example/version').subscribe();
    const req = controller.expectOne('https://app.example/version');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getAccessToken).not.toHaveBeenCalled();
    controller.verify();
  });

  it('errors the call and sends nothing when the token cannot be obtained', () => {
    setup();
    const failure = new Error('token failure');
    getAccessToken.mockReturnValue(throwError(() => failure));
    let caught: unknown;
    http.get('https://app.example/api/ahb/FV2510/55001').subscribe({
      error: (error: unknown) => (caught = error),
    });
    expect(caught).toBe(failure);
    controller.expectNone('https://app.example/api/ahb/FV2510/55001');
    controller.verify();
  });

  describe('apiUrl with a trailing slash', () => {
    // The generated client concatenates `rootUrl + '/api/...'` verbatim, so APP_API_URL with a
    // trailing slash yields a double slash; the normalized single-slash form must match too.
    it.each([
      'https://app.example//api/ahb/FV2510/55001',
      'https://app.example/api/ahb/FV2510/55001',
    ])('attaches the token to %s', url => {
      environment.apiUrl = 'https://app.example/';
      setup();
      getAccessToken.mockReturnValue(of('abc'));
      http.get(url).subscribe();
      const req = controller.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
      controller.verify();
    });

    it.each(['https://app.example//api/datenstand', 'https://app.example//api/health?probe=1'])(
      'keeps %s public',
      url => {
        environment.apiUrl = 'https://app.example/';
        setup();
        http.get(url).subscribe();
        const req = controller.expectOne(url);
        expect(req.request.headers.has('Authorization')).toBe(false);
        expect(getAccessToken).not.toHaveBeenCalled();
        controller.verify();
      }
    );
  });

  describe('public endpoints', () => {
    it.each([
      'https://app.example/api/datenstand',
      'https://app.example/api/datenstand?x=1',
      'https://app.example/api/datenstand#frag',
      'https://app.example/api/health',
      'https://app.example/api/health?probe=1',
    ])('passes %s through without a token', url => {
      setup();
      http.get(url).subscribe();
      const req = controller.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(getAccessToken).not.toHaveBeenCalled();
      controller.verify();
    });

    it('does not treat /api/datenstand/extra as public', () => {
      setup();
      getAccessToken.mockReturnValue(of('abc'));
      http.get('https://app.example/api/datenstand/extra').subscribe();
      const req = controller.expectOne('https://app.example/api/datenstand/extra');
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
      controller.verify();
    });
  });

  it('never attaches the token to a look-alike host', () => {
    setup();
    http.get('https://app.example.evil/api/x').subscribe();
    const req = controller.expectOne('https://app.example.evil/api/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getAccessToken).not.toHaveBeenCalled();
    controller.verify();
  });

  it('attaches the token to relative /api URLs when apiUrl is empty (current behavior)', () => {
    environment.apiUrl = '';
    setup();
    getAccessToken.mockReturnValue(of('abc'));
    http.get('/api/ahb/x').subscribe();
    const req = controller.expectOne('/api/ahb/x');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    controller.verify();
  });
});
