
import React, { useState, useMemo, useEffect } from 'react';
import { getDiagnosticAdvice, summarizeMedicalRecords, analyzePatientRisk, checkSymptoms } from '../services/geminiService';
import { Patient } from '../types';

interface RiskAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
}

interface SymptomFinding {
  condition: string;
  probability: string;
  urgency: 'EMERGENT' | 'URGENT' | 'ROUTINE';
  reasoning: string;
  clinicalAdvice: string;
  recommendedActions: string[];
}

interface SymptomCheckerResult {
  disclaimer: string;
  findings: SymptomFinding[];
}

interface AIAssistantProps {
  patients: Patient[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ patients }) => {
  const [activeTab, setActiveTab] = useState<'checker' | 'analysis' | 'summary' | 'risk'>('checker');
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [checkerResults, setCheckerResults] = useState<SymptomCheckerResult | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Summary/Risk State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId), 
    [patients, selectedPatientId]
  );

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    const historyText = patient.history
      .map(h => `[Date: ${h.date}] Clinic: ${h.clinicType} | Findings: ${h.notes}`)
      .join('\n');
    setHistory(historyText);
    setAnalysis(null);
    setRiskAlerts([]);
  };

  const filteredPatients = useMemo(() => {
    const term = patientSearchTerm.toLowerCase().trim();
    if (!term) return patients.slice(0, 5);
    return patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.medicalRecordNumber.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [patients, patientSearchTerm]);

  const handleSymptomCheck = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setCheckerResults(null);
    setAnalysis(null);
    setRiskAlerts([]);
    
    const results = await checkSymptoms(symptoms);
    setCheckerResults(results);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setCheckerResults(null);
    setRiskAlerts([]);
    setCopySuccess(false);
    
    const [diagResult, risks] = await Promise.all([
      getDiagnosticAdvice(symptoms, history),
      analyzePatientRisk(symptoms, history)
    ]);
    
    setAnalysis(diagResult);
    setRiskAlerts(risks);
    setLoading(false);
  };

  const handleSummarize = async () => {
    if (!selectedPatient || selectedPatient.history.length === 0) {
      alert("Selected patient has no clinical history available for summarization.");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    setCheckerResults(null);
    setRiskAlerts([]);
    setCopySuccess(false);
    
    // Use the potentially edited history state for context
    const context = history.trim().split('\n');
    const result = await summarizeMedicalRecords(context.length > 0 ? context : selectedPatient.history.map(h => h.notes));
    setAnalysis(result);
    setLoading(false);
  };

  const handleRiskAudit = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setAnalysis(null);
    setCheckerResults(null);
    setRiskAlerts([]);
    
    // Use the potentially edited history state for the audit context
    const risks = await analyzePatientRisk(symptoms.trim() || "Routine clinical audit", history);
    
    setRiskAlerts(risks);
    setLoading(false);
  };

  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-3xl mb-4 shadow-xl shadow-indigo-100/50">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">AI Clinical Intelligence</h2>
        <p className="text-slate-500 max-w-xl mx-auto font-bold text-sm uppercase tracking-widest opacity-60">
          Advanced Diagnostic Decision Support & Risk Audit System
        </p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => { setActiveTab('checker'); setAnalysis(null); setCheckerResults(null); setRiskAlerts([]); setSymptoms(''); setHistory(''); setSelectedPatientId(''); }}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'checker' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Symptom Checker
          </button>
          <button 
            onClick={() => { setActiveTab('analysis'); setAnalysis(null); setCheckerResults(null); setRiskAlerts([]); setSymptoms(''); setHistory(''); setSelectedPatientId(''); }}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Diagnostic Analysis
          </button>
          <button 
            onClick={() => { setActiveTab('summary'); setAnalysis(null); setCheckerResults(null); setRiskAlerts([]); setSymptoms(''); setHistory(''); setSelectedPatientId(''); }}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Smart Summary
          </button>
          <button 
            onClick={() => { setActiveTab('risk'); setAnalysis(null); setCheckerResults(null); setRiskAlerts([]); setSymptoms(''); setHistory(''); setSelectedPatientId(''); }}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'risk' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Risk Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8 flex flex-col">
          {activeTab === 'checker' || activeTab === 'analysis' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Presenting Symptoms</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl h-48 focus:outline-none transition-all resize-none text-slate-950 font-bold text-lg shadow-inner placeholder-slate-300"
                  placeholder="e.g. Sudden sharp chest pain radiating to left arm, shortness of breath, cold sweat..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              {activeTab === 'analysis' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Clinical History (Context)</label>
                  <textarea 
                    className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl h-32 focus:outline-none transition-all resize-none text-slate-950 font-bold text-lg shadow-inner placeholder-slate-300"
                    placeholder="e.g. 54-year-old male with known hypertension and hyperlipidemia..."
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                  />
                </div>
              )}

              <button 
                onClick={activeTab === 'checker' ? handleSymptomCheck : handleAnalyze}
                disabled={loading || !symptoms.trim()}
                className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-lg hover:bg-black shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
              >
                {loading ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : activeTab === 'checker' ? "Initiate Checker" : "Run Diagnostic Analysis"}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 flex-1 flex flex-col">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Search Patient Record</label>
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black text-slate-950 placeholder-slate-300 shadow-inner"
                    placeholder="MRN, Name or ID..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
                
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {filteredPatients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full p-5 rounded-3xl border-2 text-left transition-all ${
                      selectedPatientId === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-1' : 'bg-white border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <p className={`font-black text-lg leading-tight ${selectedPatientId === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                    <div className="flex justify-between items-center mt-2">
                       <p className={`text-[9px] font-black uppercase tracking-widest ${selectedPatientId === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>MRN: {p.medicalRecordNumber}</p>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${selectedPatientId === p.id ? 'bg-white/20' : 'bg-slate-100'}`}>{p.history.length} Visits</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPatient && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Clinical Context (Pre-filled Archives)</label>
                    <textarea 
                      className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl h-40 focus:outline-none transition-all resize-none text-slate-950 font-bold text-sm shadow-inner"
                      placeholder="Verified patient clinical history..."
                      value={history}
                      onChange={(e) => setHistory(e.target.value)}
                    />
                  </div>
                  {activeTab === 'risk' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Current Presenting Complaints (Optional)</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black text-slate-950 shadow-inner"
                        placeholder="Current acute symptoms..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={activeTab === 'summary' ? handleSummarize : handleRiskAudit}
                disabled={loading || !selectedPatientId}
                className={`w-full text-white py-6 rounded-3xl font-black text-lg shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] mt-auto ${activeTab === 'risk' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-950 hover:bg-black'}`}
              >
                {loading ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : activeTab === 'summary' ? "Generate Summary" : "Perform Risk Audit"}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Intelligence Results */}
        <div className="lg:col-span-7">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl min-h-[750px] border-t-8 border-t-indigo-600 flex flex-col relative overflow-hidden">
            {/* AI Watermark background */}
            <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
               <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>

            <div className="flex items-center justify-between mb-8 z-10">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                {activeTab === 'checker' ? 'Symptom Logic' : activeTab === 'analysis' ? 'Diagnostic Logic & Next Steps' : activeTab === 'summary' ? 'Clinical Narrative' : 'Red Flag Log'}
              </h4>
              {analysis && (
                <button onClick={() => handleCopyToClipboard(analysis)} className={`p-3 rounded-xl transition-all border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${copySuccess ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-400'}`}>
                  {copySuccess ? "Copied" : "Copy findings"}
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[850px] pr-4 custom-scrollbar z-10 space-y-8">
              {loading && (
                <div className="h-full flex flex-col items-center justify-center py-48 space-y-6">
                   <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-black text-[10px] text-indigo-600 uppercase tracking-[0.4em] animate-pulse">Consulting Neural Engine...</p>
                </div>
              )}

              {/* Symptom Checker Visual Results */}
              {!loading && checkerResults && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-6 bg-indigo-50 border-l-8 border-indigo-600 rounded-r-3xl text-indigo-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Pathophysiological Analysis</p>
                    <p className="text-xs font-bold leading-relaxed">{checkerResults.disclaimer}</p>
                  </div>

                  <div className="space-y-6">
                    {checkerResults.findings.map((finding, idx) => (
                      <div key={idx} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="space-y-1">
                            <h5 className="text-2xl font-black text-slate-900 tracking-tight">{finding.condition}</h5>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence: {finding.probability}</span>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            finding.urgency === 'EMERGENT' ? 'bg-red-600 text-white' : 
                            finding.urgency === 'URGENT' ? 'bg-amber-500 text-white' : 
                            'bg-indigo-600 text-white'
                          }`}>
                            {finding.urgency}
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                            {finding.reasoning}
                          </p>
                          <div className="pt-4 space-y-4 border-t border-slate-50">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Physician Advice</p>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">{finding.clinicalAdvice}</p>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {finding.recommendedActions.map((action, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest">{action}</span>
                                ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Audit Visual Results */}
              {!loading && riskAlerts.length > 0 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">AI-Detected Clinical Risks</h5>
                  <div className="grid grid-cols-1 gap-4">
                    {riskAlerts.map((risk, i) => (
                      <div key={i} className={`p-8 rounded-[2rem] border-2 flex items-start gap-6 transition-all hover:scale-[1.01] ${
                        risk.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-900 shadow-xl shadow-red-100' : 
                        risk.severity === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}>
                        <div className={`p-4 rounded-2xl ${risk.severity === 'CRITICAL' ? 'bg-red-600 animate-pulse' : risk.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'} text-white shrink-0 shadow-lg shadow-opacity-20`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="space-y-1">
                          <p className="font-black uppercase text-xs tracking-[0.2em]">{risk.title}</p>
                          <p className="text-base font-bold leading-relaxed opacity-80">{risk.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Text Analysis (Analysis/Summary) */}
              {!loading && analysis && (
                <div className="text-slate-950 space-y-8 font-medium text-lg leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-5 bg-indigo-50 border-l-8 border-indigo-600 rounded-r-3xl text-indigo-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Validated Intelligence Stream</p>
                    <p className="font-black text-2xl tracking-tight">
                      {activeTab === 'summary' ? `Patient Dossier: ${selectedPatient?.name}` : 'Diagnostic Synthesis & Potential Outcomes'}
                    </p>
                  </div>

                  <div className="whitespace-pre-wrap text-slate-800 font-serif p-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                    {analysis}
                  </div>
                  
                  <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 no-print">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">F</div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Freetown International<br/>Clinical Informatics Hub</p>
                     </div>
                     <button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                        Print Intelligence Report
                     </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !analysis && !checkerResults && riskAlerts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-8 opacity-30 text-center py-32">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-sm uppercase tracking-[0.4em]">Engine Standby</p>
                    <p className="text-xs font-bold max-w-xs mx-auto">
                      {activeTab === 'checker' 
                        ? 'Submit presenting symptoms to generate an urgency-mapped differential list.' 
                        : activeTab === 'analysis' ? 'Provide symptoms and history for a comprehensive diagnostic analysis summary and next steps.'
                        : activeTab === 'summary' ? 'Select an active patient to generate a summarized medical dossier.'
                        : 'Initiate a safety audit for high-risk clinical identification.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
