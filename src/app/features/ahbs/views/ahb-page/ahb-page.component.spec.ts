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

  it('should split sender and empfaenger without "an" keyword', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const component = fixture.point.componentInstance;

    const testDirection = 'ABC an XYZ';
    const result = component.getSenderEmpfaenger(testDirection);

    expect(result.sender).toBe('ABC');
    expect(result.empfaenger).toBe('XYZ');
    expect(result.sender).not.toContain(' an ');
    expect(result.empfaenger).not.toContain(' an ');
  });

  it('should handle direction without empfaenger', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const component = fixture.point.componentInstance;

    const testDirection = 'ABC';
    const result = component.getSenderEmpfaenger(testDirection);

    expect(result.sender).toBe('ABC');
    expect(result.empfaenger).toBe('');
  });

  it('should handle empty direction', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const component = fixture.point.componentInstance;

    const testDirection = '';
    const result = component.getSenderEmpfaenger(testDirection);

    expect(result.sender).toBe('');
    expect(result.empfaenger).toBe('');
  });

  // todo add more tests
});
