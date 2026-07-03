import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, combineLatest } from 'rxjs';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService, Appointment } from '../../core/services/appointment.service';
import { FinancialService, Invoice, Expense } from '../../core/services/financial.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatIconModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  totalPatients = 0;
  totalDoctors = 0;
  todayAppointments: Appointment[] = [];
  todayInvoices: Invoice[] = [];
  todayExpenses: Expense[] = [];
  totalIncomes = 0;
  totalExpensesAmount = 0;
  netProfit = 0;
  waitingCount = 0;
  inClinicCount = 0;
  completedCount = 0;
  todayDate = new Date();
  remainingFloat = 0;

  currentPatient: Appointment | null = null;
  nextPatient: Appointment | null = null;

  private sub = new Subscription();

  constructor(
    private patientService: PatientService,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private financialService: FinancialService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sub = combineLatest([
      this.patientService.patients$,
      this.doctorService.doctors$,
      this.appointmentService.appointments$,
      this.financialService.invoices$,
      this.financialService.expenses$,
      this.financialService.remainingFloat$,
    ]).subscribe(([patients, doctors, appointments, invoices, expenses, remainingFloat]) => {
      this.totalPatients = patients.length;
      this.totalDoctors = doctors.length;
      const today = new Date();
      this.todayAppointments = appointments.filter(a => this.isSameDay(a.appointmentDate, today));
      this.waitingCount = this.todayAppointments.filter(a => a.status === 'انتظار').length;
      this.inClinicCount = this.todayAppointments.filter(a => a.status === 'داخل للدكتور').length;
      this.completedCount = this.todayAppointments.filter(a => a.status === 'انتهى').length;

      const activeInvoices = invoices.filter(i => !i.archived);
      const activeExpenses = expenses.filter(e => !e.archived);
      this.todayInvoices = activeInvoices.filter(i => this.isSameDay(i.date, today));
      this.todayExpenses = activeExpenses.filter(e => this.isSameDay(e.date, today));
      this.totalIncomes = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
      this.totalExpensesAmount = activeExpenses.reduce((s, e) => s + e.amount, 0);
      this.netProfit = this.totalIncomes - this.totalExpensesAmount;
      this.remainingFloat = remainingFloat;

      const inClinic = this.todayAppointments
        .filter(a => a.status === 'داخل للدكتور')
        .sort((a, b) => a.ticketNumber - b.ticketNumber);
      this.currentPatient = inClinic.length > 0 ? inClinic[0] : null;

      const waiting = this.todayAppointments
        .filter(a => a.status === 'انتظار')
        .sort((a, b) => a.ticketNumber - b.ticketNumber);
      this.nextPatient = waiting.length > 0 ? waiting[0] : null;

      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }
}
