import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MatIconModule } from '@angular/material/icon';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { interval, Observable, map } from 'rxjs';
import { PatientService, Patient } from '../../core/services/patient.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { FinancialService, Invoice } from '../../core/services/financial.service';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';

interface SearchResult {
  typeKey: string;
  type: string;
  label: string;
  subLabel: string;
  route: string;
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MatIconModule,
    TooltipModule,
    TranslatePipe,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  liveTime: Observable<Date> = interval(1000).pipe(map(() => new Date()));

  searchQuery = '';
  searchResults: SearchResult[] = [];
  showSearchResults = false;
  isDark = false;
  isRtl = true;
  currentLang = 'ar';

  private subs: Subscription = new Subscription();

  constructor(
    private router: Router,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private financialService: FinancialService,
    public languageService: LanguageService,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.subs.add(
      this.themeService.darkMode$.subscribe(dark => {
        this.isDark = dark;
      })
    );
    this.subs.add(
      this.languageService.currentLang$.subscribe(lang => {
        this.isRtl = lang === 'ar';
        this.currentLang = lang;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    this.languageService.toggleLang();
  }

  onSearchInput() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    const results: SearchResult[] = [];
    const typeKey = this.currentLang === 'ar' ? 'مريض' : 'Patient';
    const typeKeyDr = this.currentLang === 'ar' ? 'دكتور' : 'Doctor';
    const typeKeyInv = this.currentLang === 'ar' ? 'فاتورة' : 'Invoice';
    const currency = this.currentLang === 'ar' ? 'جنيه' : 'EGP';

    const patients: Patient[] = this.patientService.getPatients();
    for (const p of patients) {
      if (p.name.toLowerCase().includes(q) || p.phone.includes(q)) {
        results.push({
          typeKey: 'PATIENTS.TITLE',
          type: typeKey,
          label: p.name,
          subLabel: p.phone,
          route: '/patients',
          queryParams: { search: p.name },
        });
      }
    }

    const doctors: Doctor[] = this.doctorService.getDoctors();
    for (const d of doctors) {
      if (d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)) {
        results.push({
          typeKey: 'DOCTORS.TITLE',
          type: typeKeyDr,
          label: d.name,
          subLabel: d.specialty,
          route: '/doctors',
          queryParams: { search: d.name },
        });
      }
    }

    const invoices: Invoice[] = this.financialService.getInvoices();
    for (const inv of invoices) {
      if (inv.patientName.toLowerCase().includes(q)) {
        results.push({
          typeKey: 'BILLING.TITLE',
          type: typeKeyInv,
          label: inv.patientName,
          subLabel: `${inv.totalAmount} ${currency}`,
          route: '/billing',
          queryParams: { search: inv.patientName },
        });
      }
    }

    this.searchResults = results.slice(0, 10);
    this.showSearchResults = results.length > 0;
  }

  selectResult(result: SearchResult) {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.router.navigate([result.route], { queryParams: result.queryParams });
  }

  onSearchBlur() {
    setTimeout(() => (this.showSearchResults = false), 200);
  }

  onSearchFocus() {
    if (this.searchResults.length > 0) {
      this.showSearchResults = true;
    }
  }
}
