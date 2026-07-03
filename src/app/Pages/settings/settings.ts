import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AppointmentService, ServiceOption } from '../../core/services/appointment.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { LabService, Lab, LabServiceOption } from '../../core/services/lab.service';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule, ReactiveFormsModule, ButtonModule, DialogModule,
    TableModule, InputTextModule, TabsModule, SelectModule, CurrencyPipe,
    TranslatePipe,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit, OnDestroy {
  services: ServiceOption[] = [];
  doctors: Doctor[] = [];
  labs: Lab[] = [];
  labServiceOptions: LabServiceOption[] = [];

  displayServiceDialog = false;
  editingServiceIndex: number | null = null;
  serviceDialogTitle = '';
  serviceForm: FormGroup;

  displayDoctorDialog = false;
  editingDoctor: Doctor | null = null;
  doctorDialogTitle = '';
  doctorForm: FormGroup;

  displayLabDialog = false;
  editingLab: Lab | null = null;
  labDialogTitle = '';
  labForm: FormGroup;

  displayLabServiceOptionDialog = false;
  editingLabServiceOptionIndex: number | null = null;
  labServiceOptionDialogTitle = '';
  labServiceOptionForm: FormGroup;

  displayDeleteConfirmDialog = false;
  deleteTarget: { type: 'service' | 'doctor' | 'lab' | 'labServiceOption'; index?: number; id?: number; name: string } | null = null;
  deleteBlocked = false;

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private labService: LabService,
    private cdr: ChangeDetectorRef,
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
    });

    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      phone: [''],
      doctorSharePercentage: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    this.labForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
    });

    this.labServiceOptionForm = this.fb.group({
      serviceName: ['', Validators.required],
      costPrice: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.sub.add(
      this.appointmentService.services$.subscribe(services => {
        this.services = services;
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
      this.labService.labServiceOptions$.subscribe(options => {
        this.labServiceOptions = options;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  // === SERVICE CRUD ===

  openAddServiceDialog() {
    this.editingServiceIndex = null;
    this.serviceDialogTitle = 'SETTINGS.SERVICE_ADD';
    this.serviceForm.reset();
    this.displayServiceDialog = true;
  }

  openEditServiceDialog(index: number) {
    this.editingServiceIndex = index;
    this.serviceDialogTitle = 'SETTINGS.SERVICE_EDIT';
    const svc = this.services[index];
    this.serviceForm.patchValue({ name: svc.name, price: svc.price });
    this.displayServiceDialog = true;
  }

  confirmDeleteService(index: number) {
    const svc = this.services[index];
    const appointments = this.appointmentService.getAppointments();
    const active = appointments.filter(a =>
      (a.status === 'انتظار' || a.status === 'داخل للدكتور') &&
      a.services.some(s => s.serviceName === svc.name)
    );
    if (active.length > 0) {
      this.deleteTarget = { type: 'service', name: svc.name };
      this.deleteBlocked = true;
    } else {
      this.deleteTarget = { type: 'service', index, name: svc.name };
      this.deleteBlocked = false;
    }
    this.displayDeleteConfirmDialog = true;
  }

  confirmDeleteDoctor(doctorId: number) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) return;
    const appointments = this.appointmentService.getAppointments();
    const active = appointments.filter(a =>
      (a.status === 'انتظار' || a.status === 'داخل للدكتور') &&
      a.services.some(s => s.doctorId === doctorId)
    );
    if (active.length > 0) {
      this.deleteTarget = { type: 'doctor', id: doctorId, name: doctor.name };
      this.deleteBlocked = true;
    } else {
      this.deleteTarget = { type: 'doctor', id: doctorId, name: doctor.name };
      this.deleteBlocked = false;
    }
    this.displayDeleteConfirmDialog = true;
  }

  confirmDeleteLab(labId: number) {
    const lab = this.labs.find(l => l.id === labId);
    if (!lab) return;
    const orders = this.labService.getLabOrders().filter(o => o.labId === labId && o.status === 'قيد التصنيع');
    if (orders.length > 0) {
      this.deleteTarget = { type: 'lab', id: labId, name: lab.name };
      this.deleteBlocked = true;
    } else {
      this.deleteTarget = { type: 'lab', id: labId, name: lab.name };
      this.deleteBlocked = false;
    }
    this.displayDeleteConfirmDialog = true;
  }

  confirmDeleteLabServiceOption(index: number) {
    const opt = this.labServiceOptions[index];
    const orders = this.labService.getLabOrders().filter(o => o.serviceName === opt.serviceName && o.status === 'قيد التصنيع');
    if (orders.length > 0) {
      this.deleteTarget = { type: 'labServiceOption', name: opt.serviceName };
      this.deleteBlocked = true;
    } else {
      this.deleteTarget = { type: 'labServiceOption', index, name: opt.serviceName };
      this.deleteBlocked = false;
    }
    this.displayDeleteConfirmDialog = true;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    if (this.deleteTarget.type === 'service' && this.deleteTarget.index !== undefined) {
      this.appointmentService.removeService(this.deleteTarget.index);
    } else if (this.deleteTarget.type === 'doctor' && this.deleteTarget.id !== undefined) {
      this.doctorService.removeDoctor(this.deleteTarget.id);
    } else if (this.deleteTarget.type === 'lab' && this.deleteTarget.id !== undefined) {
      this.labService.removeLab(this.deleteTarget.id);
    } else if (this.deleteTarget.type === 'labServiceOption' && this.deleteTarget.index !== undefined) {
      this.labService.removeLabServiceOption(this.deleteTarget.index);
    }
    this.displayDeleteConfirmDialog = false;
    this.deleteTarget = null;
    this.deleteBlocked = false;
  }

  saveService() {
    if (this.serviceForm.invalid) return;
    const fv = this.serviceForm.value;
    const service: ServiceOption = { name: fv.name, price: fv.price };

    if (this.editingServiceIndex !== null) {
      this.appointmentService.updateService(this.editingServiceIndex, service);
    } else {
      this.appointmentService.addService(service);
    }

    this.displayServiceDialog = false;
    this.serviceForm.reset();
  }

  // === DOCTOR CRUD ===

  openAddDoctorDialog() {
    this.editingDoctor = null;
    this.doctorDialogTitle = 'SETTINGS.DOCTOR_ADD';
    this.doctorForm.reset({ doctorSharePercentage: 50 });
    this.displayDoctorDialog = true;
  }

  openEditDoctorDialog(doctor: Doctor) {
    this.editingDoctor = doctor;
    this.doctorDialogTitle = 'SETTINGS.DOCTOR_EDIT';
    this.doctorForm.patchValue({
      name: doctor.name,
      specialty: doctor.specialty,
      phone: doctor.phone,
      doctorSharePercentage: doctor.doctorSharePercentage,
    });
    this.displayDoctorDialog = true;
  }

  saveDoctor() {
    if (this.doctorForm.invalid) return;
    const fv = this.doctorForm.value;

    if (this.editingDoctor) {
      this.doctorService.updateDoctor({
        ...this.editingDoctor,
        name: fv.name,
        specialty: fv.specialty,
        phone: fv.phone || '',
        doctorSharePercentage: fv.doctorSharePercentage,
      });
    } else {
      this.doctorService.addDoctor({
        name: fv.name,
        specialty: fv.specialty,
        phone: fv.phone || '',
        doctorSharePercentage: fv.doctorSharePercentage,
        workingDays: [],
      });
    }

    this.displayDoctorDialog = false;
    this.editingDoctor = null;
    this.doctorForm.reset({ doctorSharePercentage: 50 });
  }

  updateDoctorPercentage(doctor: Doctor, percentage: number) {
    if (percentage < 0 || percentage > 100) return;
    this.doctorService.updateDoctor({ ...doctor, doctorSharePercentage: percentage });
  }

  // === LAB CRUD ===

  openAddLabDialog() {
    this.editingLab = null;
    this.labDialogTitle = 'SETTINGS.LAB_ADD';
    this.labForm.reset();
    this.displayLabDialog = true;
  }

  openEditLabDialog(lab: Lab) {
    this.editingLab = lab;
    this.labDialogTitle = 'SETTINGS.LAB_EDIT';
    this.labForm.patchValue({ name: lab.name, phone: lab.phone });
    this.displayLabDialog = true;
  }

  saveLab() {
    if (this.labForm.invalid) return;
    const fv = this.labForm.value;

    if (this.editingLab) {
      this.labService.updateLab({ ...this.editingLab, name: fv.name, phone: fv.phone || '' });
    } else {
      this.labService.addLab({ name: fv.name, phone: fv.phone || '', balance: 0 });
    }

    this.displayLabDialog = false;
    this.editingLab = null;
    this.labForm.reset();
  }

  // === LAB SERVICE OPTION CRUD ===

  openAddLabServiceOptionDialog() {
    this.editingLabServiceOptionIndex = null;
    this.labServiceOptionDialogTitle = 'SETTINGS.LAB_SERVICE_ADD';
    this.labServiceOptionForm.reset();
    this.displayLabServiceOptionDialog = true;
  }

  openEditLabServiceOptionDialog(index: number) {
    this.editingLabServiceOptionIndex = index;
    this.labServiceOptionDialogTitle = 'SETTINGS.LAB_SERVICE_EDIT';
    const opt = this.labServiceOptions[index];
    this.labServiceOptionForm.patchValue({ serviceName: opt.serviceName, costPrice: opt.costPrice });
    this.displayLabServiceOptionDialog = true;
  }

  saveLabServiceOption() {
    if (this.labServiceOptionForm.invalid) return;
    const fv = this.labServiceOptionForm.value;
    const option: LabServiceOption = { id: 0, serviceName: fv.serviceName, costPrice: fv.costPrice };

    if (this.editingLabServiceOptionIndex !== null) {
      this.labService.updateLabServiceOption(this.editingLabServiceOptionIndex, option);
    } else {
      this.labService.addLabServiceOption({ serviceName: fv.serviceName, costPrice: fv.costPrice });
    }

    this.displayLabServiceOptionDialog = false;
    this.labServiceOptionForm.reset();
  }
}
