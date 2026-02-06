
import React from 'react';

interface ModuleItem {
  id: number | string;
  title: string;
  timestamp: string;
  status: string;
}

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: string;
  items: ModuleItem[];
  onAdd: () => void;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, description, icon, items, onAdd }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-slate-500 max-w-xl font-medium">{description}</p>
          </div>
          <div className="md:ml-auto flex gap-4 w-full md:w-auto">
            <button 
              onClick={onAdd}
              className="flex-1 md:flex-none px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest text-xs"
            >
              New Entry
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Operational Records Log</h4>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Filter secure records..." 
                className="pl-12 pr-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-black text-slate-950 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 focus:outline-none transition-all placeholder-slate-400 w-64" 
              />
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-4">
            {items.length > 0 ? items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all animate-in slide-in-from-top-2">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-slate-400 font-mono text-xs">#{item.id}</div>
                  <div>
                    <p className="font-black text-slate-900 text-lg leading-tight">{item.title}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Processed: {item.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-5 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">{item.status}</span>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center text-slate-400 space-y-6 opacity-30">
                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-black uppercase tracking-[0.4em] text-xs">No Operational Logs Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
