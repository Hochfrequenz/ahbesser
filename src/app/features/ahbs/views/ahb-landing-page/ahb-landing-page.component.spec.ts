import { AhbLandingPageComponent } from './ahb-landing-page.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';

describe('AhbLandingPageComponent', () => {
  beforeEach(() => MockBuilder(AhbLandingPageComponent));

  it('should render', () => {
    const fixture = MockRender(AhbLandingPageComponent);
    const html = ngMocks.formatHtml(fixture);
    expect(html).toContain('<app-header>');
    expect(html).toContain('<form');
  });
});
