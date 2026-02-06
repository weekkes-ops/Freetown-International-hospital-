
import React, { useState, useMemo } from 'react';
import { Vendor } from '../types';

interface VendorManagerProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
  onAddVendor: (vendor: Vendor) => void;
}

const VendorManager: React.FC<VendorManagerProps> = ({ vendors, onUpdateVendor, onAddVendor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    category: 'Pharmaceutical' as any,
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  const categories = ['Pharmaceutical', 'Surgical Equipment', 'Medical Supplies', 'Maintenance', 'General'];

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, searchTerm, categoryFilter]);

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newVendorForm.name.trim() || !newVendorForm.contactPerson.trim() || !newVendorForm.phone.trim()) {
      setFormError("Basic company and contact information is required.");
      return;
    }

    onAddVendor({
      id: `VND${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      ...newVendorForm,
      status: 'Active',
      lastSupplyDate: 'N/A'
    });

    setIsAddModalOpen(false);
    setNewVendorForm({ name: '', category: 'Pharmaceutical', contactPerson: '', phone: '', email: '', address: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Under Review': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Controls */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search partners by company or contact name..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-black text-slate-950 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategoryFilter(cat)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                categoryFilter === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setIsAddModalOpen(true); setFormError(null); }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Register Vendor
        </button>
      </div>

      {/* Vendor Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Partner Info</th>
                <th className="px-10 py-6">Primary Contact</th>
                <th className="px-10 py-6">Category</th>
                <th className="px-10 py-6">Last Transaction</th>
                <th className="px-10 py-6 text-center">Identity</th>
                <th className="px-10 py-6 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-10 py-6">
                    <div>
                      <p className="text-base font-black text-slate-900 tracking-tight">{vendor.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {vendor.id}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-sm font-bold text-slate-700">{vendor.contactPerson}</p>
                    <p className="text-[10px] font-medium text-slate-400">{vendor.email}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                      {vendor.category}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-sm font-black text-slate-900">
                    {vendor.lastSupplyDate}
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border-2 uppercase tracking-widest ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <a href={`tel:${vendor.phone}`} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>
                       <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Supply Partner</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>

                {formError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest text-center animate-pulse">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleAddVendor} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Company Nomenclature</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black placeholder-slate-300 transition-all" placeholder="e.g. Salone Diagnostics" value={newVendorForm.name} onChange={e => setNewVendorForm({...newVendorForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Supply Domain</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" value={newVendorForm.category} onChange={e => setNewVendorForm({...newVendorForm, category: e.target.value as any})}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Primary Contact Person</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" placeholder="John Doe" value={newVendorForm.contactPerson} onChange={e => setNewVendorForm({...newVendorForm, contactPerson: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Business Phone</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" placeholder="+232..." value={newVendorForm.phone} onChange={e => setNewVendorForm({...newVendorForm, phone: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Official Email</label>
                        <input type="email" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" placeholder="contact@company.sl" value={newVendorForm.email} onChange={e => setNewVendorForm({...newVendorForm, email: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Physical/HQ Address</label>
                        <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black h-20 resize-none" value={newVendorForm.address} onChange={e => setNewVendorForm({...newVendorForm, address: e.target.value})} />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-2xl uppercase tracking-[0.2em]">Authorize Partner Enrollment</button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManager;
