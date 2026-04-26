import { Component, input, output } from '@angular/core';

export type TIconType = 'trash' | 'edit' | 'close' | 'full-screen';

@Component({
  selector: 'hercules-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
})
export class IconComponent {
  public readonly iconType = input<TIconType>('edit');
  protected readonly iconClick = output<void>();

  public onClick() {
    this.iconClick.emit();
  }
}
