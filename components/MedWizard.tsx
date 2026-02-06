
import React, { useState, useMemo } from 'react';
import { Patient, LabTest, FinancialRecord, VisitRecord } from '../types';
import { CLINIC_TYPES } from '../constants';

interface MedWizardProps {
  onComplete: (patient: Patient, financial: FinancialRecord) => void;
  labTests: LabTest[];
}

enum WizardStep {
  REGISTRATION = 0,
  CONSULTATION = 1,
  LABORATORY = 2,
  SUMMARY = 3
}

const MedWizard: React.FC<MedWizardProps> = ({ onComplete, labTests }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.REGISTRATION);
  
  // Registration State
  const [formData, setFormData] = useState({
    name: '',
    medicalRecordNumber: '',
    nationalId: '',
    age: '30',
    gender: 'Male',
    clinicType: CLINIC_TYPES[0],
    contact: '',
    email: ''
  });
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);

  // Doctor State
  const [doctorDescription, setDoctorDescription] = useState('');

  // Lab State
  const [labResults, setLabResults] = useState<Record<string, string>>({});

  const totalBill = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + t.price, 0) + 50000; // 50,000 Le base consultation
  }, [selectedTests]);

  const toggleTest = (test: LabTest) => {
    if (selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const generateMRN = (): string => {
    const part1 = Math.floor(Math.random() * 900 + 100);
    const part2 = Math.floor(Math.random() * 900 + 100);
    return `MRN-${part1}-${part2}`;
  };

  // Added generateUPI helper to fix missing upi property in Patient creation
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

  const handleNext = () => {
    // Enhanced validation feedback
    if (currentStep === WizardStep.REGISTRATION) {
      if (!formData.name.trim() || !formData.age.trim() || !formData.contact.trim() || !formData.nationalId.trim()) {
        alert("CRITICAL: Please ensure Name, National ID, Age, and Contact Number are provided before proceeding.");
        return;
      }
      // Generate MRN if not set
      if (!formData.medicalRecordNumber) {
        setFormData(prev => ({ ...prev, medicalRecordNumber: generateMRN() }));
      }
    }
    
    // Smooth scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Explicit state update with functional transition
    setCurrentStep((prev) => (prev + 1) as WizardStep);
  };

  const handleFinish = () => {
    const patientId = `W${Math.floor(Math.random() * 9000) + 1000}`;
    
    const visitHistory: VisitRecord[] = [
      { 
        date: new Date().toISOString().split('T')[0], 
        clinicType: formData.clinicType, 
        notes: `Full Journey Completed. Clinical Findings: ${doctorDescription || 'Standard Checkup'}` 
      }
    ];

    const finalPatient: Patient = {
      id: patientId,
      // Fixed: Added required upi property
      upi: generateUPI(),
      medicalRecordNumber: formData.medicalRecordNumber || generateMRN(),
      nationalId: formData.nationalId,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as any,
      bloodType: 'N/A',
      contact: formData.contact,
      email: formData.email || `${formData.name.toLowerCase().replace(' ', '.')}@medcore.sl`,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Completed',
      history: visitHistory,
      clinicType: formData.clinicType,
      requestedTests: selectedTests.map(t => ({ ...t, result: labResults[t.id] })),
      doctorDescription,
      totalLabBill: totalBill - 50000
    };

    const financial: FinancialRecord = {
      id: `FW${Math.floor(Math.random() * 10000)}`,
      type: 'Income',
      category: 'Wizard Comprehensive Billing',
      amount: totalBill,
      date: new Date().toISOString().split('T')[0],
      description: `MedWizard Journey: ${formData.name}`
    };

    onComplete(finalPatient, financial);
    
    // Reset wizard state
    setCurrentStep(WizardStep.REGISTRATION);
    setFormData({ name: '', medicalRecordNumber: '', nationalId: '', age: '30', gender: 'Male', clinicType: CLINIC_TYPES[0], contact: '', email: '' });
    setSelectedTests([]);
    setDoctorDescription('');
    setLabResults({});
  };

  const steps = [
    { label: 'Registration', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Consultation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Laboratory', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517' },
    { label: 'Summary', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Wizard Header / Stepper */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10"></div>
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 bg-white px-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                currentStep >= idx ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={step.icon} />
                </svg>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${currentStep >= idx ? 'text-indigo-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
        {/* Step 1: Cashier Registration */}
        {currentStep === WizardStep.REGISTRATION && (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 animate-in slide-in-from-right-10 duration-500">
            <div className="lg:col-span-7 p-10 lg:p-14 lg:pr-10 space-y-10">
              <div>
                <h3 className="text-4xl font-black text-slate-950 tracking-tight uppercase">Patient Intake</h3>
                <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Reception & Initial Billing Terminal</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Legal Name</label>
                  <input 
                    type="text" 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black placeholder-slate-300 shadow-sm"
                    placeholder="e.g. Johnathan Smith"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">National ID / Passport</label>
                  <input 
                    type="text" 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black placeholder-slate-300 shadow-sm"
                    placeholder="E.g. NHID-9281-X"
                    value={formData.nationalId}
                    onChange={e => setFormData({...formData, nationalId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Age (Years)</label>
                  <input 
                    type="number" 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black placeholder-slate-300 shadow-sm"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gender</label>
                  <select 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black shadow-sm"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact (Sierra Leone)</label>
                  <input 
                    type="tel" 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black placeholder-slate-300 shadow-sm"
                    placeholder="+232 7X XXXXXX"
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Email Address</label>
                  <input 
                    type="email" 
                    className="w-full p-6 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none transition-all text-slate-950 font-black placeholder-slate-300 shadow-sm"
                    placeholder="patient@freetown-int.sl"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Assigned Clinic Specialty</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CLINIC_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, clinicType: type})}
                      className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                        formData.clinicType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-10 lg:p-14 bg-slate-50 border-l border-slate-100 flex flex-col">
              <h4 className="text-xl font-black text-slate-950 mb-8 flex items-center gap-3 uppercase tracking-tight">
                 <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517" /></svg>
                 </div>
                 Diagnostic Selection
              </h4>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {labTests.map(test => (
                  <div 
                    key={test.id} 
                    onClick={() => toggleTest(test)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                      selectedTests.find(t => t.id === test.id) ? 'bg-white border-indigo-600 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`font-black uppercase tracking-tight text-sm ${selectedTests.find(t => t.id === test.id) ? 'text-indigo-600' : 'text-slate-600'}`}>{test.name}</span>
                    <span className="text-slate-950 font-black">Le {test.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t-2 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Total Service Fee (Inc. Reg)</span>
                  <span className="text-4xl font-black text-slate-950 tracking-tighter">Le {totalBill.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleNext}
                  className="w-full bg-slate-950 text-white py-6 rounded-2xl font-black text-xl hover:bg-black active:scale-95 transition-all shadow-2xl uppercase tracking-[0.2em] cursor-pointer"
                >
                  Proceed to Consultation
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === WizardStep.CONSULTATION && (
          <div className="p-10 lg:p-14 space-y-10 flex-1 flex flex-col animate-in slide-in-from-right-10 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b-2 border-slate-100 pb-10">
               <div className="space-y-1">
                 <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tight">Clinical Assessment</h3>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Patient Case: <span className="text-indigo-600 font-black">{formData.name}</span></p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">MRN: {formData.medicalRecordNumber || 'Pending Generation'}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">National ID: {formData.nationalId}</p>
               </div>
               <div className="flex gap-4">
                  <div className="px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center min-w-[140px]">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Clinic</p>
                    <p className="font-black text-indigo-700 uppercase text-xs">{formData.clinicType}</p>
                  </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
               <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Physician's Findings & Treatment Plan</label>
                    <textarea 
                      className="w-full p-8 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-[2rem] h-[400px] outline-none transition-all resize-none text-slate-950 font-black text-xl leading-relaxed shadow-inner placeholder-slate-300"
                      placeholder="Enter detailed clinical observation, symptoms, and proposed prescription..."
                      value={doctorDescription}
                      onChange={e => setDoctorDescription(e.target.value)}
                    />
                 </div>
               </div>
               
               <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white flex flex-col">
                  <div className="flex-1">
                    <h4 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight text-indigo-400">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Clinical Summary
                    </h4>
                    <div className="space-y-6 opacity-90">
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Patient Profile Overview</p>
                        <div className="grid grid-cols-2 gap-4 text-xs font-black uppercase tracking-widest">
                          <span className="text-slate-400">Name: <span className="text-white ml-2">{formData.name}</span></span>
                          <span className="text-slate-400">MRN: <span className="text-white ml-2">{formData.medicalRecordNumber}</span></span>
                          <span className="text-slate-400">Nat ID: <span className="text-white ml-2">{formData.nationalId}</span></span>
                          <span className="text-slate-400">Clinic: <span className="text-white ml-2">{formData.clinicType}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-white/10">
                    <button 
                      onClick={handleNext}
                      className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xl shadow-2xl transition-all uppercase tracking-[0.2em]"
                    >
                      {selectedTests.length > 0 ? "Dispatch to Laboratory" : "Proceed to Final Summary"}
                    </button>
                  </div>
               </div>
             </div>
          </div>
        )}

        {currentStep === WizardStep.LABORATORY && (
          <div className="p-10 lg:p-14 space-y-10 flex-1 animate-in slide-in-from-right-10 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b-2 border-slate-100 pb-10">
               <div>
                 <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tight">Diagnostic Workflow</h3>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Capturing results for <span className="text-indigo-600 font-black">{formData.name}</span></p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">MRN: {formData.medicalRecordNumber}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">National ID: {formData.nationalId}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic Charges</p>
                 <p className="text-3xl font-black text-amber-600 tracking-tighter">Le {(totalBill - 50000).toLocaleString()}</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedTests.map(test => (
                  <div key={test.id} className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-amber-300 transition-all space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950 uppercase tracking-tight text-lg">{test.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200">ID: {test.id}</span>
                    </div>
                    <input 
                      type="text" 
                      className="w-full p-5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 text-slate-950 font-black text-xl shadow-inner placeholder-slate-300"
                      placeholder="Input clinical findings..."
                      value={labResults[test.id] || ''}
                      onChange={e => setLabResults({...labResults, [test.id]: e.target.value})}
                    />
                  </div>
                ))}
                {selectedTests.length === 0 && (
                  <div className="col-span-2 py-32 text-center text-slate-400 opacity-30 italic font-black uppercase tracking-[0.3em]">No diagnostics required for this patient journey</div>
                )}
             </div>

             <div className="pt-12 mt-auto border-t-2 border-slate-100">
               <button 
                onClick={handleNext}
                className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
               >
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Generate Final Medical Dossier
               </button>
             </div>
          </div>
        )}

        {currentStep === WizardStep.SUMMARY && (
          <div className="p-10 lg:p-14 space-y-12 flex-1 animate-in slide-in-from-bottom-10 duration-700">
             <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                   <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-5xl font-black text-slate-950 uppercase tracking-tighter">Process Finalized</h3>
                <p className="text-slate-500 max-w-md mx-auto font-bold text-sm uppercase tracking-widest opacity-60">Verified & Secure Clinical Data Synchronized</p>
             </div>

             <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-200 max-w-4xl mx-auto shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 border-b-2 border-slate-200 pb-10 gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-100">F</div>
                      <div>
                        <h4 className="font-black text-slate-950 tracking-tight text-xl uppercase">Freetown International</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">{new Date().toLocaleDateString()} • OFFICIAL RECORD</p>
                      </div>
                   </div>
                   <div className="text-center sm:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Validation Reference</p>
                      <p className="font-black text-indigo-600 uppercase text-lg tracking-tighter">#WIZ-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                   <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Dossier</p>
                      <p className="font-black text-slate-950 text-2xl tracking-tight">{formData.name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">MRN: {formData.medicalRecordNumber}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formData.age}Y • {formData.gender} • {formData.contact}</p>
                      <p className="text-[10px] font-black text-indigo-600 mt-2 uppercase">National ID: {formData.nationalId}</p>
                   </div>
                   <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Department</p>
                      <p className="font-black text-indigo-600 text-2xl tracking-tight">{formData.clinicType} Clinic</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Total Settled: Le {totalBill.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Physician's Validated Findings</p>
                      <div className="text-slate-950 italic text-lg leading-relaxed font-bold whitespace-pre-wrap">
                        {doctorDescription || 'No detailed physician notes provided.'}
                      </div>
                   </div>

                   {selectedTests.length > 0 && (
                     <div className="p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Diagnostic Result Summary</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {selectedTests.map(t => (
                              <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                 <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">{t.name}</span>
                                 <span className="font-black text-slate-950 text-sm">{labResults[t.id] || 'INCONCLUSIVE'}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className="mt-16 flex flex-col md:flex-row gap-6">
                   <button 
                    onClick={() => window.print()}
                    className="flex-1 py-5 bg-white border-2 border-slate-300 text-slate-700 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-sm uppercase tracking-widest"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                     Print Comprehensive Report
                   </button>
                   <button 
                    onClick={handleFinish}
                    className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl uppercase tracking-widest"
                   >
                     Commit & Discharge Patient
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedWizard;
