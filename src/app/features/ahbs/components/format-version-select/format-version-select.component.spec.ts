import { of } from 'rxjs';
import { AhbService } from '../../../../core/api';
import { FormatVersionSelectComponent } from './format-version-select.component';
import { MockBuilder, MockRender, MockService } from 'ng-mocks';

describe('FormatVersionSelectComponent', () => {

  beforeEach(() => MockBuilder(FormatVersionSelectComponent).mock(AhbService, MockService(AhbService, {
    getFormatVersions: () => of([]),
  })));

  it('should render', () => {
    MockRender(FormatVersionSelectComponent);
  });
});
