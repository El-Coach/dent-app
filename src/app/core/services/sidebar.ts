import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  // المذيع الحامل للحالة المبدئية (مقفول = false)
  private sidebarVisible = new BehaviorSubject<boolean>(false);

  // الراديو اللي الكومبوننتس هتسمعه
  isOpen$ = this.sidebarVisible.asObservable();

  // دالة تبديل الحالة (عكس القيمة الحالية)
  toggleSidebar() {
    this.sidebarVisible.next(!this.sidebarVisible.value);
  }

  // دالة لتحديد الحالة مباشرة (تستخدم عند الإغلاق من الزر الافتراضي لـ PrimeNG)
  setSidebarState(state: boolean) {
    this.sidebarVisible.next(state);
  }
}
