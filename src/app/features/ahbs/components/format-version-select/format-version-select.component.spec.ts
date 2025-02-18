import { of } from 'rxjs';
import { AhbService } from '../../../../core/api';
import { FormatVersionSelectComponent } from './format-version-select.component';
import { MockBuilder, MockRender, MockService, ngMocks } from 'ng-mocks';

describe('FormatVersionSelectComponent', () => {
  const mockFormatVersions = ['FV2410', 'FV2504'];

  beforeEach(() =>
    MockBuilder(FormatVersionSelectComponent).mock(
      AhbService,
      MockService(AhbService, {
        getFormatVersions: () => of(mockFormatVersions),
      })
    )
  );

  it('should render', () => {
    MockRender(FormatVersionSelectComponent);
  });

  it('should set default format version (FV2410) when no value is provided', async () => {
    // Mock current date to be before June 6, 2025
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    // Wait for ngOnInit to complete
    await fixture.whenStable();

    expect(component.control.value).toBe('FV2410');

    jest.useRealTimers();
  });

  it('should respect provided format version and not override with default', async () => {
    // Mock current date to be before June 6, 2025
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    // Set initial value through writeValue (simulating form control binding)
    component.writeValue('FV2504');

    // Wait for ngOnInit to complete
    await fixture.whenStable();

    // Value should still be FV2504, not overridden by default FV2410
    expect(component.control.value).toBe('FV2504');

    jest.useRealTimers();
  });

  it('should set FV2504 as default after June 6, 2025', async () => {
    // Mock current date to be after June 6, 2025
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-07'));

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    // Wait for ngOnInit to complete
    await fixture.whenStable();

    expect(component.control.value).toBe('FV2504');

    jest.useRealTimers();
  });

  it('should notify of changes through onChange callback', async () => {
    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);

    // Simulate user selecting a different format version
    component.control.setValue('FV2504');

    expect(onChangeSpy).toHaveBeenCalledWith('FV2504');
  });
});
