
import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { 
  Plus, 
  FileText, 
  Download, 
  UserPlus, 
  LayoutDashboard, 
  Users, 
  User, 
  ClipboardList, 
  AlertCircle,
  Calendar,
  AlertTriangle,
  Upload,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Shield,
  Bell,
  CheckCircle2,
  Info
} from 'lucide-react';
import { generatePDF } from '../services/utils';
import { RequestCategory, Patient } from '../types';

type ViewState = 'DASHBOARD' | 'PATIENTS' | 'REQUESTS' | 'PROFILE';

export const ParentDashboard = () => {
  const { currentUser, patients, requests, addPatient, createRequest, getPatientById, getUserById } = useStore();
  const [currentView, setCurrentView] = useState<ViewState>('REQUESTS');
  
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  
  const [newPName, setNewPName] = useState('');
  const [newPBirth, setNewPBirth] = useState('');
  const [newPTherapy, setNewPTherapy] = useState('');
  const [newPShift, setNewPShift] = useState('Manhã');
  const [newPObs, setNewPObs] = useState('');

  const [reqPatientId, setReqPatientId] = useState('');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('RELATORIO');
  const [reqSpecialty, setReqSpecialty] = useState('');
  const [reqReportPurpose, setReqReportPurpose] = useState<'CONSULTA_MEDICA' | 'OUTROS'>('CONSULTA_MEDICA');
  const [reqMedicalDate, setReqMedicalDate] = useState('');
  const [reqParentNotes, setReqParentNotes] = useState('');

  const myPatients = patients.filter(p => p.parentId === currentUser?.id);
  const myRequests = requests.filter(r => r.parentId === currentUser?.id);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} anos`;
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors mb-1
        ${currentView === view 
          ? 'bg-teal-600 text-white rounded-r-full shadow-md' 
          : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-teal-600 dark:hover:text-teal-400'
        }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/5 py-6 shrink-0 flex flex-col shadow-sm">
        <div className="px-6 mb-8">
           <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Painel do Responsável</p>
        </div>
        <nav className="flex-1 overflow-y-auto pr-4">
          <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem view="PATIENTS" icon={Users} label="Meus Pacientes" />
          <SidebarItem view="REQUESTS" icon={FileText} label="Solicitações" />
          <SidebarItem view="PROFILE" icon={User} label="Meu Perfil" />
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {currentView === 'REQUESTS' && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 italic tracking-tighter">
                  <FileText className="text-teal-600" size={28} /> Minhas Solicitações
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie seus pedidos de documentos e relatórios</p>
              </div>
              <button 
                onClick={() => {
                  if (myPatients.length > 0) { setReqPatientId(myPatients[0].id); setShowNewRequest(true); }
                  else { alert('Cadastre um paciente primeiro.'); setCurrentView('PATIENTS'); }
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> Novo Pedido
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2rem] bg-white dark:bg-slate-900/50 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-full mb-6">
                    <ClipboardList size={48} className="text-gray-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">Nenhuma solicitação ativa</h3>
                <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs mt-2 font-medium">Você ainda não possui pedidos registrados. Clique em "Novo Pedido" para começar.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
                      <tr>
                        <th className="p-6">Paciente</th>
                        <th className="p-6">Documento</th>
                        <th className="p-6">Data Pedido</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {myRequests.map(req => {
                        const patient = getPatientById(req.patientId);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="p-6">
                                <p className="font-bold text-slate-700 dark:text-white group-hover:text-teal-600 transition-colors">{patient?.name}</p>
                            </td>
                            <td className="p-6">
                                <span className="text-xs font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-lg uppercase tracking-wider">{req.category}</span>
                            </td>
                            <td className="p-6 text-gray-500 dark:text-slate-400 text-sm font-medium">{new Date(req.requestDate).toLocaleDateString('pt-BR')}</td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm ${
                                req.status === 'APPROVED_BY_ADMIN' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {req.status === 'APPROVED_BY_ADMIN' ? 'Concluído' : 'Em Processamento'}
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              {req.status === 'APPROVED_BY_ADMIN' ? (
                                <button 
                                    onClick={() => generatePDF(req, patient!, getUserById(req.therapistId!)!, currentUser!)}
                                    className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 p-2 rounded-xl transition-all"
                                    title="Baixar Documento"
                                >
                                    <Download size={18}/>
                                </button>
                              ) : (
                                <button className="p-2 text-slate-300 dark:text-slate-700 cursor-not-allowed">
                                    <Info size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
