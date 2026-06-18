import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HercTextDirective } from '../shared/directives/text.directive';

@Component({
  selector: 'hercules-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HercTextDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {}
