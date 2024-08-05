import { ExportButtonComponent } from './export-button.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { AhbService } from '../../../../core/api/services/ahb.service';
import { of } from 'rxjs';

describe('ExportButtonComponent', () => {
  beforeEach(() =>
    MockBuilder(ExportButtonComponent).provide({
      provide: AhbService,
      useValue: {
        getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet: jest
          .fn()
          .mockReturnValue(of(new Blob())),
      },
    }),
  );

  it('should render', () => {
    const component = MockRender(ExportButtonComponent, {
      formatVersion: 'testFormatVersion',
      pruefi: 'testPruefi',
    });
    expect(ngMocks.formatHtml(component)).toContain('Export XLSX');
  });

  it('should call getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet when button is clicked', () => {
    MockRender(ExportButtonComponent, {
      formatVersion: 'testFormatVersion',
      pruefi: 'testPruefi',
    });
    const ahbService = ngMocks.findInstance(AhbService);

    const button = ngMocks.find('button');
    ngMocks.click(button);

    expect(
      ahbService.getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet,
    ).toHaveBeenCalledWith({
      'format-version': 'testFormatVersion',
      pruefi: 'testPruefi',
      format: 'xlsx',
    });
  });
});
