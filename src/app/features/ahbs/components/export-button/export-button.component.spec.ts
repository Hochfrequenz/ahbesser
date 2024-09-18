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

  beforeAll(() => {
    // Mock window.URL.createObjectURL and window.URL.revokeObjectURL
    window.URL.createObjectURL = jest.fn(
      () => 'blob:http://localhost/export.xlsx',
    );
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

    // Find the button
    const button = ngMocks.find('button');

    // Trigger click event
    ngMocks.click(button);

    // Ensure the click triggers Angular's change detection
    component.detectChanges();

    // Wait for any async actions to complete
    await component.whenStable();

    // Check if the service method was called
    expect(
      ahbService.getAhb$VndOpenxmlformatsOfficedocumentSpreadsheetmlSheet,
    ).toHaveBeenCalledWith({
      'format-version': 'testFormatVersion',
      pruefi: 'testPruefi',
      format: 'xlsx',
    });

    // Ensure window.URL.createObjectURL was called
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
