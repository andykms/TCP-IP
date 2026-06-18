import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HercToggleButtonDirective } from '../../shared/directives/toggle-button.directive';
import { ThemeService } from '../features/theme.service';
import { type ThemeMode } from '../features/theme.model';

@Component({
  selector: 'hercules-interface-settings',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.css'],
  imports: [HercTextDirective, HercToggleButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly theme = this.themeService.theme;

  protected setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }
}
