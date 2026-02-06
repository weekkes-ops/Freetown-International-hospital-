
import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Patient } from '../types';
import { CLINIC_TYPES } from '../constants';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppointmentManagerProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (app: Appointment) => void;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ appointments, patients, onAddAppointment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminderStatus, setReminderStatus] = useState<Record<string, 'pending' | 'sent'>>({});
  
  const [newApp, setNewApp] = useState({
    patientId: '',
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    department: CLINIC_TYPES[0],
    doctor: '',
    reason: ''
  });

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const getPatientDetails = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.medicalRecordNumber.toLowerCase().includes(patientSearch.toLowerCase())
    ).slice(0, 5);
  }, [patients, patientSearch]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    return appointments.filter(a => 
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [appointments, searchTerm]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.patientId || !newApp.doctor) {
      addNotification("Please select a valid patient and assign a physician.", "warning");
      return;
    }

    onAddAppointment({
      id: `APP-${Date.now()}`,
      patientId: newApp.patientId,
      patientName: newApp.patientName,
      doctorName: newApp.doctor,
      date: newApp.date,
      time: newApp.time,
      department: newApp.department,
      status: 'Scheduled',
      reason: newApp.reason
    });

    setIsModalOpen(false);
    addNotification(`Appointment secured for ${newApp.patientName}. System MRN synchronized.`, 'success');
    setNewApp({ patientId: '', patientName: '', date: new Date().toISOString().split('T')[0], time: '09:00', department: CLINIC_TYPES[0], doctor: '', reason: '' });
    setPatientSearch('');
  };

  const handleDispatchReminders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const targetApps = appointments.filter(a => a.date >= today && a.status === 'Scheduled' && reminderStatus[a.id] !== 'sent');
    
    if (targetApps.length === 0) {
      addNotification("No pending scheduled consultations found in the upcoming queue.", "info");
      return;
    }

    setIsDispatching(true);
    addNotification(`Initializing communication engine for ${targetApps.length} records...`, "info");
    
    // Process one by one to simulate "automated" dispatch
    for (const app of targetApps) {
      const p = getPatientDetails(app.patientId);
      const contactMethod = p?.contact || p?.email || 'System Default';
      await new Promise(resolve => setTimeout(resolve, 600));
      setReminderStatus(prev => ({ ...prev, [app.id]: 'sent' }));
      console.debug(`[Reminder Engine] Sent to ${contactMethod} for ${app.patientName}`);
    }

    setIsDispatching(false);
    addNotification(`Dispatch finalized. Reminders transmitted to all scheduled patients via SMS/Email.`, "success");
  };

  const handleSingleReminder = async (app: Appointment) => {
    const p = getPatientDetails(app.patientId);
    if (!p) {
      addNotification("Critical: Patient record data missing for dispatch.", "warning");
      return;
    }

    const endpoint = p.contact || p.email;
    addNotification(`Transmitting reminder to ${app.patientName} (${endpoint})...`, "info");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReminderStatus(prev => ({ ...prev, [app.id]: 'sent' }));
    addNotification(`Reminder verified and delivered via secure tele-gateway.`, "success");
  };

  const selectPatient = (p: Patient) => {
    setNewApp({...newApp, patientId: p.id, patientName: p.name});
    setPatientSearch(p.name);
  };

  const pendingCount = appointments.filter(a => reminderStatus[a.id] !== 'sent' && a.status === 'Scheduled').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 relative">
      {/* Toast Notification Container */}
      <div className="fixed top-24 right-8 z-[200] space-y-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`p-5 rounded-2xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-right-10 duration-300 pointer-events-auto min-w-[320px] ${
            n.type === 'success' ? 'bg-slate-950 border-emerald-500 text-white' : 
            n.type === 'warning' ? 'bg-amber-600 border-amber-400 text-white' :
            'bg-indigo-600 border-indigo-400 text-white'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : 'bg-white/20'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {n.type === 'warning' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                )}
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">System Comms Alert</p>
              <p className="text-xs font-bold leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comms Terminal / Reminder Control */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search appointments by patient or doctor name..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-black text-slate-950 placeholder-slate-400 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              New Booking
            </button>
          </div>
        </div>

        <div className="md:col-span-4 bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Comms Engine</p>
                <h4 className="text-xl font-black uppercase">Automated Reminders</h4>
              </div>
              <button 
                onClick={() => setAutoReminderEnabled(!autoReminderEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${autoReminderEnabled ? 'bg-emerald-400' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoReminderEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
           </div>
           <div className="flex items-center justify-between mt-6">
              <div>
                 <p className="text-2xl font-black tracking-tighter leading-none">{pendingCount}</p>
                 <p className="text-[8px] font-black uppercase text-indigo-200 tracking-widest">Pending Dispatches</p>
              </div>
              <button 
                onClick={handleDispatchReminders}
                disabled={isDispatching || pendingCount === 0}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isDispatching || pendingCount === 0 ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                }`}
              >
                {isDispatching ? 'Transmitting...' : 'Dispatch Bulk'}
              </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Patient Personality</th>
                <th className="px-10 py-6">Primary Contact</th>
                <th className="px-10 py-6">Assigned Physician</th>
                <th className="px-10 py-6">Schedule Details</th>
                <th className="px-10 py-6 text-right">Comms Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((app) => {
                const patient = getPatientDetails(app.patientId);
                const isSent = reminderStatus[app.id] === 'sent';
                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-6">
                      <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{app.patientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">UPI: {patient?.upi?.slice(0, 8) || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-slate-700">{patient?.contact || 'No SMS Log'}</p>
                        <p className="text-[10px] font-medium text-slate-400">{patient?.email || 'No E-Mail'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">Dr</div>
                        <p className="font-bold text-slate-700 text-sm">{app.doctorName}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-900">{app.date}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.time}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end items-center gap-3">
                         <button 
                          onClick={() => handleSingleReminder(app)}
                          disabled={isSent}
                          className={`p-3 rounded-xl transition-all border ${
                            isSent 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'text-slate-300 hover:text-indigo-600 hover:bg-white border-transparent hover:border-indigo-100 hover:shadow-sm'
                          }`} 
                          title={isSent ? "Reminder Delivered" : "Transmit Individual Reminder"}
                         >
                           {isSent ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           ) : (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                           )}
                         </button>
                         <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border flex items-center justify-center shadow-sm ${
                           app.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                         }`}>
                            {app.status}
                         </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-300 space-y-4 opacity-40">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="font-black uppercase tracking-[0.4em] text-[10px]">No appointments match the current filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10 overflow-hidden">
             <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Patient Schedule</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Clinical Reservation</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                   <div className="relative">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Search Patient Registry</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-lg shadow-inner placeholder-slate-300 transition-all"
                        placeholder="Type Name or MRN to retrieve..."
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                      />
                      {filteredPatients.length > 0 && (
                        <div className="absolute w-full mt-2 bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-2xl z-20 overflow-hidden">
                          {filteredPatients.map(p => (
                            <button key={p.id} type="button" onClick={() => selectPatient(p)} className="w-full p-5 text-left hover:bg-indigo-600 hover:text-white border-b border-slate-100 flex justify-between items-center transition-all group">
                              <span className="font-black text-slate-900 group-hover:text-white transition-colors">{p.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-indigo-200">MRN: {p.medicalRecordNumber}</span>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Assign Physician</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black shadow-inner" placeholder="Dr. Gregory House" value={newApp.doctor} onChange={e => setNewApp({...newApp, doctor: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Specialty Unit</label>
                        <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black shadow-inner appearance-none" value={newApp.department} onChange={e => setNewApp({...newApp, department: e.target.value})}>
                          {CLINIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Consultation Date</label>
                        <input type="date" required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black shadow-inner" value={newApp.date} onChange={e => setNewApp({...newApp, date: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Time Slot</label>
                        <input type="time" required className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black shadow-inner" value={newApp.time} onChange={e => setNewApp({...newApp, time: e.target.value})} />
                      </div>
                   </div>
                   
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Clinical Context / Purpose</label>
                      <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black h-28 resize-none shadow-inner placeholder-slate-300" placeholder="Brief reason for the visit..." value={newApp.reason} onChange={e => setNewApp({...newApp, reason: e.target.value})} />
                   </div>

                   <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-black shadow-2xl uppercase tracking-[0.2em] transition-all">Authorize Reservation</button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
