import { AhbTableComponent } from './ahb-table.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';

describe('AhbTableComponent', () => {
  beforeEach(async () => MockBuilder(AhbTableComponent));

  it('should render', () => {
    const fixture = MockRender(AhbTableComponent, {
      lines: [],
    });
    ngMocks.formatHtml(fixture);
  });
});
