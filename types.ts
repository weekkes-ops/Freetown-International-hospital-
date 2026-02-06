
export enum UserRole {
  CASHIER = 'CASHIER',
  DOCTOR = 'DOCTOR',
  LAB_TECH = 'LAB_TECH',
  MATRON = 'MATRON',
  ADMIN = 'ADMIN'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  CASHIER = 'CASHIER',
  DOCTOR = 'DOCTOR',
  LABORATORY = 'LABORATORY',
  APPOINTMENTS = 'APPOINTMENTS',
  EMPLOYEES = 'EMPLOYEES',
  PHARMACY = 'PHARMACY',
  ACCOUNTING = 'ACCOUNTING',
  INVENTORY = 'INVENTORY',
  REPORTING = 'REPORTING',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  SURGICAL_THEATER = 'SURGICAL_THEATER',
  PAYROLLS = 'PAYROLLS',
  VENDORS = 'VENDORS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  WIZARD = 'WIZARD'
}

export interface VisitRecord {
  date: string;
  clinicType: string;
  notes: string;
  vitals?: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  result?: string;
}

export interface RiskAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
}

export interface ActivityLog {
  id: string;
  type: 'STATUS_UPDATE' | 'EXPORT' | 'REGISTRATION' | 'INVENTORY_ADJUST' | 'SURGERY_LOG' | 'PAYROLL_GEN';
  userRole: UserRole;
  timestamp: string;
  count: number;
  details: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 encoded file data
  timestamp: string;
}

export interface StaffTask {
  id: string;
  title: string;
  priority: 'Routine' | 'Urgent' | 'Critical';
  category: 'Clinical' | 'Admin' | 'Personal';
  completed: boolean;
  dueDate: string;
}

export interface Patient {
  id: string; 
  upi: string; 
  medicalRecordNumber: string; 
  nationalId: string; 
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  lastVisit: string;
  status: 'Registered' | 'Awaiting Doctor' | 'In Consultation' | 'Awaiting Lab' | 'Completed' | 'Admitted' | 'Outpatient' | 'Discharged';
  contact: string;
  email: string;
  history: VisitRecord[];
  labHistory?: { date: string, results: LabTest[] }[];
  clinicType?: string;
  requestedTests?: LabTest[];
  doctorDescription?: string;
  totalLabBill?: number;
  riskAlerts?: RiskAlert[];
  documents?: PatientDocument[];
  vitals?: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  department: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reason?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'On Duty' | 'Off Duty' | 'On Leave';
  experience: string;
  image: string;
  salary?: number;
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Pharmaceutical' | 'Surgical' | 'Lab' | 'General';
  quantity: number;
  minThreshold: number;
  unit: string;
  pricePerUnit: number;
  lastUpdated: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'Pharmaceutical' | 'Surgical Equipment' | 'Medical Supplies' | 'Maintenance' | 'General';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Under Review' | 'Inactive';
  lastSupplyDate: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  year: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending';
}

export interface SurgicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  surgeon: string;
  theaterRoom: string;
  date: string;
  startTime: string;
  anesthesiaType: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Post-Op';
}
