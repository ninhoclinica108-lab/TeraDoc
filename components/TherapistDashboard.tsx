import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { FileEdit, Save, CheckCircle, PenTool, Loader2, FileText, AlertOctagon, Send, FileSignature, LogOut, Upload } from 'lucide-react';

export const TherapistDashboard = () => {
  const { currentUser, requests, saveReportDraft, submitDraft, signReport, getPatientById, getUserById, updateUserSignature } = useStore();
  
  // State
  const [activeTab, setActiveTab] = useState<'DRAFTS' | 'SIGNING' | 'SIGNATURE_CONFIG' | 'DISCHARGE'>('DRAFTS');
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  
  // Signature Config State
  const [newSigFile, setNewSigFile] = useState<File | null>(null);

  // Filter Tasks
  const myRequests = requests.filter(r => r.therapistId === currentUser?.id);
  
  const draftTasks = myRequests.filter(r => ['ASSIGNED', 'NEEDS_REVISION', 'WAITING_APPROVAL'].includes(r.status));
  const signingTasks = myRequests.filter(r => ['WAITING_SIGNATURE'].includes(r.status));
  
  const activeTask = activeReqId ? myRequests.find(r => r.id === activeReqId) : null;

  const openTask = (req: any) => {
    setActiveReqId(req.id);
    setContent(req.therapistContent || '');
    if (req.status === 'WAITING_SIGNATURE') {
        setActiveTab('SIGNING');
    } else {
        setActiveTab('DRAFTS');
    }
  };

  const handleSaveDraft = () => {
    if (activeReqId) saveReportDraft(activeReqId, content);
  };

  const handleSubmitDraft = () => {
    if (activeReqId) {
        saveReportDraft(activeReqId, content);
        submitDraft(activeReqId);
        setActiveReqId(null);
    }
  };

  const handleSign = () => {
    if (!activeReqId) return;
    setIsSigning(true);
    setTimeout(() => {
        signReport(activeReqId);
        setIsSigning(false);
    }, 1500);
  };

  const handleSignatureUpload = () => {
      if (newSigFile && currentUser) {
          // Simulate upload
          const fakeUrl = URL.createObjectURL(newSigFile);
          updateUserSignature(currentUser.id, fakeUrl);
          setNewSigFile(null);
          alert('Assinatura atualizada com sucesso!');
      }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] transition-colors duration-300">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/40">
            <h3 className="font-bold text-teal-800 dark:text-teal-200">Menu do Terapeuta</h3>
        </div>
        <nav className="flex-1 p-2 space-y-1">
            <button onClick={() => { setActiveTab('DRAFTS'); setActiveReqId(null); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'DRAFTS' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <FileEdit size={18} /> Em Elaboração 
                {draftTasks.length > 0 && <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">{draftTasks.length}</span>}
            </button>
            <button onClick={() => { setActiveTab('SIGNING'); setActiveReqId(null); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'SIGNING' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <FileSignature size={18} /> Assinar Documentos
                {signingTasks.length > 0 && <span className="ml-auto bg-green-500 text-white px-2 py-0.5 rounded text-xs animate-pulse">{signingTasks.length}</span>}
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 my-2 pt-2">
                <button onClick={() => setActiveTab('DISCHARGE')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'DISCHARGE' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <LogOut size={18} /> Emitir Declaração Alta
                </button>
                <button onClick={() => setActiveTab('SIGNATURE_CONFIG')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${activeTab === 'SIGNATURE_CONFIG' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <PenTool size={18} /> Cadastrar Assinatura
                </button>
            </div>
        </nav>
      </div>

      {/* Task List (Visible only on Drafts/Signing tabs) */}
      {(activeTab === 'DRAFTS' || activeTab === 'SIGNING') && (
         <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-bold text-gray-700 dark:text-gray-200">{activeTab === 'DRAFTS' ? 'Tarefas Pendentes' : 'Aguardando Assinatura'}</h4>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {(activeTab === 'DRAFTS' ? draftTasks : signingTasks).length === 0 && (
                    <div className="text-center p-8 text-gray-400 dark:text-gray-500 text-sm">Nenhuma tarefa aqui.</div>
                )}
                {(activeTab === 'DRAFTS' ? draftTasks : signingTasks).map(req => {
                    const patient = getPatientById(req.patientId);
                    const isRevision = req.status === 'NEEDS_REVISION';
                    return (
                    <div 
                        key={req.id}
                        onClick={() => openTask(req)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border relative ${
                        activeReqId === req.id ? 'border-teal-500 bg-white dark:bg-gray-700 shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-500'
                        } ${isRevision ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                             <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{patient?.name}</span>
                             <span className="text-[10px] bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">{req.category}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{req.category === 'RELATORIO' ? req.reportPurpose : req.category}</p>
                        {isRevision && req.adminNotes && (
                            <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-2 rounded">
                                <strong>Admin:</strong> {req.adminNotes}
                            </div>
                        )}
                    </div>
                    );
                })}
            </div>
         </div>
      )}

      {/* Workspace Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative">
        
        {/* VIEW: SIGNATURE CONFIG */}
        {activeTab === 'SIGNATURE_CONFIG' && (
            <div className="p-8 flex flex-col items-center">
                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Cadastro de Assinatura Digital</h2>
                <div className="w-full max-w-md bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
                    {currentUser?.signatureUrl ? (
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Assinatura Atual:</p>
                            <img src={currentUser.signatureUrl} alt="Assinatura" className="h-20 mx-auto object-contain bg-white border p-2 rounded" />
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 text-sm rounded">Nenhuma assinatura cadastrada.</div>
                    )}
                    
                    <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-8 cursor-pointer hover:bg-white dark:hover:bg-gray-600 transition-colors">
                        <Upload className="mx-auto text-gray-400 dark:text-gray-300 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-300">Clique para fazer upload da imagem (PNG/JPG)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setNewSigFile(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    
                    {newSigFile && (
                        <div className="mt-4">
                            <p className="text-xs text-green-600 dark:text-green-400 mb-2">Selecionado: {newSigFile.name}</p>
                            <button onClick={handleSignatureUpload} className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700">Salvar Nova Assinatura</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW: DISCHARGE */}
        {activeTab === 'DISCHARGE' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <FileText size={64} className="text-teal-200 dark:text-teal-800/50 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Emitir Declaração de Alta</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mt-2">Funcionalidade para gerar documentos padronizados de alta terapêutica.</p>
                <button className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700" onClick={() => alert('Gerador de declaração de alta (Simulado)')}>
                    Iniciar Assistente de Alta
                </button>
            </div>
        )}

        {/* VIEW: WORKSPACE (Draft or Sign) */}
        {(activeTab === 'DRAFTS' || activeTab === 'SIGNING') && activeTask ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    {activeTab === 'DRAFTS' ? 'Editor de Documento' : 'Assinatura Digital'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Paciente: {getPatientById(activeTask.patientId)?.name}</p>
              </div>
              
              {activeTab === 'DRAFTS' && (
                  <button onClick={handleSaveDraft} className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 text-xs flex items-center gap-1">
                      <Save size={14} /> Salvar Rascunho
                  </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 bg-white dark:bg-gray-800 overflow-y-auto">
               {activeTab === 'DRAFTS' ? (
                   <div className="h-full flex flex-col">
                       {activeTask.status === 'NEEDS_REVISION' && (
                           <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
                               <AlertOctagon />
                               <div><span className="font-bold block">Revisão Solicitada:</span> {activeTask.adminNotes}</div>
                           </div>
                       )}
                       <textarea 
                            className="flex-1 w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-relaxed font-serif"
                            placeholder="Escreva o parecer técnico aqui..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                   </div>
               ) : (
                   // PDF SIGNING VIEW
                   <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                       {/* Simulated PDF Page - Kept White for realism */}
                       <div className="bg-white w-[210mm] h-[297mm] shadow-lg p-16 relative scale-50 sm:scale-75 origin-top mt-4 text-xs text-gray-300">
                           [Conteúdo do PDF Gerado pelo Admin...]
                           <br/><br/>
                           Lorem ipsum dolor sit amet...
                           <br/><br/>
                           {/* Signature Line Area */}
                           <div className="absolute bottom-32 left-0 right-0 px-20">
                                <div className="border-t border-black w-64 mx-auto relative h-20 flex items-end justify-center">
                                    <span className="text-black text-xs">Assinatura do Terapeuta</span>
                                    {/* VISUAL SIGNATURE OVERLAY */}
                                    {currentUser?.signatureUrl && (
                                        <img 
                                            src={currentUser.signatureUrl} 
                                            className="absolute bottom-4 h-16 object-contain pointer-events-none"
                                            alt="Minha Assinatura"
                                        />
                                    )}
                                </div>
                           </div>
                       </div>
                   </div>
               )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              {activeTab === 'DRAFTS' ? (
                  <button 
                    onClick={handleSubmitDraft}
                    disabled={content.length < 5}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                  >
                    <Send size={16} /> Enviar para Aprovação Admin
                  </button>
              ) : (
                  <button 
                    onClick={handleSign}
                    disabled={isSigning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm font-medium"
                  >
                    {isSigning ? <Loader2 className="animate-spin" size={16} /> : <PenTool size={16} />}
                    {isSigning ? 'Processando...' : 'Aplicar Assinatura e Devolver ao Admin'}
                  </button>
              )}
            </div>
          </>
        ) : (
          (activeTab === 'DRAFTS' || activeTab === 'SIGNING') && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50/30 dark:bg-gray-900/30">
                <FileEdit size={32} className="mb-4 opacity-20"/>
                <p>Selecione um item da lista</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};