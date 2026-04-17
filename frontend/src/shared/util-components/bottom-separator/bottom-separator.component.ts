import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { HercTextDirective } from '../../directives/text.directive';
import { HercRowResizeDirective } from '../../directives/row-resize.directive';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'hercules-bottom-separator',
  templateUrl: './bottom-separator.component.html',
  styleUrls: ['./bottom-separator.component.css'],
  imports: [HercTextDirective, HercRowResizeDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HercBottomSeparatorComponent {
  protected readonly currHeight = signal('30px');
  public readonly label = input<string>('');

  protected get mainClasses() {
    return `messages`;
  }

  protected toggle(): void {}

  protected changeHeight(height: number) {
    this.currHeight.set(`${height}px`);
  }

  protected setBottomZone() {
    this.currHeight.set('30px');
  }

  protected setTopZone() {
    this.currHeight.set('100%');
  }
}
