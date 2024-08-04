import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { IconCopyUrlComponent } from './icon-copy-url.component';
import { Renderer2 } from '@angular/core';

describe('IconCopyUrlComponent', () => {
  let component: IconCopyUrlComponent;
  let fixture: ComponentFixture<IconCopyUrlComponent>;
  let mockRenderer: jest.Mocked<Renderer2>;

  beforeEach(async () => {
    mockRenderer = {
      removeClass: jest.fn(),
      addClass: jest.fn(),
    } as unknown as jest.Mocked<Renderer2>;

    await TestBed.configureTestingModule({
      imports: [IconCopyUrlComponent],
      providers: [{ provide: Renderer2, useValue: mockRenderer }],
    }).compileComponents();

    fixture = TestBed.createComponent(IconCopyUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should copy current URL to clipboard', fakeAsync(() => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://no-edifacts-given.com' },
      writable: true,
    });

    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
    });

    component.onClickCopyUrl();

    tick();
    expect(writeTextMock).toHaveBeenCalledWith('https://no-edifacts-given.com');
    tick(3000);
  }));
});
