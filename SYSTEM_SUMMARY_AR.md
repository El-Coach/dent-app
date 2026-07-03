# ملخص هندسي شامل — نظام عيادة الأسنان (Angular 19 UI)
## للمرجعية في بناء .NET Web API + SQL Server Backend

---

## 1. هيكل الموديلات (Entities / Interfaces)

### 1.1 Patient (patient.service.ts:6-13)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `name` | `string` | مطلوب |
| `age` | `number \| null` | اختياري |
| `phone` | `string` | مطلوب |
| `registrationDate` | `Date` | تاريخ التسجيل |
| `notes` | `string` | ملاحظات طبية |

مساعدة: `PatientAppointmentData { services: { doctorId, serviceName }[], appointmentDate, timeSlot }` — تستخدم عند إضافة مريض بحجز موعد أول.

### 1.2 Doctor (doctor.service.ts:9-16)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `name` | `string` | - |
| `specialty` | `string` | - |
| `phone` | `string` | - |
| `workingDays` | `WorkingDay[]` | أيام العمل |
| `doctorSharePercentage` | `number` | 0-100, النسبة المئوية للطبيب |

### 1.3 WorkingDay (doctor.service.ts:4-7)
```typescript
{ day: string; hours: string }
```

### 1.4 ServiceOption (appointment.service.ts:28-31)
| الحقل | النوع |
|-------|-------|
| `name` | `string` |
| `price` | `number` |

**قيم افتراضية (Seed Data):** كشف جديد 300, استشارة 50, طوارئ 400, حشو عصب 800, تركيبات 1500, تنظيف 200, خلع 150, أشعة 100, زراعة 3000.

### 1.5 Appointment (appointment.service.ts:15-26)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `patientId` | `number` | FK → Patient |
| `patientName` | `string` | Denormalized |
| `services` | `AppointmentServiceDetail[]` | قائمة الخدمات |
| `appointmentDate` | `Date` | - |
| `timeSlot` | `string` | "09:00", "09:30"... |
| `ticketNumber` | `number` | Auto: عدد غير الملغية في نفس التاريخ + 1 |
| `status` | `AppointmentStatus` | 'انتظار' \| 'داخل للدكتور' \| 'انتهى' \| 'ملغي' |
| `isEmergency` | `boolean` | طوارئ/ووك إن |
| `notes` | `string` | - |

**مشتق تلقائياً:** `status` يُشتق من حالة الخدمات:
- كل الخدمات 'ملغي' → 'ملغي'
- كل الخدمات 'انتهى' → 'انتهى'
- أي خدمة 'داخل للدكتور' → 'داخل للدكتور'
- وإلا → 'انتظار'

### 1.6 AppointmentServiceDetail (appointment.service.ts:7-13)
| الحقل | النوع |
|-------|-------|
| `doctorId` | `number` |
| `doctorName` | `string` |
| `serviceName` | `string` |
| `price` | `number` |
| `status` | `ServiceStatus` |

`ServiceStatus = 'انتظار' | 'داخل للدكتور' | 'انتهى' | 'ملغي'`

### 1.7 Invoice (financial.service.ts:10-23)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `appointmentId` | `number` | FK → Appointment |
| `patientId` | `number` | FK → Patient |
| `patientName` | `string` | Denormalized |
| `services` | `AppointmentServiceDetail[]` | Snapshot وقت الإنشاء |
| `totalAmount` | `number` | مجموع أسعار الخدمات |
| `paidAmount` | `number` | المبلغ المدفوع (Accumulated) |
| `remainingAmount` | `number` | المبلغ المتبقي |
| `status` | `'مدفوع بالكامل' \| 'مدفوع جزئياً' \| 'غير مدفوع'` | يُشتق تلقائياً عند الدفع |
| `date` | `Date` | تاريخ الإنشاء |
| `payments` | `PaymentTransaction[]` | سجل الدفعات |
| `archived` | `boolean` | Soft-delete للإقفال |

### 1.8 PaymentTransaction (financial.service.ts:5-8)
```typescript
{ amount: number; date: Date }
```

### 1.9 Expense (financial.service.ts:25-32)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `description` | `string` | بيان المصروف |
| `amount` | `number` | المبلغ |
| `category` | `'مرتبات' \| 'خامات أسنان' \| 'فواتير' \| 'مصروفات معامل' \| 'أخرى'` | التصنيف |
| `date` | `Date` | التاريخ |
| `archived` | `boolean` | Soft-delete للإقفال |

