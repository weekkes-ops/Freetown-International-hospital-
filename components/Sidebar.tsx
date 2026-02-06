import React from 'react';
import { AppView, UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isOpen, setIsOpen, userRole, onLogout }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: "M4 6h16M4 12h16M4 18h16", roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR, UserRole.MATRON] },
    { id: AppView.WIZARD, label: 'Patient Journey', icon: "M13 10V3L4 14h7v7l9-11h-7z", roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { id: AppView.CASHIER, label: 'Registration Desk', icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR] },
    { id: AppView.DOCTOR, label: 'Consultation', icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: AppView.LABORATORY, label: 'Laboratory', icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517", roles: [UserRole.ADMIN, UserRole.LAB_TECH, UserRole.DOCTOR] },
    { id: AppView.PHARMACY, label: 'Pharmacy', icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", roles: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR] },
    { id: AppView.PATIENTS, label: 'Patient Master', icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MATRON] },
    { id: AppView.MEDICAL_RECORDS, label: 'Records Archive', icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MATRON] },
    { id: AppView.APPOINTMENTS, label: 'Appointments', icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", roles: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR, UserRole.CASHIER] },
    { id: AppView.SURGICAL_THEATER, label: 'Surgical Theater', icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: AppView.INVENTORY, label: 'Inventory Control', icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", roles: [UserRole.ADMIN, UserRole.MATRON, UserRole.CASHIER, UserRole.DOCTOR] },
    { id: AppView.ACCOUNTING, label: 'Accounting', icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1", roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR] },
    { id: AppView.PAYROLLS, label: 'Payroll Management', icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2", roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: AppView.VENDORS, label: 'Vendor Relations', icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.DOCTOR] },
    { id: AppView.EMPLOYEES, label: 'HR Management', icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197", roles: [UserRole.ADMIN, UserRole.MATRON, UserRole.DOCTOR] },
    { id: AppView.REPORTING, label: 'System Reports', icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: AppView.AI_ASSISTANT, label: 'AI Intelligence', icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z", roles: [UserRole.ADMIN, UserRole.DOCTOR] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50`}>
      <div className="h-16 flex items-center px-4 border-b border-slate-100 overflow-hidden shrink-0">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 shrink-0" />
          {isOpen && <span className="font-bold text-slate-800 text-lg tracking-tight leading-tight">Freetown Int.</span>}
        </div>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center ${isOpen ? 'px-4' : 'justify-center'} py-2.5 rounded-xl transition-all ${
              activeView === item.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
            </div>
            {isOpen && <span className="ml-3 font-medium truncate text-xs uppercase tracking-wider">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
        {isOpen && (
          <div className="px-3 py-2 bg-slate-50 rounded-xl mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Identity</p>
            <p className="text-[11px] font-bold text-indigo-600 truncate">{userRole.replace('_', ' ')}</p>
          </div>
        )}
        <button 
          onClick={onLogout}
          className={`w-full flex items-center ${isOpen ? 'px-4' : 'justify-center'} py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {isOpen && <span className="ml-3 font-bold text-xs uppercase tracking-widest">Log Out</span>}
        </button>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
        >
          <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;