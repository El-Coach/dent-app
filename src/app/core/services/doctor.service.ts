import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface WorkingDay {
  day: string;
  hours: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  workingDays: WorkingDay[];
  doctorSharePercentage: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private doctorsSubject = new BehaviorSubject<Doctor[]>([]);
  doctors$: Observable<Doctor[]> = this.doctorsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    const doctors: Doctor[] = [
      {
        id: 1, name: 'د. أحمد مصطفى', specialty: 'جراحة الأسنان', phone: '01011111111',
        doctorSharePercentage: 50,
        workingDays: [
          { day: 'الأحد', hours: '10:00 ص – 2:00 م' },
          { day: 'الإثنين', hours: '10:00 ص – 2:00 م' },
          { day: 'الأربعاء', hours: '4:00 م – 8:00 م' },
        ],
      },
      {
        id: 2, name: 'د. سارة خالد', specialty: 'تقويم الأسنان', phone: '01022222222',
        doctorSharePercentage: 50,
        workingDays: [
          { day: 'السبت', hours: '12:00 م – 6:00 م' },
          { day: 'الإثنين', hours: '12:00 م – 6:00 م' },
          { day: 'الثلاثاء', hours: '12:00 م – 6:00 م' },
        ],
      },
      {
        id: 3, name: 'د. محمد علي', specialty: 'طب أسنان الأطفال', phone: '01033333333',
        doctorSharePercentage: 50,
        workingDays: [
          { day: 'الأحد', hours: '9:00 ص – 1:00 م' },
          { day: 'الثلاثاء', hours: '9:00 ص – 1:00 م' },
          { day: 'الخميس', hours: '9:00 ص – 1:00 م' },
        ],
      },
      {
        id: 4, name: 'د. نورا حسن', specialty: 'علاج العصب', phone: '01044444444',
        doctorSharePercentage: 50,
        workingDays: [
          { day: 'السبت', hours: '2:00 م – 8:00 م' },
          { day: 'الأربعاء', hours: '2:00 م – 8:00 م' },
        ],
      },
    ];
    this.doctorsSubject.next(doctors);
  }

  private nextId(): number {
    const current = this.doctorsSubject.value;
    return current.length > 0 ? Math.max(...current.map(d => d.id)) + 1 : 1;
  }

  getDoctors(): Doctor[] {
    return this.doctorsSubject.value;
  }

  getDoctor(id: number): Doctor | undefined {
    return this.doctorsSubject.value.find(d => d.id === id);
  }

  addDoctor(data: Omit<Doctor, 'id'>): Doctor {
    const doctor: Doctor = { id: this.nextId(), ...data };
    this.doctorsSubject.next([...this.doctorsSubject.value, doctor]);
    return doctor;
  }

  updateDoctor(doctor: Doctor): void {
    const current = this.doctorsSubject.value.map(d => d.id === doctor.id ? doctor : d);
    this.doctorsSubject.next(current);
  }

  removeDoctor(id: number): void {
    const current = this.doctorsSubject.value.filter(d => d.id !== id);
    this.doctorsSubject.next(current);
  }
}
