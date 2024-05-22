import { signal } from '@angular/core';
import { AhbPageComponent } from './ahb-page.component';
import { MockBuilder, MockRender, MockService, ngMocks } from 'ng-mocks';
import { AhbService } from '../../../../core/api';
import { of } from 'rxjs';

describe('AhbPageComponent', () => {
  beforeEach(() =>
    MockBuilder(AhbPageComponent).mock(
      AhbService,
      MockService(AhbService, {
        getAhb: (params) =>
          of({
            meta: {
              pruefidentifikator: params.pruefi,
            },
          }),
      } as AhbService),
    ),
  );

  it('should render', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('<app-header>');
    expect(html).toContain('loading ...');
  });

  // todo add more tests
});
