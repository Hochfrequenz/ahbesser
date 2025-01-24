import { HighlightPipe } from './highlight.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HighlightPipe,
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustHtml: jest.fn(value => value as SafeHtml),
          },
        },
      ],
    });

    pipe = TestBed.inject(HighlightPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should bypass security and trust the HTML', () => {
    const spy = jest.spyOn(sanitizer, 'bypassSecurityTrustHtml');
    const html = 'foobar';
    const hightlight = 'foo';
    pipe.transform(html, hightlight);
    expect(spy).toHaveBeenCalledWith('<mark>foo</mark>bar');
  });
});
