import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { Subscription } from 'rxjs';
import { LabService, Lab, LabOrder, LabServiceOption } from '../../core/services/lab.service';
import { PatientService, Patient } from '../../core/services/patient.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { FinancialService } from '../../core/services/financial.service';

@Component({
  selector: 'app-labs-ledger',
  imports: [
    FormsModule, TableModule, ButtonModule, DialogModule, SelectModule,
    InputNumberModule, TagModule, TabsModule, CurrencyPipe, DatePipe,
    TranslatePipe,
  ],
  templateUrl: './labs-ledger.html',
  styleUrl: './labs-ledger.scss',
})
export class LabsLedger implements OnInit, OnDestroy {
  Math = Math;
  labs: Lab[] = [];
  labOrders: LabOrder[] = [];
  labServiceOptions: LabServiceOption[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];

  selectedLabId: number | null = null;

  displayAddDialog = false;
  addForm = {
    patient: null as Patient | null,
    lab: null as Lab | null,
    serviceOption: null as LabServiceOption | null,
    units: 1,
    doctor: null as Doctor | null,
  };

  displaySettleDialog = false;
  settleLab: Lab | null = null;
  settleOrders: LabOrder[] = [];

  private sub = new Subscription();

  constructor(
    private labService: LabService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private financialService: FinancialService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sub.add(
      this.labService.labs$.subscribe(labs => {
        this.labs = labs;
        this.cdr.detectChanges();
      })
    );
    this.sub.add(
      this.labService.labOrders$.subscribe(orders => {
        this.labOrders = orders;
        this.cdr.detectChanges();
      })
    );
    this.sub.add(
      this.labService.labServiceOptions$.subscribe(opts => {
        this.labServiceOptions = opts;
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
      this.doctorService.doctors$.subscribe(doctors => {
        this.doctors = doctors;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get activeOrders(): LabOrder[] {
    const all = this.selectedLabId == null
      ? this.labOrders
      : this.labOrders.filter(o => o.labId === this.selectedLabId);
    return all.filter(o => !o.archived);
  }

  get archivedOrders(): LabOrder[] {
    const all = this.selectedLabId == null
      ? this.labOrders
      : this.labOrders.filter(o => o.labId === this.selectedLabId);
    return all.filter(o => o.archived);
  }

  get totalLabBalance(): number {
    if (this.selectedLabId == null) return this.labs.reduce((s, l) => s + l.balance, 0);
    const lab = this.labs.find(l => l.id === this.selectedLabId);
    return lab?.balance || 0;
  }

  get totalLabReservedBox(): number {
    if (this.selectedLabId == null) return this.labs.reduce((s, l) => s + l.reservedBox, 0);
    const lab = this.labs.find(l => l.id === this.selectedLabId);
    return lab?.reservedBox || 0;
  }

  get selectedLab(): Lab | null {
    if (this.selectedLabId == null) return null;
    return this.labs.find(l => l.id === this.selectedLabId) || null;
  }

  openAddDialog() {
    this.addForm = { patient: null, lab: null, serviceOption: null, units: 1, doctor: null };
    this.displayAddDialog = true;
  }

  get unitCost(): number {
    return this.addForm.serviceOption?.costPrice || 0;
  }

  get totalCost(): number {
    return this.unitCost * (this.addForm.units || 0);
  }

  saveOrder() {
    const f = this.addForm;
    if (!f.patient || !f.lab || !f.serviceOption || !f.units || f.units < 1 || !f.doctor) return;

    this.labService.addLabOrder({
      date: new Date(),
      patientId: f.patient.id,
      patientName: f.patient.name,
      labId: f.lab.id,
      labName: f.lab.name,
      serviceName: f.serviceOption.serviceName,
      units: f.units,
      unitCost: f.serviceOption.costPrice,
      totalCost: this.totalCost,
      status: 'قيد التصنيع',
      doctorName: f.doctor.name,
    });

    this.displayAddDialog = false;
  }

  toggleStatus(order: LabOrder) {
    const newStatus = order.status === 'قيد التصنيع' ? 'تم الاستلام' : 'قيد التصنيع';
    this.labService.updateLabOrderStatus(order.id, newStatus);
  }

  removeOrder(orderId: number) {
    this.labService.removeLabOrder(orderId);
  }

  openSettleDialog(lab: Lab) {
    this.settleLab = lab;
    this.settleOrders = this.labOrders.filter(o => o.labId === lab.id && !o.archived && o.status === 'تم الاستلام');
    this.displaySettleDialog = true;
  }

  confirmSettle() {
    if (!this.settleLab) return;
    this.labService.settleLabFromReservedBox(this.settleLab.id);
    this.displaySettleDialog = false;
    this.settleLab = null;
    this.settleOrders = [];
  }
}
