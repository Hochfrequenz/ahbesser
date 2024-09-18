import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputSearchEnhancedComponent } from './input-search-enhanced.component';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('InputSearchEnhancedComponent', () => {
  let component: InputSearchEnhancedComponent;
  let fixture: ComponentFixture<InputSearchEnhancedComponent>;
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockActivatedRoute = {
      queryParams: of(convertToParamMap({ query: 'test' })),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InputSearchEnhancedComponent, FormsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputSearchEnhancedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
