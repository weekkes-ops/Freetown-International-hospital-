import React, { useState, useEffect, useMemo } from 'react';
import { Patient, FinancialRecord, VisitRecord } from '../types';
import { CLINIC_TYPES } from '../constants';
import Logo from './Logo';

interface CashierRegistrationProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onAddFinancial: (record: FinancialRecord) => void;
}

const CashierRegistration: React.FC<CashierRegistrationProps> = ({ patients, onAddPatient, onAddFinancial }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'records'>('register');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordPatientId, setSelectedRecordPatientId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    upi: '',
    medicalRecordNumber: '',
    nationalId: '',
    name: '',
    age: '',
    gender: 'Male' as const,
    contact: '',
    email: '',
    clinicType: CLINIC_TYPES[0],
  });
  
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedRecordPatient = useMemo(() => {
    return patients.find(p => p.id === selectedRecordPatientId) || null;
  }, [patients, selectedRecordPatientId]);

  const generateUniqueId = (): string => {
    let newId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 1000) {
      const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      newId = `P${num}`;
      isUnique = !patients.some(p => p.id === newId);
      attempts++;
    }
    return newId;
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

  useEffect(() => {
    if (!formData.id) {
      setFormData(prev => ({ 
        ...prev, 
        id: generateUniqueId(),
        upi: generateUPI(),
        medicalRecordNumber: generateMRN()
      }));
    }
  }, [patients]);

  const registrationFee = 50000;
  const isIdTaken = patients.some(p => p.id === formData.id);
  const isIdMalformed = !/^P\d{3,5}$/.test(formData.id);
  const isIdInvalid = isIdTaken || isIdMalformed;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || isIdInvalid || !formData.nationalId || !formData.medicalRecordNumber) return;

    const initialHistory: VisitRecord[] = [
      { 
        date: new Date().toISOString().split('T')[0], 
        clinicType: 'Registration', 
        notes: `Registered for ${formData.clinicType} clinic. Initial registration fee collected.` 
      }
    ];

    const newPatient: Patient = {
      id: formData.id,
      upi: formData.upi || generateUPI(),
      medicalRecordNumber: formData.medicalRecordNumber,
      nationalId: formData.nationalId,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as any,
      bloodType: 'N/A',
      contact: formData.contact,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s/g, '.')}@freetown-int.sl`,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Awaiting Doctor',
      history: initialHistory,
      clinicType: formData.clinicType,
      requestedTests: [],
      totalLabBill: 0
    };

    onAddPatient(newPatient);
    onAddFinancial({
      id: `F${Math.floor(Math.random() * 10000)}`,
      type: 'Income',
      category: 'Patient Registration',
      amount: registrationFee,
      date: new Date().toISOString().split('T')[0],
      description: `New Registration: ${formData.name} (${formData.id})`
    });

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
    setFormData({ 
      id: '', 
      upi: '',
      medicalRecordNumber: '',
      nationalId: '', 
      name: '', 
      age: '', 
      gender: 'Male', 
      contact: '', 
      email: '', 
      clinicType: CLINIC_TYPES[0] 
    });
  };

  const filteredRecords = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.upi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nationalId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const recentRegistrations = useMemo(() => {
    return [...patients].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 5);
  }, [patients]);

  const handlePrintRecord = () => {
    if (!selectedRecordPatient) return;
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cashier-print-template, #cashier-print-template * { visibility: visible; }
          #cashier-print-template { 
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
            margin: 15mm;
          }
        }
      `}</style>

      {/* Optimized Hidden Printable Template */}
      {selectedRecordPatient && (
        <div id="cashier-print-template" className="hidden print:block font-sans text-slate-900">
          <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-end">
            <div className="flex gap-4 items-center">
              <Logo className="w-16 h-16" />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Freetown International</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-2">Registration & Billing Terminal • Official Copy</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</p>
              <p className="text-xl font-mono font-black">REG-{selectedRecordPatient.id}-{new Date().getTime().toString().slice(-4)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b border-slate-100">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Bio-Profile</h2>
              <div className="space-y-1">
                <p className="text-3xl font-black">{selectedRecordPatient.name}</p>
                <p className="text-lg font-bold text-slate-600">{selectedRecordPatient.age}Y • {selectedRecordPatient.gender}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-2">System UPI:</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{selectedRecordPatient.upi}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">MRN</p>
                      <p className="text-xs font-black">{selectedRecordPatient.medicalRecordNumber}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">National ID</p>
                      <p className="text-xs font-black">{selectedRecordPatient.nationalId}</p>
                   </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Destination</h2>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-500">Service Clinic</p>
                <p className="text-2xl font-black text-slate-950 uppercase">{selectedRecordPatient.clinicType}</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Financial Settlement</h2>
             <div className="border-2 border-slate-100 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4">Clinical Item/Service</th>
                         <th className="px-6 py-4 text-right">Fee (Le)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      <tr>
                         <td className="px-6 py-6 font-bold">Standard Registration & Consultation Access Fee</td>
                         <td className="px-6 py-6 font-black text-right">50,000</td>
                      </tr>
                   </tbody>
                   <tfoot className="bg-slate-900 text-white">
                      <tr>
                         <td className="px-6 py-6 font-black uppercase tracking-widest">Total Settled (Amount Paid)</td>
                         <td className="px-6 py-6 font-black text-right text-3xl">Le 50,000</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>

          <div className="mt-32 grid grid-cols-3 gap-10">
             <div className="text-center">
                <div className="border-b border-slate-300 w-full mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-400">Reception Officer</p>
             </div>
             <div className="text-center">
                <div className="border-b border-slate-300 w-full mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-400">Hospital Administrator</p>
             </div>
             <div className="text-center">
                <div className="w-20 h-20 border-2 border-slate-100 mx-auto rounded-xl flex items-center justify-center bg-slate-50">
                   <span className="text-[8px] font-black uppercase text-slate-300">Official Stamp</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      {isSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          INTAKE REGISTERED SUCCESSFULLY
        </div>
      )}

      <div className="flex bg-white p-2 rounded-3xl border border-slate-200 w-fit no-print">
         <button onClick={() => setActiveTab('register')} className={`px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>New Intake</button>
         <button onClick={() => setActiveTab('records')} className={`px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Search Archives</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab === 'register' ? (
          <>
            <div className="lg:col-span-8 bg-white p-10 lg:p-14 rounded-[2.5rem] border border-slate-100 shadow-xl no-print">
              <div className="flex items-center gap-6 mb-12 border-b border-slate-100 pb-10">
                 <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Patient Enrollment</h3>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-1">Reception Terminal • Freetown International</p>
                 </div>
              </div>
              <form onSubmit={handleRegister} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Hospital Patient ID (PXXX)</label>
                    <div className="relative">
                      <input type="text" required className={`w-full p-6 bg-white border-4 rounded-2xl transition-all outline-none font-black text-xl ${isIdInvalid ? 'border-red-500' : 'border-slate-100 focus:border-indigo-600 shadow-inner'}`} value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Medical Record Number (MRN)</label>
                    <div className="relative">
                      <input type="text" required className="w-full p-6 bg-slate-50 border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner text-indigo-700" placeholder="MRN-XXX-XXX" value={formData.medicalRecordNumber} onChange={e => setFormData({...formData, medicalRecordNumber: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">National ID / Passport No.</label>
                    <div className="relative">
                      <input type="text" required className="w-full p-6 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner" placeholder="E.g. SL-928374" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Assigned Clinic Specialty</label>
                    <select className="w-full p-6 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner" value={formData.clinicType} onChange={e => setFormData({...formData, clinicType: e.target.value})}>
                      {CLINIC_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Full Legal Name</label>
                    <input type="text" required className="w-full p-6 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Age</label><input type="number" required className="w-full p-6 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Gender</label><select className="w-full p-6 bg-white border-4 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none font-black text-xl shadow-inner" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}><option>Male</option><option>Female</option></select></div>
                </div>
                <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-1">Fee for Enrollment</span>
                    <span className="text-4xl font-black text-indigo-600 tracking-tighter">Le {registrationFee.toLocaleString()}</span>
                  </div>
                  <button disabled={isIdInvalid || !formData.nationalId} className={`flex-1 px-12 py-6 text-white rounded-[2rem] font-black text-xl transition-all shadow-2xl uppercase tracking-[0.2em] ${isIdInvalid || !formData.nationalId ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-950 hover:bg-black'}`}>Register & Finalize</button>
                </div>
              </form>
            </div>
            <div className="lg:col-span-4 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 no-print">
              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Recent Activity</h3>
              <div className="space-y-4">
                {recentRegistrations.map(p => (
                  <div key={p.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-400 transition-all cursor-pointer" onClick={() => setSelectedRecordPatientId(p.id)}>
                    <div className="flex justify-between items-start mb-2"><span className="font-black text-slate-900 truncate pr-2">{p.name}</span><span className="text-[9px] font-black text-slate-400">#{p.id}</span></div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>MRN: {p.medicalRecordNumber}</span><span className="text-indigo-500">Active</span></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="lg:col-span-12 space-y-6 no-print">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                <input type="text" placeholder="Search Archives by Name, MRN, ID, UPI or National Identifier..." className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-black text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredRecords.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                     <h4 className="font-black text-slate-900 text-lg mb-2">{p.name}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-1">MRN: {p.medicalRecordNumber}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-4">HMS ID: {p.id} • Nat: {p.nationalId}</p>
                     <button onClick={() => setSelectedRecordPatientId(p.id)} className="w-full py-4 bg-slate-50 text-slate-600 font-black text-[10px] uppercase rounded-xl hover:bg-slate-900 hover:text-white transition-all border border-slate-100">Transaction Summary</button>
                  </div>
                ))}
             </div>
             {selectedRecordPatient && (
               <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 no-print">
                  <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden p-10">
                    <div className="flex justify-between items-start mb-8">
                       <h3 className="text-3xl font-black text-slate-900">Record: {selectedRecordPatient.name}</h3>
                       <button onClick={() => setSelectedRecordPatientId(null)} className="p-4 bg-slate-50 rounded-2xl hover:text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="bg-slate-950 rounded-3xl p-8 text-white flex items-center justify-between">
                       <div><p className="text-[10px] font-black text-indigo-400 uppercase">Total Intake Fee</p><h4 className="text-4xl font-black">Le 50,000</h4></div>
                       <button onClick={handlePrintRecord} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl">Print Official Receipt</button>
                    </div>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierRegistration;