import { Directive, effect, ElementRef, input, OnInit, Renderer2 } from '@angular/core';
import { THerculesTextSize } from './text.directive';

@Directive({
  selector: '[herculesTextfieldContainer]',
  host: {
    '(change)': 'onChange($event)',
  },
})
export class HercTextfieldDirective implements OnInit {
  public readonly disabled = input<boolean>(false);
  public readonly placeholderTop = input<string>('');
  public readonly class = input<string>('');
  public readonly size = input<THerculesTextSize>('medium');
  public readonly resize = input<'none' | 'horizontal' | 'vertical'>('none');

  private readonly disabledEffect = effect(() => {
    const disabledClass = 'hercules-textfield-container-disabled';
    if (this.disabled()) this.el.nativeElement.classList.add(disabledClass);
    else this.el.nativeElement.classList.remove(disabledClass);
  });

  ngOnInit() {
    this.setClasses();
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  private setClasses() {
    const classes = [];
    classes.push('hercules-textfield-container');
    classes.push(`hercules-textfield-container-${this.size()}`);
    classes.push(`hercules-textfield-container-resize-${this.resize()}`);
    this.el.nativeElement.querySelector('textarea').placeholder = this.placeholderTop();
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
