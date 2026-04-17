import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { HercTextDirective, THerculesTextType } from '../../directives/text.directive';
import {
  ArrowButtonComponent,
  TArrowButtonOrientation,
  TArrowButtonType,
} from '../arrow-button/arrow-button.component';

@Component({
  selector: 'hercules-dropdown-content',
  templateUrl: './dropdown-content.component.html',
  styleUrls: ['./dropdown-content.component.css'],
  imports: [HercTextDirective, ArrowButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HerculesDropdownContentComponent {
  public readonly title = input('');
  public readonly activeStyleHard = input(false);
  protected readonly opened = signal(false);

  toggle() {
    this.opened.update((value) => !value);
  }

  get textColor(): THerculesTextType {
    return this.activeStyleHard() ? 'main' : this.opened() ? 'main' : 'sub';
  }

  get arrowColor(): TArrowButtonType {
    return this.activeStyleHard() ? 'main' : this.opened() ? 'main' : 'sub';
  }

  get arrowOrientation(): TArrowButtonOrientation {
    return this.opened() ? 'down' : 'up';
  }

  get dropdownClasses(): string {
    return `dropdown-content ${this.opened() ? 'dropdown-open' : ''}`;
  }

  get contentStyle(): object {
    return this.opened() ? { display: 'block' } : { display: 'hidden' };
  }
}
