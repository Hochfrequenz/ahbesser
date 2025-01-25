import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  constructor(private readonly domSanitizer: DomSanitizer) {}

  transform(value: string | undefined, highlightText: string | undefined): SafeHtml {
    if (!value) {
      return this.domSanitizer.bypassSecurityTrustHtml('');
    }
    if (!highlightText) {
      return this.domSanitizer.bypassSecurityTrustHtml(value);
    }
    const regex = new RegExp(highlightText, 'gi');
    const html = value.replace(regex, match => `<mark>${match}</mark>`);
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
