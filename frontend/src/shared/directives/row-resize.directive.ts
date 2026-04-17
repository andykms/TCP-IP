import { DestroyRef, Directive, ElementRef, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, filter, fromEvent } from 'rxjs';

@Directive({
  selector: '[herculesRowResize]',
  host: {
    '(mousedown)': 'onMousedown()',
    '(onselect)': 'onSelect($event)',
    '(select)': 'onSelect($event)',
  },
})
export class HercRowResizeDirective implements OnInit {
  private readonly isMousedown = signal(false);

  protected readonly onResize = output<number>();
  public bottomZone = input<number>(100);
  public topZone = input<number>(100);
  public onBottomZone = output<void>();
  public onTopZone = output<void>();

  constructor(
    private readonly el: ElementRef,
    private readonly destroy$: DestroyRef,
  ) {}

  ngOnInit() {
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        auditTime(1),
        takeUntilDestroyed(this.destroy$),
        filter((event: MouseEvent) => {
          const bottomY = this.el.nativeElement.getBoundingClientRect().bottom;
          const topY = this.el.nativeElement.getBoundingClientRect().top;
          return this.isMousedown() && bottomY < window.innerHeight && topY >= 0;
        }),
      )
      .subscribe((event: MouseEvent) => {
        event.stopPropagation();
        if (this.isMousedown()) {
          const currY = event.clientY;
          const windowHeight = window.innerHeight;
          const newHeight = windowHeight - currY;
          if (newHeight <= this.bottomZone()) {
            this.onBottomZone.emit();
            return;
          }
          if (windowHeight - newHeight <= this.topZone()) {
            this.onTopZone.emit();
            return;
          }
          this.onResize.emit(newHeight);
        }
      });

    fromEvent<MouseEvent>(document, 'mouseup').subscribe((event: MouseEvent) => {
      this.isMousedown.set(false);
    });
  }

  onMousedown() {
    this.isMousedown.set(true);
  }

  onMouseup() {
    this.isMousedown.set(false);
  }

  onSelect(event: Event) {
    event.preventDefault();
  }
}
