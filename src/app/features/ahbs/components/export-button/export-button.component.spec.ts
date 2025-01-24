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
    })
  );

  beforeAll(() => {
    // Mock window.URL.createObjectURL
    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/export.xlsx');
    window.URL.revokeObjectURL = jest.fn();
  });

  it('should render', () => {
    const component = MockRender(ExportButtonComponent, {
      formatVersion: 'testFormatVersion',
      pruefi: 'testPruefi',
    });
    expect(ngMocks.formatHtml(component)).toContain('Export XLSX');
  });

  it('should call getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet when button is clicked', async () => {
    const component = MockRender(ExportButtonComponent, {
      formatVersion: 'testFormatVersion',
      pruefi: 'testPruefi',
    });
    const ahbService = ngMocks.findInstance(AhbService);

    const button = ngMocks.find('button');

    ngMocks.click(button);
    component.detectChanges();
    await component.whenStable();

    expect(
      ahbService.getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet
    ).toHaveBeenCalledWith({
      'format-version': 'testFormatVersion',
      pruefi: 'testPruefi',
      format: 'xlsx',
    });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
