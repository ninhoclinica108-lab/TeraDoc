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
  
  // Modals State
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  
  // New Patient Form
  const [newPName, setNewPName] = useState('');
  const [newPBirth, setNewPBirth] = useState('');
  const [newPTherapy, setNewPTherapy] = useState('');
  const [newPShift, setNewPShift] = useState('Manhã'); // Updated default
  const [newPObs, setNewPObs] = useState('');

  // New Request Form Complex State
  const [reqPatientId, setReqPatientId] = useState('');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('RELATORIO');
  
  // Sub-fields
  const [reqSpecialty, setReqSpecialty] = useState('');
  const [reqReportPurpose, setReqReportPurpose] = useState<'CONSULTA_MEDICA' | 'OUTROS'>('CONSULTA_MEDICA');
  const [reqMedicalDate, setReqMedicalDate] = useState('');
  const [reqParentNotes, setReqParentNotes] = useState(''); // "Outros" details or general notes
  
  const [reqDeclarationNotes, setReqDeclarationNotes] = useState('');
  
  const [reqAbsentStart, setReqAbsentStart] = useState('');
  const [reqAbsentEnd, setReqAbsentEnd] = useState('');
  const [reqAbsentReason, setReqAbsentReason] = useState('');
  
  const [reqAttachment, setReqAttachment] = useState<File | null>(null);
  const [reqDismissalReason, setReqDismissalReason] = useState('');
  
  const [reqAccessoryType, setReqAccessoryType] = useState('Chaveiro');

  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '(11) 99876-5432',
    cpf: '123.456.789-00',
    address: 'Rua das Acácias, 123 - São Paulo, SP',
    notifications: true,
    twoFactor: false
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email
      }));
    }
  }, [currentUser]);

  // Computed
  const myPatients = patients.filter(p => p.parentId === currentUser?.id);
  const myRequests = requests.filter(r => r.parentId === currentUser?.id);
  const selectedPatient = patients.find(p => p.id === reqPatientId);

  // Age Calculation
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  // Check 6 Month Validity - Returns the conflicting request if found
  const getRecentReport = () => {
    if (!reqPatientId || reqCategory !== 'RELATORIO') return null;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return requests.find(r => 
      r.patientId === reqPatientId && 
      r.category === 'RELATORIO' && 
      r.status === 'APPROVED_BY_ADMIN' && // Only counts finished reports
      r.completionDate && 
      new Date(r.completionDate) > sixMonthsAgo
    );
  };
  
  const recentReport = getRecentReport();

  const resetRequestForm = () => {
    setReqCategory('RELATORIO');
    setReqParentNotes('');
    setReqReportPurpose('CONSULTA_MEDICA');
    setReqMedicalDate('');
    setReqDeclarationNotes('');
    setReqAbsentStart('');
    setReqAbsentEnd('');
    setReqAbsentReason('');
    setReqDismissalReason('');
    setReqAttachment(null);
    setReqSpecialty('');
    setShowNewRequest(false);
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      addPatient({
        parentId: currentUser.id,
        name: newPName,
        birthDate: newPBirth,
        therapyType: newPTherapy,
        shift: newPShift,
        observations: newPObs
      });
      setShowNewPatient(false);
      setNewPName(''); setNewPBirth(''); setNewPTherapy(''); setNewPObs('');
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct payload based on category
    const payload: any = {
      patientId: reqPatientId,
      category: reqCategory,
    };

    if (reqCategory === 'RELATORIO') {
      payload.reportPurpose = reqReportPurpose;
      payload.reportSpecialty = reqSpecialty;
      if (reqReportPurpose === 'CONSULTA_MEDICA') {
        payload.medicalConsultationDate = reqMedicalDate;
      } else {
        payload.parentNotes = reqParentNotes; // "Outros" details
      }
    } else if (reqCategory === 'DECLARACAO') {
      payload.declarationNotes = reqDeclarationNotes;
    } else if (reqCategory === 'FALTA_JUSTIFICATIVA') {
      payload.absentStartDate = reqAbsentStart;
      payload.absentEndDate = reqAbsentEnd;
      payload.absentReason = reqAbsentReason;
      if (reqAttachment) payload.attachmentUrl = 'arquivo_simulado.pdf';
    } else if (reqCategory === 'ATUALIZACAO_LAUDO') {
      if (reqAttachment) payload.attachmentUrl = 'laudo_novo.pdf';
    } else if (reqCategory === 'DESLIGAMENTO') {
      payload.dismissalReason = reqDismissalReason;
    } else if (reqCategory === 'ACESSORIO') {
        payload.parentNotes = `Solicitação de acessório: ${reqAccessoryType}`;
    }

    createRequest(payload);
    resetRequestForm();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingProfile(false);
      alert('Dados atualizados com sucesso!');
    }, 1000);
  };

  const handleDownload = (req: any) => {
    const patient = getPatientById(req.patientId);
    
    // Tenta obter o terapeuta. Se não houver ID (ex: assinado pelo admin), usa um fallback.
    const therapist = req.therapistId ? getUserById(req.therapistId) : {
        id: 'admin_fallback',
        name: 'Diretoria Clínica / Admin',
        email: 'ninhoclinica108@gmail.com', // Updated to new admin email
        role: 'ADMIN'
    } as any;
    
    if (patient && currentUser) {
        // Se existe um Blob URL (upload real na sessão), baixa o arquivo
        if (req.pdfUrl && req.pdfUrl.startsWith('blob:')) {
            const link = document.createElement('a');
            link.href = req.pdfUrl;
            link.download = `Documento_${req.category}_${patient.name}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Caso contrário, gera o PDF dinamicamente
            generatePDF(req, patient, therapist, currentUser);
        }
    } else {
        alert('Erro ao baixar: Dados do paciente ou usuário incompletos.');
    }
  };

  const getStatusDisplay = (status: string) => {
      if (status === 'APPROVED_BY_ADMIN') return { label: 'Pronto', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
      if (status === 'PENDING') return { label: 'Solicitado', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' };
      if (status === 'NEEDS_REVISION') return { label: 'Em Revisão', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
      return { label: 'Em Processamento', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' };
  };

  // Sidebar Item
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
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-900 -m-4 sm:-m-6 lg:-m-8 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-6 flex flex-col shrink-0 transition-colors duration-300">
        <div className="px-6 mb-8">
           <div className="flex items-center gap-2 mb-1">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
               <FileText className="text-white w-5 h-5" />
             </div>
             <span className="font-bold text-lg text-slate-800 dark:text-white">TeraDoc</span>
           </div>
           <p className="text-xs text-gray-400 pl-9">Relatórios Terapêuticos</p>
        </div>

        <div className="flex-1 pr-4">
          <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegação</p>
          <nav>
            <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem view="PATIENTS" icon={Users} label="Meus Pacientes" />
            <SidebarItem view="REQUESTS" icon={FileText} label="Solicitações" />
            <SidebarItem view="PROFILE" icon={User} label="Meu Perfil" />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* VIEW: REQUESTS */}
        {currentView === 'REQUESTS' && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-600 dark:text-indigo-400" />
                  Minhas Solicitações
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie e acompanhe suas solicitações</p>
              </div>
              <button 
                onClick={() => {
                  if (myPatients.length > 0) {
                    setReqPatientId(myPatients[0].id);
                    setShowNewRequest(true);
                  } else {
                    alert('Cadastre um paciente primeiro.');
                    setCurrentView('PATIENTS');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2"
              >
                <Plus size={18} /> Nova Solicitação
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 text-gray-400">
                  <ClipboardList size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Nenhuma solicitação ainda</h3>
                <p className="text-gray-500 dark:text-gray-400">Faça sua primeira solicitação de relatório</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-4 font-medium">Paciente</th>
                      <th className="p-4 font-medium">Tipo</th>
                      <th className="p-4 font-medium">Data</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {myRequests.map(req => {
                      const patient = getPatientById(req.patientId);
                      const statusInfo = getStatusDisplay(req.status);
                      return (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-medium text-slate-700 dark:text-gray-200">{patient?.name}</td>
                          <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{req.category.replace('_', ' ')}</td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(req.requestDate).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            {req.status === 'APPROVED_BY_ADMIN' ? (
                              <button 
                                onClick={() => handleDownload(req)}
                                className="flex items-center gap-1 text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg font-medium text-sm shadow-sm"
                              >
                                <Download size={16} /> Baixar
                              </button>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                <AlertCircle size={14} /> Em andamento
                              </span>
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

        {/* VIEW: PATIENTS */}
        {currentView === 'PATIENTS' && (
           <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-8">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Users className="text-indigo-600 dark:text-indigo-400" />
                    Meus Pacientes
                  </h1>
               </div>
               <button 
                onClick={() => setShowNewPatient(true)}
                className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
              >
                <UserPlus size={18} /> Novo Paciente
              </button>
             </div>

             <div className="grid md:grid-cols-2 gap-4">
                {myPatients.length === 0 && (
                   <div className="col-span-2 p-8 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
                      Nenhum paciente cadastrado.
                   </div>
                )}
                {myPatients.map(p => (
                  <div key={p.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{p.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{calculateAge(p.birthDate)} • {p.shift || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* VIEW: PROFILE (Finalized) */}
        {currentView === 'PROFILE' && (
           <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <User className="text-indigo-600 dark:text-indigo-400" />
                  Meu Perfil
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus dados pessoais e preferências</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column: Avatar & Summary */}
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden text-center">
                       <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                       <div className="px-6 pb-6 relative">
                          <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-700 shadow-md mx-auto -mt-12 flex items-center justify-center relative group cursor-pointer">
                             {currentUser?.avatar ? (
                               <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                             ) : (
                               <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{currentUser?.name.charAt(0)}</div>
                             )}
                             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                             </div>
                          </div>
                          <h2 className="mt-3 text-lg font-bold text-gray-800 dark:text-white">{currentUser?.name}</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{currentUser?.email}</p>
                          <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full uppercase tracking-wide">
                             Responsável
                          </span>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                       <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2"><Shield size={18} className="text-indigo-600 dark:text-indigo-400" /> Resumo da Conta</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500 dark:text-gray-400">Pacientes</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">{myPatients.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500 dark:text-gray-400">Solicitações Totais</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">{myRequests.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500 dark:text-gray-400">Membro desde</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">Jan 2023</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Edit Form */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Dados Pessoais</h3>
                          {isSavingProfile && <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 animate-pulse"><CheckCircle2 size={16}/> Salvando...</span>}
                       </div>
                       
                       <form onSubmit={handleSaveProfile} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                <div className="relative">
                                   <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                   <input 
                                     type="text" 
                                     value={profileData.name}
                                     onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                     className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                                   />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                <div className="relative">
                                   <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                   <input 
                                     type="text" 
                                     value={profileData.cpf}
                                     onChange={(e) => setProfileData({...profileData, cpf: e.target.value})}
                                     className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                <div className="relative">
                                   <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                   <input 
                                     type="email" 
                                     value={profileData.email}
                                     disabled
                                     className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                                   />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                   <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                   <input 
                                     type="text" 
                                     value={profileData.phone}
                                     onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                     className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                                   />
                                </div>
                             </div>
                          </div>

                          <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço Residencial</label>
                             <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                  type="text" 
                                  value={profileData.address}
                                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                  className="w-full pl-10 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                                />
                             </div>
                          </div>

                          <div className="pt-4 flex justify-end">
                             <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all">
                                <Save size={18} /> Salvar Alterações
                             </button>
                          </div>
                       </form>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Preferências & Segurança</h3>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400"><Bell size={20} /></div>
                                 <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Notificações por E-mail</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Receba atualizações sobre o status das solicitações</p>
                                 </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={profileData.notifications} onChange={() => setProfileData({...profileData, notifications: !profileData.notifications})} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                           </div>

                           <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg text-orange-600 dark:text-orange-400"><Shield size={20} /></div>
                                 <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Autenticação de Dois Fatores</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Adicione uma camada extra de segurança</p>
                                 </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={profileData.twoFactor} onChange={() => setProfileData({...profileData, twoFactor: !profileData.twoFactor})} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              </label>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Placeholder for Dashboard only */}
        {currentView === 'DASHBOARD' && (
           <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <LayoutDashboard size={48} className="mb-4 opacity-20" />
              <p>Dashboard geral em desenvolvimento...</p>
           </div>
        )}
      </main>

      {/* --- MODAL: NEW PATIENT --- */}
      {showNewPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Cadastrar Paciente</h3>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <input type="text" placeholder="Nome Completo" required className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={newPName} onChange={e => setNewPName(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={newPBirth} onChange={e => setNewPBirth(e.target.value)} />
                <select className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={newPShift} onChange={e => setNewPShift(e.target.value)}>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Integral">Integral</option>
                </select>
              </div>
              <input type="text" placeholder="Tipo de Terapia (ex: Psicologia)" required className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={newPTherapy} onChange={e => setNewPTherapy(e.target.value)} />
              <textarea placeholder="Observações..." className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={newPObs} onChange={e => setNewPObs(e.target.value)} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewPatient(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW REQUEST (Complex) --- */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Nova Solicitação</h3>
            <form onSubmit={handleRequestSubmit} className="space-y-6">
              
              {/* 1. Select Patient */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">1. Selecione o Paciente</label>
                <select 
                  className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  value={reqPatientId}
                  onChange={e => setReqPatientId(e.target.value)}
                >
                  {myPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedPatient && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex gap-4">
                        <span><strong>Nascimento:</strong> {new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR')}</span>
                        <span><strong>Idade:</strong> {calculateAge(selectedPatient.birthDate)}</span>
                    </div>
                )}
              </div>

              {/* 2. Select Type */}
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">2. Para que sua solicitação seja validada, selecione uma opção:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                        { id: 'RELATORIO', label: 'Relatórios' },
                        { id: 'DECLARACAO', label: 'Declarações' },
                        { id: 'FALTA_JUSTIFICATIVA', label: 'Falta Justificativa' },
                        { id: 'ATUALIZACAO_LAUDO', label: 'Atualização de Laudos' },
                        { id: 'DESLIGAMENTO', label: 'Desligamento/Suspensão' },
                        { id: 'ACESSORIO', label: 'Solicitação de Acessório' },
                    ].map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setReqCategory(type.id as RequestCategory)}
                            className={`p-3 text-sm rounded-lg border transition-all text-left ${reqCategory === type.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                  </div>
              </div>

              {/* 3. Conditional Fields based on Category */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300">
                  
                  {/* RELATORIO */}
                  {reqCategory === 'RELATORIO' && (
                      <div className="space-y-4">
                          {recentReport && (
                              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg flex gap-4 text-amber-900 dark:text-amber-100 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                  <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full h-fit">
                                     <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg mb-1">Atenção: Relatório Vigente Encontrado</h4>
                                    <p className="text-sm mb-2 opacity-90">
                                      Identificamos um relatório emitido em <strong>{new Date(recentReport.completionDate!).toLocaleDateString('pt-BR')}</strong> para este paciente.
                                    </p>
                                    <div className="bg-white/60 dark:bg-black/20 p-3 rounded text-xs text-amber-800 dark:text-amber-200 mb-3 border border-amber-100 dark:border-amber-800/30">
                                      <strong className="flex items-center gap-1 mb-1"><Info size={12}/> Nota de Validade:</strong> A maioria das instituições (escolas e planos de saúde) considera relatórios terapêuticos válidos por <strong>6 meses</strong>.
                                    </div>
                                    <p className="text-sm font-semibold">
                                      Deseja prosseguir com uma nova solicitação mesmo assim?
                                    </p>
                                  </div>
                              </div>
                          )}

                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Especialidade Desejada</label>
                              <input type="text" required className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" placeholder="Ex: Psicologia, Fonoaudiologia..." value={reqSpecialty} onChange={e => setReqSpecialty(e.target.value)} />
                          </div>

                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Finalidade do Relatório</label>
                              <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                      <input type="radio" name="purpose" checked={reqReportPurpose === 'CONSULTA_MEDICA'} onChange={() => setReqReportPurpose('CONSULTA_MEDICA')} />
                                      Consulta Médica
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                      <input type="radio" name="purpose" checked={reqReportPurpose === 'OUTROS'} onChange={() => setReqReportPurpose('OUTROS')} />
                                      Outros
                                  </label>
                              </div>
                          </div>

                          {reqReportPurpose === 'CONSULTA_MEDICA' && (
                              <div>
                                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data da Consulta (Opcional)</label>
                                  <input type="date" className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" value={reqMedicalDate} onChange={e => setReqMedicalDate(e.target.value)} />
                              </div>
                          )}
                          
                          {reqReportPurpose === 'OUTROS' && (
                              <div>
                                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descreva o que deseja</label>
                                  <textarea required className="w-full p-2 border dark:border-gray-600 rounded h-24 bg-white dark:bg-gray-700 dark:text-white" value={reqParentNotes} onChange={e => setReqParentNotes(e.target.value)} />
                              </div>
                          )}
                      </div>
                  )}

                  {/* DECLARACAO */}
                  {reqCategory === 'DECLARACAO' && (
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações da Declaração</label>
                          <textarea required className="w-full p-2 border dark:border-gray-600 rounded h-24 bg-white dark:bg-gray-700 dark:text-white" placeholder="Ex: Declaração de comparecimento para a escola..." value={reqDeclarationNotes} onChange={e => setReqDeclarationNotes(e.target.value)} />
                      </div>
                  )}

                  {/* FALTA */}
                  {reqCategory === 'FALTA_JUSTIFICATIVA' && (
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Início Afastamento</label>
                                  <input type="date" required className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" value={reqAbsentStart} onChange={e => setReqAbsentStart(e.target.value)} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Retorno</label>
                                  <input type="date" required className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" value={reqAbsentEnd} onChange={e => setReqAbsentEnd(e.target.value)} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Motivo</label>
                              <input type="text" required className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" value={reqAbsentReason} onChange={e => setReqAbsentReason(e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Upload de Declaração (Opcional)</label>
                              <div className="border border-dashed dark:border-gray-600 p-4 rounded text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <Upload className="mx-auto text-gray-400 mb-2" />
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Clique para anexar arquivo (Simulado)</span>
                                  <input type="file" className="hidden" onChange={e => setReqAttachment(e.target.files ? e.target.files[0] : null)} />
                              </div>
                              {reqAttachment && <p className="text-xs text-green-600 mt-1">Arquivo selecionado: {reqAttachment.name}</p>}
                          </div>
                      </div>
                  )}

                  {/* ATUALIZACAO LAUDO */}
                  {reqCategory === 'ATUALIZACAO_LAUDO' && (
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Upload do Novo Laudo</label>
                          <div className="border border-dashed dark:border-gray-600 p-4 rounded text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                              <Upload className="mx-auto text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Anexar Laudo Digitalizado (Simulado)</span>
                              <input type="file" className="hidden" onChange={e => setReqAttachment(e.target.files ? e.target.files[0] : null)} />
                          </div>
                          {reqAttachment && <p className="text-xs text-green-600 mt-1">Arquivo selecionado: {reqAttachment.name}</p>}
                      </div>
                  )}

                  {/* DESLIGAMENTO */}
                  {reqCategory === 'DESLIGAMENTO' && (
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Motivo do Desligamento/Suspensão</label>
                          <textarea required className="w-full p-2 border dark:border-gray-600 rounded h-24 bg-white dark:bg-gray-700 dark:text-white" value={reqDismissalReason} onChange={e => setReqDismissalReason(e.target.value)} />
                      </div>
                  )}
                  
                  {/* ACESSORIO */}
                  {reqCategory === 'ACESSORIO' && (
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de Acessório</label>
                          <select className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" value={reqAccessoryType} onChange={e => setReqAccessoryType(e.target.value)}>
                              <option value="Chaveiro">Chaveiro</option>
                              <option value="Cracha">Crachá de Identificação</option>
                              <option value="Cordao">Cordão</option>
                          </select>
                      </div>
                  )}

              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetRequestForm} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enviar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};