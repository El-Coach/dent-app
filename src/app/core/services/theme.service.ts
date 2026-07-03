import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(this.getInitialTheme());
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    this.applyTheme(this.darkMode.value);
  }

  get isDark(): boolean {
    return this.darkMode.value;
  }

  get currentTheme(): ThemeMode {
    return this.darkMode.value ? 'dark' : 'light';
  }

  toggleTheme(): void {
    const newValue = !this.darkMode.value;
    this.darkMode.next(newValue);
    localStorage.setItem('dent-theme', newValue ? 'dark' : 'light');
    this.applyTheme(newValue);
  }

  setTheme(theme: ThemeMode): void {
    const isDark = theme === 'dark';
    this.darkMode.next(isDark);
    localStorage.setItem('dent-theme', theme);
    this.applyTheme(isDark);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem('dent-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
