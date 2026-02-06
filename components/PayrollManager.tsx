
import React, { useState, useMemo } from 'react';
import { PayrollRecord, Staff, UserRole } from '../types';

interface PayrollManagerProps {
  staff: Staff[];
  payrolls: PayrollRecord[];
  onAddPayroll: (record: PayrollRecord) => void;
}

const PayrollManager: React.FC<PayrollManagerProps> = ({ staff, payrolls, onAddPayroll }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [month, setMonth] = useState('May');
  const [allowance, setAllowance] = useState('0');
  const [deduction, setDeduction] = useState('0');

  const selectedStaff = useMemo(() => staff.find(s => s.id === selectedStaffId), [staff, selectedStaffId]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const base = selectedStaff.salary || 3500000;
    const allow = parseFloat(allowance) || 0;
    const ded = parseFloat(deduction) || 0;
    const net = base + allow - ded;

    onAddPayroll({
      id: `PAY-${Date.now()}`,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      month,
      year: '2024',
      baseSalary: base,
      allowances: allow,
      deductions: ded,
      netPay: net,
      status: 'Paid'
    });

    setIsModalOpen(false);
    setSelectedStaffId('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Payroll</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Personnel Disbursement Ledger</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" /></svg>
          Generate Payroll
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-10 py-6">Staff Beneficiary</th>
              <th className="px-10 py-6">Cycle</th>
              <th className="px-10 py-6">Base (Le)</th>
              <th className="px-10 py-6">+/- Adjust</th>
              <th className="px-10 py-6 text-right">Net Disbursement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payrolls.map(pay => (
              <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6">
                  <p className="font-black text-slate-900">{pay.staffName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pay.staffId}</p>
                </td>
                <td className="px-10 py-6 font-bold text-slate-600">{pay.month} {pay.year}</td>
                <td className="px-10 py-6 font-mono font-bold">{pay.baseSalary.toLocaleString()}</td>
                <td className="px-10 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-emerald-500 text-[9px] font-black">+{pay.allowances.toLocaleString()}</span>
                    <span className="text-red-500 text-[9px] font-black">-{pay.deductions.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-right font-black text-indigo-600 text-lg">Le {pay.netPay.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Process Payroll</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Personnel</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
                    <option value="">Choose employee...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cycle Month</label>
                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={month} onChange={e => setMonth(e.target.value)}>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Allowances</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={allowance} onChange={e => setAllowance(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mandatory Deductions</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black" value={deduction} onChange={e => setDeduction(e.target.value)} />
                </div>

                {selectedStaff && (
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Calculated Net Pay</p>
                    <p className="text-3xl font-black text-indigo-700">Le {((selectedStaff.salary || 3500000) + parseFloat(allowance || '0') - parseFloat(deduction || '0')).toLocaleString()}</p>
                  </div>
                )}

                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-xl uppercase">Authorize Disbursement</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManager;
