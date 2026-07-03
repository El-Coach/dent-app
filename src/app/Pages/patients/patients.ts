import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { PatientService, Patient, PatientAppointmentData } from '../../core/services/patient.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { AppointmentService, Appointment, ServiceOption } from '../../core/services/appointment.service';
import { FinancialService, Invoice } from '../../core/services/financial.service';
import { LabService, Lab, LabOrder, LabPayment } from '../../core/services/lab.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-patients',
  imports: [
    FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, TableModule,
    InputTextModule, TextareaModule, DatePickerModule, SelectModule,
    InputNumberModule, CardModule, TagModule, CurrencyPipe, DatePipe,
    TranslatePipe,
  ],
  templateUrl: './patients.html',
  styleUrl: './patients.scss',
})
export class Patients implements OnInit, OnDestroy {
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  labs: Lab[] = [];
  displayDialog = false;
  patientForm: FormGroup;
  selectedPatient: Patient | null = null;
  searchQuery = '';

  displayStatement = false;
  statementPatient: Patient | null = null;
  patientInvoices: Invoice[] = [];
  totalBilled = 0;
  totalPaid = 0;
  totalDebt = 0;

  serviceOptions: ServiceOption[] = [];
  existingPendingAppointmentIds: number[] = [];
  labOrders: LabOrder[] = [];
  labPayments: LabPayment[] = [];
  displayLabPaymentDialog = false;
  selectedLabForPayment: Lab | null = null;
  labPaymentAmount: number = 0;

