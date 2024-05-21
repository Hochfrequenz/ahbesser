import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AhbSearchFormHeaderComponent } from './ahb-search-form-header.component';

describe('AhbSearchFormHeaderComponent', () => {
  let component: AhbSearchFormHeaderComponent;
  let fixture: ComponentFixture<AhbSearchFormHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AhbSearchFormHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AhbSearchFormHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
