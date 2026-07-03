import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FinancialService, Invoice, Expense } from '../../core/services/financial.service';

@Component({
  selector: 'app-billing',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, TableModule,
    CardModule, TagModule, InputTextModule, SelectModule,
    SelectButtonModule, DatePickerModule, TabsModule, MatIconModule, DatePipe, CurrencyPipe,
    TranslatePipe,
  ],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
})
export class Billing implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  expenses: Expense[] = [];
  filteredInvoices: Invoice[] = [];
  filteredExpenses: Expense[] = [];
  totalIncomes = 0;
  totalExpensesAmount = 0;
  netProfit = 0;

  selectedFilterDate: Date = new Date();
  filterMode: 'date' | 'month' = 'date';
  filterModeOptions = [
    { label: 'BILLING.DAY', value: 'date' },
    { label: 'BILLING.MONTH', value: 'month' },
  ];

  displayPaymentDialog = false;
  selectedInvoice: Invoice | null = null;
  paymentAmount = 0;

  displayExpenseDialog = false;
  expenseForm: FormGroup;
  categoryOptions: { label: string; value: string }[] = [];

  searchQuery = '';

  displayClosureDialog = false;
  closureRemainingFloat = 0;
  closureSummary = { openingBalance: 0, totalRevenue: 0, generalExpenses: 0, labExpenses: 0, totalExpenses: 0, netAmount: 0 };
  remainingFloat = 0;

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private financialService: FinancialService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      date: [new Date(), Validators.required],
    });
  }

  ngOnInit() {
    this.filterModeOptions = [
      { label: this.translate.instant('BILLING.DAY'), value: 'date' },
      { label: this.translate.instant('BILLING.MONTH'), value: 'month' },
    ];
    this.categoryOptions = [
      { label: this.translate.instant('CATEGORIES.SALARIES'), value: 'مرتبات' },
      { label: this.translate.instant('CATEGORIES.MATERIALS'), value: 'خامات أسنان' },
      { label: this.translate.instant('CATEGORIES.BILLS'), value: 'فواتير' },
      { label: this.translate.instant('CATEGORIES.LAB_EXPENSES'), value: 'مصروفات معامل' },
      { label: this.translate.instant('CATEGORIES.OTHER'), value: 'أخرى' },
    ];

    this.sub.add(
      this.financialService.invoices$.subscribe(invoices => {
        this.invoices = invoices;
        this.applyFilter();
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.financialService.expenses$.subscribe(expenses => {
        this.expenses = expenses;
        this.applyFilter();
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.financialService.remainingFloat$.subscribe(f => {
        this.remainingFloat = f;
        this.cdr.detectChanges();
      })
    );

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onFilterDateChange() {
    this.applyFilter();
  }

  onFilterModeChange() {
    this.applyFilter();
  }

  private applyFilter() {
    const activeInvoices = this.invoices.filter(i => !i.archived);
    const activeExpenses = this.expenses.filter(e => !e.archived);

    if (this.filterMode === 'date') {
      this.filteredInvoices = activeInvoices.filter(i => this.isSameDay(i.date, this.selectedFilterDate));
      this.filteredExpenses = activeExpenses.filter(e => this.isSameDay(e.date, this.selectedFilterDate));
    } else {
      this.filteredInvoices = activeInvoices.filter(i => this.isSameMonth(i.date, this.selectedFilterDate));
      this.filteredExpenses = activeExpenses.filter(e => this.isSameMonth(e.date, this.selectedFilterDate));
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      this.filteredInvoices = this.filteredInvoices.filter(i => i.patientName.toLowerCase().includes(q));
    }

    this.calculateStats();
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  private isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth();
  }

  openPaymentDialog(invoice: Invoice) {
    this.selectedInvoice = invoice;
    this.paymentAmount = invoice.remainingAmount;
    this.displayPaymentDialog = true;
  }

  confirmPayment() {
    if (!this.selectedInvoice || this.paymentAmount <= 0 || this.paymentAmount > this.selectedInvoice.remainingAmount) return;
    this.financialService.payInvoice(this.selectedInvoice.id, this.paymentAmount);
    this.displayPaymentDialog = false;
    this.selectedInvoice = null;
  }

  openExpenseDialog() {
    this.expenseForm.reset({ date: new Date() });
    this.displayExpenseDialog = true;
  }

  saveExpense() {
    if (this.expenseForm.invalid) return;
    const fv = this.expenseForm.value;
    this.financialService.addExpense({
      description: fv.description,
      amount: fv.amount,
      category: fv.category,
      date: fv.date || new Date(),
    });
    this.displayExpenseDialog = false;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'مدفوع بالكامل': return 'success';
      case 'مدفوع جزئياً': return 'warn';
      case 'غير مدفوع': return 'danger';
      default: return 'secondary';
    }
  }

  filterInput(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Tab' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      event.preventDefault();
    }
  }

  private calculateStats() {
    this.totalIncomes = this.filteredInvoices.reduce((s, i) => s + i.paidAmount, 0);
    this.totalExpensesAmount = this.filteredExpenses.reduce((s, e) => s + e.amount, 0);
    this.netProfit = this.totalIncomes - this.totalExpensesAmount;
  }

  openClosureDialog() {
    const activeInvoices = this.invoices.filter(i => !i.archived);
    const activeExpenses = this.expenses.filter(e => !e.archived);
    const totalRevenue = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalExpensesAmount = activeExpenses.reduce((s, e) => s + e.amount, 0);
    const generalExpenses = activeExpenses.filter(e => e.category !== 'مصروفات معامل').reduce((s, e) => s + e.amount, 0);
    const labExpenses = activeExpenses.filter(e => e.category === 'مصروفات معامل').reduce((s, e) => s + e.amount, 0);
    this.closureSummary = {
      openingBalance: this.remainingFloat,
      totalRevenue,
      generalExpenses,
      labExpenses,
      totalExpenses: totalExpensesAmount,
      netAmount: this.remainingFloat + totalRevenue - totalExpensesAmount,
    };
    this.closureRemainingFloat = 0;
    this.displayClosureDialog = true;
  }

  confirmClosure() {
    this.financialService.closeAndResetSafe(this.closureRemainingFloat);
    this.displayClosureDialog = false;
  }
}
