import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconLogoComponent } from './icon-logo.component';

describe('IconLogoComponent', () => {
  let component: IconLogoComponent;
  let fixture: ComponentFixture<IconLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
