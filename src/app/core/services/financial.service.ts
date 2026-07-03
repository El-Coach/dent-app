import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Appointment, AppointmentServiceDetail } from './appointment.service';

export interface PaymentTransaction {
  amount: number;
  date: Date;
}

export interface Invoice {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  services: AppointmentServiceDetail[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'مدفوع بالكامل' | 'مدفوع جزئياً' | 'غير مدفوع';
  date: Date;
  payments: PaymentTransaction[];
  archived: boolean;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: 'مرتبات' | 'خامات أسنان' | 'فواتير' | 'مصروفات معامل' | 'أخرى';
  date: Date;
  archived: boolean;
}

export interface SafeClosure {
  id: number;
  closureDate: Date;
  totalRevenue: number;
  generalExpenses: number;
  labExpenses: number;
  totalExpenses: number;
  netAmount: number;
  remainingFloat: number;
  invoicesCount: number;
  expensesCount: number;
}

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  invoices$: Observable<Invoice[]> = this.invoicesSubject.asObservable();

  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$: Observable<Expense[]> = this.expensesSubject.asObservable();

  private safeClosuresSubject = new BehaviorSubject<SafeClosure[]>([]);
  safeClosures$: Observable<SafeClosure[]> = this.safeClosuresSubject.asObservable();

  private remainingFloatSubject = new BehaviorSubject<number>(0);
  remainingFloat$: Observable<number> = this.remainingFloatSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    const today = new Date();
    const invoices: Invoice[] = [
      {
        id: 1, appointmentId: 3, patientId: 3, patientName: 'خالد عمر',
        services: [{ doctorId: 2, doctorName: 'د. سارة خالد', serviceName: 'كشف جديد', price: 300, status: 'انتهى' }],
        totalAmount: 300, paidAmount: 0, remainingAmount: 300, status: 'غير مدفوع', date: new Date(),
        payments: [], archived: false,
      },
      {
        id: 2, appointmentId: 5, patientId: 5, patientName: 'يوسف إبراهيم',
        services: [{ doctorId: 3, doctorName: 'د. محمد علي', serviceName: 'كشف جديد', price: 300, status: 'انتهى' }],
        totalAmount: 300, paidAmount: 300, remainingAmount: 0, status: 'مدفوع بالكامل', date: new Date(),
        payments: [{ amount: 300, date: new Date() }], archived: false,
      },
      {
        id: 3, appointmentId: 7, patientId: 2, patientName: 'سارة علي',
        services: [{ doctorId: 3, doctorName: 'د. محمد علي', serviceName: 'استشارة', price: 50, status: 'انتهى' }],
        totalAmount: 50, paidAmount: 30, remainingAmount: 20, status: 'مدفوع جزئياً', date: new Date(),
        payments: [{ amount: 30, date: new Date() }], archived: false,
      },
    ];
    this.invoicesSubject.next(invoices);

