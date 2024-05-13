import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AhbTableComponent } from './ahb-table.component';

describe('AhbTableComponent', () => {
  let component: AhbTableComponent;
  let fixture: ComponentFixture<AhbTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AhbTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AhbTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
