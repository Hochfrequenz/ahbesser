/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { Ahb } from '../models/ahb';
import { getAhb } from '../fn/ahb/get-ahb';
import { GetAhb$Params } from '../fn/ahb/get-ahb';
import { getFormatVersions } from '../fn/ahb/get-format-versions';
import { GetFormatVersions$Params } from '../fn/ahb/get-format-versions';
import { getPruefis } from '../fn/ahb/get-pruefis';
import { GetPruefis$Params } from '../fn/ahb/get-pruefis';


/**
 * Everything about AHB documents
 */
@Injectable({ providedIn: 'root' })
export class AhbService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `getAhb()` */
  static readonly GetAhbPath = '/ahb/{format-version}/{pruefi}';

  /**
   * Get an AHB document for a Pruefidentifikator from the provided Formatversion.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getAhb()` instead.
   *
   * This method doesn't expect any request body.
   */
  getAhb$Response(params: GetAhb$Params, context?: HttpContext): Observable<StrictHttpResponse<Ahb>> {
    return getAhb(this.http, this.rootUrl, params, context);
  }

  /**
   * Get an AHB document for a Pruefidentifikator from the provided Formatversion.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getAhb$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getAhb(params: GetAhb$Params, context?: HttpContext): Observable<Ahb> {
    return this.getAhb$Response(params, context).pipe(
      map((r: StrictHttpResponse<Ahb>): Ahb => r.body)
    );
  }

  /** Path part for operation `getFormatVersions()` */
  static readonly GetFormatVersionsPath = '/format-versions';

  /**
   * Get a list of all available format versions.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getFormatVersions()` instead.
   *
   * This method doesn't expect any request body.
   */
  getFormatVersions$Response(params?: GetFormatVersions$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<string>>> {
    return getFormatVersions(this.http, this.rootUrl, params, context);
  }

  /**
   * Get a list of all available format versions.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getFormatVersions$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getFormatVersions(params?: GetFormatVersions$Params, context?: HttpContext): Observable<Array<string>> {
    return this.getFormatVersions$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<string>>): Array<string> => r.body)
    );
  }

  /** Path part for operation `getPruefis()` */
  static readonly GetPruefisPath = '/{format-version}/pruefis';

  /**
   * Get a list of all available Pruefidentifikators for a given format version.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getPruefis()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPruefis$Response(params: GetPruefis$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<{
'pruefidentifikator'?: string;
'description'?: string;
}>>> {
    return getPruefis(this.http, this.rootUrl, params, context);
  }

  /**
   * Get a list of all available Pruefidentifikators for a given format version.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getPruefis$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPruefis(params: GetPruefis$Params, context?: HttpContext): Observable<Array<{
'pruefidentifikator'?: string;
'description'?: string;
}>> {
    return this.getPruefis$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<{
'pruefidentifikator'?: string;
'description'?: string;
}>>): Array<{
'pruefidentifikator'?: string;
'description'?: string;
}> => r.body)
    );
  }

}
