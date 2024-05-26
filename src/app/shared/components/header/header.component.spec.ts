import { HeaderComponent } from './header.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';

describe('HeaderComponent', () => {
  beforeEach(() => MockBuilder(HeaderComponent));

  it('should render', () => {
    const fixture = MockRender(HeaderComponent);
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('app-icon-logo');
  });
});
