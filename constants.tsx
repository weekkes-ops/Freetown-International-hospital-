
import { Patient, Appointment, Staff, FinancialRecord, LabTest } from './types';

export const CLINIC_TYPES = [
  'Surgical',
  'Pediatric',
  'Dental',
  'Gynecological',
  'Orthopedic',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'General Medicine'
];

export const LAB_TEST_CATALOG: LabTest[] = [
  { id: 'LT001', name: 'Full Blood Count (FBC)', price: 45000 },
  { id: 'LT002', name: 'Lipid Profile', price: 75000 },
  { id: 'LT003', name: 'Liver Function Test (LFT)', price: 90000 },
  { id: 'LT004', name: 'Kidney Function Test (KFT)', price: 100000 },
  { id: 'LT005', name: 'Blood Sugar (Fasting)', price: 20000 },
  { id: 'LT006', name: 'Malaria Parasite (MP)', price: 30000 },
  { id: 'LT007', name: 'Urinalysis', price: 25000 },
  { id: 'LT008', name: 'HBA1C', price: 60000 },
  { id: 'LT009', name: 'Thyroid Panel', price: 110000 },
  { id: 'LT010', name: 'Chest X-Ray', price: 150000 },
  { id: 'LT011', name: 'ECG/EKG', price: 85000 }
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P001',
    upi: '8f72c3d0-a1e4-4e92-8f1b-3f48c0a2d5e1',
    medicalRecordNumber: 'MRN-442-991',
    nationalId: 'NHID-100293-A',
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Female',
    bloodType: 'A+',
    lastVisit: '2024-05-10',
    status: 'Admitted',
    contact: '+232 76 123456',
    email: 'sarah.j@example.com',
    history: [
      { date: '2024-05-10', clinicType: 'General', notes: 'Asthma flare-up symptoms' },
      { date: '2024-01-15', clinicType: 'General', notes: 'Routine checkup completed' }
    ]
  },
  {
    id: 'P002',
    upi: '2b9e4a1c-7d5f-4b3a-9c2e-1d8a7f6e5d4c',
    medicalRecordNumber: 'MRN-881-203',
    nationalId: 'PASS-882201-C',
    name: 'Michael Chen',
    age: 45,
    gender: 'Male',
    bloodType: 'O-',
    lastVisit: '2024-05-12',
    status: 'Awaiting Doctor',
    clinicType: 'Cardiology',
    contact: '+232 77 654321',
    email: 'mchen@example.com',
    history: [
      { date: '2024-05-12', clinicType: 'Cardiology', notes: 'Hypertension monitoring' },
      { date: '2022-11-04', clinicType: 'Endocrinology', notes: 'Type 2 Diabetes diagnosis' }
    ]
  },
  {
    id: 'P003',
    upi: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    medicalRecordNumber: 'MRN-112-556',
    nationalId: 'NHID-339281-K',
    name: 'Aminata Conteh',
    age: 28,
    gender: 'Female',
    bloodType: 'B+',
    lastVisit: '2024-05-19',
    status: 'Awaiting Doctor',
    clinicType: 'General Medicine',
    contact: '+232 33 987654',
    email: 'aminata.c@example.sl',
    history: [
      { date: '2024-05-19', clinicType: 'General Medicine', notes: 'Initial Registration via Cashier Desk' }
    ]
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'A101',
    patientId: 'P002',
    patientName: 'Michael Chen',
    doctorName: 'Dr. Gregory House',
    date: '2024-05-20',
    time: '09:00 AM',
    department: 'Cardiology',
    status: 'Scheduled'
  }
];

export const MOCK_STAFF: Staff[] = [
  {
    id: 'S001',
    name: 'Dr. Gregory House',
    role: 'Diagnostic Specialist',
    department: 'Internal Medicine',
    status: 'On Duty',
    experience: '20 Years',
    image: 'https://picsum.photos/seed/doctor1/200/200'
  }
];

export const MOCK_FINANCIAL_RECORDS: FinancialRecord[] = [
  { id: 'F001', type: 'Income', category: 'Patient Consultation', amount: 120000, date: '2024-05-18', description: 'Consultation fees' }
];
