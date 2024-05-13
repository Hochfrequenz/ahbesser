/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Ahb } from '../../models/ahb';
import { FormatVersion } from '../../models/format-version';

export interface GetAhb$Params {
  /**
   * Formatversion of the AHB to return
   */
  'format-version': FormatVersion;

  /**
   * Pruefidentifikator of the AHB to return
   */
  pruefi: string;
}

export function getAhb(
  http: HttpClient,
  rootUrl: string,
  params: GetAhb$Params,
  context?: HttpContext,
): Observable<StrictHttpResponse<Ahb>> {
  const rb = new RequestBuilder(rootUrl, getAhb.PATH, 'get');
  if (params) {
    rb.path('format-version', params['format-version'], {});
    rb.path('pruefi', params.pruefi, {});
  }

  return http
    .request(
      rb.build({ responseType: 'json', accept: 'application/json', context }),
    )
    .pipe(
      filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<Ahb>;
      }),
    );
}

getAhb.PATH = '/ahb/{format-version}/{pruefi}';
