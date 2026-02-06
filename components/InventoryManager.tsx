
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';

interface InventoryManagerProps {
  items: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: InventoryItem) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ items, onUpdateItem, onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Pharmaceutical' | 'Surgical' | 'Lab' | 'General'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Pharmaceutical' as any,
    quantity: '',
    minThreshold: '',
    unit: 'Units',
    pricePerUnit: ''
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId), [items, selectedItemId]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = parseInt(newItemForm.quantity);
    const threshold = parseInt(newItemForm.minThreshold);
    const price = parseFloat(newItemForm.pricePerUnit);

    if (!newItemForm.name.trim()) {
      setFormError("Item nomenclature is required.");
      return;
    }
    if (isNaN(qty) || isNaN(threshold) || isNaN(price)) {
      setFormError("Quantity, threshold, and price must be valid numbers.");
      return;
    }

    onAddItem({
      id: `INV${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: newItemForm.name,
      category: newItemForm.category,
      quantity: qty,
      minThreshold: threshold,
      unit: newItemForm.unit,
      pricePerUnit: price,
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    setIsAddModalOpen(false);
    setNewItemForm({ name: '', category: 'Pharmaceutical', quantity: '', minThreshold: '', unit: 'Units', pricePerUnit: '' });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const change = parseInt(adjustmentValue);
    if (!selectedItem || isNaN(change)) return;

    onUpdateItem({
      ...selectedItem,
      quantity: Math.max(0, selectedItem.quantity + change),
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    setIsAdjustModalOpen(false);
    setAdjustmentValue('');
    setSelectedItemId(null);
  };

  const getStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'OUT OF STOCK', color: 'bg-red-50 text-red-600 border-red-200' };
    if (item.quantity <= item.minThreshold) return { label: 'LOW STOCK', color: 'bg-amber-50 text-amber-600 border-amber-200' };
    return { label: 'IN STOCK', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Search and Filters Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search items by name or reference ID..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-black text-slate-950 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Pharmaceutical', 'Surgical', 'Lab', 'General'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategoryFilter(cat as any)}
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
          New Supply
        </button>
      </div>

      {/* Inventory Grid/Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Reference & Name</th>
                <th className="px-10 py-6">Category</th>
                <th className="px-10 py-6">Stock Level</th>
                <th className="px-10 py-6 text-right">Value (Le)</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-10 py-6">
                      <div>
                        <p className="text-xs font-black text-slate-400 font-mono mb-1 uppercase tracking-tighter">#{item.id}</p>
                        <p className="text-base font-black text-slate-900 tracking-tight">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-lg font-black text-slate-950">{item.quantity} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">{item.unit}</span></p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Threshold: {item.minThreshold}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <p className="text-lg font-black text-slate-950">Le {item.pricePerUnit.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Per {item.unit.slice(0, -1)}</p>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 uppercase tracking-widest ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => { setSelectedItemId(item.id); setIsAdjustModalOpen(true); }}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-400 space-y-4 opacity-30">
                    <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2" /></svg>
                    <p className="font-black uppercase tracking-[0.4em] text-xs italic">No matching supply logs found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-indigo-500/10">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Supply</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>

                {formError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest text-center animate-pulse">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleAddItem} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Item Nomenclature</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black placeholder-slate-300 transition-all" placeholder="e.g. Paracetamol 500mg" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Classification</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" value={newItemForm.category} onChange={e => setNewItemForm({...newItemForm, category: e.target.value as any})}>
                          <option>Pharmaceutical</option><option>Surgical</option><option>Lab</option><option>General</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Measuring Unit</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" placeholder="Vials, Tablets..." value={newItemForm.unit} onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Opening Stock</label>
                        <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" value={newItemForm.quantity} onChange={e => setNewItemForm({...newItemForm, quantity: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Minimum Alert Threshold</label>
                        <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" value={newItemForm.minThreshold} onChange={e => setNewItemForm({...newItemForm, minThreshold: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cost Per Unit (Le)</label>
                        <input type="number" step="0.01" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-2xl outline-none text-slate-950 font-black" placeholder="0.00" value={newItemForm.pricePerUnit} onChange={e => setNewItemForm({...newItemForm, pricePerUnit: e.target.value})} />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-2xl uppercase tracking-[0.2em]">Commit to Inventory</button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-t-8 border-indigo-600">
             <div className="p-10">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Adjust Stock Level</h3>
                   <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Ref: <span className="text-indigo-600">{selectedItem.name}</span></p>
                <form onSubmit={handleAdjustStock} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">Enter Value to Add/Subtract</label>
                      <input 
                        type="number" 
                        autoFocus
                        placeholder="e.g. 50 or -20" 
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-3xl outline-none text-slate-950 font-black text-4xl text-center shadow-inner"
                        value={adjustmentValue} 
                        onChange={e => setAdjustmentValue(e.target.value)} 
                      />
                   </div>
                   <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl uppercase tracking-widest">Authorize Transaction</button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
