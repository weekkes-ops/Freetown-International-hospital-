
import React, { useState } from 'react';
import { FinancialRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface AccountingProps {
  records: FinancialRecord[];
  onAddRecord: (record: FinancialRecord) => void;
}

const Accounting: React.FC<AccountingProps> = ({ records, onAddRecord }) => {
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'Income' as 'Income' | 'Expense',
    category: '',
    amount: '',
    description: ''
  });

  const filteredRecords = records.filter(r => filter === 'All' || r.type === filter);
  
  const totalIncome = records.filter(r => r.type === 'Income').reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'Expense').reduce((acc, r) => acc + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const chartData = [
    { name: 'Financial Overview', income: totalIncome, expense: totalExpenses }
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newRecord.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    onAddRecord({
      id: `F${Math.floor(Math.random() * 10000)}`,
      type: newRecord.type,
      category: newRecord.category || 'General',
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      description: newRecord.description
    });

    setIsModalOpen(false);
    setNewRecord({ type: 'Income', category: '', amount: '', description: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Modal implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Post Ledger Transaction</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <form onSubmit={handleAddSubmit} className="space-y-6">
                   <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setNewRecord({...newRecord, type: 'Income'})}
                        className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-all ${newRecord.type === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                      >Credit / Income</button>
                      <button 
                        type="button"
                        onClick={() => setNewRecord({...newRecord, type: 'Expense'})}
                        className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-all ${newRecord.type === 'Expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                      >Debit / Expense</button>
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Classification Category</label>
                      <input 
                        required
                        className="w-full p-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black placeholder-slate-300 shadow-sm"
                        placeholder="e.g. Pharmacy Sales, Ward Utilities"
                        value={newRecord.category}
                        onChange={e => setNewRecord({...newRecord, category: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Value (Sierra Leonean Leones)</label>
                      <input 
                        required
                        type="number"
                        className="w-full p-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black placeholder-slate-300 shadow-sm"
                        placeholder="0.00"
                        value={newRecord.amount}
                        onChange={e => setNewRecord({...newRecord, amount: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Transaction Narratives</label>
                      <textarea 
                        className="w-full p-4 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl outline-none h-24 resize-none text-slate-950 font-black placeholder-slate-300 shadow-sm"
                        placeholder="Enter transaction specifics..."
                        value={newRecord.description}
                        onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                      />
                   </div>
                   <button className="w-full bg-slate-950 text-white py-5 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-2xl uppercase tracking-[0.2em]">
                      Finalize Ledger Entry
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Total Receivables</p>
          <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">Le {totalIncome.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Total Expenditures</p>
          <h3 className="text-4xl font-black text-red-600 tracking-tighter">Le {totalExpenses.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group border-b-8 border-b-indigo-600">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Operational Surplus</p>
          <h3 className={`text-4xl font-black tracking-tighter ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            Le {netProfit.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Master Ledger</h4>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-slate-950 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Record New Transaction
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Reference ID</th>
                <th className="px-10 py-6">Account Category</th>
                <th className="px-10 py-6">Narratives</th>
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6 text-right">Ledger Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-10 py-6 text-xs font-black text-slate-400 font-mono">#{record.id}</td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${record.type === 'Income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {record.category}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-sm text-slate-700 font-bold italic leading-relaxed">"{record.description || 'N/A'}"</td>
                  <td className="px-10 py-6 text-sm text-slate-900 font-black">{record.date}</td>
                  <td className={`px-10 py-6 text-right font-black text-lg ${record.type === 'Income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    Le {record.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
