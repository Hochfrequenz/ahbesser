import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputSearchEnhancedComponent } from './input-search-enhanced.component';

describe('InputSearchEnhancedComponent', () => {
  let component: InputSearchEnhancedComponent;
  let fixture: ComponentFixture<InputSearchEnhancedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputSearchEnhancedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputSearchEnhancedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
