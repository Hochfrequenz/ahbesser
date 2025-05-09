/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Ahb } from '../../models/ahb';
import { FormatVersion } from '../../models/format-version';

export interface GetAhb$Json$Params {

/**
 * Formatversion of the AHB to return
 */
  'format-version': FormatVersion;

/**
 * Pruefidentifikator of the AHB to return
 */
  pruefi: string;

/**
 * Format of the AHB file to return
 */
  format?: 'json' | 'xlsx' | 'csv';
}

export function getAhb$Json(http: HttpClient, rootUrl: string, params: GetAhb$Json$Params, context?: HttpContext): Observable<StrictHttpResponse<Ahb>> {
  const rb = new RequestBuilder(rootUrl, getAhb$Json.PATH, 'get');
  if (params) {
    rb.path('format-version', params['format-version'], {});
    rb.path('pruefi', params.pruefi, {});
    rb.query('format', params.format, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Ahb>;
    })
  );
}

getAhb$Json.PATH = '/api/ahb/{format-version}/{pruefi}';
