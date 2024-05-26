import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconArrowLeftComponent } from './icon-arrow-left.component';

describe('IconArrowLeftComponent', () => {
  let component: IconArrowLeftComponent;
  let fixture: ComponentFixture<IconArrowLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconArrowLeftComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconArrowLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
