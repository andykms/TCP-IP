import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type TArrowButtonOrientation = 'up' | 'down';
export type TArrowButtonSize = 'small' | 'medium' | 'large';
export type TArrowButtonType = 'main' | 'sub';

@Component({
  selector: 'hercules-arrow-button',
  templateUrl: './arrow-button.component.html',
  styleUrls: ['./arrow-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowButtonComponent {
  public readonly type = input<TArrowButtonType>('main');
  public readonly orientation = input<TArrowButtonOrientation>('up');
  public readonly size = input<TArrowButtonSize>('medium');

  public readonly onClick = output<void>();

  get arrowClasses() {
    return `arrow-button arrow-${this.type()} arrow-${this.orientation()} arrow-${this.size()} `;
  }
}
