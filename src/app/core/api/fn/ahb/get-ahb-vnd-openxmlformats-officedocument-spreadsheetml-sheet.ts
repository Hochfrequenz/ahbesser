/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { FormatVersion } from '../../models/format-version';

export interface GetAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet$Params {

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

export function getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet(http: HttpClient, rootUrl: string, params: GetAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet$Params, context?: HttpContext): Observable<StrictHttpResponse<Blob>> {
  const rb = new RequestBuilder(rootUrl, getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet.PATH, 'get');
  if (params) {
    rb.path('format-version', params['format-version'], {});
    rb.path('pruefi', params.pruefi, {});
    rb.query('format', params.format, {});
  }

  return http.request(
    rb.build({ responseType: 'blob', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Blob>;
    })
  );
}

getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet.PATH = '/api/ahb/{format-version}/{pruefi}';