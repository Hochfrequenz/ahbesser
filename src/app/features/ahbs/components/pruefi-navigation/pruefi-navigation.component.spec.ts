import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruefiNavigationComponent } from './pruefi-navigation.component';

describe('PruefiNavigationComponent', () => {
  let component: PruefiNavigationComponent;
  let fixture: ComponentFixture<PruefiNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruefiNavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PruefiNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
