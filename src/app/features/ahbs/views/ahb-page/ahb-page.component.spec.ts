import { AhbPageComponent } from './ahb-page.component';
import { MockBuilder, MockRender, MockService, ngMocks } from 'ng-mocks';
import { AhbService } from '../../../../core/api';
import { of } from 'rxjs';

describe('AhbPageComponent', () => {
  beforeEach(() =>
    MockBuilder(AhbPageComponent).mock(
      AhbService,
      MockService(AhbService, {
        getAhb$Json: jest.fn((params) =>
          of({
            meta: {
              pruefidentifikator: params.pruefi,
              description: 'Test description',
              direction: 'Test direction',
              maus_version: '1.0.0',
            },
            lines: [],
          }),
        ),
        getAhb$Json$Response: jest.fn(),
        getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet: jest.fn(),
        getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet$Response:
          jest.fn(),
        getAhb$Csv: jest.fn(),
        getAhb$Csv$Response: jest.fn(),
        getFormatVersions: jest.fn(),
        getFormatVersions$Response: jest.fn(),
        getPruefis: jest.fn(),
        getPruefis$Response: jest.fn(),
      } as Partial<AhbService>),
    ),
  );

  it('should render', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('<app-header');
    expect(html).toContain('loading ...');
  });

  // todo add more tests
});
