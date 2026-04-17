import { Directive, effect, ElementRef, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[herculesToggleButton]',
})
export class HercToggleButtonDirective {
  public readonly active = input<boolean>(false);

  private readonly activeEffect = effect(() => {
    if (this.active()) {
      this.rerender.setAttribute(
        this.el.nativeElement,
        'class',
        'hercules-toggle-button hercules-toggle-button-active',
      );
    } else {
      this.rerender.setAttribute(this.el.nativeElement, 'class', 'hercules-toggle-button');
    }
  });

  constructor(
    private readonly el: ElementRef,
    private readonly rerender: Renderer2,
  ) {
    this.rerender.setAttribute(this.el.nativeElement, 'class', 'hercules-toggle-button');
  }
}
