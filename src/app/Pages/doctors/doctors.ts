import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { PatientService, Patient } from '../../core/services/patient.service';
import { AppointmentService, AppointmentServiceDetail } from '../../core/services/appointment.service';
import { FinancialService, Invoice, Expense } from '../../core/services/financial.service';

interface DoctorServiceEntry extends AppointmentServiceDetail {
  patientId: number;
  patientName: string;
  invoiceDate: Date;
}

@Component({
  selector: 'app-doctors',
  imports: [
    CardModule, TableModule, TagModule, DialogModule,
    ButtonModule, TabsModule, MessageModule, CurrencyPipe, DatePipe,
    TranslatePipe,
  ],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss',
})
export class Doctors implements OnInit, OnDestroy {
  doctors: Doctor[] = [];
  searchQuery = '';
  displayProfile = false;
  selectedDoctor: Doctor | null = null;
  doctorServices: DoctorServiceEntry[] = [];
  totalRevenue = 0;
  doctorShare = 0;
  completedCount = 0;

  payoutDone = false;

  displayPatientInfo = false;
  selectedPatient: Patient | null = null;
  patientInvoices: Invoice[] = [];
  patientTotalBilled = 0;
  patientTotalPaid = 0;
  patientTotalDebt = 0;

  private sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private financialService: FinancialService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sub.add(
      this.doctorService.doctors$.subscribe(doctors => {
        this.doctors = doctors;
      })
    );
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get filteredDoctors(): Doctor[] {
    if (!this.searchQuery) return this.doctors;
    const q = this.searchQuery.toLowerCase();
    return this.doctors.filter(d =>
      d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)
    );
  }

  openProfile(doctor: Doctor) {
    this.selectedDoctor = doctor;
    this.payoutDone = false;

    const allInvoices = this.financialService.getInvoices();
    this.doctorServices = [];
    this.totalRevenue = 0;
    this.completedCount = 0;

    for (const inv of allInvoices) {
      const doctorSvc = inv.services.filter(s => s.doctorId === doctor.id);
      for (const svc of doctorSvc) {
        this.doctorServices.push({
          ...svc,
          patientId: inv.patientId,
          patientName: inv.patientName,
          invoiceDate: inv.date,
        });
        this.totalRevenue += svc.price;
        this.completedCount++;
      }
    }

    this.doctorShare = this.totalRevenue * (doctor.doctorSharePercentage / 100);
    this.displayProfile = true;
  }

  openPatientInfo(patientId: number) {
    const patient = this.patientService.getPatients().find(p => p.id === patientId);
    if (!patient) return;
    this.selectedPatient = patient;
    this.patientInvoices = this.financialService.getInvoices().filter(i => i.patientId === patientId);
    this.patientTotalBilled = this.patientInvoices.reduce((s, i) => s + i.totalAmount, 0);
    this.patientTotalPaid = this.patientInvoices.reduce((s, i) => s + i.paidAmount, 0);
    this.patientTotalDebt = this.patientInvoices.reduce((s, i) => s + i.remainingAmount, 0);
    this.displayPatientInfo = true;
  }

  doctorPayout(doctor: Doctor) {
    if (this.totalRevenue <= 0) return;
    this.financialService.addExpense({
      description: `صرف مستحقات دكتور ${doctor.name}`,
      amount: this.doctorShare,
      category: 'مرتبات',
      date: new Date(),
    });
    this.payoutDone = true;
    this.totalRevenue = 0;
    this.doctorShare = 0;
    this.completedCount = 0;
    this.doctorServices = [];
    this.cdr.detectChanges();
  }
}