### 1.10 SafeClosure (financial.service.ts:34-45)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `closureDate` | `Date` | تاريخ الإقفال |
| `totalRevenue` | `number` | مجموع إيرادات الفواتير النشطة |
| `generalExpenses` | `number` | مصروفات عامة (category ≠ 'مصروفات معامل') |
| `labExpenses` | `number` | مصروفات معامل (category = 'مصروفات معامل') |
| `totalExpenses` | `number` | إجمالي المصروفات |
| `netAmount` | `number` | totalRevenue - totalExpenses |
| `remainingFloat` | `number` | الفكة المرحومة للفترة القادمة |
| `invoicesCount` | `number` | عدد الفواتير النشطة |
| `expensesCount` | `number` | عدد المصروفات النشطة |

### 1.11 Lab (lab.service.ts:4-10)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `name` | `string` | اسم المعمل |
| `phone` | `string` | رقم الهاتف |
| `balance` | `number` | إجمالي المديونية (الديون المستحقة على العيادة للمعمل) |
| `reservedBox` | `number` | الكاش المعزول في ظرف المعمل (محجوز من الخزنة بالفعل) |

### 1.12 LabServiceOption (lab.service.ts:12-16)
| الحقل | النوع |
|-------|-------|
| `id` | `number` |
| `serviceName` | `string` |
| `costPrice` | `number` |

**قيم افتراضية (Seed):** طربوش زركونيا 800, طربوش إي ماكس 600, طربوش معدني 300, جهاز تقويم 1500, مثبت تقويم 200, دعامة زرع 1200, تاج مؤقت 150, أطقم أسنان كاملة 2500, أطقم أسنان جزئية 1800.

### 1.13 LabOrder (lab.service.ts:20-34)
| الحقل | النوع | ملاحظات |
|-------|-------|---------|
| `id` | `number` | PK |
| `date` | `Date` | تاريخ الطلب |
| `patientId` | `number` | FK → Patient |
| `patientName` | `string` | Denormalized |
| `labId` | `number` | FK → Lab |
| `labName` | `string` | Denormalized |
| `serviceName` | `string` | اسم الخدمة المطلوبة |
| `units` | `number` | عدد الوحدات |
| `unitCost` | `number` | تكلفة الوحدة |
| `totalCost` | `number` | units × unitCost |
| `status` | `LabOrderStatus` | 'قيد التصنيع' \| 'تم الاستلام' |
| `doctorName` | `string` | الطبيب الطالب |
| `archived` | `boolean` | Soft-delete بعد التسوية |

### 1.14 LabPayment (lab.service.ts:36-44)
| الحقل | النوع |
|-------|-------|
| `id` | `number` |
| `labId` | `number` |
| `labName` | `string` |
| `patientId` | `number` |
| `patientName` | `string` |
| `amount` | `number` |
| `date` | `Date` |

---

## 2. الخدمات (Services) وإدارة الحالة (State Management)

كل Service يستخدم نمط `BehaviorSubject<T>` + `Observable<T>` مع `providedIn: 'root'`. الكومبوننتات تحقن `ChangeDetectorRef` وتستدعي `detectChanges()` بعد كل تحديث لدفع الـ UI.

### 2.1 PatientService (patient.service.ts)
| Stream | النوع |
|--------|-------|
| `patients$` | `BehaviorSubject<Patient[]>` |

**الوظائف:**
- `getPatients(): Patient[]` — قراءة مباشرة
- `addPatient(data: Omit<Patient, 'id'>, appointmentData?: PatientAppointmentData): Patient` — تضيف مريض جديد، اختيارياً تنشئ موعد مع خدمات
- `updatePatient(patient: Patient): void` — تحديث بيانات المريض

### 2.2 DoctorService (doctor.service.ts)
| Stream | النوع |
|--------|-------|
| `doctors$` | `BehaviorSubject<Doctor[]>` |

**الوظائف:**
- `getDoctors(), getDoctor(id): Doctor | undefined`
- `addDoctor(data: Omit<Doctor, 'id'>): Doctor`
- `updateDoctor(doctor: Doctor): void`
- `removeDoctor(id: number): void`

### 2.3 AppointmentService (appointment.service.ts)
| Stream | النوع |
|--------|-------|
| `appointments$` | `BehaviorSubject<Appointment[]>` |
| `services$` | `BehaviorSubject<ServiceOption[]>` |

