import { Component, ElementRef, ViewChild, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-icon-copy-url',
  standalone: true,
  templateUrl: './icon-copy-url.component.html',
})
export class IconCopyUrlComponent {
  @ViewChild('popover') popover!: ElementRef;

  constructor(private renderer: Renderer2) {}

  onClickCopyUrl() {
    const currentUrl = window.location.href;

    navigator.clipboard.writeText(currentUrl).then(() => {
      this.showPopover();
      setTimeout(() => this.hidePopover(), 3000);
    });
  }

  private showPopover() {
    if (this.popover && this.popover.nativeElement) {
      this.renderer.removeClass(this.popover.nativeElement, 'invisible');
      this.renderer.removeClass(this.popover.nativeElement, 'opacity-0');
      this.renderer.addClass(this.popover.nativeElement, 'visible');
      this.renderer.addClass(this.popover.nativeElement, 'opacity-100');
    }
  }

  private hidePopover() {
    if (this.popover && this.popover.nativeElement) {
      this.renderer.addClass(this.popover.nativeElement, 'invisible');
      this.renderer.addClass(this.popover.nativeElement, 'opacity-0');
      this.renderer.removeClass(this.popover.nativeElement, 'visible');
      this.renderer.removeClass(this.popover.nativeElement, 'opacity-100');
    }
  }
}
