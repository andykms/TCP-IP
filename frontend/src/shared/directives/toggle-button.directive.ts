import { Directive, effect, ElementRef, input, Renderer2 } from "@angular/core";

@Directive({
  selector: "[herculesToggleButton]"
})
export class HercToggleButtonDirective {
  public readonly active = input<boolean>(false);

  private readonly activeEffect = effect(() => {
    if (this.active()) {
      this.rerender.addClass(this.el, "hercules-toggle-button-active");
    } else {
      this.rerender.removeClass(this.el, "hercules-toggle-button-active");
    }
  });

  constructor(private readonly el: ElementRef, private readonly rerender: Renderer2) {
    rerender.addClass(el, "hercules-toggle-button");
  }
}