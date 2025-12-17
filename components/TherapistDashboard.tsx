
import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { FileEdit, Save, CheckCircle, PenTool, Loader2, FileText, AlertOctagon, Send, FileSignature, LogOut, Upload } from 'lucide-react';

export const TherapistDashboard = () => {
  const { currentUser, requests, saveReportDraft, submitDraft, signReport, getPatientById, getUserById, updateUserSignature } = useStore();
  
  const [activeTab, setActiveTab] = useState<'DRAFTS' | 'SIGNING' | 'SIGNATURE_CONFIG' | 'DISCHARGE'>('DRAFTS');
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  
  const myRequests = requests.filter(r => r.therapistId === currentUser?.id);
  const draftTasks = myRequests.filter(r => ['ASSIGNED', 'NEEDS_REVISION', 'WAITING_APPROVAL'].includes(r.status));
  const signingTasks = myRequests.filter(r => ['WAITING_SIGNATURE'].includes(r.status));
  
  const activeTask = activeReqId ? myRequests.find(r => r.id === activeReqId) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full p-4 lg:p-8 bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar de Tarefas */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col shrink-0 overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-white/5 bg-teal-50/50 dark:bg-teal-900/10">
            <h3 className="font-black text-teal-800 dark:text-teal-400 italic tracking-tighter uppercase">Painel Clínico</h3>
            <p className="text-[10px] text-teal-600/60 dark:text-teal-400/40 font-black uppercase tracking-[0.2em] mt-1">Gestão de Documentos</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button 
                onClick={() => setActiveTab('DRAFTS')} 
                className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between transition-all font-bold ${activeTab === 'DRAFTS' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
                <div className="flex items-center gap-3">
                    <FileEdit size={18} />
                    <span className="text-sm">Elaboração</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeTab === 'DRAFTS' ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800'}`}>{draftTasks.length}</span>
            </button>
            <button 
                onClick={() => setActiveTab('SIGNING')} 
                className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between transition-all font-bold ${activeTab === 'SIGNING' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
                <div className="flex items-center gap-3">
                    <FileSignature size={18} />
                    <span className="text-sm">Assinaturas</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeTab === 'SIGNING' ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800'}`}>{signingTasks.length}</span>
            </button>
            <div className="border-t dark:border-white/5 my-4 pt-4">
                <button 
                    onClick={() => setActiveTab('SIGNATURE_CONFIG')} 
                    className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-bold ${activeTab === 'SIGNATURE_CONFIG' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    <PenTool size={18} />
                    <span className="text-sm">Configurar Firma</span>
                </button>
            </div>
        </nav>
      </div>

      {/* Área de Trabalho */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden relative">
        <div className="p-8 flex flex-col items-center justify-center h-full text-center">
            <div className="p-10 bg-gray-50 dark:bg-slate-800 rounded-full mb-8 animate-pulse">
                <FileText size={64} className="text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter">Área de Trabalho Vazia</h3>
            <p className="text-slate-400 dark:text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">Selecione um documento na barra lateral para iniciar a edição ou assinatura digital.</p>
        </div>
      </div>
    </div>
  );
};