**الوظائف الرئيسية:**
- **إدارة الخدمات:** `getServices(), addService(), updateService(index), removeService(index)`
- **إدارة المواعيد:** `getAppointments(), addAppointment(data), updateAppointment(appointment)`
- `updateServiceStatus(appointmentId, serviceIndex, newStatus)` — يغير حالة خدمة فردية ثم يستدعي `updateAppointment` الذي يشتق status تلقائياً
- `deriveStatus(services): AppointmentStatus` — الاشتقاق التلقائي للحالة الكلية
- `nextTicketNumber(date): number` — عدد المواعيد غير الملغية في نفس التاريخ + 1
- `getAvailableTimeSlots(date, excludeId?): string[]` — يوفر كل الوقت - المواعيد المحجوزة (غير الملغية)
- `allTimeSlots: string[]` — 23 خانة زمنية من 09:00 إلى 20:00 بفاصل 30 دقيقة
- `isSameDay(a, b): boolean, getServiceStatusSeverity(status): string`

### 2.4 FinancialService (financial.service.ts)
| Stream | النوع |
|--------|-------|
| `invoices$` | `BehaviorSubject<Invoice[]>` |
| `expenses$` | `BehaviorSubject<Expense[]>` |
| `safeClosures$` | `BehaviorSubject<SafeClosure[]>` |
| `remainingFloat$` | `BehaviorSubject<number>` |

**الوظائف الرئيسية:**
- `getInvoices(), getExpenses()`
- `generateInvoice(appointment): Invoice` — ينشئ فاتورة لكامل الموعد (يتخطى إن وُجدت مسبقاً)
- `generateInvoiceForService(appointment, serviceIndex): Invoice` — فاتورة لخدمة فردية
- `voidInvoiceForAppointment(appointmentId): void` — يحذف الفاتورة (للمواعيد الملغاة)
- `payInvoice(invoiceId, amount): void` — دفع جزئي أو كلي: يضيف `amount` إلى `paidAmount` ويدفع `PaymentTransaction` إلى `payments[]` ويشتق `status` تلقائياً
- `addExpense(data: Omit<Expense, 'id' | 'archived'>): Expense` — يضيف مصروف جديد (دائماً `archived: false`)
- `closeAndResetSafe(remainingFloat): SafeClosure` — إقفال الخزنة وترحيلها (انظر القسم 3.4)

### 2.5 LabService (lab.service.ts)
| Stream | النوع |
|--------|-------|
| `labs$` | `BehaviorSubject<Lab[]>` |
| `labServiceOptions$` | `BehaviorSubject<LabServiceOption[]>` |
| `labOrders$` | `BehaviorSubject<LabOrder[]>` |
| `labPayments$` | `BehaviorSubject<LabPayment[]>` |

**الوظائف الرئيسية:**
- **CRUD المعامل:** `getLabs(), addLab(data: Omit<Lab, 'id' | 'reservedBox'>), updateLab(), removeLab()`
- **CRUD خدمات المعامل:** `getLabServiceOptions(), addLabServiceOption(), updateLabServiceOption(index), removeLabServiceOption(index)`
- `addLabOrder(data: Omit<LabOrder, 'id' | 'archived'>): LabOrder` — ينشئ طلباً ويزيد `lab.balance += totalCost`
- `updateLabOrderStatus(orderId, newStatus): void` — يبدّل حالة الطلب (قيد التصنيع ↔ تم الاستلام)
- `removeLabOrder(orderId): void` — يحذف الطلب وينقص `lab.balance = max(0, balance - totalCost)`
- `addLabPayment(data: Omit<LabPayment, 'id'>): LabPayment` — يسجل دفعة ويزيد `lab.reservedBox += amount` (لا يلمس `balance`)
- `getLabPayments(): LabPayment[]`
- `archiveCompletedOrdersForLab(labId): void` — يؤرشف كل طلبات 'تم الاستلام' غير المؤرشفة للمعمل
- `settleLabFromReservedBox(labId): void` — التسوية: `balance = max(0, balance - reservedBox)` + `reservedBox = 0` + أرشفة الطلبات المكتملة

---

## 3. اللوجيك المالي بالتفصيل

### 3.1 إدارة الخزنة (Safe Management)

