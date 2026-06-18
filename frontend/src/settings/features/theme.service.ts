import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { type ThemeMode } from './theme.model';

const STORAGE_KEY = 'hercules-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<ThemeMode>(this.loadTheme());

  constructor() {
    effect(() => {
      const mode = this.theme();
      localStorage.setItem(STORAGE_KEY, mode);
      this.applyTheme(mode);
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (this.theme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  private loadTheme(): ThemeMode {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }

    return 'dark';
  }

  private applyTheme(mode: ThemeMode): void {
    const isLight = mode === 'light' || (mode === 'system' && this.isSystemLight());
    this.document.body.classList.toggle('theme-light', isLight);
  }

  private isSystemLight(): boolean {
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  }
}
