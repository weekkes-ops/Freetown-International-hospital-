
import React, { useState, useMemo, useEffect } from 'react';
import { Patient, VisitRecord, UserRole, RiskAlert, ActivityLog } from '../types';
import { CLINIC_TYPES } from '../constants';
import Logo from './Logo';
import { analyzePatientRisk } from '../services/geminiService';
import { db } from '../services/dbService';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface PatientListProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  onUpdatePatients: (patients: Patient[]) => void;
  onAddPatient: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  userRole: UserRole;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onUpdatePatient, onUpdatePatients, onAddPatient, onDeletePatient, userRole }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clinicFilter, setClinicFilter] = useState('All');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'status'>('lastVisit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [singlePatientToUpdate, setSinglePatientToUpdate] = useState<Patient | null>(null);
  const [patientToComplete, setPatientToComplete] = useState<Patient | null>(null);
  
  // AI Risk State
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [expandedRiskPatientId, setExpandedRiskPatientId] = useState<string | null>(null);

  // Operational Tracking State (Audit Trail)
  const [actionLogs, setActionLogs] = useState<ActivityLog[]>([]);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Audit Filtering State
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('All');
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('All');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

  // New Patient Form State
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodType: 'N/A',
    nationalId: '',
    contact: '',
    email: '',
    clinicType: CLINIC_TYPES[0]
  });

  const statusOptions = ['Registered', 'Awaiting Doctor', 'In Consultation', 'Awaiting Lab', 'Completed', 'Admitted', 'Outpatient', 'Discharged'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'N/A'];
  const logTypes = ['STATUS_UPDATE', 'EXPORT', 'REGISTRATION', 'INVENTORY_ADJUST', 'SURGERY_LOG', 'PAYROLL_GEN'];
  const roles = Object.values(UserRole);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const loadLogs = async () => {
      const logs = await db.getActivityLogs();
      setActionLogs(logs);
    };
    loadLogs();
  }, []);

  const addNotification = (message: string, type: Notification['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  const addPersistentLog = async (type: ActivityLog['type'], count: number, details: string) => {
    const newLog: ActivityLog = {
      id: `AUDIT-${Date.now()}`,
      type,
      userRole,
      timestamp: new Date().toLocaleString(),
      count,
      details,
      status: 'SUCCESS'
    };
    await db.addActivityLog(newLog);
    setActionLogs(prev => [newLog, ...prev]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setClinicFilter('All');
    setBloodTypeFilter('All');
    setMinAge('');
    setMaxAge('');
    setStartDate('');
    setEndDate('');
    setSortBy('lastVisit');
    setSortDirection('desc');
    setSelectedIds(new Set());
  };

  const filteredPatients = useMemo(() => {
    const query = debouncedSearchTerm.toLowerCase().trim();
    const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
    const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

    const filtered = patients.filter(p => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      if (!matchesStatus) return false;
      
      const matchesClinic = clinicFilter === 'All' || p.clinicType === clinicFilter;
      if (!matchesClinic) return false;

      const matchesBlood = bloodTypeFilter === 'All' || p.bloodType === bloodTypeFilter;
      if (!matchesBlood) return false;

      const patientAge = p.age;
      if (minAge !== '' && patientAge < parseInt(minAge)) return false;
      if (maxAge !== '' && patientAge > parseInt(maxAge)) return false;

      const visitDate = new Date(p.lastVisit).getTime();
      if (startTimestamp !== null && visitDate < startTimestamp) return false;
      if (endTimestamp !== null && visitDate > endTimestamp) return false;
      
      if (query.length === 0) return true;

      // Enhanced categorical search logic
      return (
        p.name.toLowerCase().includes(query) || 
        p.id.toLowerCase().includes(query) || 
        p.medicalRecordNumber.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        (p.clinicType && p.clinicType.toLowerCase().includes(query)) ||
        (p.bloodType && p.bloodType.toLowerCase().includes(query)) ||
        (p.contact && p.contact.includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query))
      );
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'lastVisit') {
        comparison = new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [patients, debouncedSearchTerm, statusFilter, clinicFilter, bloodTypeFilter, minAge, maxAge, startDate, endDate, sortBy, sortDirection]);

  // Memoized Filtered Audit Logs with Date Range
  const filteredActionLogs = useMemo(() => {
    return actionLogs.filter(log => {
      const typeMatch = auditTypeFilter === 'All' || log.type === auditTypeFilter;
      const roleMatch = auditRoleFilter === 'All' || log.userRole === auditRoleFilter;
      
      const logDate = new Date(log.timestamp).getTime();
      const matchesStart = !auditStartDate || logDate >= new Date(auditStartDate).setHours(0, 0, 0, 0);
      const matchesEnd = !auditEndDate || logDate <= new Date(auditEndDate).setHours(23, 59, 59, 999);
      
      return typeMatch && roleMatch && matchesStart && matchesEnd;
    });
  }, [actionLogs, auditTypeFilter, auditRoleFilter, auditStartDate, auditEndDate]);

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAllVisible = () => {
    const allVisibleSelected = filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id));
    const next = new Set(selectedIds);
    
    if (allVisibleSelected) {
      filteredPatients.forEach(p => next.delete(p.id));
    } else {
      filteredPatients.forEach(p => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const handleQuickCompleteRequest = (patient: Patient) => {
    if (patient.status === 'Completed') return;
    setPatientToComplete(patient);
  };

  const handleConfirmQuickComplete = async () => {
    if (!patientToComplete) return;
    const updated = { ...patientToComplete, status: 'Completed' as const };
    onUpdatePatient(updated);
    await addPersistentLog('STATUS_UPDATE', 1, `Quick completion for patient ${patientToComplete.name} authorized`);
    addNotification(`${patientToComplete.name} record status set to COMPLETED.`, 'success');
    setPatientToComplete(null);
  };

  const handleInitiateConsultation = async (patient: Patient) => {
    if (patient.status === 'In Consultation') return;
    const updated = { ...patient, status: 'In Consultation' as const };
    onUpdatePatient(updated);
    await addPersistentLog('STATUS_UPDATE', 1, `Consultation initiated for ${patient.name}`);
    addNotification(`${patient.name} is now IN CONSULTATION.`, 'info');
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (singlePatientToUpdate) {
      const updated = { ...singlePatientToUpdate, status: newStatus as any };
      onUpdatePatient(updated);
      await addPersistentLog('STATUS_UPDATE', 1, `Clinical status for ${singlePatientToUpdate.name} transitioned to "${newStatus}"`);
      addNotification(`${singlePatientToUpdate.name} status updated to ${newStatus}.`, 'success');
      setSinglePatientToUpdate(null);
      setIsBulkStatusModalOpen(false);
      return;
    }

    const updated = patients
      .filter(p => selectedIds.has(p.id))
      .map(p => ({ ...p, status: newStatus as any }));
    
    onUpdatePatients(updated);
    
    const count = updated.length;
    await addPersistentLog('STATUS_UPDATE', count, `Clinical status batch transition to "${newStatus}" authorized for ${count} files`);
    addNotification(`Batch update finalized for ${count} patient files.`, 'success');
    
    setSelectedIds(new Set());
    setIsBulkStatusModalOpen(false);
  };

  const handleBulkDelete = async () => {
    if (!onDeletePatient) return;
    const count = selectedIds.size;
    const idsToDelete = Array.from(selectedIds);
    
    for (const id of idsToDelete) {
      await onDeletePatient(id);
    }
    
    await addPersistentLog('STATUS_UPDATE', count, `Administrative batch purge of ${count} patient records executed`);
    addNotification(`Permanently removed ${count} records from master archive.`, 'error');
    
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleBulkExport = async () => {
    const selectedData = patients.filter(p => selectedIds.has(p.id));
    const count = selectedData.length;
    const headers = ['HMS ID', 'MRN', 'Name', 'Age', 'Gender', 'Status', 'Clinic', 'Last Visit', 'Contact', 'Email'];
    const rows = selectedData.map(p => [
      p.id, 
      p.medicalRecordNumber, 
      p.name, 
      p.age, 
      p.gender, 
      p.status, 
      p.clinicType || 'N/A', 
      p.lastVisit,
      `"${p.contact}"`,
      p.email
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FIH_Batch_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    await addPersistentLog('EXPORT', count, `Bulk clinical data export executed for ${count} dossiers`);
    addNotification(`Data export generated for ${count} records.`, 'info');
  };

  const handleClearAuditLog = async () => {
    if (confirm("Permanently wipe local audit ledger? Medical history remains intact.")) {
      await db.clearActivityLogs();
      setActionLogs([]);
      addNotification("Audit cache purged.", "warning");
    }
  };

  const handleRunSafetyScan = async (patient: Patient) => {
    if (scanningId) return;
    setScanningId(patient.id);
    try {
      const historyText = patient.history.map(h => `${h.date}: ${h.notes}`).join(' | ');
      const alerts = await analyzePatientRisk(patient.doctorDescription || "Checkup", historyText);
      onUpdatePatient({ ...patient, riskAlerts: alerts });
      setExpandedRiskPatientId(patient.id);
      
      // Log safety scan to audit trail
      await addPersistentLog('REGISTRATION', 1, `Neural safety scan finalized for patient ${patient.name}. Potential risks detected: ${alerts.length}`);
      
      addNotification(`Safety intelligence scan finalized for ${patient.name}.`, 'success');
    } catch (error) {
      console.error("Scan failure", error);
    } finally {
      setScanningId(null);
    }
  };

  const generateUniqueId = (): string => {
    const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `P${num}`;
  };

  const generateMRN = (): string => {
    const part1 = Math.floor(Math.random() * 900 + 100);
    const part2 = Math.floor(Math.random() * 900 + 100);
    return `MRN-${part1}-${part2}`;
  };

  const generateUPI = (): string => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.name || !newPatientForm.age || !newPatientForm.nationalId || !newPatientForm.contact) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const patientId = generateUniqueId();
    const initialHistory: VisitRecord[] = [{
      date: new Date().toISOString().split('T')[0],
      clinicType: 'Registration',
      notes: `Record initialized via Master Portal. Assigned to ${newPatientForm.clinicType} clinic.`
    }];

    const newPatient: Patient = {
      id: patientId,
      upi: generateUPI(),
      medicalRecordNumber: generateMRN(),
      nationalId: newPatientForm.nationalId,
      name: newPatientForm.name,
      age: parseInt(newPatientForm.age),
      gender: newPatientForm.gender,
      bloodType: newPatientForm.bloodType,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Registered',
      contact: newPatientForm.contact,
      email: newPatientForm.email || `${newPatientForm.name.toLowerCase().replace(/\s/g, '.')}@freetown-int.sl`,
      history: initialHistory,
      clinicType: newPatientForm.clinicType,
      requestedTests: [],
      totalLabBill: 0
    };

    onAddPatient(newPatient);
    await addPersistentLog('REGISTRATION', 1, `New patient record ${newPatient.name} initialized in system`);
    addNotification(`${newPatient.name} has been successfully registered.`, 'success');
    
    setIsRegisterModalOpen(false);
    setNewPatientForm({
      name: '', age: '', gender: 'Male', bloodType: 'N/A', nationalId: '', contact: '', email: '', clinicType: CLINIC_TYPES[0]
    });
  };

  const renderRiskBadge = (patient: Patient) => {
    if (!patient.riskAlerts || patient.riskAlerts.length === 0) return null;
    const critical = patient.riskAlerts.filter(a => a.severity === 'CRITICAL').length;
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); setExpandedRiskPatientId(expandedRiskPatientId === patient.id ? null : patient.id); }}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
          critical > 0 ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-amber-500 text-white'
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        {critical > 0 ? `${critical} Critical` : `${patient.riskAlerts.length} Alerts`}
      </button>
    );
  };

  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (clinicFilter !== 'All' ? 1 : 0) + (bloodTypeFilter !== 'All' ? 1 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-12">
      {/* Professional Notification Stack */}
      <div className="fixed top-20 right-8 z-[300] space-y-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right-10 duration-300 pointer-events-auto min-w-[320px] ${
            n.type === 'success' ? 'bg-slate-900 border-emerald-500 text-white' : 
            n.type === 'warning' ? 'bg-amber-600 border-amber-400 text-white' : 
            n.type === 'error' ? 'bg-red-600 border-red-400 text-white' :
            'bg-indigo-600 border-indigo-400 text-white'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'error' ? 'bg-white/20' : 'bg-white/20'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Notification</p>
              <p className="text-xs font-bold">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Header Toolbar */}
      <div className="flex flex-col gap-6 no-print">
        <div className="relative overflow-hidden h-20 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm transition-all duration-300">
          <div className={`absolute inset-0 flex items-center justify-between px-6 transition-transform duration-300 ${selectedIds.size > 0 ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-md group">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by name, status, clinic or blood type..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              
              <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                   Showing {filteredPatients.length} / {patients.length} records
                 </span>
              </div>

              <div className="h-8 w-px bg-slate-100 mx-2"></div>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2-2V6z" /></svg></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsRegisterModalOpen(true)} 
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl font-black text-[10px] uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Register Patient
              </button>
              <button onClick={() => setIsAuditPanelOpen(true)} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-950 text-white hover:bg-black transition-all shadow-xl group">
                <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Audit Trail</span>
              </button>
            </div>
          </div>

          <div className={`absolute inset-0 flex items-center justify-between px-6 bg-indigo-600 text-white transition-transform duration-300 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg">{selectedIds.size}</div>
                <span className="text-xs font-black uppercase tracking-widest">Selected Records</span>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSinglePatientToUpdate(null); setIsBulkStatusModalOpen(true); }} className="px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Transition Status
                </button>
                <button onClick={handleBulkExport} className="px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export CSV
                </button>
                {userRole === UserRole.ADMIN && (
                  <button onClick={() => setIsBulkDeleteModalOpen(true)} className="px-4 py-2 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-red-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Administrative Purge
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel Selection</button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
             <button onClick={toggleSelectAllVisible} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id)) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}>
               <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id)) ? 'bg-white border-white text-indigo-600' : 'bg-transparent border-slate-300'}`}>
                 <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
               </div>
               {filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id)) ? 'Selected All' : 'Select Filtered'}
             </button>
          </div>

          <div className="h-6 w-px bg-slate-100"></div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
             <select 
               className={`border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors ${statusFilter !== 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-600'}`}
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option value="All">All Statuses</option>
               {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic:</span>
             <select 
               className={`border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors ${clinicFilter !== 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-600'}`}
               value={clinicFilter}
               onChange={(e) => setClinicFilter(e.target.value)}
             >
               <option value="All">All Clinics</option>
               {CLINIC_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood:</span>
             <select 
               className={`border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors ${bloodTypeFilter !== 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-600'}`}
               value={bloodTypeFilter}
               onChange={(e) => setBloodTypeFilter(e.target.value)}
             >
               <option value="All">All Types</option>
               {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age:</span>
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 placeholder="Min" 
                 className="w-12 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[10px] font-black text-indigo-600 outline-none placeholder:text-slate-300"
                 value={minAge}
                 onChange={(e) => setMinAge(e.target.value)}
               />
               <span className="text-slate-300 text-[10px] font-black">-</span>
               <input 
                 type="number" 
                 placeholder="Max" 
                 className="w-12 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[10px] font-black text-indigo-600 outline-none placeholder:text-slate-300"
                 value={maxAge}
                 onChange={(e) => setMaxAge(e.target.value)}
               />
             </div>
          </div>

          <div className="h-6 w-px bg-slate-100"></div>

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
             <select 
               className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer"
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
             >
               <option value="name">Patient Name</option>
               <option value="lastVisit">Last Visit Date</option>
               <option value="status">Clinical Status</option>
             </select>
             <button 
               onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
               className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"
               title={`Currently: ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
             >
               <svg className={`w-4 h-4 transition-transform duration-300 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7 7 7M5 14l7 7 7-7" /></svg>
             </button>
          </div>

          <button onClick={clearFilters} className="ml-auto p-2 text-slate-400 hover:text-red-500 transition-colors" title="Reset Filters">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Active Filter Summary Strip */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 animate-in slide-in-from-top-2 duration-300">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Constraints:</span>
            {statusFilter !== 'All' && (
              <span className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('All')} className="hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            {clinicFilter !== 'All' && (
              <span className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase">
                Clinic: {clinicFilter}
                <button onClick={() => setClinicFilter('All')} className="hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            {bloodTypeFilter !== 'All' && (
              <span className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase">
                Blood: {bloodTypeFilter}
                <button onClick={() => setBloodTypeFilter('All')} className="hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[8px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest ml-2 underline underline-offset-2">Clear All</button>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10 overflow-hidden">
             <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Master Registration</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Establish New Patient Repository</p>
                   </div>
                   <button onClick={() => setIsRegisterModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Full Legal Name</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner placeholder-slate-300" placeholder="Patient's primary name" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Age</label>
                        <input type="number" required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner" placeholder="0" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Gender Identity</label>
                        <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner" value={newPatientForm.gender} onChange={e => setNewPatientForm({...newPatientForm, gender: e.target.value as any})}>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">National ID / Passport</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner placeholder-slate-300" placeholder="Official Identification" value={newPatientForm.nationalId} onChange={e => setNewPatientForm({...newPatientForm, nationalId: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Blood Classification</label>
                        <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner" value={newPatientForm.bloodType} onChange={e => setNewPatientForm({...newPatientForm, bloodType: e.target.value})}>
                          {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Contact Phone</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner placeholder-slate-300" placeholder="+232 ..." value={newPatientForm.contact} onChange={e => setNewPatientForm({...newPatientForm, contact: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Secure Email</label>
                        <input type="email" className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner placeholder-slate-300" placeholder="patient@example.sl" value={newPatientForm.email} onChange={e => setNewPatientForm({...newPatientForm, email: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Primary Triage Clinic</label>
                        <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black shadow-inner" value={newPatientForm.clinicType} onChange={e => setNewPatientForm({...newPatientForm, clinicType: e.target.value})}>
                          {CLINIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-black shadow-2xl uppercase tracking-[0.2em] transition-all">Authorize Master Enrollment</button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Collapsible Audit Trail Panel */}
      {isAuditPanelOpen && (
        <div className="fixed inset-0 z-[250] no-print">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAuditPanelOpen(false)}></div>
           <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-200">
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Audit Trail</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified System Activity</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAuditPanelOpen(false)} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-200 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              {/* Audit Filters */}
              <div className="p-6 bg-white border-b border-slate-100 flex flex-col gap-6 shrink-0">
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filter by Type</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer"
                        value={auditTypeFilter}
                        onChange={(e) => setAuditTypeFilter(e.target.value)}
                      >
                        <option value="All">All Actions</option>
                        {logTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filter by Role</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer"
                        value={auditRoleFilter}
                        onChange={(e) => setAuditRoleFilter(e.target.value)}
                      >
                        <option value="All">All Roles</option>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                   </div>
                 </div>

                 {/* Temporal Filter for Audit */}
                 <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Search Filter</p>
                    <div className="flex gap-4">
                      <div className="flex-1">
                         <label className="block text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Start Date</label>
                         <input 
                           type="date"
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-indigo-600 outline-none focus:border-indigo-400 transition-colors"
                           value={auditStartDate}
                           onChange={(e) => setAuditStartDate(e.target.value)}
                         />
                      </div>
                      <div className="flex-1">
                         <label className="block text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 ml-1">End Date</label>
                         <input 
                           type="date"
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-indigo-600 outline-none focus:border-indigo-400 transition-colors"
                           value={auditEndDate}
                           onChange={(e) => setAuditEndDate(e.target.value)}
                         />
                      </div>
                    </div>
                    {(auditStartDate || auditEndDate) && (
                      <button onClick={() => { setAuditStartDate(''); setAuditEndDate(''); }} className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1 hover:underline">Reset Dates</button>
                    )}
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
                 {filteredActionLogs.length > 0 ? filteredActionLogs.map(log => (
                    <div key={log.id} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4 hover:border-indigo-200 transition-all hover:bg-white hover:shadow-xl group">
                       <div className="flex justify-between items-start">
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${
                            log.type === 'STATUS_UPDATE' ? 'bg-emerald-600 text-white' : 
                            log.type === 'EXPORT' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                          }`}>
                             {log.type.replace('_', ' ')}
                          </span>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-indigo-600 uppercase leading-none">{log.userRole}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{log.timestamp}</p>
                          </div>
                       </div>
                       <p className="font-bold text-slate-800 text-sm leading-snug group-hover:text-slate-950 transition-colors">"{log.details}"</p>
                       <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Impact: {log.count} Patient Record{log.count !== 1 ? 's' : ''}</p>
                       </div>
                    </div>
                 )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                       </div>
                       <p className="text-xs font-black uppercase tracking-[0.4em]">No matching logs</p>
                    </div>
                 )}
              </div>

              <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4 shrink-0">
                 <button onClick={handleClearAuditLog} className="flex-1 py-4 text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors bg-white border border-slate-200 shadow-sm">Purge Trail</button>
                 <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-black transition-all">Download Audit</button>
              </div>
           </div>
        </div>
      )}

      {/* Quick Complete Confirmation Modal */}
      {patientToComplete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-10 text-center border-t-8 border-emerald-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2 tracking-tight">Finalize Patient Session?</h3>
            <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">Confirm completion for <b>{patientToComplete.name}</b>. This will archive the current clinical encounter.</p>
            <div className="flex gap-4">
              <button onClick={() => setPatientToComplete(null)} className="flex-1 py-4 text-slate-400 font-black border-2 border-slate-100 rounded-2xl text-[10px] uppercase tracking-widest">Hold, Cancel</button>
              <button onClick={handleConfirmQuickComplete} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">Confirm Completion</button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Views */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 no-print">
          {filteredPatients.length > 0 ? filteredPatients.map(p => (
            <div key={p.id} className={`bg-white p-8 rounded-[2rem] border-2 shadow-sm hover:shadow-2xl transition-all group animate-in zoom-in-95 duration-300 relative flex flex-col ${selectedIds.has(p.id) ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 hover:border-indigo-100'}`}>
              <button onClick={() => toggleSelectOne(p.id)} className={`absolute top-6 right-6 w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></button>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform ${selectedIds.has(p.id) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{p.name.charAt(0)}</div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight text-lg leading-tight">{p.name}</h4>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">MRN: {p.medicalRecordNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 space-y-3">
                 <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Safety</p>
                    {renderRiskBadge(p)}
                 </div>
                 {!p.riskAlerts && (
                   <button onClick={(e) => { e.stopPropagation(); handleRunSafetyScan(p); }} disabled={scanningId === p.id} className="w-full py-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                     {scanningId === p.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                     Run Clinical Scan
                   </button>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Age / Sex / Blood</p>
                    <p className="text-xs font-black text-slate-800">{p.age}Y • {p.gender} • {p.bloodType || 'N/A'}</p>
                 </div>
                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                    <p className="text-xs font-black text-indigo-600 uppercase">{p.status}</p>
                 </div>
              </div>

              <div className="mt-auto flex gap-3">
                 <button 
                   onClick={() => handleInitiateConsultation(p)}
                   className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                 >
                   Open Case
                 </button>
                 <button 
                   onClick={() => handleQuickCompleteRequest(p)}
                   disabled={p.status === 'Completed'}
                   className={`px-4 py-3 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                     p.status === 'Completed' 
                       ? 'bg-emerald-50 text-emerald-400 border-emerald-100 cursor-not-allowed' 
                       : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                   }`}
                   title="Quick Complete Session"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                   <span className="text-[8px] font-black uppercase">Complete</span>
                 </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30">
              <p className="text-sm font-black uppercase tracking-[0.4em]">No Patient Records Found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden no-print">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 flex items-center gap-4">
                  <button onClick={toggleSelectAllVisible} className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id)) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></button>
                  Patient Identity
                </th>
                <th className="px-8 py-6">MRN / Blood</th>
                <th className="px-8 py-6">Current Status</th>
                <th className="px-8 py-6">Last Visit</th>
                <th className="px-8 py-6 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(p.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleSelectOne(p.id)} className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></button>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{p.gender} • {p.age}Y</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-slate-600">{p.medicalRecordNumber}</p>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Type: {p.bloodType || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-lg">{p.status}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">{p.lastVisit}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleRunSafetyScan(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Safety Scan"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
                       <button onClick={() => handleInitiateConsultation(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Open Case"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                       <button 
                         onClick={() => handleQuickCompleteRequest(p)} 
                         disabled={p.status === 'Completed'}
                         className={`p-2 rounded-lg transition-all ${
                           p.status === 'Completed' 
                             ? 'text-emerald-300 cursor-not-allowed' 
                             : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                         }`} 
                         title="Quick Complete"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Status Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 p-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-2">Transition State</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Impacted Records: <span className="text-indigo-600">{selectedIds.size}</span></p>
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {statusOptions.map(status => (
                <button key={status} onClick={() => handleBulkStatusChange(status)} className="w-full py-4 text-left px-6 rounded-2xl bg-slate-50 hover:bg-indigo-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all">
                  {status}
                </button>
              ))}
            </div>
            <button onClick={() => setIsBulkStatusModalOpen(false)} className="w-full mt-6 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-10 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Authorize Batch Purge?</h3>
            <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">This will permanently remove <b>{selectedIds.size}</b> selected files from the master archive. This action is irreversible.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black border-2 border-slate-100 rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleBulkDelete} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-100">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