  get allTimeSlots(): string[] {
    return this.appointmentService.allTimeSlots;
  }

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private financialService: FinancialService,
    private labService: LabService,
    private cdr: ChangeDetectorRef,
  ) {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      age: [null],
      phone: ['', Validators.required],
      registrationDate: [new Date()],
      notes: [''],
      appointmentDate: [null],
      timeSlot: [''],
      services: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.sub.add(
      this.patientService.patients$.subscribe(patients => {
        this.patients = patients;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.doctorService.doctors$.subscribe(doctors => {
        this.doctors = doctors;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.labService.labs$.subscribe(labs => {
        this.labs = labs;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.appointmentService.services$.subscribe(services => {
        this.serviceOptions = services;
      })
    );

    this.sub.add(
      this.labService.labOrders$.subscribe(orders => {
        this.labOrders = orders;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.labService.labPayments$.subscribe(payments => {
        this.labPayments = payments;
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

  get servicesFormArray(): FormArray {
    return this.patientForm.get('services') as FormArray;
  }

  createServiceGroup(docId?: number, svcName?: string): FormGroup {
    return this.fb.group({
      doctorId: [docId || null],
      serviceName: [svcName || ''],
    });
  }

  addServiceRow() {
    this.servicesFormArray.push(this.createServiceGroup());
  }

  removeServiceRow(index: number) {
    this.servicesFormArray.removeAt(index);
  }

  getServicePrice(serviceName: string): number {
    const opt = this.serviceOptions.find(o => o.name === serviceName);
    return opt?.price || 0;
  }

  get filteredPatients(): Patient[] {
    if (!this.searchQuery) return this.patients;
    const q = this.searchQuery.toLowerCase();
    return this.patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.phone.includes(q)
    );
  }

  openNewDialog() {
    this.selectedPatient = null;
    this.existingPendingAppointmentIds = [];
    this.patientForm.reset({ registrationDate: new Date() });
    this.servicesFormArray.clear();
    this.addServiceRow();
    this.displayDialog = true;
  }

  openEditDialog(patient: Patient) {
    this.selectedPatient = patient;
    this.patientForm.patchValue({
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      registrationDate: new Date(patient.registrationDate),
      notes: patient.notes,
    });

    this.servicesFormArray.clear();
    const pendingAppts = this.appointmentService.getAppointments().filter(
      a => a.patientId === patient.id && a.status === 'انتظار'
    );
    this.existingPendingAppointmentIds = pendingAppts.map(a => a.id);

    const allServices = pendingAppts.flatMap(a => a.services);
    if (allServices.length > 0) {
      for (const svc of allServices) {
        this.servicesFormArray.push(this.createServiceGroup(svc.doctorId, svc.serviceName));
      }
      this.patientForm.patchValue({
        appointmentDate: pendingAppts[0].appointmentDate,
        timeSlot: pendingAppts[0].timeSlot,
      });
    } else {
      this.addServiceRow();
    }

    this.displayDialog = true;
  }

  savePatient() {
    if (this.patientForm.invalid) return;

    const fv = this.patientForm.value;

    if (this.selectedPatient) {
      this.patientService.updatePatient({
        ...this.selectedPatient,
        name: fv.name,
        age: fv.age,
        phone: fv.phone,
        registrationDate: fv.registrationDate || new Date(),
        notes: fv.notes,
      });

      const rawServices = fv.services || [];
      const validServices = rawServices.filter((s: any) => s.doctorId && s.serviceName);

      const existingPending = this.appointments.filter(a =>
        this.existingPendingAppointmentIds.includes(a.id)
      );

      if (existingPending.length > 0) {
        if (validServices.length > 0) {
          const updatedServices = validServices.map((s: any) => ({
            doctorId: s.doctorId,
            doctorName: this.doctors.find(d => d.id === s.doctorId)?.name || '',
            serviceName: s.serviceName,
            price: this.getServicePrice(s.serviceName),
            status: 'انتظار' as const,
          }));
          this.appointmentService.updateAppointment({
            ...existingPending[0],
            services: updatedServices,
          });
        }
        for (let i = 1; i < existingPending.length; i++) {
          const cancelled = { ...existingPending[i], status: 'ملغي' as const };
          this.appointmentService.updateAppointment(cancelled);
          this.financialService.voidInvoiceForAppointment(existingPending[i].id);
        }
      } else if (validServices.length > 0 && fv.appointmentDate && fv.timeSlot) {
        this.appointmentService.addAppointment({
          patientId: this.selectedPatient.id,
          patientName: this.selectedPatient.name,
          services: validServices.map((s: any) => ({
            doctorId: s.doctorId,
            doctorName: this.doctors.find(d => d.id === s.doctorId)?.name || '',
            serviceName: s.serviceName,
            price: this.getServicePrice(s.serviceName),
            status: 'انتظار' as const,
          })),
          appointmentDate: fv.appointmentDate,
          timeSlot: fv.timeSlot,
          status: 'انتظار',
          isEmergency: false,
          notes: '',
        });
      }
    } else {
      const rawServices = fv.services || [];
      const validServices = rawServices.filter((s: any) => s.doctorId && s.serviceName);

      let appointmentData: PatientAppointmentData | undefined;
      if (validServices.length > 0 && fv.appointmentDate && fv.timeSlot) {
        appointmentData = {
          services: validServices,
          appointmentDate: fv.appointmentDate,
          timeSlot: fv.timeSlot,
        };
      }

      this.patientService.addPatient(
        {
          name: fv.name,
          age: fv.age,
          phone: fv.phone,
          registrationDate: fv.registrationDate || new Date(),
          notes: fv.notes,
        },
        appointmentData,
      );
    }

    this.displayDialog = false;
    this.patientForm.reset({ registrationDate: new Date() });
    this.servicesFormArray.clear();
    this.existingPendingAppointmentIds = [];
  }

  openStatement(patient: Patient) {
    this.statementPatient = patient;
    this.patientInvoices = this.financialService.getInvoices().filter(i => i.patientId === patient.id);
    this.totalBilled = this.patientInvoices.reduce((s, i) => s + i.totalAmount, 0);
    this.totalPaid = this.patientInvoices.reduce((s, i) => s + i.paidAmount, 0);
    this.totalDebt = this.patientInvoices.reduce((s, i) => s + i.remainingAmount, 0);
    this.displayStatement = true;
  }

  getPatientLabOrders(patientId: number): LabOrder[] {
    return this.labOrders.filter(o => o.patientId === patientId);
  }

  openLabPaymentDialog(patient: Patient) {
    this.statementPatient = patient;
    const patientLabIds = [...new Set(this.labOrders.filter(o => o.patientId === patient.id).map(o => o.labId))];
    this.selectedLabForPayment = patientLabIds.length > 0 ? this.labs.find(l => l.id === patientLabIds[0]) || null : null;
    this.labPaymentAmount = 0;
    this.displayLabPaymentDialog = true;
  }

  confirmLabPayment() {
    if (!this.statementPatient || !this.selectedLabForPayment || !this.labPaymentAmount || this.labPaymentAmount <= 0) return;
    const lab = this.selectedLabForPayment;

    this.financialService.addExpense({
      description: `تجنيد وعزل كاش في ظرف معمل ${lab.name} - ${this.statementPatient.name}`,
      amount: this.labPaymentAmount,
      category: 'مصروفات معامل',
      date: new Date(),
    });

    this.labService.addLabPayment({
      labId: lab.id,
      labName: lab.name,
      patientId: this.statementPatient.id,
      patientName: this.statementPatient.name,
      amount: this.labPaymentAmount,
      date: new Date(),
    });

    this.displayLabPaymentDialog = false;
    this.labPaymentAmount = 0;
    this.selectedLabForPayment = null;
  }

  getPatientLabPayments(patientId: number): LabPayment[] {
    return this.labPayments.filter(p => p.patientId === patientId);
  }

  private get appointments(): Appointment[] {
    return this.appointmentService.getAppointments();
  }
}
