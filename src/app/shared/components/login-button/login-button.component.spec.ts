import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginButtonComponent } from './login-button.component';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, of } from 'rxjs';

type MockAuthService = {
  isAuthenticated$: Observable<boolean>;
  loginWithRedirect: jest.Mock;
  logout: jest.Mock;
};

describe('LoginButtonComponent', () => {
  let component: LoginButtonComponent;
  let fixture: ComponentFixture<LoginButtonComponent>;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated$: of(false),
      loginWithRedirect: jest.fn(),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginButtonComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call loginWithRedirect when not authenticated', () => {
    component.loginOrLogout();
    expect(mockAuthService.loginWithRedirect).toHaveBeenCalled();
  });

  it('should call logout when authenticated', () => {
    mockAuthService.isAuthenticated$ = of(true);
    fixture = TestBed.createComponent(LoginButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.loginOrLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
