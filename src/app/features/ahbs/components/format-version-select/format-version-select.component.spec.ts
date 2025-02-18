import { of } from 'rxjs';
import { AhbService } from '../../../../core/api';
import { FormatVersionSelectComponent } from './format-version-select.component';
import { MockBuilder, MockRender, MockService, ngMocks } from 'ng-mocks';

jest.setTimeout(10000); // Increase global timeout

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
    jest.setSystemTime(new Date('2024-11-01'));

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    // Advance timers and wait for async operations
    jest.runAllTimers();
    await fixture.whenStable();

    expect(component.control.value).toBe('FV2410');

    jest.useRealTimers();
  });

  it('should respect provided format version and not override with default', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    component.writeValue('FV2504');

    // Advance timers and wait for async operations
    jest.runAllTimers();
    await fixture.whenStable();

    expect(component.control.value).toBe('FV2504');

    jest.useRealTimers();
  });

  it('should notify of changes through onChange callback', async () => {
    jest.useFakeTimers();

    const fixture = MockRender(FormatVersionSelectComponent);
    const component = fixture.point.componentInstance;

    // Wait for initialization
    jest.runAllTimers();
    await fixture.whenStable();

    const onChangeSpy = jest.fn();
    component.registerOnChange(onChangeSpy);

    // Simulate user selecting a different format version
    component.control.setValue('FV2504');

    // We need to run detectChanges to trigger Angular's change detection
    fixture.detectChanges();
    jest.runAllTimers();
    await fixture.whenStable();

    expect(onChangeSpy).toHaveBeenCalledWith('FV2504');

    jest.useRealTimers();
  });

  describe('Default Format Version Selection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    async function renderAndStabilize() {
      const fixture = MockRender(FormatVersionSelectComponent);
      const component = fixture.point.componentInstance;
      jest.runAllTimers();
      await fixture.whenStable();
      return { fixture, component };
    }

    it('should return FV2404 before September 30, 2024 22:00:00 UTC', async () => {
      jest.setSystemTime(new Date('2024-09-30T21:59:59Z'));
      const { component } = await renderAndStabilize();
      expect(component.control.value).toBe('FV2404');
    });

    it('should return FV2410 between September 30, 2024 22:00:00 UTC and June 5, 2025 22:00:00 UTC', async () => {
      jest.setSystemTime(new Date('2024-09-30T22:00:01Z'));
      const { component } = await renderAndStabilize();
      expect(component.control.value).toBe('FV2410');

      // Test the upper boundary
      jest.setSystemTime(new Date('2025-06-05T21:59:59Z'));
      const { component: component2 } = await renderAndStabilize();
      expect(component2.control.value).toBe('FV2410');
    });

    it('should return FV2504 between June 5, 2025 22:00:00 UTC and September 30, 2025 22:00:00 UTC', async () => {
      jest.setSystemTime(new Date('2025-06-05T22:00:01Z'));
      const { component } = await renderAndStabilize();
      expect(component.control.value).toBe('FV2504');

      // Test the upper boundary
      jest.setSystemTime(new Date('2025-09-30T21:59:59Z'));
      const { component: component2 } = await renderAndStabilize();
      expect(component2.control.value).toBe('FV2504');
    });

    it('should return FV2510 after September 30, 2025 22:00:00 UTC', async () => {
      jest.setSystemTime(new Date('2025-09-30T22:00:01Z'));
      const { component } = await renderAndStabilize();
      expect(component.control.value).toBe('FV2510');

      // Test a far future date
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const { component: component2 } = await renderAndStabilize();
      expect(component2.control.value).toBe('FV2510');
    });
  });
});
