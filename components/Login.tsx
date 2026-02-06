import React, { useState } from 'react';
import { UserRole } from '../types';
import Logo from './Logo';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const roles = [
    { id: UserRole.CASHIER, label: 'Cashier', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-emerald-500', password: '1234567' },
    { id: UserRole.DOCTOR, label: 'Doctor', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'bg-indigo-500', password: '1234567' },
    { id: UserRole.LAB_TECH, label: 'Lab Technician', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517', color: 'bg-amber-500', password: '123456' },
    { id: UserRole.MATRON, label: 'Matron', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', color: 'bg-rose-500', password: '12345' },
    { id: UserRole.ADMIN, label: 'System Admin', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', color: 'bg-slate-800', password: '12345' },
  ];

  const handleRoleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId);
    setPassword('');
    setError(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Passwords specified by user:
    // Admin: 12345
    // Lab Tech: 123456
    // Cashier: 1234567
    // Doctor: 1234567
    let isValid = false;
    if (selectedRole === UserRole.ADMIN && password === '12345') isValid = true;
    else if (selectedRole === UserRole.LAB_TECH && password === '123456') isValid = true;
    else if (selectedRole === UserRole.CASHIER && password === '1234567') isValid = true;
    else if (selectedRole === UserRole.DOCTOR && password === '1234567') isValid = true;
    else if (selectedRole === UserRole.MATRON && password === '12345') isValid = true;

    if (isValid) {
      onLogin(selectedRole!);
    } else {
      setError('Invalid authorization key. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
      <div className="max-w-4xl w-full">
        {!selectedRole ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-center mb-12 space-y-4">
              <Logo className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Freetown International</h1>
              <p className="text-slate-500 font-medium">Professional Hospital Management System • Select your portal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-[1.03] transition-all group relative overflow-hidden text-left"
                >
                  <div className={`w-14 h-14 ${role.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-opacity-20`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={role.icon} /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{role.label}</h3>
                  <p className="text-slate-400 text-sm mt-2 font-medium">Access specialized modules for {role.label.toLowerCase()} responsibilities.</p>
                  
                  <div className="mt-8 flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Verify Identity 
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedRole(null)} 
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 font-black text-[10px] uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              Return to Selection
            </button>
            
            <div className="text-center mb-10">
              <div className={`w-20 h-20 bg-slate-50 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                <Logo className="w-14 h-14" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{roles.find(r => r.id === selectedRole)?.label}</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Authorized Personnel Access Only</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Authorization Key</label>
                <input 
                  autoFocus
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 rounded-3xl outline-none text-slate-950 font-black text-2xl tracking-widest text-center transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-xl uppercase tracking-[0.2em]"
              >
                Authenticate
              </button>
            </form>
          </div>
        )}

        <div className="mt-16 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
          &copy; 2024 Freetown International Hospital • Secure Enterprise Access
        </div>
      </div>
    </div>
  );
};

export default Login;