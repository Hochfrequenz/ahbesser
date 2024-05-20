import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  constructor(private readonly domSanitizer: DomSanitizer) {}

  transform(
    value: string | undefined,
    highlightText: string | undefined,
  ): SafeHtml {
    if (!value) {
      return this.domSanitizer.bypassSecurityTrustHtml('');
    }
    if (!highlightText) {
      return this.domSanitizer.bypassSecurityTrustHtml(value);
    }
    const html = value
      .split(highlightText)
      .join(`<mark>${highlightText}</mark>`);
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
