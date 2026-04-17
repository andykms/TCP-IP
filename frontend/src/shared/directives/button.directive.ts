import { Directive, effect, ElementRef, input, OnInit, Renderer2 } from '@angular/core';

export type HercButtonType = 'primary' | 'secondary' | 'tertiary' | 'ok';
export type HercButtonSize = 'small' | 'medium' | 'large';

@Directive({
  selector: '[herculesButton]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class HercButtonDirective implements OnInit {
  public readonly buttonType = input<HercButtonType>('primary');
  public readonly disabled = input<boolean>(false);
  public readonly size = input<HercButtonSize>('medium');

  private readonly disabledEffect = effect(() => {
    if (this.disabled()) {
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
    } else {
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
      this.initStyles();
    }
  });

  ngOnInit() {
    this.initStyles();
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  private initStyles() {
    const classes = [];
    classes.push('hercules-button');
    switch (this.buttonType()) {
      case 'primary':
        classes.push('hercules-button-primary');
        break;
      case 'secondary':
        classes.push('hercules-button-secondary');
        break;
      case 'tertiary':
        classes.push('hercules-button-tertiary');
        break;
      case 'ok':
        classes.push('hercules-button-ok');
        break;
    }

    this.renderer.setAttribute(this.el.nativeElement, 'class', classes.join(' '));

    switch (this.size()) {
      case 'small':
        this.renderer.setStyle(this.el.nativeElement, 'font-size', '10px');
        break;
      case 'medium':
        this.renderer.setStyle(this.el.nativeElement, 'font-size', '14px');
        break;
      case 'large':
        this.renderer.setStyle(this.el.nativeElement, 'font-size', '16px');
        break;
    }
  }

  protected onClick(event: MouseEvent) {
    if (this.buttonType() === 'ok') {
      event.preventDefault();
    }
  }
}