الخزنة تحتوي على "رصيد افتتاحي" (`remainingFloat`) يُرحّل من إقفال سابق. الإيرادات تزيد منه والمصروفات تنقص منه.

**معادلة كاش الخزنة المتاح:**
```
صافي الخزنة = remainingFloat + totalInvoicePaidAmounts − totalExpenses
```
حيث `totalExpenses = generalExpenses + labExpenses`.

**ملاحظة:** مصروفات المعامل (`category = 'مصروفات معامل'`) هي كاش تم إخراجه فعلياً من الخزنة إلى ظرف المعمل — لكنه لم يُسلم للمعمل بعد. يظل محجوزاً في `lab.reservedBox` لحين التسوية.

### 3.2 عزل كاش المعامل — Strict Envelope System

هذا هو الجزء الأكثر دقة في النظام. الفكرة: الفلوس بتخرج من الخزنة فعلياً لما المريض يدفع تكاليف المعمل، وتتحجز في "ظرف"虚拟. لما ممثل المعمل يجي يستلم، بنخصم الظرف من المديونية فقط — من غير ما نخصم تاني من الخزنة.

#### (أ) إنشاء طلب معمل — `addLabOrder()`
- `lab.balance += order.totalCost` ← تزيد المديونية (العيادة مدينة للمعمل)
- لا تأثير على الخزنة أو `reservedBox`
- **لا يتم إنشاء أي Expense**

#### (ب) المريض يدفع تكاليف المعمل — `confirmLabPayment()` (في PatientsComponent)
1. `FinancialService.addExpense(...)`:
   - `category = 'مصروفات معامل'`
   - `description = "تجنيد وعزل كاش في ظرف معمل [name] - [patient]"`
   - `archived = false`
   - **هذا يسحب الفلوس من الخزنة فعلياً (deduction فوري)**
2. `LabService.addLabPayment(...)`:
   - `lab.reservedBox += amount` ← الفلوس دخلت الظرف
3. `lab.balance` (المديونية) **ما تتغيرش** في هذه المرحلة

#### (ج) تسوية الحساب مع ممثل المعمل — `confirmSettle()` (في LabsLedgerComponent)
1. `LabService.settleLabFromReservedBox(labId)`:
   - `newBalance = max(0, balance - reservedBox)` ← بنخصم قيمة الظرف من المديونية
   - `reservedBox = 0` ← الظرف فاضي
   - `archiveCompletedOrdersForLab(labId)` ← أرشفة الطلبات 'تم الاستلام'
2. **لا يتم إنشاء أي Expense** — لأن الفلوس اتم خصمها من الخزنة فعلياً في الخطوة (ب). أي خصم تاني هيكون خصم مزدوج.

#### (د) مثال كامل للدورة
```
ابتدائي:     balance=0, reservedBox=0, الخزنة=0
طلب 1000:    balance=1000, reservedBox=0, الخزنة=0
مريض دفع 500: balance=1000, reservedBox=500, الخزنة=-500 (Expense سُجل)
مريض دفع 300: balance=1000, reservedBox=800, الخزنة=-800
تسوية:       balance=200, reservedBox=0, الخزنة=-800 (لا Expense جديد)
             أرشفة جميع طلبات 'تم الاستلام'
```

### 3.3 صرف مستحقات الأطباء (Doctor Payout)

في شاشة الأطباء، تبويب "سجل الخدمات والمستحقات":
1. تُحتسب `totalRevenue` = مجموع أسعار كل الخدمات المنجزة للدكتور (من كل الفواتير)
2. `doctorShare = totalRevenue × (doctor.doctorSharePercentage / 100)`
3. **`FinancialService.addExpense()`**:
   - `category = 'مرتبات'`
   - `description = "صرف مستحقات دكتور [name]"`
   - المبلغ = `doctorShare`
4. تُصفّر `totalRevenue` و `doctorShare` و `completedCount` و `doctorServices`

### 3.4 إقفال الخزنة الشامل (Safe Closure)

في شاشة الخزنة، زر "جرد وإغلاق الخزنة يدوي":

#### شاشة التأكيد التفصيلية تعرض:
1. الرصيد الافتتاحي (من `remainingFloat$`)
2. إجمالي الإيرادات المجمعة (sum of `paidAmount` لكل الفواتير النشطة غير المؤرشفة)
3. مصروفات عامة (sum of expenses حيث `category ≠ 'مصروفات معامل'`)
4. مصروفات معامل (sum of expenses حيث `category = 'مصروفات معامل'`)
5. صافي الكاش المتوفر = `openingBalance + totalRevenue - generalExpenses - labExpenses`
6. حقل إدخال: المبلغ المتبقي فعلياً في الدرج كفكة للفترة القادمة

