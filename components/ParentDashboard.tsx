
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
          ? 'bg-indigo-600 text-white rounded-r-full shadow-md' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-6 shrink-0 flex flex-col shadow-sm">
        <div className="px-6 mb-8">
           <div className="flex items-center gap-2 mb-1">
             <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" alt="Logo" className="w-8 h-8 object-contain" />
             <span className="font-bold text-lg text-slate-800 dark:text-white">TeraDoc</span>
           </div>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Área do Responsável</p>
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
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-600" /> Minhas Solicitações
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acompanhe o andamento dos seus pedidos</p>
              </div>
              <button 
                onClick={() => {
                  if (myPatients.length > 0) { setReqPatientId(myPatients[0].id); setShowNewRequest(true); }
                  else { alert('Cadastre um paciente primeiro.'); setCurrentView('PATIENTS'); }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> Nova Solicitação
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                <ClipboardList size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Nenhuma solicitação ainda</h3>
                <p className="text-sm text-gray-400 max-w-xs mt-1">Solicite relatórios, declarações ou justificativas aqui.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-4">Paciente</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {myRequests.map(req => {
                      const patient = getPatientById(req.patientId);
                      return (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-medium text-slate-700 dark:text-gray-200">{patient?.name}</td>
                          <td className="p-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{req.category}</td>
                          <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(req.requestDate).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${req.status === 'APPROVED_BY_ADMIN' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {req.status === 'APPROVED_BY_ADMIN' && (
                              <button className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-xs"><Download size={14}/> PDF</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
