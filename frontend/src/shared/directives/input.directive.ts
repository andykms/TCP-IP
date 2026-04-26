import { Directive, effect, ElementRef, input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';

export type HercInputType = 'base' | 'danger';
@Directive({
  selector: '[herculesInputContainer]',
  host: {
    '(change)': 'onChange($event)',
  },
})
export class HercInputDirective implements OnChanges {
  public readonly size = input<'small' | 'medium' | 'large'>('medium');
  public readonly disabled = input<boolean>(false);
  public readonly class = input<string>('');
  public readonly inputType = input<HercInputType>('base');

  private readonly disabledEffect = effect(() => {
    const inputElem = this.el.nativeElement.querySelector('input');
    inputElem.color = this.disabled() ? 'var(--disabled-color)' : 'var(--main-text-color)';
  });

  ngOnChanges(): void {
    this.setClasses();
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  private setClasses() {
    const classes = [];
    classes.push('hercules-input-container');
    classes.push(`hercules-input-container-${this.inputType()}`);

    switch (this.size()) {
      case 'small':
        classes.push('hercules-input-small');
        break;
      case 'medium':
        classes.push('hercules-input-medium');
        break;
      case 'large':
        classes.push('hercules-input-large');
        break;
    }
    this.renderer.setAttribute(
      this.el.nativeElement,
      'class',
      classes.join(' ') + ` ${this.class()}`,
    );
  }

  onChange(event: Event) {
    if (this.disabled()) {
      event.preventDefault();
    }
  }
}