#### `closeAndResetSafe(remainingFloat)` — الخوارزمية:
1. تجيب كل الفواتير والمصروفات النشطة (غير المؤرشفة)
2. تحسب `totalRevenue`, `generalExpenses`, `labExpenses`, `totalExpenses`, `netAmount`
3. تنشئ `SafeClosure` record بكل التفاصيل
4. تؤرشف كل الفواتير النشطة (`archived: true`)
5. تؤرشف كل المصروفات النشطة
6. تحدث `remainingFloat$` = القيمة اللي دخلها المستخدم

### 3.5 الدفعات الجزئية (Partial Payments)

`payInvoice(invoiceId, amount)`:
- `paidAmount += amount` (تراكمي)
- تدفع `{ amount, date: new Date() }` إلى `payments[]`
- تحسب `remainingAmount = max(0, totalAmount - paidAmount)`
- تشتق `status`:
  - `remaining ≤ 0` → 'مدفوع بالكامل'
  - `paid > 0` → 'مدفوع جزئياً'
  - وإلا → 'غير مدفوع'

---

## 4. الشاشات والـ Workflow

### 4.1 شريط التنقل (Sidebar)
الترتيب: Dashboard (home) → Doctors (oral_disease) → Appointments (calendar_month) → Patients (person) → Billing (money_bag) → Labs (biotech) → Settings

### 4.2 المسارات (Routes)

| المسار | الكومبوننت |
|--------|-----------|
| `/dashboard` | `Dashboard` |
| `/patients` | `Patients` |
| `/doctors` | `Doctors` |
| `/appointments` | `Appointments` |
| `/billing` | `Billing` |
| `/labs-ledger` | `LabsLedger` |
| `/settings` | `Settings` |
| `''` | Redirect → `/dashboard` |

### 4.3 Dashboard (لوحة التحكم)
**المصادر:** `combineLatest([patients$, doctors$, appointments$, invoices$, expenses$, remainingFloat$])`

**البطاقات:**
- صف أول: المريض الحالي (أول 'داخل للدكتور' sorted by ticketNumber) + المريض التالي (أول 'انتظار')
- صف ثاني: إجمالي المرضى, إجمالي الأطباء, مواعيد اليوم
- صف ثالث: في انتظار الكشف, داخل العيادة, تم الكشف
- صف رابع: رصيد الخزنة (الافتتاحي), إجمالي الخزنة الحالي, صافي الربح

### 4.4 Patients (إدارة المرضى)
**جدول:** ID, الاسم, السن, الهاتف, تاريخ التسجيل, ملاحظات طبية, إجراءات (تعديل, كشف حساب)

**ديالوج الإضافة/التعديل:**
- حقول المريض: الاسم*, السن, الهاتف*, تاريخ التسجيل, ملاحظات
- حجز موعد أول (اختياري): تاريخ, ساعة, خدمات (FormArray — دكتور + خدمة)
- التعديل: يقرا الخدمات من المواعيد المعلقة (`status === 'انتظار'`) ويملأ الفورم

**ديالوج كشف الحساب:**
- 3 كروت: إجمالي الفواتير, المدفوع, المتبقي
- لكل فاتورة: جدول الخدمات + سجل الدفعات مع التوقيت (`yyyy/MM/dd hh:mm a`)
- **جدول تركيبات (طلبات المعامل):** التاريخ, المعمل, الخدمة, الوحدات, الإجمالي, الحالة
- **زر "تسديد دفعة للمعمل":** يفتح ديالوج: اختيار المعمل + إدخال المبلغ → ينفذ `addExpense(category='مصروفات معامل')` + `addLabPayment()`
- **جدول سجل دفعات المعمل:** التاريخ, المعمل, المبلغ

### 4.5 Appointments (جدول المواعيد)
**فلتر:** تاريخ (DatePicker) + دكتور (Select)

**كروت الإحصائيات:** في انتظار الكشف, داخل العيادة, إجمالي المواعيد لليوم

