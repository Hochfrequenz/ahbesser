import { AhbSearchFormHeaderComponent } from './ahb-search-form-header.component';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('AhbSearchFormHeaderComponent', () => {

  beforeEach(() => MockBuilder(AhbSearchFormHeaderComponent));

  it('should render', () => {
    MockRender(AhbSearchFormHeaderComponent, {
      formatVersion: 'FV123',
      pruefi: '123',
    });
  });
});
