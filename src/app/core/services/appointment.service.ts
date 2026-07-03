import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppointmentStatus = 'انتظار' | 'داخل للدكتور' | 'انتهى' | 'ملغي';
export type ServiceStatus = 'انتظار' | 'داخل للدكتور' | 'انتهى' | 'ملغي';

export interface AppointmentServiceDetail {
  doctorId: number;
  doctorName: string;
  serviceName: string;
  price: number;
  status: ServiceStatus;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  services: AppointmentServiceDetail[];
  appointmentDate: Date;
  timeSlot: string;
  ticketNumber: number;
  status: AppointmentStatus;
  isEmergency: boolean;
  notes: string;
}

export interface ServiceOption {
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  appointments$: Observable<Appointment[]> = this.appointmentsSubject.asObservable();

  private servicesSubject = new BehaviorSubject<ServiceOption[]>([
    { name: 'كشف جديد', price: 300 },
    { name: 'استشارة', price: 50 },
    { name: 'طوارئ', price: 400 },
    { name: 'حشو عصب', price: 800 },
    { name: 'تركيبات', price: 1500 },
    { name: 'تنظيف', price: 200 },
    { name: 'خلع', price: 150 },
    { name: 'أشعة', price: 100 },
    { name: 'زراعة', price: 3000 },
  ]);
  services$: Observable<ServiceOption[]> = this.servicesSubject.asObservable();