**الجدول (لكل موعد):**
- رقم الدور, المريض, التاريخ, الساعة
- عمود الخدمات: كل خدمة في Card منفصل:
  - Tag باسم الخدمة + Select دكتور (inline change) + Tag الحالة
  - أزرار الإجراءات حسب الحالة:
    - `انتظار`: [بدء الكشف] [إلغاء]
    - `داخل للدكتور`: [إنهاء الكشف] [إلغاء]
    - `انتهى`: "تم الدفع لاحقاً"
  - زر حذف الخدمة 🗑 (فقط إذا >1 service والحالة ≠ 'انتهى')
- `changeServiceStatus()`: يغير حالة الخدمة. إذا 'انتهى' → يستدعي `generateInvoiceForService()`

**ديالوج إضافة/تعديل موعد:**
- المريض*, التاريخ*, الساعة*, الخدمات (FormArray — دكتور + خدمة), طوارئ (ToggleSwitch), ملاحظات
- Emergency toggle يفتح كل الـ time slots
- يعرض مجموع أسعار الخدمات

### 4.6 Doctors (إدارة الأطباء)
**جدول:** ID, الاسم, التخصص (Tag), الهاتف, مواعيد العمل (أيام مجمعة)

**ديالوج ملف الطبيب (عند الضغط على صف):**
- **تبويب 1 — بيانات الطبيب:** الاسم, التخصص, الهاتف, مواعيد العمل
- **تبويب 2 — سجل الخدمات والمستحقات:**
  - 3 كروت: عدد الخدمات, الإيرادات, نسبة الطبيب (XX%) = المستحق
  - **زر "تسوية وصرف الحساب الحالي":** ينشئ Expense (مرتبات) ويصفّر العدادات
  - جدول الخدمات: التاريخ, المريض (clickable → opens patient info dialog with financial history), الخدمة, السعر

**ديالوج معلومات المريض (من Doctor):**
- بيانات المريض + ملاحظات طبية (red box)
- التاريخ المالي: 3 كروت + لكل فاتورة تفاصيل + سجل الدفعات بالتوقيت

### 4.7 Billing (الخزينة والمحاسبة)
**3 كروت علوية:**
1. الرصيد الافتتاحي للخزنة (من `remainingFloat$`)
2. إجمالي الخزنة الحالي (remainingFloat + netProfit)
3. زر "جرد وإغلاق الخزنة يدوي"

**فلتر:**
- SelectButton: يوم / شهر
- DatePicker (يتغير view حسب الفلتر)

**3 كروت إحصائيات الفلتر:** إجمالي الإيرادات, إجمالي المصروفات, صافي الربح

**تبويبات:**
1. **فواتير المرضى (الإيرادات):** جدول — #, المريض, الخدمات (Tags + دكتور + سعر), الإجمالي, المدفوع, المتبقي, الحالة (Tag), زر "تحصيل مبلغ"
2. **المصروفات:** جدول — #, البيان, القسم (Tag), المبلغ, التاريخ, زر "تسجيل مصروف جديد"

**ديالوج إقفال الخزنة التفصيلي:**
- 5 كروت: الافتتاحي, الإيرادات, مصروفات عامة, مصروفات معامل, صافي الكاش
- معادلة توضيحية: (الافتتاحي + الإيرادات - المصروفات العامة - مصروفات المعامل)
- حقل إدخال "المبلغ المتبقي في الخزنة كفكة للفترة القادمة"
- زر "ترحيل وإغلاق الخزنة الآن"

**ديالوج تحصيل مبلغ:**
- عرض بيانات الفاتورة: المريض, الخدمات, المتبقي
- Input number للمبلغ
- تحقق: `amount <= invoice.remainingAmount`

### 4.8 LabsLedger (دفتر المعامل)
**هيدر:**
- فلتر معمل (Select)
- إجمالي المديونية (balance) + المحجوز في الظرف (reservedBox)

**تبويبان:**
1. **الطلبات الجارية** (`!archived`):
   - جدول: #, التاريخ, المريض, المعمل, الخدمة, الوحدات, تكلفة الوحدة, الإجمالي, الحالة (Tag قابل للنقر - toggle status), الطبيب, حذف
   - **زر "تسوية حساب المعمل"** (يظهر عند اختيار معمل)
2. **أرشيف المعاملات** (`archived`): نفس الجدول بدون أزرار إجراءات

