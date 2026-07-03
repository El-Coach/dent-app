import { Routes } from '@angular/router';
import { Dashboard } from './Pages/dashboard/dashboard';
import { Patients } from './Pages/patients/patients';
import { Doctors } from './Pages/doctors/doctors';
import { Appointments } from './Pages/appointments/appointments';
import { Billing } from './Pages/billing/billing';
import { Settings } from './Pages/settings/settings';
import { LabsLedger } from './Pages/labs-ledger/labs-ledger';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'patients', component: Patients },
  { path: 'doctors', component: Doctors },
  { path: 'appointments', component: Appointments },
  { path: 'billing', component: Billing },
  { path: 'settings', component: Settings },
  { path: 'labs-ledger', component: LabsLedger },
];
