import { AhbPageComponent } from './ahb-page.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { AhbService } from '../../../../core/api';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AhbTableComponent } from '../../components/ahb-table/ahb-table.component';
import { signal, computed } from '@angular/core';

describe('AhbPageComponent', () => {
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() };

    return MockBuilder(AhbPageComponent)
      .keep(AhbTableComponent)
      .provide({
        provide: AhbTableComponent,
        useValue: {
          markIndex: signal(0),
          markElements: computed(() => [] as HTMLElement[]),
          nextResult: () => {},
          previousResult: () => {},
          resetMarkIndex: () => {},
        },
      })
      .mock(AhbService, {
        getAhb$Json: jest.fn(params =>
          of({
            meta: {
              pruefidentifikator: params.pruefi,
              description: '',
              direction: '',
              maus_version: '',
            },
            lines: [],
          })
        ),
      })
      .mock(ActivatedRoute, {
        queryParams: of({}),
      })
      .mock(Router, mockRouter);
  });

  it('should render', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('<app-header');
    expect(html).toContain('Anwendungshandbuch 123');
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

    expect(result.sender).toBe(
      'MSCONS-Nachrichten können von verschiedenen Marktrollen gesendet werden.'
    );
    expect(result.empfaenger).toBe(
      'MSCONS-Nachrichten können von verschiedenen Marktrollen empfangen werden.'
    );
  });

  it('should refresh table and redirect URL upon formatversion change', () => {
    const fixture = MockRender(AhbPageComponent, {
      formatVersion: 'FV123',
      pruefi: '456',
    });
    const component = fixture.point.componentInstance;
    const router = ngMocks.findInstance(Router);

    const navigateSpy = jest.spyOn(router, 'navigate');

    component.onFormatVersionChange('FV456');

    expect(navigateSpy).toHaveBeenCalledWith(['/ahb', 'FV456', '456']);
  });

  // Add more tests here
});
