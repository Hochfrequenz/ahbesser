import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruefiInputComponent } from './pruefi-input.component';

describe('PruefiInputComponent', () => {
  let component: PruefiInputComponent;
  let fixture: ComponentFixture<PruefiInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruefiInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PruefiInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
