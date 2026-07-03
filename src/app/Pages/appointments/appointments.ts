import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { PatientService, Patient } from '../../core/services/patient.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { AppointmentService, Appointment, AppointmentServiceDetail, ServiceOption } from '../../core/services/appointment.service';
import { FinancialService } from '../../core/services/financial.service';

@Component({
  selector: 'app-appointments',
  imports: [
    FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, TableModule,
    SelectModule, DatePickerModule, TagModule, CardModule, ToggleSwitchModule,
    InputTextModule, CurrencyPipe, DatePipe, TranslatePipe,
  ],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class Appointments implements OnInit, OnDestroy {
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  selectedDoctorId: number | null = null;
  filterDate: Date = new Date();
  displayDialog = false;
  appointmentForm: FormGroup;
  availableTimeSlots: string[] = [];
  isEditing = false;
  editingAppointmentId: number | null = null;

  waitingCount = 0;
  inClinicCount = 0;
  totalAppointmentsForDay = 0;
  serviceOptions: ServiceOption[] = [];

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private financialService: FinancialService,
    private cdr: ChangeDetectorRef,
  ) {
    this.appointmentForm = this.fb.group({
      patientId: [null, Validators.required],
      appointmentDate: [new Date(), Validators.required],
      timeSlot: ['', Validators.required],
      services: this.fb.array([]),
      isEmergency: [false],
      notes: [''],
    });
  }

  ngOnInit() {
    this.sub.add(
      this.doctorService.doctors$.subscribe(doctors => {
        this.doctors = doctors;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.appointmentService.appointments$.subscribe(appointments => {
        this.appointments = appointments;
        this.applyFilters();
        this.updateStats();
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.patientService.patients$.subscribe(patients => {
        this.patients = patients;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.appointmentService.services$.subscribe(services => {
        this.serviceOptions = services;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.appointmentForm.get('appointmentDate')!.valueChanges.subscribe(() => {
        this.updateAvailableSlots();
      })
    );

    this.sub.add(
      this.appointmentForm.get('services')?.valueChanges.subscribe(() => {
        this.updateAvailableSlots();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get servicesFormArray(): FormArray {
    return this.appointmentForm.get('services') as FormArray;
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

  getServicesTotal(): number {
    let total = 0;
    for (const ctrl of this.servicesFormArray.controls) {
      total += this.getServicePrice(ctrl.get('serviceName')?.value);
    }
    return total;
  }

  private updateStats() {
    const today = new Date();
    this.waitingCount = this.appointments.filter(a =>
      a.status === 'انتظار' && this.appointmentService.isSameDay(a.appointmentDate, today)
    ).length;
    this.inClinicCount = this.appointments.filter(a =>
      a.status === 'داخل للدكتور' && this.appointmentService.isSameDay(a.appointmentDate, today)
    ).length;
    this.totalAppointmentsForDay = this.appointments.filter(a =>
      this.appointmentService.isSameDay(a.appointmentDate, this.filterDate) && a.status !== 'ملغي'
    ).length;
  }

  private applyFilters() {
    let result = [...this.appointments];

    result = result.filter(a =>
      this.appointmentService.isSameDay(a.appointmentDate, this.filterDate)
    );

    if (this.selectedDoctorId) {
      result = result.filter(a =>
        a.services.some(s => s.doctorId === this.selectedDoctorId)
      );
    }

    this.filteredAppointments = result;
  }

  filterByDoctor(doctorId: number | null) {
    this.selectedDoctorId = doctorId;
    this.applyFilters();
  }

  onFilterDateChange() {
    this.applyFilters();
    this.updateStats();
  }

  getDoctorName(doctorId: number): string {
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : '';
  }

  getStatusSeverity(status: string): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
    return this.appointmentService.getServiceStatusSeverity(status as any);
  }

  buildServicesArray(): AppointmentServiceDetail[] {
    const result: AppointmentServiceDetail[] = [];
    for (const ctrl of this.servicesFormArray.controls) {
      const val = ctrl.value;
      if (val.doctorId && val.serviceName) {
        const doctor = this.doctors.find(d => d.id === val.doctorId);
        result.push({
          doctorId: val.doctorId,
          doctorName: doctor?.name || '',
          serviceName: val.serviceName,
          price: this.getServicePrice(val.serviceName),
          status: 'انتظار',
        });
      }
    }
    return result;
  }

  openNewDialog() {
    this.isEditing = false;
    this.editingAppointmentId = null;
    this.appointmentForm.reset({ appointmentDate: new Date(), isEmergency: false });
    this.servicesFormArray.clear();
    this.addServiceRow();
    this.updateAvailableSlots();
    this.displayDialog = true;
  }

  openRescheduleDialog(appointment: Appointment) {
    this.isEditing = true;
    this.editingAppointmentId = appointment.id;
    this.servicesFormArray.clear();
    for (const svc of appointment.services) {
      this.servicesFormArray.push(this.createServiceGroup(svc.doctorId, svc.serviceName));
    }
    if (this.servicesFormArray.length === 0) this.addServiceRow();
    this.appointmentForm.patchValue({
      patientId: appointment.patientId,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      isEmergency: appointment.isEmergency,
      notes: appointment.notes,
    });
    this.updateAvailableSlots(appointment.id);
    this.displayDialog = true;
  }

  private updateAvailableSlots(excludeAppointmentId?: number) {
    const isEmergency = this.appointmentForm.get('isEmergency')?.value;
    if (isEmergency) {
      this.availableTimeSlots = this.appointmentService.allTimeSlots;
      return;
    }
    const date = this.appointmentForm.get('appointmentDate')?.value;
    if (date) {
      this.availableTimeSlots = this.appointmentService.getAvailableTimeSlots(date, excludeAppointmentId);
    } else {
      this.availableTimeSlots = this.appointmentService.allTimeSlots;
    }
    const currentSlot = this.appointmentForm.get('timeSlot')?.value;
    if (currentSlot && !this.availableTimeSlots.includes(currentSlot)) {
      this.appointmentForm.patchValue({ timeSlot: '' });
    }
  }

  onEmergencyToggle() {
    this.updateAvailableSlots(this.editingAppointmentId ?? undefined);
  }

  saveAppointment() {
    if (this.appointmentForm.invalid) return;

    const fv = this.appointmentForm.value;
    const services = this.buildServicesArray();

    if (this.isEditing && this.editingAppointmentId) {
      const existing = this.appointments.find(a => a.id === this.editingAppointmentId);
      if (existing) {
        const updated: Appointment = {
          ...existing,
          patientId: fv.patientId,
          patientName: this.patients.find(p => p.id === fv.patientId)?.name || '',
          services,
          appointmentDate: fv.appointmentDate,
          timeSlot: fv.timeSlot,
          isEmergency: fv.isEmergency,
          notes: fv.notes,
        };
        this.appointmentService.updateAppointment(updated);
      }
    } else {
      const patient = this.patients.find(p => p.id === fv.patientId);
      this.appointmentService.addAppointment({
        patientId: fv.patientId,
        patientName: patient?.name || '',
        services,
        appointmentDate: fv.appointmentDate,
        timeSlot: fv.timeSlot,
        status: 'انتظار',
        isEmergency: fv.isEmergency,
        notes: fv.notes,
      });
    }

    this.displayDialog = false;
    this.appointmentForm.reset({ appointmentDate: new Date(), isEmergency: false });
    this.servicesFormArray.clear();
  }

  changeServiceStatus(id: number, serviceIndex: number, newStatus: 'داخل للدكتور' | 'انتهى' | 'ملغي') {
    this.appointmentService.updateServiceStatus(id, serviceIndex, newStatus);
    if (newStatus === 'انتهى') {
      const appointment = this.appointments.find(a => a.id === id);
      if (appointment) {
        this.financialService.generateInvoiceForService(appointment, serviceIndex);
      }
    }
  }

  cancelService(id: number, serviceIndex: number) {
    this.changeServiceStatus(id, serviceIndex, 'ملغي');
  }

  removeServiceFromAppointment(id: number, serviceIndex: number) {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment || appointment.services.length <= 1) return;
    const updatedServices = appointment.services.filter((_, i) => i !== serviceIndex);
    this.appointmentService.updateAppointment({ ...appointment, services: updatedServices });
  }

  changeServiceDoctor(id: number, serviceIndex: number, newDoctorId: number) {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment) return;
    const doctor = this.doctors.find(d => d.id === newDoctorId);
    const updatedServices = appointment.services.map((s, i) =>
      i === serviceIndex ? { ...s, doctorId: newDoctorId, doctorName: doctor?.name || '' } : s
    );
    this.appointmentService.updateAppointment({ ...appointment, services: updatedServices });
  }
}
