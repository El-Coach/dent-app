import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppointmentService, AppointmentServiceDetail, ServiceOption } from './appointment.service';
import { DoctorService } from './doctor.service';

export interface Patient {
  id: number;
  name: string;
  age: number | null;
  phone: string;
  registrationDate: Date;
  notes: string;
}

export interface PatientAppointmentData {
  services: { doctorId: number; serviceName: string }[];
  appointmentDate: Date;
  timeSlot: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  patients$: Observable<Patient[]> = this.patientsSubject.asObservable();

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
  ) {
    this.loadInitialData();
  }

  private loadInitialData() {
    const patients: Patient[] = [
      { id: 1, name: 'أحمد محمد', age: 35, phone: '01012345678', registrationDate: new Date('2025-01-15'), notes: 'حساسية من البنسلين' },
      { id: 2, name: 'سارة علي', age: 28, phone: '01198765432', registrationDate: new Date('2025-03-22'), notes: '' },
      { id: 3, name: 'خالد عمر', age: 45, phone: '01234567890', registrationDate: new Date('2025-06-10'), notes: 'مريض سكري' },
      { id: 4, name: 'نورة حسن', age: 32, phone: '01556789012', registrationDate: new Date('2025-09-05'), notes: 'تحتاج متابعة شهرية' },
      { id: 5, name: 'يوسف إبراهيم', age: 50, phone: '01099887766', registrationDate: new Date('2026-02-18'), notes: '' },
    ];
    this.patientsSubject.next(patients);
  }

  private nextId(): number {
    const current = this.patientsSubject.value;
    return current.length > 0 ? Math.max(...current.map(p => p.id)) + 1 : 1;
  }

  getPatients(): Patient[] {
    return this.patientsSubject.value;
  }

  addPatient(data: Omit<Patient, 'id'>, appointmentData?: PatientAppointmentData): Patient {
    const patient: Patient = { id: this.nextId(), ...data };
    this.patientsSubject.next([...this.patientsSubject.value, patient]);

    if (appointmentData && appointmentData.services.length > 0 && appointmentData.appointmentDate && appointmentData.timeSlot) {
      const services: AppointmentServiceDetail[] = appointmentData.services.map(s => {
        const doctor = this.doctorService.getDoctor(s.doctorId);
        const services = this.appointmentService.getServices();
        const opt = services.find(o => o.name === s.serviceName);
        return {
          doctorId: s.doctorId,
          doctorName: doctor?.name || '',
          serviceName: s.serviceName,
          price: opt?.price || 300,
          status: 'انتظار',
        };
      });

      this.appointmentService.addAppointment({
        patientId: patient.id,
        patientName: patient.name,
        services,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        status: 'انتظار',
        isEmergency: false,
        notes: '',
      });
    }

    return patient;
  }

  updatePatient(patient: Patient): void {
    const current = this.patientsSubject.value.map(p => p.id === patient.id ? patient : p);
    this.patientsSubject.next(current);
  }
}
