import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ArrowButtonComponent } from '../arrow-button/arrow-button.component';
import { HercTextDirective, type THerculesTextSize } from '../../directives/text.directive';
import { type DropdownListItem } from '../../features/dropdown-list-item.model';

@Component({
  selector: 'hercules-list-dropdown',
  templateUrl: './list-dropdown.component.html',
  styleUrls: ['./list-dropdown.component.css'],
  imports: [ArrowButtonComponent, HercTextDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HercListDropdownComponent {
  public readonly value = input<string>('');
  public readonly items = input<DropdownListItem[]>([]);
  public readonly size = input<THerculesTextSize>('medium');
  protected readonly isChoosen = signal(false);
  protected readonly onChoose = output<DropdownListItem>();
  protected readonly opened = signal(false);

  protected readonly currentItems = computed(() => {
    const regex = new RegExp(`${this.value()}`, 'i');
    return this.value().length <= 0
      ? this.items()
      : this.items().filter((item) => regex.test(item.label));
  });

  private readonly changeEffect = effect(() => {
    const isHasValue = this.value().length > 0 && !untracked(() => this.isChoosen());
    this.opened.set(isHasValue);
    if (untracked(() => this.isChoosen())) {
      this.isChoosen.set(false);
    }
  });

  protected toggle(): void {
    this.opened.update((open) => !open);
  }

  protected choose(item: DropdownListItem): void {
    this.isChoosen.set(true);
    this.opened.set(false);
    this.onChoose.emit(item);
  }
}