    const expenses: Expense[] = [
      { id: 1, description: 'مرتبات الأطباء', amount: 5000, category: 'مرتبات', date: new Date(), archived: false },
      { id: 2, description: 'شراء خامات', amount: 2000, category: 'خامات أسنان', date: new Date(), archived: false },
      { id: 3, description: 'فاتورة كهرباء', amount: 800, category: 'فواتير', date: new Date('2025-05-15'), archived: false },
    ];
    this.expensesSubject.next(expenses);
  }

  private nextInvoiceId(): number {
    const current = this.invoicesSubject.value;
    return current.length > 0 ? Math.max(...current.map(i => i.id)) + 1 : 1;
  }

  private nextExpenseId(): number {
    const current = this.expensesSubject.value;
    return current.length > 0 ? Math.max(...current.map(e => e.id)) + 1 : 1;
  }

  private nextClosureId(): number {
    const current = this.safeClosuresSubject.value;
    return current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 1;
  }

  getInvoices(): Invoice[] {
    return this.invoicesSubject.value;
  }

  getExpenses(): Expense[] {
    return this.expensesSubject.value;
  }

  generateInvoice(appointment: Appointment): Invoice {
    const existing = this.invoicesSubject.value.find(i => i.appointmentId === appointment.id);
    if (existing) return existing;

    const totalAmount = appointment.services.reduce((sum, s) => sum + s.price, 0);

    const invoice: Invoice = {
      id: this.nextInvoiceId(),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      services: [...appointment.services],
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'غير مدفوع',
      date: new Date(),
      payments: [],
      archived: false,
    };
    this.invoicesSubject.next([...this.invoicesSubject.value, invoice]);
    return invoice;
  }

  generateInvoiceForService(appointment: Appointment, serviceIndex: number): Invoice {
    const service = appointment.services[serviceIndex];
    const invoice: Invoice = {
      id: this.nextInvoiceId(),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      services: [{ ...service, status: 'انتهى' }],
      totalAmount: service.price,
      paidAmount: 0,
      remainingAmount: service.price,
      status: 'غير مدفوع',
      date: new Date(),
      payments: [],
      archived: false,
    };
    this.invoicesSubject.next([...this.invoicesSubject.value, invoice]);
    return invoice;
  }

  voidInvoiceForAppointment(appointmentId: number): void {
    const filtered = this.invoicesSubject.value.filter(i => i.appointmentId !== appointmentId);
    this.invoicesSubject.next(filtered);
  }

  payInvoice(invoiceId: number, amount: number): void {
    const current: Invoice[] = this.invoicesSubject.value.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const paid = inv.paidAmount + amount;
      const remaining = Math.max(0, inv.totalAmount - paid);
      const status: 'مدفوع بالكامل' | 'مدفوع جزئياً' | 'غير مدفوع' =
        remaining <= 0 ? 'مدفوع بالكامل' : paid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
      return {
        ...inv,
        paidAmount: paid,
        remainingAmount: remaining,
        status,
        payments: [...inv.payments, { amount, date: new Date() }],
      };
    });
    this.invoicesSubject.next(current);
  }

  addExpense(data: Omit<Expense, 'id' | 'archived'>): Expense {
    const expense: Expense = { id: this.nextExpenseId(), archived: false, ...data };
    this.expensesSubject.next([...this.expensesSubject.value, expense]);
    return expense;
  }

  // === SAFE CLOSURE ===

  closeAndResetSafe(remainingFloat: number): SafeClosure {
    const allInvoices = this.invoicesSubject.value;
    const allExpenses = this.expensesSubject.value;

    const activeInvoices = allInvoices.filter(i => !i.archived);
    const activeExpenses = allExpenses.filter(e => !e.archived);

    const totalRevenue = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalExpensesAmount = activeExpenses.reduce((s, e) => s + e.amount, 0);
    const generalExpenses = activeExpenses.filter(e => e.category !== 'مصروفات معامل').reduce((s, e) => s + e.amount, 0);
    const labExpenses = activeExpenses.filter(e => e.category === 'مصروفات معامل').reduce((s, e) => s + e.amount, 0);

    const closure: SafeClosure = {
      id: this.nextClosureId(),
      closureDate: new Date(),
      totalRevenue,
      generalExpenses,
      labExpenses,
      totalExpenses: totalExpensesAmount,
      netAmount: totalRevenue - totalExpensesAmount,
      remainingFloat,
      invoicesCount: activeInvoices.length,
      expensesCount: activeExpenses.length,
    };

    const archivedInvoices = allInvoices.map(i => i.archived ? i : { ...i, archived: true });
    const archivedExpenses = allExpenses.map(e => e.archived ? e : { ...e, archived: true });

    this.invoicesSubject.next(archivedInvoices);
    this.expensesSubject.next(archivedExpenses);
    this.safeClosuresSubject.next([...this.safeClosuresSubject.value, closure]);
    this.remainingFloatSubject.next(remainingFloat);

    return closure;
  }
}
