
import React, { useState, useMemo } from 'react';
import { Patient, VisitRecord } from '../types';

interface MedicalRecordsArchiveProps {
  patients: Patient[];
}

const MedicalRecordsArchive: React.FC<MedicalRecordsArchiveProps> = ({ patients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients.slice(0, 8);
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-6">Clinical Archive Gateway</h2>
        <div className="relative">
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Retrieve patient dossiers by name, MRN, or system ID..." 
            className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] outline-none transition-all font-black text-xl text-slate-950 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredPatients.map(p => (
            <button 
              key={p.id} 
              onClick={() => setSelectedPatientId(p.id)}
              className={`w-full p-6 text-left rounded-[2rem] border-2 transition-all group ${
                selectedPatientId === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white border-slate-100 hover:border-indigo-300'
              }`}
            >
              <h4 className="font-black text-lg leading-tight">{p.name}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPatientId === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>MRN: {p.medicalRecordNumber}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${selectedPatientId === p.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{p.history.length} ENCOUNTERS</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8">
          {selectedPatient ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-10 animate-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-end border-b border-slate-100 pb-10">
                  <div>
                    <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">{selectedPatient.name}</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Life-Course Clinical Investigation Log</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Record Index</p>
                    <p className="text-2xl font-mono font-black text-indigo-600">{selectedPatient.medicalRecordNumber}</p>
                  </div>
               </div>

               <div className="space-y-8">
                  {selectedPatient.history.map((record, idx) => (
                    <div key={idx} className="relative pl-10 border-l-4 border-slate-100">
                       <div className="absolute left-[-12px] top-0 w-5 h-5 rounded-full bg-white border-4 border-indigo-600"></div>
                       <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-6">
                             <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200">{record.clinicType} Encounter</span>
                             <span className="text-sm font-black text-slate-900">{record.date}</span>
                          </div>
                          <p className="text-slate-700 font-medium text-lg leading-relaxed italic">"{record.notes}"</p>
                          {record.vitals && (
                            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-4 gap-4">
                               {Object.entries(record.vitals).map(([k, v]) => (
                                 <div key={k} className="text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.toUpperCase()}</p>
                                    <p className="text-xs font-black text-slate-800">{v || '--'}</p>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-20 opacity-40">
               <svg className="w-20 h-20 text-slate-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               <h4 className="text-2xl font-black text-slate-900 uppercase mb-2">Longitudinal Records Viewer</h4>
               <p className="max-w-xs font-bold text-slate-500 uppercase text-xs tracking-widest">Select a patient from the directory to initialize the medical archive stream.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsArchive;