**ديالوج إضافة طلب معمل:**
- المريض*, المعمل*, الخدمة*, عدد الوحدات*, الطبيب*
- يعرض تكلفة الوحدة + الإجمالي تلقائياً
- `saveOrder()`: يستدعي `addLabOrder()` → يزيد `lab.balance`

**ديالوج تسوية حساب المعمل:**
- جدول الطلبات المكتملة 'تم الاستلام'
- 3 كروت:
  1. إجمالي مديونية المعمل الحالية (balance)
  2. المبلغ المتوفر في ظرف المعمل وجاهز للتسليم (reservedBox)
  3. المديونية المتبقية بعد صرف الظرف (max(0, balance - reservedBox))
- رسالة توضيحية: "سيتم خصم قيمة الظرف من مديونية المعمل وتصفير الظرف. لن يتم إنشاء أي مصروف إضافي في الخزنة"
- زر "تسليم الكاش المحجوز وتحديث الحساب" (معطل لو `reservedBox ≤ 0`)

### 4.9 Settings (الإعدادات)
**3 تبويبات:**
1. **إدارة الخدمات والأسعار:** جدول (اسم + سعر) + إضافة/تعديل/حذف. الحذف المأمون: يتحقق إذا كانت الخدمة مرتبطة بمواعيد نشطة (`انتظار` أو `داخل للدكتور`)
2. **إدارة الأطباء والنسب:** جدول (اسم + تخصص + نسبة % — editable inline) + إضافة/تعديل/حذف. الحذف المأمون: يتحقق من المواعيد النشطة
3. **إدارة المعامل والتركيبات:** جدولان فرعيان:
   - المعامل: ID, الاسم, الهاتف, الرصيد (balance), المحجوز بالظرف (reservedBox)
   - خدمات المعامل: ID, اسم الخدمة, تكلفة المعمل
   - الحذف المأمون: يتحقق من وجود طلبات 'قيد التصنيع'

**ديالوج تأكيد الحذف:**
- لو العنصر مرتبط ببيانات نشطة → رسالة منع + زر "فهمت"
- لو غير مرتبط → تأكيد + زر "حذف"

---

## 5. قواعد العمل الأساسية (Business Rules Summary)

1. **حالة الموعد مُشتقة دائماً** من حالات الخدمات الفردية، لا تُحدد يدوياً
2. **الفاتورة** تُنشأ تلقائياً عند إنهاء خدمة (`status === 'انتهى'`) أو يدوياً للموعد كامل
3. **الدفع الجزئي** مدعوم بالكامل مع سجل زمني لجميع الدفعات
4. **كاش المعامل معزول تماماً**: دفعة المريض = Expense يخصم من الخزنة + reservedBox يزيد. التسوية = reservedBox يُخصم من balance فقط (بدون Expense جديد)
5. **إقفال الخزنة يدوي**: يؤرشف كل الفواتير والمصروفات النشطة، ويسجل `remainingFloat` للفترة التالية
6. **العناصر المؤرشفة** مستبعدة من حسابات الفترة الحالية لكن محفوظة للتاريخ
7. **رقم الدور** Auto-increment لكل يوم، يتخطى المواعيد الملغاة
8. **كل الإعدادات ديناميكية**: الخدمات, الأطباء, المعامل, وخدمات المعامل كلها قابلة للإدارة من Settings

---

## 6. توصيات لبناء الـ .NET Backend

### هيكل قاعدة البيانات المقترح (SQL Server Tables):
- `Patients`, `Doctors`, `WorkingDays`, `ServiceOptions`, `Appointments`, `AppointmentServices`, `Invoices`, `InvoicePayments`, `Expenses`, `SafeClosures`, `Labs`, `LabServiceOptions`, `LabOrders`, `LabPayments`

### الـ Controllers المقترحة:
- `PatientsController` — CRUD + search
- `DoctorsController` — CRUD + payout calculation
- `ServiceOptionsController` — CRUD
- `AppointmentsController` — CRUD + date/doctor filtering + ticket number generation
- `InvoicesController` — CRUD + generate + pay (partial)
- `ExpensesController` — CRUD + category filtering
- `SafeClosuresController` — close + history
- `LabsController` — CRUD + balance tracking
- `LabOrdersController` — CRUD + status toggle + archive
- `LabPaymentsController` — CRUD + reservedBox update
- `LabSettlementController` — POST settle (balance - reservedBox, zero reservedBox, archive)
- `DashboardController` — GET aggregated stats from multiple tables
