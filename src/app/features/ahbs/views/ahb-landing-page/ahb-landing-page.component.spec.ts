import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AhbLandingPageComponent } from './ahb-landing-page.component';

describe('AhbLandingPageComponent', () => {
  let component: AhbLandingPageComponent;
  let fixture: ComponentFixture<AhbLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AhbLandingPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AhbLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
