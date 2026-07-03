import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLang = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private currentLang = new BehaviorSubject<SupportedLang>(this.getInitialLang());

  currentLang$ = this.currentLang.asObservable();

  constructor() {
    this.translate.use(this.currentLang.value);
    this.applyDir(this.currentLang.value);
  }

  get currentLangValue(): SupportedLang {
    return this.currentLang.value;
  }

  get isRtl(): boolean {
    return this.currentLang.value === 'ar';
  }

  switchLang(lang: SupportedLang): void {
    this.translate.use(lang);
    this.currentLang.next(lang);
    localStorage.setItem('dent-lang', lang);
    this.applyDir(lang);
    document.documentElement.setAttribute('lang', lang);
  }

  toggleLang(): void {
    const newLang = this.currentLang.value === 'ar' ? 'en' : 'ar';
    this.switchLang(newLang);
  }

  private getInitialLang(): SupportedLang {
    const saved = localStorage.getItem('dent-lang') as SupportedLang;
    if (saved && (saved === 'ar' || saved === 'en')) return saved;
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ar' ? 'ar' : 'en';
  }

  private applyDir(lang: SupportedLang): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }
}
