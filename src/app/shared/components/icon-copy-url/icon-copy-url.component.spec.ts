import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconCopyUrlComponent } from './icon-copy-url.component';

describe('IconCopyUrlComponent', () => {
  let component: IconCopyUrlComponent;
  let fixture: ComponentFixture<IconCopyUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconCopyUrlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IconCopyUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
