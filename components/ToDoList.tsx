
import React, { useState } from 'react';
import { StaffTask } from '../types';

interface ToDoListProps {
  tasks: StaffTask[];
  onUpsertTask: (task: StaffTask) => void;
  onDeleteTask: (id: string) => void;
}

const ToDoList: React.FC<ToDoListProps> = ({ tasks, onUpsertTask, onDeleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<StaffTask['priority']>('Routine');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onUpsertTask({
      id: `TASK-${Date.now()}`,
      title: newTaskTitle,
      priority: newPriority,
      category: 'Clinical',
      completed: false,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setNewTaskTitle('');
  };

  const toggleTask = (task: StaffTask) => {
    onUpsertTask({ ...task, completed: !task.completed });
  };

  // Sort tasks: Incomplete first, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityMap = { Critical: 0, Urgent: 1, Routine: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div>
          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Clinical Rounds</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Directives & Tasks</p>
        </div>
        <div className="px-3 py-1 bg-indigo-100 rounded-full text-[9px] font-black text-indigo-600 uppercase">
          {tasks.filter(t => !t.completed).length} Pending
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
        {sortedTasks.map((task) => (
          <div 
            key={task.id} 
            className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-500 ease-out relative overflow-hidden ${
              task.completed 
                ? 'bg-emerald-50/30 border-emerald-100' 
                : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'
            }`}
          >
            {/* Completion Animation flourish on background */}
            <div className={`absolute inset-0 bg-emerald-500/5 transition-opacity duration-700 ${task.completed ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <button 
              onClick={() => toggleTask(task)}
              className={`relative w-8 h-8 rounded-xl border-2 transition-all duration-300 shrink-0 flex items-center justify-center ${
                task.completed 
                  ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200 scale-110' 
                  : 'bg-white border-slate-200 hover:border-indigo-400 group-hover:scale-105'
              }`}
            >
              {task.completed && (
                <div className="animate-in zoom-in spin-in-12 duration-300 fill-white text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="absolute inset-0 bg-emerald-400 rounded-xl animate-ping opacity-25"></div>
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0 relative">
              <p className={`text-sm font-bold truncate transition-all duration-700 ease-in-out ${
                task.completed ? 'text-slate-400 italic' : 'text-slate-900'
              }`}>
                {task.title}
              </p>
              {/* Strike-through flourish animation */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-300 transition-all duration-500 ease-in-out origin-left pointer-events-none ${task.completed ? 'w-full scale-x-100' : 'w-0 scale-x-0'}`}></div>
              
              <div className="flex items-center gap-2 mt-1">
                 <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${
                   task.priority === 'Critical' ? 'bg-red-100 text-red-600' : 
                   task.priority === 'Urgent' ? 'bg-amber-100 text-amber-600' : 
                   'bg-slate-100 text-slate-500'
                 }`}>
                   {task.priority}
                 </span>
                 <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{task.category}</span>
              </div>
            </div>

            <button 
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4 select-none">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
             <p className="font-black uppercase tracking-[0.4em] text-[10px]">No Active Directives</p>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-slate-100 bg-slate-50 shrink-0">
        <form onSubmit={handleAddTask} className="flex gap-2">
           <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder="Draft new personnel directive..." 
               className="w-full pl-6 pr-4 py-4 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl outline-none font-bold text-sm shadow-inner transition-all placeholder-slate-300"
               value={newTaskTitle}
               onChange={(e) => setNewTaskTitle(e.target.value)}
             />
             <select 
               className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-100 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1 outline-none text-indigo-600 cursor-pointer"
               value={newPriority}
               onChange={(e) => setNewPriority(e.target.value as any)}
             >
               <option value="Routine">Routine</option>
               <option value="Urgent">Urgent</option>
               <option value="Critical">Critical</option>
             </select>
           </div>
           <button type="submit" className="p-4 bg-slate-950 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
           </button>
        </form>
      </div>
    </div>
  );
};

export default ToDoList;
