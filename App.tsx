
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppView, Patient, Staff, Appointment, FinancialRecord, LabTest, UserRole, InventoryItem, Vendor, PayrollRecord, SurgicalRecord, StaffTask } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import AppointmentManager from './components/AppointmentManager';
import AIAssistant from './components/AIAssistant';
import StaffDirectory from './components/StaffDirectory';
import ModulePlaceholder from './components/ModulePlaceholder';
import Accounting from './components/Accounting';
import CashierRegistration from './components/CashierRegistration';
import DoctorConsultation from './components/DoctorConsultation';
import LaboratoryDesk from './components/LaboratoryDesk';
import MedWizard from './components/MedWizard';
import InventoryManager from './components/InventoryManager';
import VendorManager from './components/VendorManager';
import PayrollManager from './components/PayrollManager';
import SurgicalTheater from './components/SurgicalTheater';
import MedicalRecordsArchive from './components/MedicalRecordsArchive';
import Login from './components/Login';
import Logo from './components/Logo';
import { db } from './services/dbService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('connected');
  const [gitStatus, setGitStatus] = useState<'synced' | 'pushing'>('synced');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [surgeries, setSurgeries] = useState<SurgicalRecord[]>([]);
  const [tasks, setTasks] = useState<StaffTask[]>([]);

  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        setDbStatus('syncing');
        const [p, s, a, f, l, i, v, pay, surg, t] = await Promise.all([
          db.getPatients(), db.getStaff(), db.getAppointments(), db.getFinancials(), db.getLabTests(), db.getInventory(), db.getVendors(), db.getPayrolls(), db.getSurgeries(), db.getTasks()
        ]);
        setPatients(p);
        setStaff(s);
        setAppointments(a);
        setFinancials(f);
        setLabTests(l);
        setInventory(i);
        setVendors(v);
        setPayrolls(pay);
        setSurgeries(surg);
        setTasks(t);
        setDbStatus('connected');
      } catch (err) {
        setDbStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) initData();
  }, [currentUser]);

  const triggerGitSync = () => {
    setGitStatus('pushing');
    setTimeout(() => setGitStatus('synced'), 2000);
  };

  const permissions: Record<AppView, UserRole[]> = useMemo(() => ({
    [AppView.DASHBOARD]: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR, UserRole.MATRON],
    [AppView.WIZARD]: [UserRole.ADMIN, UserRole.CASHIER],
    [AppView.CASHIER]: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR],
    [AppView.DOCTOR]: [UserRole.ADMIN, UserRole.DOCTOR],
    [AppView.LABORATORY]: [UserRole.ADMIN, UserRole.LAB_TECH, UserRole.DOCTOR],
    [AppView.PHARMACY]: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR],
    [AppView.PATIENTS]: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MATRON],
    [AppView.MEDICAL_RECORDS]: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MATRON],
    [AppView.APPOINTMENTS]: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR, UserRole.CASHIER],
    [AppView.SURGICAL_THEATER]: [UserRole.ADMIN, UserRole.DOCTOR],
    [AppView.INVENTORY]: [UserRole.ADMIN, UserRole.MATRON, UserRole.CASHIER, UserRole.DOCTOR],
    [AppView.ACCOUNTING]: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR],
    [AppView.PAYROLLS]: [UserRole.ADMIN, UserRole.DOCTOR],
    [AppView.VENDORS]: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR],
    [AppView.EMPLOYEES]: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR],
    [AppView.REPORTING]: [UserRole.ADMIN, UserRole.DOCTOR],
    [AppView.AI_ASSISTANT]: [UserRole.ADMIN, UserRole.DOCTOR],
  }), []);

  const handleLogin = (role: UserRole) => {
    setCurrentUser(role);
    if (role === UserRole.LAB_TECH) { setActiveView(AppView.LABORATORY); }
    else { setActiveView(AppView.DASHBOARD); }
  };

  const updatePatient = useCallback(async (updatedPatient: Patient) => {
    setDbStatus('syncing');
    await db.upsertPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setDbStatus('connected');
    triggerGitSync();
  }, []);

  const updatePatients = useCallback(async (updatedPatients: Patient[]) => {
    setDbStatus('syncing');
    await Promise.all(updatedPatients.map(p => db.upsertPatient(p)));
    setPatients(prev => prev.map(p => {
      const match = updatedPatients.find(up => up.id === p.id);
      return match ? match : p;
    }));
    setDbStatus('connected');
    triggerGitSync();
  }, []);

  const addPatient = useCallback(async (newPatient: Patient) => {
    setDbStatus('syncing');
    await db.upsertPatient(newPatient);
    setPatients(prev => [newPatient, ...prev]);
    setDbStatus('connected');
    triggerGitSync();
  }, []);

  const deletePatient = useCallback(async (patientId: string) => {
    if (confirm("Permanently delete this record?")) {
      setDbStatus('syncing');
      await db.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setDbStatus('connected');
      triggerGitSync();
    }
  }, []);

  const handleAddAppointment = async (newApp: Appointment) => {
    setDbStatus('syncing');
    await db.addAppointment(newApp);
    setAppointments(prev => [newApp, ...prev]);
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleAddFinancialRecord = async (record: FinancialRecord) => {
    setDbStatus('syncing');
    await db.addFinancial(record);
    setFinancials(prev => [record, ...prev]);
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleAddLabTest = async (test: LabTest) => {
    setDbStatus('syncing');
    await db.addLabTest(test);
    setLabTests(prev => [...prev, test]);
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleUpdateInventory = async (item: InventoryItem) => {
    setDbStatus('syncing');
    await db.upsertInventoryItem(item);
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleAddInventory = async (item: InventoryItem) => {
    setDbStatus('syncing');
    await db.upsertInventoryItem(item);
    setInventory(prev => [item, ...prev]);
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleUpdateVendor = async (vendor: Vendor) => {
    setDbStatus('syncing');
    await db.upsertVendor(vendor);
    setVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v));
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleAddVendor = async (vendor: Vendor) => {
    setDbStatus('syncing');
    await db.upsertVendor(vendor);
    setVendors(prev => [vendor, ...prev]);
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleAddPayroll = async (record: PayrollRecord) => {
    setDbStatus('syncing');
    await db.addPayroll(record);
    setPayrolls(prev => [record, ...prev]);
    await db.addFinancial({
      id: `FIN-${Date.now()}`,
      type: 'Expense',
      category: 'Salaries',
      amount: record.netPay,
      date: new Date().toISOString().split('T')[0],
      description: `Disbursement to ${record.staffName}`
    });
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleUpsertSurgery = async (record: SurgicalRecord) => {
    setDbStatus('syncing');
    await db.upsertSurgery(record);
    setSurgeries(prev => {
      const idx = prev.findIndex(s => s.id === record.id);
      if (idx !== -1) return prev.map(s => s.id === record.id ? record : s);
      return [record, ...prev];
    });
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleUpsertTask = async (task: StaffTask) => {
    setDbStatus('syncing');
    await db.upsertTask(task);
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx !== -1) return prev.map(t => t.id === task.id ? task : t);
      return [task, ...prev];
    });
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleDeleteTask = async (taskId: string) => {
    setDbStatus('syncing');
    await db.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setDbStatus('connected');
    triggerGitSync();
  };

  const handleWizardComplete = async (patient: Patient, financial: FinancialRecord) => {
    setDbStatus('syncing');
    await Promise.all([db.upsertPatient(patient), db.addFinancial(financial)]);
    setPatients(prev => [patient, ...prev]);
    setFinancials(prev => [financial, ...prev]);
    setActiveView(AppView.DASHBOARD);
    setDbStatus('connected');
    triggerGitSync();
  };

  const renderView = () => {
    if (!currentUser) return null;
    if (isLoading) return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Postgres Database...</p>
      </div>
    );

    const allowedRoles = permissions[activeView];
    if (allowedRoles && !allowedRoles.includes(currentUser)) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0-8V7m0 8V9m0 6a9 9 0 110-18 9 9 0 010 18z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Unauthorized Access</h2>
          <p className="text-slate-500 max-w-md font-medium">Identity level <b>{currentUser}</b> is not authorized for module <b>{activeView}</b>.</p>
          <button onClick={() => {
            if (currentUser === UserRole.LAB_TECH) setActiveView(AppView.LABORATORY);
            else setActiveView(AppView.DASHBOARD);
          }} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">Return to Workspace</button>
        </div>
      );
    }

    switch (activeView) {
      case AppView.DASHBOARD: return <Dashboard appointments={appointments} financials={financials} patients={patients} tasks={tasks} onUpsertTask={handleUpsertTask} onDeleteTask={handleDeleteTask} />;
      case AppView.WIZARD: return <MedWizard onComplete={handleWizardComplete} labTests={labTests} />;
      case AppView.CASHIER: return <CashierRegistration patients={patients} onAddPatient={addPatient} onAddFinancial={handleAddFinancialRecord} />;
      case AppView.DOCTOR: return <DoctorConsultation patients={patients} onUpdatePatient={updatePatient} />;
      case AppView.LABORATORY: return <LaboratoryDesk patients={patients} onUpdatePatient={updatePatient} labTests={labTests} onAddLabTest={handleAddLabTest} />;
      case AppView.PATIENTS: return <PatientList patients={patients} onUpdatePatient={updatePatient} onUpdatePatients={updatePatients} onAddPatient={addPatient} onDeletePatient={deletePatient} userRole={currentUser} />;
      case AppView.APPOINTMENTS: return <AppointmentManager appointments={appointments} patients={patients} onAddAppointment={handleAddAppointment} />;
      case AppView.ACCOUNTING: return <Accounting records={financials} onAddRecord={handleAddFinancialRecord} />;
      case AppView.INVENTORY: return <InventoryManager items={inventory} onUpdateItem={handleUpdateInventory} onAddItem={handleAddInventory} />;
      case AppView.VENDORS: return <VendorManager vendors={vendors} onUpdateVendor={handleUpdateVendor} onAddVendor={handleAddVendor} />;
      case AppView.PAYROLLS: return <PayrollManager staff={staff} payrolls={payrolls} onAddPayroll={handleAddPayroll} />;
      case AppView.SURGICAL_THEATER: return <SurgicalTheater surgeries={surgeries} patients={patients} onUpsertSurgery={handleUpsertSurgery} />;
      case AppView.MEDICAL_RECORDS: return <MedicalRecordsArchive patients={patients} />;
      case AppView.AI_ASSISTANT: return <AIAssistant patients={patients} />;
      default: return <ModulePlaceholder title={activeView} description="Module under development." icon="M13 10V3L4 14h7v7l9-11h-7z" items={[]} onAdd={() => {}} />;
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={setActiveView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} userRole={currentUser} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Logo className="w-8 h-8" />
               <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{activeView.toLowerCase().replace('_', ' ')}</h2>
            </div>
            <div className="flex items-center gap-2 ml-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Postgres: {dbStatus}</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${gitStatus === 'synced' ? 'bg-indigo-500' : 'bg-amber-500 animate-ping'}`}></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GitHub: {gitStatus}</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">Hospital Staff</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{currentUser}</p>
              </div>
              <img src={`https://picsum.photos/seed/${currentUser}/100/100`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-indigo-100 object-cover" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
