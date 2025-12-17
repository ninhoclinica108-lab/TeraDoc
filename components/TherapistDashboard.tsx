
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
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 lg:p-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar de Tarefas */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/40">
            <h3 className="font-bold text-teal-800 dark:text-teal-200">Minhas Demandas</h3>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <button onClick={() => setActiveTab('DRAFTS')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'DRAFTS' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                <FileEdit size={18} /> Elaboração ({draftTasks.length})
            </button>
            <button onClick={() => setActiveTab('SIGNING')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'SIGNING' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                <FileSignature size={18} /> Assinaturas ({signingTasks.length})
            </button>
            <div className="border-t dark:border-gray-700 my-2 pt-2">
                <button onClick={() => setActiveTab('SIGNATURE_CONFIG')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'SIGNATURE_CONFIG' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                    <PenTool size={18} /> Minha Assinatura
                </button>
            </div>
        </nav>
      </div>

      {/* Área de Trabalho */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative">
        <div className="p-8 flex flex-col items-center justify-center h-full text-center text-gray-400">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Selecione uma tarefa para começar a trabalhar.</p>
        </div>
      </div>
    </div>
  );
};
