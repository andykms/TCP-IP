import { Directive, ElementRef, input, OnChanges, OnInit, Renderer2 } from '@angular/core';

export type THerculesTextType =
  | 'main'
  | 'sub'
  | 'ok'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'primary';
export type THerculesTextSize = 'small' | 'medium' | 'large';
export type THerculesTextWeight = 'bold' | 'normal' | 'thin' | 'light';

@Directive({
  selector: '[herculesText]',
})
export class HercTextDirective implements OnInit, OnChanges {
  public readonly hovered = input<boolean>(false);
  public readonly class = input<string>('');
  public readonly texttype = input<THerculesTextType>('main');
  public readonly size = input<THerculesTextSize>('medium');
  public readonly weight = input<THerculesTextWeight>('normal');

  ngOnInit() {
    this.setClasses();
  }

  ngOnChanges() {
    this.setClasses();
  }

  constructor(
    private readonly el: ElementRef,
    private readonly rerender: Renderer2,
  ) {}

  private setClasses() {
    const classes = [];
    classes.push('hercules-text');
    classes.push(`hercules-text-${this.texttype()}`);
    classes.push(`hercules-text-${this.size()}`);
    classes.push(`hercules-text-${this.weight()}`);
    if (this.hovered()) {
      classes.push('hercules-text-hovered');
    }
    this.rerender.setAttribute(
      this.el.nativeElement,
      'class',
      classes.join(' ') + ` ${this.class()}`,
    );
  }
}
