
import { Patient, Staff, Appointment, FinancialRecord, LabTest, VisitRecord, InventoryItem, ActivityLog, Vendor, PayrollRecord, SurgicalRecord, StaffTask } from '../types';
import { MOCK_PATIENTS, MOCK_STAFF, MOCK_APPOINTMENTS, MOCK_FINANCIAL_RECORDS, LAB_TEST_CATALOG } from '../constants';

const DB_KEY = 'FIH_HMS_DB_V2';

interface DatabaseSchema {
  patients: Patient[];
  staff: Staff[];
  appointments: Appointment[];
  financials: FinancialRecord[];
  labTests: LabTest[];
  inventory: InventoryItem[];
  logs: ActivityLog[];
  vendors: Vendor[];
  payrolls: PayrollRecord[];
  surgeries: SurgicalRecord[];
  tasks: StaffTask[];
}

class DBService {
  private data: DatabaseSchema;

  constructor() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
      // Ensure tasks exists in legacy data
      if (!this.data.tasks) this.data.tasks = [];
    } else {
      this.data = {
        patients: MOCK_PATIENTS,
        staff: MOCK_STAFF.map(s => ({...s, salary: 5000000})),
        appointments: MOCK_APPOINTMENTS,
        financials: MOCK_FINANCIAL_RECORDS,
        labTests: LAB_TEST_CATALOG,
        inventory: [],
        logs: [],
        vendors: [],
        payrolls: [],
        surgeries: [],
        tasks: [
          { id: 'T1', title: 'Verify Lab results for Sarah Johnson', priority: 'Urgent', category: 'Clinical', completed: false, dueDate: new Date().toISOString().split('T')[0] },
          { id: 'T2', title: 'Review monthly inventory requisition', priority: 'Routine', category: 'Admin', completed: false, dueDate: new Date().toISOString().split('T')[0] },
          { id: 'T3', title: 'Matron meeting regarding ward 4 staffing', priority: 'Urgent', category: 'Admin', completed: false, dueDate: new Date().toISOString().split('T')[0] }
        ]
      };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  private async delay(ms: number = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getPatients(): Promise<Patient[]> { await this.delay(); return [...this.data.patients]; }
  async upsertPatient(patient: Patient): Promise<void> {
    const index = this.data.patients.findIndex(p => p.id === patient.id);
    if (index !== -1) this.data.patients[index] = { ...patient };
    else this.data.patients.push(patient);
    this.save();
  }
  async deletePatient(id: string): Promise<void> {
    this.data.patients = this.data.patients.filter(p => p.id !== id);
    this.save();
  }

  async getStaff(): Promise<Staff[]> { await this.delay(); return [...this.data.staff]; }
  async addStaff(member: Staff): Promise<void> { this.data.staff.push(member); this.save(); }

  async getAppointments(): Promise<Appointment[]> { await this.delay(); return [...this.data.appointments]; }
  async addAppointment(app: Appointment): Promise<void> { this.data.appointments.unshift(app); this.save(); }

  async getFinancials(): Promise<FinancialRecord[]> { await this.delay(); return [...this.data.financials]; }
  async addFinancial(record: FinancialRecord): Promise<void> { this.data.financials.unshift(record); this.save(); }

  async getLabTests(): Promise<LabTest[]> { await this.delay(); return [...this.data.labTests]; }
  async addLabTest(test: LabTest): Promise<void> { this.data.labTests.push(test); this.save(); }

  async getInventory(): Promise<InventoryItem[]> { await this.delay(); return [...this.data.inventory]; }
  async upsertInventoryItem(item: InventoryItem): Promise<void> {
    const index = this.data.inventory.findIndex(i => i.id === item.id);
    if (index !== -1) this.data.inventory[index] = { ...item };
    else this.data.inventory.push(item);
    this.save();
  }

  async getVendors(): Promise<Vendor[]> { await this.delay(); return [...this.data.vendors]; }
  async upsertVendor(vendor: Vendor): Promise<void> {
    const index = this.data.vendors.findIndex(v => v.id === vendor.id);
    if (index !== -1) this.data.vendors[index] = { ...vendor };
    else this.data.vendors.push(vendor);
    this.save();
  }

  async getActivityLogs(): Promise<ActivityLog[]> { await this.delay(100); return [...this.data.logs]; }
  async addActivityLog(log: ActivityLog): Promise<void> { this.data.logs.unshift(log); this.save(); }
  async clearActivityLogs(): Promise<void> { this.data.logs = []; this.save(); }

  async getPayrolls(): Promise<PayrollRecord[]> { await this.delay(); return [...this.data.payrolls]; }
  async addPayroll(record: PayrollRecord): Promise<void> { this.data.payrolls.unshift(record); this.save(); }

  async getSurgeries(): Promise<SurgicalRecord[]> { await this.delay(); return [...this.data.surgeries]; }
  async upsertSurgery(record: SurgicalRecord): Promise<void> {
    const index = this.data.surgeries.findIndex(s => s.id === record.id);
    if (index !== -1) this.data.surgeries[index] = { ...record };
    else this.data.surgeries.push(record);
    this.save();
  }

  async getTasks(): Promise<StaffTask[]> { await this.delay(100); return [...this.data.tasks]; }
  async upsertTask(task: StaffTask): Promise<void> {
    const index = this.data.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) this.data.tasks[index] = { ...task };
    else this.data.tasks.unshift(task);
    this.save();
  }
  async deleteTask(id: string): Promise<void> {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
  }
}

export const db = new DBService();
