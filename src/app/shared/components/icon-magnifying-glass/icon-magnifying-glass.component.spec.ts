import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconMagnifyingGlassComponent } from './icon-magnifying-glass.component';

describe('IconMagnifyingGlassComponent', () => {
  let component: IconMagnifyingGlassComponent;
  let fixture: ComponentFixture<IconMagnifyingGlassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconMagnifyingGlassComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconMagnifyingGlassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
