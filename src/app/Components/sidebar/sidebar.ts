import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

interface NavItem {
  icon: string;
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    TooltipModule,
    TranslatePipe,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit, OnDestroy {
  isExpanded = false;
  isRtl = true;

  navItems: NavItem[] = [
    { icon: 'dashboard', labelKey: 'NAV.HOME', route: '/dashboard' },
    { icon: 'person', labelKey: 'NAV.PATIENTS', route: '/patients' },
    { icon: 'medical_services', labelKey: 'NAV.DOCTORS', route: '/doctors' },
    { icon: 'calendar_month', labelKey: 'NAV.APPOINTMENTS', route: '/appointments' },
    { icon: 'payments', labelKey: 'NAV.BILLING', route: '/billing' },
    { icon: 'biotech', labelKey: 'NAV.LABS', route: '/labs-ledger' },
  ];

  bottomItems: NavItem[] = [
    { icon: 'settings', labelKey: 'NAV.SETTINGS', route: '/settings' },
  ];

  private langSub!: Subscription;

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.langSub = this.languageService.currentLang$.subscribe(lang => {
      this.isRtl = lang === 'ar';
    });
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  onmouseenter() {
    this.isExpanded = true;
  }

  onmouseleave() {
    this.isExpanded = false;
  }

  getTooltip(item: NavItem): string {
    return this.languageService.currentLangValue === 'ar'
      ? this.getArabicLabel(item.labelKey)
      : item.labelKey.split('.').pop() || '';
  }

  private getArabicLabel(key: string): string {
    const labels: Record<string, string> = {
      'NAV.HOME': 'الرئيسية',
      'NAV.DOCTORS': 'الأطباء',
      'NAV.APPOINTMENTS': 'المواعيد',
      'NAV.PATIENTS': 'المرضى',
      'NAV.BILLING': 'المحاسبة',
      'NAV.LABS': 'المعامل',
      'NAV.SETTINGS': 'الإعدادات',
    };
    return labels[key] || key;
  }
}
