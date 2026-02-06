
import React, { useState, useMemo } from 'react';
import { SurgicalRecord, Patient } from '../types';

interface SurgicalTheaterProps {
  surgeries: SurgicalRecord[];
  patients: Patient[];
  onUpsertSurgery: (record: SurgicalRecord) => void;
}

const SurgicalTheater: React.FC<SurgicalTheaterProps> = ({ surgeries, patients, onUpsertSurgery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    patientId: '',
    procedure: '',
    surgeon: '',
    theater: 'OR-01',
    anesthesia: 'General',
    status: 'Scheduled' as any
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newLog.patientId);
    if (!patient) return;

    onUpsertSurgery({
      id: `SURG-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      procedure: newLog.procedure,
      surgeon: newLog.surgeon,
      theaterRoom: newLog.theater,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString(),
      anesthesiaType: newLog.anesthesia,
      status: newLog.status
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Theater Command</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Live Operative Procedures Registry</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          Log New Procedure
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {surgeries.map(surg => (
          <div key={surg.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                surg.status === 'Ongoing' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}>
                {surg.status}
              </span>
              <span className="text-[10px] font-bold text-slate-300 font-mono">#{surg.id}</span>
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">{surg.procedure}</h4>
            <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Surgeon: <span className="text-indigo-600">{surg.surgeon}</span></p>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
               <div><p className="text-[9px] font-black text-slate-400 uppercase">Theater</p><p className="text-sm font-black text-slate-800">{surg.theaterRoom}</p></div>
               <div><p className="text-[9px] font-black text-slate-400 uppercase">Patient</p><p className="text-sm font-black text-slate-800 truncate">{surg.patientName}</p></div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="p-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase mb-10">Initialize Operative Log</h3>
                <form onSubmit={handleAddSubmit} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Patient</label>
                      <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={newLog.patientId} onChange={e => setNewLog({...newLog, patientId: e.target.value})}>
                        <option value="">Select patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.medicalRecordNumber})</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Procedure Nomenclature</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" placeholder="e.g. Appendectomy" value={newLog.procedure} onChange={e => setNewLog({...newLog, procedure: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Lead Surgeon</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" placeholder="Dr. Gregory House" value={newLog.surgeon} onChange={e => setNewLog({...newLog, surgeon: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Theater Suite</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={newLog.theater} onChange={e => setNewLog({...newLog, theater: e.target.value})}>
                          <option>OR-01</option><option>OR-02</option><option>Cardiac Suite</option><option>Emergency Theater</option>
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-red-700 shadow-xl uppercase tracking-widest">Commit Procedure Log</button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurgicalTheater;
