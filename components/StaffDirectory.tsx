
import React, { useState } from 'react';
import { Staff } from '../types';

interface StaffDirectoryProps {
  staff: Staff[];
  onAddStaff: (staff: Staff) => void;
}

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ staff, onAddStaff }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Medical Practitioner',
    department: 'General',
    experience: '5 Years'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name) return;

    onAddStaff({
      id: `S${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newStaff.name,
      role: newStaff.role,
      department: newStaff.department,
      status: 'On Duty',
      experience: newStaff.experience,
      image: `https://picsum.photos/seed/${Math.random()}/200/200`
    });

    setIsModalOpen(false);
    setNewStaff({ name: '', role: 'Medical Practitioner', department: 'General', experience: '5 Years' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-800">Recruit Personnel</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <form onSubmit={handleAddSubmit} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Staff Full Name</label>
                      <input 
                        required
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-slate-900 font-medium"
                        placeholder="Legal name"
                        value={newStaff.name}
                        onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designated Role</label>
                        <input 
                          required
                          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-slate-900 font-medium"
                          placeholder="Specialist..."
                          value={newStaff.role}
                          onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                        <select 
                          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-slate-900 font-medium"
                          value={newStaff.department}
                          onChange={e => setNewStaff({...newStaff, department: e.target.value})}
                        >
                          <option>General</option>
                          <option>Cardiology</option>
                          <option>Pediatrics</option>
                          <option>ICU</option>
                        </select>
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Experience</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-slate-900 font-medium"
                        placeholder="e.g. 10 Years"
                        value={newStaff.experience}
                        onChange={e => setNewStaff({...newStaff, experience: e.target.value})}
                      />
                   </div>
                   <button className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-black transition-all shadow-xl">
                      Register Staff Member
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
