import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconLinkComponent } from './icon-link.component';

describe('IconLinkComponent', () => {
  let component: IconLinkComponent;
  let fixture: ComponentFixture<IconLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
