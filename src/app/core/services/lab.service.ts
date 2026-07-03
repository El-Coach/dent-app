import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Lab {
  id: number;
  name: string;
  phone: string;
  balance: number;
  reservedBox: number;
}

export interface LabServiceOption {
  id: number;
  serviceName: string;
  costPrice: number;
}

export type LabOrderStatus = 'قيد التصنيع' | 'تم الاستلام';

export interface LabOrder {
  id: number;
  date: Date;
  patientId: number;
  patientName: string;
  labId: number;
  labName: string;
  serviceName: string;
  units: number;
  unitCost: number;
  totalCost: number;
  status: LabOrderStatus;
  doctorName: string;
  archived: boolean;
}

export interface LabPayment {
  id: number;
  labId: number;
  labName: string;
  patientId: number;
  patientName: string;
  amount: number;
  date: Date;
}

@Injectable({ providedIn: 'root' })
export class LabService {
  private labsSubject = new BehaviorSubject<Lab[]>([]);
  labs$: Observable<Lab[]> = this.labsSubject.asObservable();

  private labServiceOptionsSubject = new BehaviorSubject<LabServiceOption[]>([
    { id: 1, serviceName: 'طربوش زركونيا', costPrice: 800 },
    { id: 2, serviceName: 'طربوش إي ماكس', costPrice: 600 },
    { id: 3, serviceName: 'طربوش معدني', costPrice: 300 },
    { id: 4, serviceName: 'جهاز تقويم', costPrice: 1500 },
    { id: 5, serviceName: 'مثبت تقويم', costPrice: 200 },
    { id: 6, serviceName: 'دعامة زرع', costPrice: 1200 },
    { id: 7, serviceName: 'تاج مؤقت', costPrice: 150 },
    { id: 8, serviceName: 'أطقم أسنان كاملة', costPrice: 2500 },
    { id: 9, serviceName: 'أطقم أسنان جزئية', costPrice: 1800 },
  ]);
  labServiceOptions$: Observable<LabServiceOption[]> = this.labServiceOptionsSubject.asObservable();

  private labOrdersSubject = new BehaviorSubject<LabOrder[]>([]);
  labOrders$: Observable<LabOrder[]> = this.labOrdersSubject.asObservable();

