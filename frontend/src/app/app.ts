import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../navigation/header/header.component';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../settings/features/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }
}
