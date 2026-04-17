import {
  Component,
  input,
  output,
  computed,
  signal,
  effect,
  OnInit,
  ElementRef,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ArrowButtonComponent } from '../arrow-button/arrow-button.component';
import { HercTextDirective, type THerculesTextSize } from '../../directives/text.directive';
import { auditTime, filter, fromEvent } from 'rxjs';

@Component({
  selector: 'hercules-hint-dropdown',
  templateUrl: './hint-dropdown.component.html',
  styleUrls: ['./hint-dropdown.component.css'],
  imports: [ArrowButtonComponent, HercTextDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HercHintDropdownComponent implements OnInit {
  public readonly value = input<string>('');
  public readonly variables = input<string[]>([]);
  public readonly size = input<THerculesTextSize>('medium');
  protected isChoosen = signal(false);
  protected onChoose = output<string>();
  protected opened = signal(false);

  protected currentVariables = computed(() => {
    const regex = new RegExp(`${this.value()}`, `i`);
    return this.value().length <= 0
      ? this.variables()
      : this.variables().filter((variable) => regex.test(variable));
  });

  ngOnInit() {}

  private readonly changeEffect = effect(() => {
    const isHasValue = this.value().length > 0 && !untracked(() => this.isChoosen());
    this.opened.set(isHasValue);
    if (untracked(() => this.isChoosen())) this.isChoosen.set(false);
  });

  protected toggle() {
    this.opened.update((open) => !open);
  }

  protected choose(variable: string) {
    this.isChoosen.set(true);
    this.opened.set(false);
    this.onChoose.emit(variable);
  }
}
