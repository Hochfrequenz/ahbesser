import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolutionsFooterComponent } from './solutions-footer.component';

describe('SolutionsFooterComponent', () => {
  let component: SolutionsFooterComponent;
  let fixture: ComponentFixture<SolutionsFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolutionsFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SolutionsFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