  allTimeSlots: string[] = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '01:00', '01:30', '02:00', '02:30',
    '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
    '06:00', '06:30', '07:00', '07:30', '08:00',
  ];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    const today = new Date();
    const appointments: Appointment[] = [
      { id: 1, patientId: 1, patientName: 'أحمد محمد', services: [{ doctorId: 1, doctorName: 'د. أحمد مصطفى', serviceName: 'كشف جديد', price: 300, status: 'انتظار' }], appointmentDate: new Date(today), timeSlot: '10:00', ticketNumber: 1, status: 'انتظار', isEmergency: false, notes: '' },
      { id: 2, patientId: 2, patientName: 'سارة علي', services: [{ doctorId: 1, doctorName: 'د. أحمد مصطفى', serviceName: 'استشارة', price: 50, status: 'داخل للدكتور' }], appointmentDate: new Date(today), timeSlot: '11:00', ticketNumber: 2, status: 'داخل للدكتور', isEmergency: false, notes: '' },
      { id: 3, patientId: 3, patientName: 'خالد عمر', services: [{ doctorId: 2, doctorName: 'د. سارة خالد', serviceName: 'كشف جديد', price: 300, status: 'انتهى' }], appointmentDate: new Date(today), timeSlot: '12:00', ticketNumber: 3, status: 'انتهى', isEmergency: false, notes: '' },
      { id: 4, patientId: 4, patientName: 'نورة حسن', services: [{ doctorId: 2, doctorName: 'د. سارة خالد', serviceName: 'طوارئ', price: 400, status: 'داخل للدكتور' }], appointmentDate: new Date(today), timeSlot: '10:30', ticketNumber: 4, status: 'داخل للدكتور', isEmergency: true, notes: '' },
      { id: 5, patientId: 5, patientName: 'يوسف إبراهيم', services: [{ doctorId: 3, doctorName: 'د. محمد علي', serviceName: 'كشف جديد', price: 300, status: 'انتهى' }], appointmentDate: new Date(today), timeSlot: '09:00', ticketNumber: 5, status: 'انتهى', isEmergency: false, notes: '' },
      { id: 6, patientId: 1, patientName: 'أحمد محمد', services: [{ doctorId: 4, doctorName: 'د. نورا حسن', serviceName: 'كشف جديد', price: 300, status: 'انتظار' }], appointmentDate: new Date(today), timeSlot: '02:00', ticketNumber: 6, status: 'انتظار', isEmergency: false, notes: '' },
      { id: 7, patientId: 2, patientName: 'سارة علي', services: [{ doctorId: 3, doctorName: 'د. محمد علي', serviceName: 'استشارة', price: 50, status: 'انتهى' }], appointmentDate: new Date(today), timeSlot: '01:00', ticketNumber: 7, status: 'انتهى', isEmergency: false, notes: '' },
      { id: 8, patientId: 3, patientName: 'خالد عمر', services: [{ doctorId: 4, doctorName: 'د. نورا حسن', serviceName: 'كشف جديد', price: 300, status: 'ملغي' }], appointmentDate: new Date(today), timeSlot: '03:00', ticketNumber: 8, status: 'ملغي', isEmergency: false, notes: 'ألغى المريض' },
      { id: 9, patientId: 3, patientName: 'خالد عمر', services: [
        { doctorId: 1, doctorName: 'د. أحمد مصطفى', serviceName: 'كشف جديد', price: 300, status: 'انتظار' },
        { doctorId: 2, doctorName: 'د. سارة خالد', serviceName: 'حشو عصب', price: 800, status: 'انتظار' },
      ], appointmentDate: new Date(today), timeSlot: '04:00', ticketNumber: 9, status: 'انتظار', isEmergency: false, notes: 'مريض متعدد الخدمات' },
    ];
    this.appointmentsSubject.next(appointments);
  }

  // === Service Options CRUD ===

  getServices(): ServiceOption[] {
    return this.servicesSubject.value;
  }

  addService(service: ServiceOption): void {
    this.servicesSubject.next([...this.servicesSubject.value, service]);
  }

  updateService(index: number, service: ServiceOption): void {
    const current = this.servicesSubject.value;
    current[index] = service;
    this.servicesSubject.next([...current]);
  }

  removeService(index: number): void {
    const current = this.servicesSubject.value.filter((_, i) => i !== index);
    this.servicesSubject.next(current);
  }

  // === Appointment CRUD ===

  private deriveStatus(services: AppointmentServiceDetail[]): AppointmentStatus {
    if (services.every(s => s.status === 'ملغي')) return 'ملغي';
    if (services.every(s => s.status === 'انتهى')) return 'انتهى';
    if (services.some(s => s.status === 'داخل للدكتور')) return 'داخل للدكتور';
    return 'انتظار';
  }

  private nextId(): number {
    const current = this.appointmentsSubject.value;
    return current.length > 0 ? Math.max(...current.map(a => a.id)) + 1 : 1;
  }

  private nextTicketNumber(date: Date): number {
    const count = this.appointmentsSubject.value.filter(a =>
      this.isSameDay(a.appointmentDate, date) && a.status !== 'ملغي'
    ).length;
    return count + 1;
  }

  getAppointments(): Appointment[] {
    return this.appointmentsSubject.value;
  }

  addAppointment(data: Omit<Appointment, 'id' | 'ticketNumber'>): Appointment {
    const ticketNumber = this.nextTicketNumber(data.appointmentDate);
    const appointment: Appointment = { id: this.nextId(), ticketNumber, ...data };
    this.appointmentsSubject.next([...this.appointmentsSubject.value, appointment]);
    return appointment;
  }

  updateAppointment(appointment: Appointment): void {
    const derivedStatus = this.deriveStatus(appointment.services);
    const updated = { ...appointment, status: derivedStatus };
    const current = this.appointmentsSubject.value.map(a => a.id === appointment.id ? updated : a);
    this.appointmentsSubject.next(current);
  }

  updateServiceStatus(appointmentId: number, serviceIndex: number, newStatus: ServiceStatus): void {
    const appointment = this.appointmentsSubject.value.find(a => a.id === appointmentId);
    if (!appointment) return;
    const updatedServices = appointment.services.map((s, i) =>
      i === serviceIndex ? { ...s, status: newStatus } : s
    );
    this.updateAppointment({ ...appointment, services: updatedServices });
  }

  getServiceStatusSeverity(status: ServiceStatus): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 'انتظار': return 'warn';
      case 'داخل للدكتور': return 'info';
      case 'انتهى': return 'success';
      case 'ملغي': return 'danger';
      default: return 'secondary';
    }
  }

  getAvailableTimeSlots(date: Date, excludeAppointmentId?: number): string[] {
    const booked = this.appointmentsSubject.value.filter(a =>
      this.isSameDay(a.appointmentDate, date) &&
      a.status !== 'ملغي' &&
      a.id !== excludeAppointmentId
    ).map(a => a.timeSlot);
    return this.allTimeSlots.filter(slot => !booked.includes(slot));
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }
}