  private labPaymentsSubject = new BehaviorSubject<LabPayment[]>([]);
  labPayments$: Observable<LabPayment[]> = this.labPaymentsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.labsSubject.next([
      { id: 1, name: 'معمل الأمل للتركيبات', phone: '01055555555', balance: 0, reservedBox: 0 },
      { id: 2, name: 'معمل التقنية الحديثة', phone: '01066666666', balance: 0, reservedBox: 0 },
      { id: 3, name: 'معمل الفن للتقويم', phone: '01077777777', balance: 0, reservedBox: 0 },
    ]);
  }

  // === Labs CRUD ===

  private nextLabId(): number {
    const current = this.labsSubject.value;
    return current.length > 0 ? Math.max(...current.map(l => l.id)) + 1 : 1;
  }

  getLabs(): Lab[] {
    return this.labsSubject.value;
  }

  addLab(data: Omit<Lab, 'id' | 'reservedBox'>): Lab {
    const lab: Lab = { id: this.nextLabId(), reservedBox: 0, ...data };
    this.labsSubject.next([...this.labsSubject.value, lab]);
    return lab;
  }

  updateLab(lab: Lab): void {
    const current = this.labsSubject.value.map(l => l.id === lab.id ? lab : l);
    this.labsSubject.next(current);
  }

  removeLab(id: number): void {
    const current = this.labsSubject.value.filter(l => l.id !== id);
    this.labsSubject.next(current);
  }

  // === Lab Service Options CRUD ===

  private nextLabServiceOptionId(): number {
    const current = this.labServiceOptionsSubject.value;
    return current.length > 0 ? Math.max(...current.map(o => o.id)) + 1 : 1;
  }

  getLabServiceOptions(): LabServiceOption[] {
    return this.labServiceOptionsSubject.value;
  }

  addLabServiceOption(data: Omit<LabServiceOption, 'id'>): LabServiceOption {
    const option: LabServiceOption = { id: this.nextLabServiceOptionId(), ...data };
    this.labServiceOptionsSubject.next([...this.labServiceOptionsSubject.value, option]);
    return option;
  }

  updateLabServiceOption(index: number, option: LabServiceOption): void {
    const current = this.labServiceOptionsSubject.value;
    current[index] = option;
    this.labServiceOptionsSubject.next([...current]);
  }

  removeLabServiceOption(index: number): void {
    const current = this.labServiceOptionsSubject.value.filter((_, i) => i !== index);
    this.labServiceOptionsSubject.next(current);
  }

  // === Lab Orders CRUD ===

  private nextLabOrderId(): number {
    const current = this.labOrdersSubject.value;
    return current.length > 0 ? Math.max(...current.map(o => o.id)) + 1 : 1;
  }

  getLabOrders(): LabOrder[] {
    return this.labOrdersSubject.value;
  }

  addLabOrder(data: Omit<LabOrder, 'id' | 'archived'>): LabOrder {
    const order: LabOrder = { id: this.nextLabOrderId(), archived: false, ...data };
    this.labOrdersSubject.next([...this.labOrdersSubject.value, order]);

    const labs = this.labsSubject.value.map(lab =>
      lab.id === order.labId ? { ...lab, balance: lab.balance + order.totalCost } : lab
    );
    this.labsSubject.next(labs);

    return order;
  }

  updateLabOrderStatus(orderId: number, newStatus: LabOrderStatus): void {
    const current = this.labOrdersSubject.value.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    this.labOrdersSubject.next(current);
  }

  removeLabOrder(orderId: number): void {
    const order = this.labOrdersSubject.value.find(o => o.id === orderId);
    if (!order) return;
    const orders = this.labOrdersSubject.value.filter(o => o.id !== orderId);
    this.labOrdersSubject.next(orders);

    const labs = this.labsSubject.value.map(lab =>
      lab.id === order.labId ? { ...lab, balance: Math.max(0, lab.balance - order.totalCost) } : lab
    );
    this.labsSubject.next(labs);
  }

  settleLabFromReservedBox(labId: number): void {
    const current = this.labsSubject.value.map(lab => {
      if (lab.id !== labId) return lab;
      const newBalance = Math.max(0, lab.balance - lab.reservedBox);
      return { ...lab, balance: newBalance, reservedBox: 0 };
    });
    this.labsSubject.next(current);
    this.archiveCompletedOrdersForLab(labId);
  }

  // === Lab Payments ===

  private nextLabPaymentId(): number {
    const current = this.labPaymentsSubject.value;
    return current.length > 0 ? Math.max(...current.map(p => p.id)) + 1 : 1;
  }

  addLabPayment(data: Omit<LabPayment, 'id'>): LabPayment {
    const payment: LabPayment = { id: this.nextLabPaymentId(), ...data };
    this.labPaymentsSubject.next([...this.labPaymentsSubject.value, payment]);

    const labs = this.labsSubject.value.map(lab =>
      lab.id === payment.labId ? { ...lab, reservedBox: lab.reservedBox + payment.amount } : lab
    );
    this.labsSubject.next(labs);

    return payment;
  }

  getLabPayments(): LabPayment[] {
    return this.labPaymentsSubject.value;
  }

  // === Archive completed orders for a lab ===

  archiveCompletedOrdersForLab(labId: number): void {
    const current = this.labOrdersSubject.value.map(o =>
      o.labId === labId && o.status === 'تم الاستلام' && !o.archived
        ? { ...o, archived: true }
        : o
    );
    this.labOrdersSubject.next(current);
  }
}
