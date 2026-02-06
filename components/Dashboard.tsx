
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { Patient, Appointment, FinancialRecord, StaffTask } from '../types';
import ToDoList from './ToDoList';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  financials: FinancialRecord[];
  tasks: StaffTask[];
  onUpsertTask: (task: StaffTask) => void;
  onDeleteTask: (id: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
        {icon}
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend}
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ patients, appointments, financials, tasks, onUpsertTask, onDeleteTask }) => {
  const patientFlowData = [
    { name: 'Mon', patients: 45 },
    { name: 'Tue', patients: 52 },
    { name: 'Wed', patients: 48 },
    { name: 'Thu', patients: 61 },
    { name: 'Fri', patients: 55 },
    { name: 'Sat', patients: 30 },
    { name: 'Sun', patients: 25 },
  ];

  const deptData = [
    { name: 'Cardiology', value: 34, color: '#6366f1' },
    { name: 'Neurology', value: 28, color: '#ec4899' },
    { name: 'Oncology', value: 45, color: '#10b981' },
    { name: 'ER', value: 62, color: '#f59e0b' },
  ];

  const totalIncome = financials.filter(r => r.type === 'Income').reduce((acc, r) => acc + r.amount, 0);
  const totalExpense = financials.filter(r => r.type === 'Expense').reduce((acc, r) => acc + r.amount, 0);

  const financialSummaryData = [
    { name: 'Earnings', amount: totalIncome, fill: '#10b981' },
    { name: 'Expenses', amount: totalExpense, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={patients.length.toString()} 
          trend="+12%" 
          color="bg-indigo-600 text-indigo-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard 
          title="Daily Appointments" 
          value={appointments.length.toString()} 
          trend="+2" 
          color="bg-pink-600 text-pink-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard 
          title="Avg. Waiting Time" 
          value="18m" 
          trend="-12%" 
          color="bg-emerald-600 text-emerald-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title="Net Earnings" 
          value={`Le ${(totalIncome - totalExpense).toLocaleString()}`} 
          trend="+8.2%" 
          color="bg-amber-600 text-amber-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-slate-800">Income vs Expenses (Le)</h4>
              <p className="text-sm text-slate-500">Monthly financial performance summary</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-green-700 uppercase">Income</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-bold text-red-700 uppercase">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialSummaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={80}>
                  {financialSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Integrated To-Do List Widget */}
        <div className="lg:col-span-4 h-[500px]">
           <ToDoList tasks={tasks} onUpsertTask={onUpsertTask} onDeleteTask={onDeleteTask} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-800">Recent Admissions</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing latest activity</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...patients].sort((a,b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 10).map((patient, idx) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {patient.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs uppercase">{patient.id}</td>
                    <td className="px-6 py-4 text-slate-500">{patient.lastVisit}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md">{patient.clinicType || 'Internal'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${patient.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <span className="text-sm text-slate-600">{patient.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Department Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-6">
            {deptData.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: dept.color}}></div>
                  <span className="text-sm text-slate-600">{dept.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{dept.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
