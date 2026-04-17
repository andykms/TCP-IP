import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[herculesTable]',
})
export class HercTableDirective implements OnInit {
  constructor(
    private readonly el: ElementRef,
    private readonly rerender: Renderer2,
  ) {}

  ngOnInit(): void {
    this.setClasses();
  }

  private setClasses() {
    const table = this.el.nativeElement;
    table.classList.add('table');
    const head = table.querySelector('thead');
    head.classList.add('thead');
    const body = table.querySelector('tbody');
    body.classList.add('tbody');
    const records = body.querySelectorAll('tr');
    records.forEach((record: HTMLTableRowElement, index: number) => {
      record.classList.add('tbodytr');
      if (index % 2 === 0) {
        record.classList.add('tbodytr-even');
      }
    });
  }
}
