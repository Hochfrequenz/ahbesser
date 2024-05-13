import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AhbPageComponent } from './ahb-page.component';

describe('AhbPageComponent', () => {
  let component: AhbPageComponent;
  let fixture: ComponentFixture<AhbPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AhbPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AhbPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
