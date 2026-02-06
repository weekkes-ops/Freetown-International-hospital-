
import React, { useState, useMemo, useEffect } from 'react';
import { Patient, LabTest, VisitRecord } from '../types';
import Logo from './Logo';

interface LaboratoryDeskProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  labTests: LabTest[];
  onAddLabTest: (test: LabTest) => void;
}

const LaboratoryDesk: React.FC<LaboratoryDeskProps> = ({ patients, onUpdatePatient, labTests, onAddLabTest }) => {
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAddSampleModalOpen, setIsAddSampleModalOpen] = useState(false);
  const [newCatalogTest, setNewCatalogTest] = useState({ name: '', price: '' });
  const [testSearch, setTestSearch] = useState('');
  const [catalogSuccess, setCatalogSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const awaitingLab = useMemo(() => {
    return patients.filter(p => {
      const hasTests = p.requestedTests && p.requestedTests.length > 0;
      const allTested = hasTests && p.requestedTests?.every(t => t.result && t.result.trim() !== '');
      return (p.status === 'Awaiting Lab') || (hasTests && !allTested && p.status !== 'Completed' && p.status !== 'Discharged');
    });
  }, [patients]);

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === activePatientId) || null;
  }, [patients, activePatientId]);

  const availableTests = useMemo(() => {
    if (!testSearch.trim()) return labTests;
    const term = testSearch.toLowerCase().trim();
    return labTests.filter(t => 
      t.name.toLowerCase().includes(term) || 
      t.id.toLowerCase().includes(term)
    );
  }, [labTests, testSearch]);

  const calculateProgress = (p: Patient) => {
    if (!p.requestedTests?.length) return 0;
    const completed = p.requestedTests.filter(t => (results[t.id] || t.result)?.trim()).length;
    return Math.round((completed / p.requestedTests.length) * 100);
  };

  const handleStartLab = (p: Patient) => {
    setActivePatientId(p.id);
    const initialResults: Record<string, string> = {};
    p.requestedTests?.forEach(t => {
      initialResults[t.id] = t.result || '';
    });
    setResults(initialResults);
    setIsAddSampleModalOpen(false);
    setSaveStatus('idle');
  };

  const handleResultChange = (testId: string, val: string) => {
    setResults(prev => ({ ...prev, [testId]: val }));
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const handleSaveProgress = () => {
    if (!activePatient) return;
    setSaveStatus('saving');
    
    const updatedTests = activePatient.requestedTests?.map(t => ({
      ...t,
      result: results[t.id] !== undefined ? results[t.id] : t.result
    }));

    onUpdatePatient({
      ...activePatient,
      requestedTests: updatedTests
    });

    setTimeout(() => setSaveStatus('saved'), 600);
  };

  const handleCompleteLab = () => {
    const latestPatient = patients.find(p => p.id === activePatientId);
    if (!latestPatient) return;
    
    const updatedTests = latestPatient.requestedTests?.map(t => ({
      ...t,
      result: results[t.id] !== undefined ? results[t.id] : t.result
    })) || [];

    const date = new Date().toISOString().split('T')[0];
    const newHistory: VisitRecord = {
      date: date,
      clinicType: 'Laboratory',
      notes: `Investigation results committed for: ${updatedTests.map(t => t.name).join(', ')}. All tests processed and dispatched.`
    };

    const newLabEntry = {
      date: date,
      results: updatedTests
    };

    onUpdatePatient({
      ...latestPatient,
      status: 'Completed',
      requestedTests: updatedTests,
      labHistory: [newLabEntry, ...(latestPatient.labHistory || [])],
      history: [newHistory, ...latestPatient.history]
    });

    setActivePatientId(null);
    setResults({});
    setSaveStatus('idle');
  };

  const handlePrintReport = () => {
    if (!activePatient) return;
    setTimeout(() => window.print(), 100);
  };

  const handleAddSampleToPatient = (test: LabTest) => {
    if (!activePatient) return;
    const testInstance = { ...test, result: '', id: `LT-${Date.now()}-${Math.floor(Math.random()*100)}` };
    const updatedTests = [...(activePatient.requestedTests || []), testInstance];
    
    onUpdatePatient({ ...activePatient, requestedTests: updatedTests });
    setResults(prev => ({ ...prev, [testInstance.id]: '' }));
    setIsAddSampleModalOpen(false);
    setTestSearch('');
  };

  const handleRemoveInvestigation = (testId: string) => {
    if (!activePatient) return;
    const updatedTests = activePatient.requestedTests?.filter(t => t.id !== testId) || [];
    onUpdatePatient({ ...activePatient, requestedTests: updatedTests });
    const newResults = { ...results };
    delete newResults[testId];
    setResults(newResults);
  };

  const handleAddTestToCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newCatalogTest.price);
    if (!newCatalogTest.name || isNaN(priceNum)) return;
    onAddLabTest({ 
      id: `LT${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
      name: newCatalogTest.name, 
      price: priceNum 
    });
    setCatalogSuccess(true);
    setNewCatalogTest({ name: '', price: '' });
    setTimeout(() => { setCatalogSuccess(false); setIsCatalogModalOpen(false); }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-12 relative h-[calc(100vh-140px)] overflow-hidden">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #lab-print-template, #lab-print-template * { visibility: visible; }
          #lab-print-template { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white; 
            padding: 0;
            color: black;
          }
          .no-print { display: none !important; }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>

      {/* Optimized Printable Lab Report Template */}
      {activePatient && (
        <div id="lab-print-template" className="hidden print:block font-sans text-slate-900">
          <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <Logo className="w-16 h-16" />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Freetown International</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-2">Department of Diagnostic Pathology • Official Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lab Ref No.</p>
              <p className="text-xl font-mono font-black">LAB-{activePatient.id}-{new Date().getTime().toString().slice(-4)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b border-slate-100">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Patient Information</h2>
              <p className="text-3xl font-black mb-1">{activePatient.name}</p>
              <div className="flex gap-4 text-sm font-bold text-slate-600">
                <span>Age: {activePatient.age}Y</span>
                <span>Sex: {activePatient.gender}</span>
                <span>ID: {activePatient.id}</span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Clinical Context</h2>
              <p className="text-sm font-bold">Requesting Dept: <span className="uppercase">{activePatient.clinicType || 'Internal Medicine'}</span></p>
              <p className="text-sm font-bold">Date Processed: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-6 mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investigation Findings</h2>
            <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Test Description</th>
                    <th className="px-8 py-4">Observation / Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePatient.requestedTests?.map(test => (
                    <tr key={test.id}>
                      <td className="px-8 py-6 align-top">
                        <p className="font-black uppercase text-sm">{test.name}</p>
                        <p className="text-[8px] font-mono text-slate-400 mt-1">REF: {test.id}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic font-serif text-lg text-slate-800 whitespace-pre-wrap">
                          {results[test.id] || test.result || "Investigation pending authorization"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-20">
             <div className="text-center">
                <div className="border-b border-slate-300 w-full mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-400">Lead Laboratory Technician</p>
             </div>
             <div className="text-center">
                <div className="border-b border-slate-300 w-full mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-400">Authorizing Pathologist</p>
             </div>
          </div>
          <p className="mt-20 text-center text-[8px] font-bold text-slate-400 uppercase tracking-[0.5em]">This is an electronically verified clinical report from FIH-HMS</p>
        </div>
      )}

      {/* Catalog Modal */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[250] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Diagnostic Catalog</h3>
                <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <form onSubmit={handleAddTestToCatalog} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Investigation Name</label>
                  <input required className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" placeholder="e.g. PCR Covid-19" value={newCatalogTest.name} onChange={e => setNewCatalogTest({...newCatalogTest, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fee (Sierra Leonean Leones)</label>
                  <input required type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" placeholder="Le 0.00" value={newCatalogTest.price} onChange={e => setNewCatalogTest({...newCatalogTest, price: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest">
                  {catalogSuccess ? 'Entry Added' : 'Register New Test'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Add Sample Modal */}
      {isAddSampleModalOpen && activePatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[250] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Request Extra Investigation</h3>
                <button onClick={() => setIsAddSampleModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <div className="mb-6 shrink-0 relative">
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Search catalog by name or ID (e.g., LT001)..." 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-950 text-sm placeholder-slate-400 transition-all focus:border-indigo-600"
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  autoFocus
                />
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {availableTests.map(test => (
                  <button key={test.id} onClick={() => handleAddSampleToPatient(test)} className="w-full p-4 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white flex justify-between items-center transition-all group border border-transparent hover:border-indigo-400">
                     <div className="text-left">
                       <span className="font-black uppercase text-xs tracking-tight block">{test.name}</span>
                       <span className="text-[8px] font-bold opacity-40 uppercase">Ref: {test.id}</span>
                     </div>
                     <span className="text-[10px] font-black text-indigo-600 group-hover:text-white">Le {test.price.toLocaleString()}</span>
                  </button>
                ))}
                {availableTests.length === 0 && (
                  <div className="py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">No matching diagnostics found</div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Sidebar Queue */}
      <div className="lg:col-span-4 flex flex-col gap-6 min-h-0 no-print">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Laboratory Intake Log</h3>
            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase">{awaitingLab.length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {awaitingLab.map(p => {
              const progress = calculateProgress(p);
              return (
                <button 
                  key={p.id} 
                  onClick={() => handleStartLab(p)} 
                  className={`w-full p-5 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group ${
                    activePatientId === p.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-x-1' 
                      : 'bg-slate-50 border-transparent hover:border-indigo-100 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-sm truncate mr-2 uppercase tracking-tight">{p.name}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${activePatientId === p.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>#{p.id}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.requestedTests?.slice(0, 3).map(t => (
                      <span key={t.id} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${activePatientId === p.id ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                        {t.name.split(' ')[0]}
                      </span>
                    ))}
                    {(p.requestedTests?.length || 0) > 3 && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${activePatientId === p.id ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>+{(p.requestedTests?.length || 0) - 3}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                       <span className={activePatientId === p.id ? 'text-indigo-100' : 'text-slate-400'}>Analytics Progress</span>
                       <span className={activePatientId === p.id ? 'text-white' : 'text-indigo-600'}>{progress}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${activePatientId === p.id ? 'bg-white/10' : 'bg-slate-200'}`}>
                       <div className={`h-full transition-all duration-500 ${activePatientId === p.id ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </button>
              );
            })}
            {awaitingLab.length === 0 && (
               <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-[10px]">No pending diagnostics</div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm shrink-0">
           <button onClick={() => setIsCatalogModalOpen(true)} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">Update Diagnostic Catalog</button>
        </div>
      </div>

      {/* Main Investigation Desk */}
      <div className="lg:col-span-8 flex flex-col min-h-0 no-print">
        {activePatient ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col h-full overflow-hidden border-t-8 border-t-indigo-600">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8 shrink-0">
              <div className="space-y-1">
                <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{activePatient.name}</h4>
                <div className="flex items-center gap-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                     Diagnostic Station • Logged ID: {activePatient.id}
                   </p>
                   {saveStatus === 'saving' && <span className="text-amber-500 text-[9px] font-black uppercase animate-pulse flex items-center gap-1"><svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Autocommiting...</span>}
                   {saveStatus === 'saved' && <span className="text-emerald-500 text-[9px] font-black uppercase flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Results Synced</span>}
                </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIsAddSampleModalOpen(true)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                   Add Sample
                 </button>
                 <button onClick={handleSaveProgress} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm">Commit Progress</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4">
              {activePatient.requestedTests?.map(test => {
                const hasData = (results[test.id] || '').trim().length > 0;
                return (
                  <div key={test.id} className={`p-8 rounded-[2.5rem] border-2 transition-all relative group shadow-sm ${hasData ? 'bg-white border-emerald-500' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-950 text-xl uppercase tracking-tight">{test.name}</span>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${hasData ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                            {hasData ? 'Verification Ready' : 'Analytics Pending'}
                          </span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Reference Index: {test.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasData && (
                          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <button 
                          onClick={() => handleRemoveInvestigation(test.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-xl border border-transparent hover:border-red-100"
                          title="Discard Analysis"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute top-4 left-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none select-none">Analytical Findings</div>
                      <textarea 
                        className={`w-full p-8 pt-10 bg-white border-2 rounded-[2rem] outline-none text-slate-950 font-black text-xl shadow-inner resize-none h-40 placeholder-slate-200 transition-all ${
                          hasData ? 'border-emerald-100 focus:border-emerald-500' : 'border-slate-200 focus:border-indigo-600'
                        }`} 
                        placeholder="Enter quantitative values (e.g., RBC 4.5), morphological observations, or interpretive text..." 
                        value={results[test.id] || ''} 
                        onChange={e => handleResultChange(test.id, e.target.value)} 
                      />
                    </div>
                    <div className="mt-4 flex justify-between items-center px-4">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verify typical reference ranges before submission.</p>
                       <span className="text-[8px] font-black text-slate-300 uppercase">System Time: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
              {(!activePatient.requestedTests || activePatient.requestedTests.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 opacity-40">
                     <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <p className="max-w-xs text-slate-400 font-black uppercase text-xs tracking-widest opacity-40">No investigation requests found for this patient file. Use the 'Add Sample' gate to initialize a new request.</p>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-slate-100 flex gap-4 shrink-0 no-print">
              <button onClick={handlePrintReport} className="flex-1 bg-slate-100 text-slate-700 py-5 rounded-2xl font-black text-[11px] uppercase shadow-sm border border-slate-200 hover:bg-white transition-all flex items-center justify-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Export Preliminary Report
              </button>
              <button 
                onClick={handleCompleteLab} 
                disabled={activePatient.requestedTests?.some(t => !(results[t.id] || '').trim())}
                className={`flex-[2] py-5 rounded-2xl font-black text-sm uppercase shadow-2xl transition-all tracking-[0.2em] flex items-center justify-center gap-4 ${
                  activePatient.requestedTests?.some(t => !(results[t.id] || '').trim())
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-950 text-white hover:bg-black'
                }`}
              >
                {activePatient.requestedTests?.some(t => !(results[t.id] || '').trim()) ? 'Analysis Incomplete' : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Finalize & Commit Result Set
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[3rem] border border-slate-100 shadow-inner flex flex-col items-center justify-center text-center p-20">
            <div className="w-28 h-28 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-indigo-100/50">
               <svg className="w-14 h-14 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517" /></svg>
            </div>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-6">Laboratory Control Interface</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600 font-black">1</div>
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">Select Patient</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">From intake queue</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600 font-black">2</div>
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">Input Data</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Record investigation findings</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600 font-black">3</div>
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">Dispatch</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Verify and send to physician</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaboratoryDesk;
