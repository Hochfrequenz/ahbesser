/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { Version } from '../models/version';
import { versionGet } from '../fn/maintenance/version-get';
import { VersionGet$Params } from '../fn/maintenance/version-get';

@Injectable({ providedIn: 'root' })
export class MaintenanceService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `versionGet()` */
  static readonly VersionGetPath = '/version';

  /**
   * Get the current version of the AHBesser application.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `versionGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  versionGet$Response(
    params?: VersionGet$Params,
    context?: HttpContext,
  ): Observable<StrictHttpResponse<Version>> {
    return versionGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get the current version of the AHBesser application.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `versionGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  versionGet(
    params?: VersionGet$Params,
    context?: HttpContext,
  ): Observable<Version> {
    return this.versionGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<Version>): Version => r.body),
    );
  }
}
