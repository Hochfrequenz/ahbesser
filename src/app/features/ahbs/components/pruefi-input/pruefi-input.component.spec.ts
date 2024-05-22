import { PruefiInputComponent } from './pruefi-input.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';

describe('PruefiInputComponent', () => {

  beforeEach(() => MockBuilder(PruefiInputComponent));

  it('should render', () => {
    const fixture = MockRender(PruefiInputComponent, {
      formatVersion: null,
    });
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('id="pruefi-list"');
  });
});
