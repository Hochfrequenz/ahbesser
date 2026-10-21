import { Router } from '@angular/router';
import { AhbSearchFormHeaderComponent } from './ahb-search-form-header.component';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('AhbSearchFormHeaderComponent', () => {
  const routerSpy = { navigate: jest.fn() };

  beforeEach(() => {
    routerSpy.navigate.mockClear();
    return MockBuilder(AhbSearchFormHeaderComponent).provide({
      provide: Router,
      useValue: routerSpy,
    });
  });

  it('should render', () => {
    MockRender(AhbSearchFormHeaderComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
  });

  // Regression test for https://github.com/Hochfrequenz/ahb-tabellen/issues/941
  // While a pruefi is displayed, changing to a *different* one (e.g. pasting) must emit the NEW
  // pruefi so the hosting page navigates to it. The previous implementation *also* navigated from
  // here via `navigateToAhb()`, which re-read `headerSearchForm.value` — still the old pruefi at
  // that point, because the FormGroup aggregate lags the child control's `valueChanges`. That
  // stale second navigation ran last and sent the user back to the currently shown pruefi.
  //
  // Asserting the emitted value alone is not enough: the buggy code emitted the new value too. So
  // we also assert the header performs NO navigation of its own — reintroducing any self-navigation
  // (which is what caused #941) makes this test fail.
  it('emits the newly entered pruefi and never navigates itself (#941)', () => {
    const fixture = MockRender(AhbSearchFormHeaderComponent, {
      formatVersion: 'FV2504',
      pruefi: '55001',
    });
    const component = fixture.point.componentInstance;

    const emitted: string[] = [];
    component.pruefiChange.subscribe((value: string) => emitted.push(value));

    // Simulate the value accessor propagating a different pruefi while 55001 is shown.
    component.headerSearchForm.get('pruefi')?.setValue('44043');

    // The host navigates via the output, using the fresh value...
    expect(emitted.at(-1)).toBe('44043');
    expect(emitted).not.toContain('55001');
    // ...and the header itself must not navigate (no stale self-navigation back to 55001).
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
