
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Patient, VisitRecord, LabTest, PatientDocument } from '../types';
import { LAB_TEST_CATALOG } from '../constants';
import Logo from './Logo';

interface DoctorConsultationProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => Promise<void> | void;
}

const VitalTrendChart: React.FC<{ 
  data: any[], 
  dataKey: string, 
  color: string, 
  title: string, 
  unit: string 
}> = ({ data, dataKey, color, title, unit }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2 h-44">
    <div className="flex items-center justify-between px-2">
      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title} ({unit})</h5>
      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: color }}></div>
    </div>
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" hide />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8}} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '9px', fontWeight: 'bold' }}
            labelClassName="text-slate-400 font-black"
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fillOpacity={1} fill={`url(#color${dataKey})`} animationDuration={1000} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DoctorConsultation: React.FC<DoctorConsultationProps> = ({ patients, onUpdatePatient }) => {
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', spo2: '' });
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLabPickerOpen, setIsLabPickerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [labSearchTerm, setLabSearchTerm] = useState('');
  const [queueSearchTerm, setQueueSearchTerm] = useState('');
  
  // Comparative History State
  const [comparingTestName, setComparingTestName] = useState<string | null>(null);

  // Staging for new orders
  const [pendingTestOrders, setPendingTestOrders] = useState<LabTest[]>([]);
  const [isCommittingOrders, setIsCommittingOrders] = useState(false);

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Scan/X-Ray');
  const [docName, setDocName] = useState('');
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);

  // Focus search input ref
  const labSearchRef = useRef<HTMLInputElement>(null);
  
  const activePatient = useMemo(() => {
    return patients.find(p => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  const stateRef = useRef({ activePatientId, description, vitals, activePatient });
  useEffect(() => {
    stateRef.current = { activePatientId, description, vitals, activePatient };
  }, [activePatientId, description, vitals, activePatient]);

  // Focus effect for search bar
  useEffect(() => {
    if (isLabPickerOpen) {
      const timer = setTimeout(() => labSearchRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isLabPickerOpen]);

  const performAutoSave = useCallback(async (isUnmounting = false) => {
    const { activePatientId: currentId, description: currentDesc, vitals: currentVitals, activePatient: currentPatient } = stateRef.current;
    if (!currentId || !currentPatient) return;
    const hasChanged = currentDesc !== (currentPatient.doctorDescription || '') || 
                       JSON.stringify(currentVitals) !== JSON.stringify(currentPatient.vitals || { bp: '', hr: '', temp: '', spo2: '' });
    if (hasChanged) {
      if (!isUnmounting) setSaveStatus('saving');
      try {
        await onUpdatePatient({ ...currentPatient, doctorDescription: currentDesc, vitals: currentVitals });
        if (!isUnmounting) {
          setLastAutoSave(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setSaveStatus('saved');
        }
      } catch (err) {
        if (!isUnmounting) setSaveStatus('error');
      }
    }
  }, [onUpdatePatient]);

  useEffect(() => {
    const interval = setInterval(() => performAutoSave(), 15000);
    return () => { clearInterval(interval); performAutoSave(true); };
  }, [performAutoSave]);

  const clinicalQueue = useMemo(() => {
    const filtered = patients.filter(p => ['Awaiting Doctor', 'In Consultation', 'Awaiting Lab'].includes(p.status));
    if (!queueSearchTerm.trim()) return filtered;
    const term = queueSearchTerm.toLowerCase().trim();
    return filtered.filter(p => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term));
  }, [patients, queueSearchTerm]);

  const filteredLabCatalog = useMemo(() => {
    const term = labSearchTerm.toLowerCase().trim();
    if (!term) return [...LAB_TEST_CATALOG].sort((a, b) => a.name.localeCompare(b.name));
    
    const tokens = term.split(/\s+/);
    return LAB_TEST_CATALOG.filter(test => {
      const searchTarget = `${test.name} ${test.id}`.toLowerCase();
      return tokens.every(token => searchTarget.includes(token));
    }).sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(term);
      const bStarts = bName.startsWith(term);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });
  }, [labSearchTerm]);

  const handleStartConsultation = async (p: Patient) => {
    if (activePatientId === p.id) return;
    setActivePatientId(p.id);
    setDescription(p.doctorDescription || '');
    setVitals(p.vitals || { bp: '', hr: '', temp: '', spo2: '' });
    setPendingTestOrders([]);
    setSaveStatus('idle');
    if (p.status === 'Awaiting Doctor') {
      await onUpdatePatient({ ...p, status: 'In Consultation' });
    }
  };

  const handleOpenLabPicker = () => {
    setLabSearchTerm('');
    setIsLabPickerOpen(true);
  };

  const togglePendingTest = (test: LabTest) => {
    setPendingTestOrders(prev => {
      const isAlreadyStaged = prev.some(t => t.id === test.id);
      if (isAlreadyStaged) {
        return prev.filter(t => t.id !== test.id);
      }
      if (activePatient?.requestedTests?.some(t => t.id === test.id)) {
        return prev;
      }
      return [...prev, { ...test, result: '' }];
    });
  };

  const handleCommitOrders = async () => {
    if (!activePatient || pendingTestOrders.length === 0) return;
    
    setIsCommittingOrders(true);
    try {
      const currentTests = activePatient.requestedTests || [];
      const updatedTests = [...currentTests, ...pendingTestOrders];
      
      await onUpdatePatient({
        ...activePatient,
        requestedTests: updatedTests,
        status: 'Awaiting Lab' 
      });
      
      setPendingTestOrders([]);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Order commit failure", error);
      setSaveStatus('error');
    } finally {
      setIsCommittingOrders(false);
    }
  };

  const handleRemovePendingTest = (testId: string) => {
    setPendingTestOrders(prev => prev.filter(t => t.id !== testId));
  };

  const totalStagedCost = useMemo(() => {
    return pendingTestOrders.reduce((sum, t) => sum + t.price, 0);
  }, [pendingTestOrders]);

  const handleUploadDocument = async () => {
    if (!activePatient || !selectedDocFile || !docName.trim()) return;
    setUploadingDoc(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const newDoc: PatientDocument = {
          id: `DOC-${Date.now()}`,
          name: docName,
          type: docType,
          data: base64Data,
          timestamp: new Date().toLocaleString()
        };

        const updatedDocs = [...(activePatient.documents || []), newDoc];
        await onUpdatePatient({ ...activePatient, documents: updatedDocs });
        
        setIsUploadModalOpen(false);
        setDocName('');
        setSelectedDocFile(null);
        setUploadingDoc(false);
      };
      reader.readAsDataURL(selectedDocFile);
    } catch (error) {
      console.error("Upload failure", error);
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!activePatient || !confirm("Permanently delete this clinical document?")) return;
    const updatedDocs = (activePatient.documents || []).filter(d => d.id !== docId);
    await onUpdatePatient({ ...activePatient, documents: updatedDocs });
  };

  const handleFinalizeClick = () => {
    if (!description.trim()) { alert("Clinical findings are mandatory."); return; }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmedFinalize = async () => {
    if (!activePatient) return;
    const hasPendingTests = activePatient.requestedTests && activePatient.requestedTests.length > 0;
    const newHistory: VisitRecord = {
      date: new Date().toISOString().split('T')[0],
      clinicType: activePatient.clinicType || 'Consultation',
      notes: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
      vitals: { ...vitals }
    };
    await onUpdatePatient({ 
      ...activePatient, 
      status: hasPendingTests ? 'Awaiting Lab' : 'Completed', 
      doctorDescription: description, 
      vitals: vitals, 
      history: [newHistory, ...(activePatient.history || [])] 
    });
    setIsConfirmModalOpen(false);
    setActivePatientId(null);
  };

  const handleVitalChange = (key: keyof typeof vitals, value: string) => {
    setVitals(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle'); 
  };

  const trendData = useMemo(() => {
    const historyPoints = [...(activePatient?.history || [])]
      .filter(h => h.vitals && (h.vitals.hr || h.vitals.temp || h.vitals.spo2 || h.vitals.bp))
      .reverse()
      .map(h => {
        const bpSystolic = h.vitals?.bp ? parseInt(h.vitals.bp.split('/')[0]) : NaN;
        return {
          name: h.date,
          HR: h.vitals?.hr ? parseFloat(h.vitals.hr) : null,
          TEMP: h.vitals?.temp ? parseFloat(h.vitals.temp) : null,
          SPO2: h.vitals?.spo2 ? parseFloat(h.vitals.spo2) : null,
          BP: isNaN(bpSystolic) ? null : bpSystolic
        };
      });

    const currentBpSystolic = vitals.bp ? parseInt(vitals.bp.split('/')[0]) : NaN;
    const currentPoint = {
      name: 'LIVE',
      HR: vitals.hr ? parseFloat(vitals.hr) : null,
      TEMP: vitals.temp ? parseFloat(vitals.temp) : null,
      SPO2: vitals.spo2 ? parseFloat(vitals.spo2) : null,
      BP: isNaN(currentBpSystolic) ? null : currentBpSystolic
    };

    return [...historyPoints, currentPoint];
  }, [activePatient, vitals]);

  // Comparative History Logic
  const historicalResultsForTest = useMemo(() => {
    if (!activePatient || !comparingTestName) return [];
    return (activePatient.labHistory || [])
      .map(entry => {
        const testMatch = entry.results.find(t => t.name === comparingTestName);
        return testMatch ? { date: entry.date, result: testMatch.result } : null;
      })
      .filter(entry => entry !== null) as { date: string, result: string | undefined }[];
  }, [activePatient, comparingTestName]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500 pb-6 overflow-hidden">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #doc-print-template, #doc-print-template * { visibility: visible; }
          #doc-print-template { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white; 
            padding: 0;
            color: black;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      {/* Sidebar Queue */}
      <div className="lg:col-span-3 flex flex-col min-h-0 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Consultation Queue</h3>
          <div className="relative mb-4">
             <input 
               type="text" 
               placeholder="Search patients..." 
               className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black focus:border-indigo-600 outline-none text-slate-950 placeholder-slate-400"
               value={queueSearchTerm}
               onChange={(e) => setQueueSearchTerm(e.target.value)}
             />
             <svg className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {clinicalQueue.map(p => (
              <div key={p.id} onClick={() => handleStartConsultation(p)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${activePatientId === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-1"><span className="font-black text-xs truncate pr-2">{p.name}</span><span className="text-[8px] font-bold opacity-60">#{p.id}</span></div>
                <div className="flex justify-between items-center"><p className={`text-[8px] font-black uppercase tracking-widest ${activePatientId === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>{p.clinicType}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Consultation Desk */}
      <div className="lg:col-span-9 flex flex-col min-h-0 no-print">
        {activePatient ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-full overflow-hidden">
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tight">{activePatient.name}</h4>
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase">
                  <span>{activePatient.age}Y • {activePatient.gender} • {activePatient.clinicType}</span>
                  {saveStatus === 'saving' && <span className="text-amber-500 animate-pulse flex items-center gap-1"><div className="w-1 h-1 bg-amber-500 rounded-full"></div> Autosaving...</span>}
                  {saveStatus === 'saved' && <span className="text-emerald-500">Synced {lastAutoSave}</span>}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4">
              {/* Demographics Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950 rounded-[1.25rem] border-2 border-slate-900 shadow-sm transition-all group overflow-hidden text-center">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">System ID</p>
                  <p className="text-lg font-black text-white group-hover:scale-105 transition-transform font-mono">{activePatient.id}</p>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-[1.25rem] border-2 border-indigo-100/50 shadow-sm transition-all hover:bg-indigo-50 text-center">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Blood Type</p>
                  <p className="text-lg font-black text-indigo-950">{activePatient.bloodType || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all hover:bg-slate-100/50 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-sm font-black text-slate-900 truncate">{activePatient.contact || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all hover:bg-slate-100/50 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">MRN</p>
                  <p className="text-sm font-black text-slate-900 truncate">{activePatient.medicalRecordNumber}</p>
                </div>
              </div>

              {/* Vitals Input */}
              <div className="grid grid-cols-4 gap-4">
                {['bp', 'hr', 'temp', 'spo2'].map(key => (
                  <div key={key} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus-within:border-indigo-600 focus-within:bg-white transition-all shadow-inner">
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">
                      {key === 'bp' ? 'BP (mmHg)' : key === 'hr' ? 'HR (bpm)' : key === 'temp' ? 'TEMP (°C)' : 'SPO2 (%)'}
                    </label>
                    <input 
                      className="w-full bg-transparent outline-none font-black text-slate-950 text-2xl placeholder-slate-300" 
                      value={vitals[key as keyof typeof vitals]} 
                      onChange={(e) => handleVitalChange(key as any, e.target.value)} 
                      placeholder={key === 'bp' ? "120/80" : "--"} 
                    />
                  </div>
                ))}
              </div>

              {/* Trends Section: Responsive 2x2 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VitalTrendChart data={trendData} dataKey="BP" color="#ef4444" title="Systolic Pressure" unit="mmHg" />
                <VitalTrendChart data={trendData} dataKey="HR" color="#6366f1" title="Heart Rate" unit="bpm" />
                <VitalTrendChart data={trendData} dataKey="TEMP" color="#f59e0b" title="Temperature" unit="°C" />
                <VitalTrendChart data={trendData} dataKey="SPO2" color="#10b981" title="Oxygen Saturation" unit="%" />
              </div>

              {/* Clinical Documents Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Medical Dossier (X-Rays & Reports)</h5>
                   <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-1.5 bg-slate-950 text-white text-[9px] font-black uppercase rounded-lg hover:bg-black transition-all shadow-md flex items-center gap-2">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     Add Clinical Media
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[180px]">
                  {activePatient.documents && activePatient.documents.length > 0 ? activePatient.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col h-44 animate-in zoom-in-95">
                      <div className="flex-1 flex items-center justify-center cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                        {doc.data.startsWith('data:image/') ? (
                          <img src={doc.data} alt={doc.name} className="max-h-full max-w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center shrink-0">
                        <p className="text-[10px] font-black text-slate-900 uppercase truncate px-2">{doc.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{doc.type}</p>
                      </div>
                      
                      {/* Delete Overlay */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-500 hover:text-white"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-300 opacity-60 italic py-10">
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">No digital records currently linked to this profile.<br/>Click "Add Clinical Media" to initiate upload.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Investigations Section */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Investigations Plan</h5>
                    <div className="flex flex-wrap gap-2">
                       <button onClick={handleOpenLabPicker} className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-3">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                         Browse Diagnostic Catalog
                       </button>
                    </div>
                 </div>

                 {/* Staged Orders (Before Commitment) */}
                 {pendingTestOrders.length > 0 && (
                   <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-8 bg-amber-50/50 rounded-[2.5rem] border-4 border-dashed border-amber-200/60 shadow-inner">
                        {pendingTestOrders.map(test => (
                           <div key={test.id} className="flex items-center justify-between px-5 py-4 bg-white border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow group animate-in zoom-in-95">
                              <div className="space-y-1">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{test.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-bold text-amber-600 uppercase">Uncommitted</span>
                                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Le {test.price.toLocaleString()}</span>
                                </div>
                              </div>
                              <button onClick={() => handleRemovePendingTest(test.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                           </div>
                        ))}
                     </div>
                     
                     <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-200 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-8">
                           <div className="text-white">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Aggregate Volume</p>
                              <p className="text-2xl font-black">{pendingTestOrders.length} Staged Item{pendingTestOrders.length !== 1 ? 's' : ''}</p>
                           </div>
                           <div className="h-10 w-px bg-white/20"></div>
                           <div className="text-white text-right md:text-left">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Financial Commitment</p>
                              <p className="text-2xl font-black text-amber-400">Le {totalStagedCost.toLocaleString()}</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleCommitOrders}
                          disabled={isCommittingOrders}
                          className="w-full md:w-auto px-12 py-5 bg-white text-indigo-700 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                        >
                          {isCommittingOrders ? (
                            <div className="w-5 h-5 border-3 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                          )}
                          Commit Orders
                        </button>
                     </div>
                   </div>
                 )}

                 {/* Committed Records (Historical/Authorized) */}
                 {activePatient.requestedTests && activePatient.requestedTests.length > 0 && (
                    <div className="space-y-3">
                       <h6 className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Verified Orders Log</h6>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                          {activePatient.requestedTests.map(test => (
                             <div key={test.id} className="flex flex-col gap-3 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{test.name}</p>
                                    <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-tighter">Ref: {test.id}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {activePatient.labHistory?.some(h => h.results.some(r => r.name === test.name)) && (
                                      <button 
                                        onClick={() => setComparingTestName(test.name)}
                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                                        title="Compare with history"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                      </button>
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                  </div>
                                </div>
                                
                                {test.result ? (
                                  <div className="mt-1 p-3 bg-slate-50 border-2 border-indigo-100 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Final Result Findings</p>
                                    <p className="text-sm font-black text-indigo-700 font-serif leading-tight">{test.result}</p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                    <p className="text-[9px] font-black text-amber-600 uppercase">Analysis in progress</p>
                                  </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Clinical Findings */}
              <div className="pt-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Physician Assessment Findings & Plan</label>
                <textarea 
                  className="w-full p-10 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-[2.5rem] h-[450px] outline-none resize-none text-slate-950 font-bold text-xl leading-relaxed shadow-inner placeholder-slate-300 transition-all" 
                  placeholder="Record patient presentation, differential diagnosis, clinical rationale..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4 shrink-0 no-print">
              <button onClick={() => window.print()} className="px-10 py-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white border border-slate-200 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Export Clinical Report
              </button>
              <button onClick={handleFinalizeClick} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-2xl transition-all">Archive Case & Finalize Session</button>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-inner flex flex-col items-center justify-center text-slate-400 opacity-40 uppercase tracking-widest font-black text-[10px] space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
             <span>Select patient from queue to initialize encounter</span>
          </div>
        )}
      </div>

      {/* Lab Picker Refinement */}
      {isLabPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6 shrink-0">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Diagnostic Catalog</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Medical Investigation Database</p>
               </div>
               <button onClick={() => setIsLabPickerOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            {/* Selection Staging Area (In-Modal) */}
            {pendingTestOrders.length > 0 && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2 shrink-0">
                 <div className="flex justify-between items-center mb-3 px-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Current Selection Set ({pendingTestOrders.length})</p>
                    <p className="text-[10px] font-black text-slate-950 uppercase">Total: Le {totalStagedCost.toLocaleString()}</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {pendingTestOrders.map(t => (
                      <div key={t.id} className="bg-white px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-2 shadow-sm">
                        <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[120px]">{t.name}</span>
                        <span className="text-[9px] font-bold text-indigo-500">Le {t.price.toLocaleString()}</span>
                        <button onClick={() => handleRemovePendingTest(t.id)} className="text-slate-300 hover:text-red-500 ml-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            
            <div className="relative mb-6 shrink-0 group">
               <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 ref={labSearchRef}
                 type="text" 
                 placeholder="Search diagnostics by name or ID (e.g. 'FBC' or 'LT001')..." 
                 className="w-full pl-12 pr-12 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-black text-slate-950 text-base shadow-inner transition-all"
                 value={labSearchTerm}
                 onChange={(e) => setLabSearchTerm(e.target.value)}
               />
               {labSearchTerm && (
                 <button 
                   onClick={() => setLabSearchTerm('')}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                   title="Clear search"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-4">
               {filteredLabCatalog.length > 0 ? filteredLabCatalog.map(test => {
                 const isStaged = pendingTestOrders.some(t => t.id === test.id);
                 const isOrdered = activePatient?.requestedTests?.some(t => t.id === test.id);
                 return (
                   <button 
                     key={test.id} 
                     disabled={isOrdered}
                     onClick={() => togglePendingTest(test)}
                     className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                       isOrdered ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' :
                       isStaged ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-x-1' : 
                       'bg-white border-slate-100 hover:border-indigo-200'
                     }`}
                   >
                     <div className="text-left">
                       <p className={`font-black uppercase tracking-tight text-sm ${isStaged ? 'text-white' : 'text-slate-900'}`}>{test.name}</p>
                       <p className={`text-[9px] font-black uppercase mt-1 ${isStaged ? 'text-indigo-100' : 'text-slate-400'}`}>System Ref: {test.id}</p>
                     </div>
                     <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className={`text-sm font-black ${isStaged ? 'text-white' : 'text-indigo-600'}`}>Le {test.price.toLocaleString()}</p>
                          {isOrdered && <p className="text-[7px] font-bold text-slate-400 uppercase">Already Committed</p>}
                       </div>
                       <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isStaged ? 'bg-white border-white text-indigo-600' : 'bg-slate-50 border-slate-200 text-transparent group-hover:border-indigo-300'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
                     </div>
                   </button>
                 );
               }) : (
                 <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="font-black uppercase tracking-[0.3em] text-xs">No diagnostic matches for "{labSearchTerm}"</p>
                 </div>
               )}
            </div>

            <div className="pt-6 border-t border-slate-100 shrink-0 mt-2">
               <button onClick={() => setIsLabPickerOpen(false)} className="w-full py-6 bg-slate-950 text-white font-black rounded-2xl shadow-2xl uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]">Confirm Staging & Return</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparative History Modal */}
      {comparingTestName && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[250] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-10 flex flex-col animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Longitudinal Comparison</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Investigation: {comparingTestName}</p>
               </div>
               <button onClick={() => setComparingTestName(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Date Recorded</th>
                      <th className="px-6 py-4">Analytical Findings</th>
                      <th className="px-6 py-4 text-right">Reference Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historicalResultsForTest.map((entry, idx) => {
                      const nextEntry = historicalResultsForTest[idx + 1];
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-900">{entry.date}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pathology Archive</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-black rounded-xl border border-indigo-100 font-serif">
                              {entry.result || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             {nextEntry ? (
                               <div className="flex flex-col items-end">
                                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                  <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Sequential Entry</span>
                               </div>
                             ) : (
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">Baseline</span>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
               {historicalResultsForTest.length === 0 && (
                 <div className="py-20 text-center opacity-30">
                    <p className="font-black uppercase tracking-[0.4em] text-xs">No prior historical data found for this investigation</p>
                 </div>
               )}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-2">
               <button onClick={() => setComparingTestName(null)} className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-black transition-all">Close Analytics View</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in-95 duration-200 border-t-8 border-slate-950">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Clinical Media Upload</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Document Reference Name</label>
                  <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-slate-900 shadow-inner placeholder-slate-300" placeholder="e.g. Thoracic X-Ray AP View" value={docName} onChange={e => setDocName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Classification Type</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-slate-900 shadow-inner" value={docType} onChange={e => setDocType(e.target.value)}>
                    <option>Scan/X-Ray</option>
                    <option>Lab Report</option>
                    <option>External Referral</option>
                    <option>Prescription Photo</option>
                  </select>
                </div>
                <div className="relative group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure File Selection</label>
                  <div className={`w-full p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-3 ${selectedDocFile ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}>
                    <svg className={`w-10 h-10 ${selectedDocFile ? 'text-indigo-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">
                      {selectedDocFile ? selectedDocFile.name : 'Click to select medical file'}
                    </span>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={e => setSelectedDocFile(e.target.files?.[0] || null)} 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUploadDocument}
                  disabled={uploadingDoc || !selectedDocFile || !docName.trim()}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploadingDoc ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                  Authorize & Upload Record
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Enhanced Document Preview Modal with Metadata Sidebar */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-6 no-print animate-in fade-in duration-300">
          <div className="relative bg-white rounded-[3rem] w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[90vh] overflow-hidden">
             
             {/* Content Viewer (Main Section) */}
             <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
                <div className="px-10 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate max-w-md">{previewDoc.name}</h3>
                   </div>
                   <div className="flex gap-3">
                      <a href={previewDoc.data} download={previewDoc.name} className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Original
                      </a>
                      <button onClick={() => setPreviewDoc(null)} className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-auto p-10 flex items-center justify-center">
                   {previewDoc.data.startsWith('data:image/') ? (
                     <div className="relative group max-w-full max-h-full">
                       <img 
                         src={previewDoc.data} 
                         alt={previewDoc.name} 
                         className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl ring-8 ring-white" 
                       />
                       <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all pointer-events-none rounded-2xl"></div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-6 text-slate-300">
                        <div className="w-32 h-32 bg-white rounded-[2rem] border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-200">
                           <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="text-center space-y-2">
                           <p className="font-black text-slate-500 text-lg uppercase tracking-widest">Document Container Ready</p>
                           <p className="text-sm font-bold text-slate-400">File format requires external viewer. Click download to open locally.</p>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Metadata Sidebar */}
             <div className="w-full md:w-80 bg-white border-l border-slate-200 p-8 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Clinical Meta-Profile</h4>
                
                <div className="space-y-8">
                   <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">File Classification</p>
                      <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <p className="text-xs font-black text-indigo-700 uppercase tracking-tight">{previewDoc.type}</p>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Record ID</p>
                      <p className="text-sm font-mono font-bold text-slate-600 break-all bg-slate-50 p-2 rounded-lg">{previewDoc.id}</p>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal Signature</p>
                      <div className="flex items-center gap-2 text-slate-800">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs font-black">{previewDoc.timestamp.split(',')[0]}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 mt-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs font-black">{previewDoc.timestamp.split(',')[1]?.trim()}</p>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-100">
                      <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-3">Linked Patient Archive</p>
                         <p className="text-lg font-black tracking-tight leading-none truncate mb-2">{activePatient.name}</p>
                         <div className="flex items-center gap-2 opacity-60">
                           <span className="text-[9px] font-bold uppercase">HMS ID:</span>
                           <span className="text-[9px] font-mono font-bold">{activePatient.id}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-10">
                   <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Clinical Disclaimer
                      </p>
                      <p className="text-[8px] font-bold text-amber-700/70 leading-relaxed uppercase">Internal hospital use only. Verify media against physical file for critical diagnostic interventions.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200 border-t-8 border-indigo-600">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-slate-900">Authorize Dispatch?</h3>
            <p className="text-sm text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">This will commit clinical assessment findings to the patient's permanent digital archive.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest">Hold, Edit More</button>
              <button onClick={handleConfirmedFinalize} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">Commit Encounter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultation;
