import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[herculesBorderedContainer]',
})
export class HercBorderedContainerDirective implements OnInit {
  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(this.el.nativeElement, 'hercules-bordered-container');
  }
}
