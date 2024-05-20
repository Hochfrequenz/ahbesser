import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormatVersionSelectComponent } from './format-version-select.component';

describe('FormatVersionSelectComponent', () => {
  let component: FormatVersionSelectComponent;
  let fixture: ComponentFixture<FormatVersionSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormatVersionSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatVersionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
