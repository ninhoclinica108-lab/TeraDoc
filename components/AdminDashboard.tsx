import React, { useState, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { 
  Users, 
  CheckCircle, 
  Bell, 
  Trash2, 
  Eye, 
  Upload, 
  FileCheck, 
  AlertTriangle, 
  Send,
  LayoutDashboard,
  FileText,
  Stethoscope,
  Briefcase,
  ShieldCheck,
  Search,
  Lock,
  Plus,
  ShieldAlert,
  KeyRound,
  UserPlus,
  Edit,
  X,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  PenTool,
  Printer,
  Stamp
} from 'lucide-react';
import { generatePDF } from '../services/utils';
import { Role } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

type AdminView = 'DASHBOARD' | 'REQUESTS' | 'THERAPISTS' | 'SPECIALTIES' | 'USERS' | 'ACCESS';

// Updated permissions based on the request image
const AVAILABLE_PERMISSIONS = [
  { id: 'acesso_relatorios', label: 'Relatórios' },
  { id: 'acesso_declaracoes', label: 'Declarações' },
  { id: 'acesso_falta_justificativa', label: 'Falta Justificativa' },
  { id: 'acesso_atualizacao_laudos', label: 'Atualização de Laudos' },
  { id: 'acesso_desligamento', label: 'Desligamento/Suspensão' },
  { id: 'acesso_acessorio', label: 'Solicitação de Acessório' },
  { id: 'gerenciar_usuarios', label: 'Gerenciar Usuários (Admin)' },
  { id: 'configuracoes_sistema', label: 'Configurações do Sistema' }
];

export const AdminDashboard = () => {
  const { requests, users, specialties, addUser, assignTherapist, getPatientById, getUserById, approveContent, uploadPdf, adminApplyStoredSignature, approveFinal, requestRevision, deleteRequest, addSpecialty, updateSpecialty, deleteSpecialty, updateUserSignature } = useStore();
  
  // View State
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');

  // Filter State (Requests)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTION'>('ALL');
  
  // Modals State
  const [assignModalReq, setAssignModalReq] = useState<string | null>(null);
  const [reviewContentModalReq, setReviewContentModalReq] = useState<string | null>(null);
  const [uploadModalReq, setUploadModalReq] = useState<string | null>(null);
  const [reviewPdfModalReq, setReviewPdfModalReq] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Access Control Modal State (Generic Users)
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'PARENT' as Role });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Therapist Registration Modal State
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [newTherapist, setNewTherapist] = useState({ name: '', email: '', password: '', specialty: '' });

  // Specialties Management State
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialtyForm, setSpecialtyForm] = useState({ id: '', name: '' });

  const therapists = users.filter(u => u.role === 'THERAPIST');
  const actionStatuses = ['PENDING', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'SIGNED_BY_THERAPIST'];

  const filteredRequests = requests.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'ACTION') return actionStatuses.includes(r.status);
    return true;
  });

  // --- CHART DATA PREPARATION ---
  
  // 1. Bar Chart: Requests by Category (Last 30 Days)
  const barChartData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const counts: Record<string, number> = {};
    
    requests.forEach(req => {
      const reqDate = new Date(req.requestDate);
      if (reqDate >= thirtyDaysAgo) {
        const categoryName = req.category.replace(/_/g, ' ');
        counts[categoryName] = (counts[categoryName] || 0) + 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      solicitacoes: counts[key]
    }));
  }, [requests]);

  // 2. Pie Chart: Status Distribution (Active Requests)
  const pieChartData = useMemo(() => {
    const activeStatuses = ['PENDING', 'ASSIGNED', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'WAITING_SIGNATURE', 'SIGNED_BY_THERAPIST', 'NEEDS_REVISION'];
    const counts: Record<string, number> = {};

    requests.forEach(req => {
      if (activeStatuses.includes(req.status)) {
        counts[req.status] = (counts[req.status] || 0) + 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key.replace(/_/g, ' '),
      value: counts[key]
    }));
  }, [requests]);

  // Colors for Pie Chart
  const STATUS_COLORS: Record<string, string> = {
    'PENDING': '#EAB308',            // Yellow-500
    'ASSIGNED': '#3B82F6',           // Blue-500
    'WAITING_APPROVAL': '#F97316',   // Orange-500
    'WAITING_PDF_UPLOAD': '#A855F7', // Purple-500
    'WAITING_SIGNATURE': '#14B8A6',  // Teal-500
    'SIGNED_BY_THERAPIST': '#6366F1',// Indigo-500
    'NEEDS_REVISION': '#EF4444'      // Red-500
  };

  const getStatusColor = (statusName: string) => {
    // Reverse map from display name to key or approximate
    const key = statusName.replace(/ /g, '_');
    return STATUS_COLORS[key] || '#94A3B8';
  };

  const handleAssign = () => {
    if (assignModalReq && selectedTherapist) {
      assignTherapist(assignModalReq, selectedTherapist);
      setAssignModalReq(null);
      setSelectedTherapist('');
    }
  };

  // Lógica atualizada de Upload / Geração de PDF e Decisão de Assinatura
  const handleUploadOrGenerate = (type: 'THERAPIST' | 'ADMIN' | 'STORED') => {
    if (uploadModalReq) {
        
      if (type === 'STORED') {
          // Admin usa a assinatura do banco de dados do terapeuta
          adminApplyStoredSignature(uploadModalReq);
      } else {
          // Se não houver arquivo real, usamos uma URL simulada (geração automática)
          const fakeUrl = uploadFile 
            ? URL.createObjectURL(uploadFile) 
            : `relatorio_gerado_sistema_${uploadModalReq}.pdf`;
          
          uploadPdf(uploadModalReq, fakeUrl, type);
      }
      
      setUploadModalReq(null);
      setUploadFile(null);
    }
  };
  
  // Generic User Creation
  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      addUser({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          permissions: selectedPermissions
      });
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'PARENT' });
      setSelectedPermissions([]);
      alert('Usuário criado com sucesso!');
  };

  // Therapist Specific Creation
  const handleCreateTherapist = (e: React.FormEvent) => {
      e.preventDefault();
      addUser({
          name: newTherapist.name,
          email: newTherapist.email,
          password: newTherapist.password,
          specialty: newTherapist.specialty,
          role: 'THERAPIST',
          permissions: ['assinar_documentos', 'criar_rascunho', 'acesso_relatorios'] // Permissões padrão para terapeutas
      });
      setShowTherapistModal(false);
      setNewTherapist({ name: '', email: '', password: '', specialty: '' });
      alert('Terapeuta cadastrado com sucesso!');
  };

  // Update Signature Logic for Therapist Card
  const handleUpdateTherapistSignature = (userId: string, file: File) => {
      const fakeUrl = URL.createObjectURL(file);
      updateUserSignature(userId, fakeUrl);
      alert('Assinatura salva no banco de dados!');
  };

  // Specialty Logic
  const handleOpenSpecialtyModal = (spec?: { id: string, name: string }) => {
      if (spec) {
          setSpecialtyForm(spec);
      } else {
          setSpecialtyForm({ id: '', name: '' });
      }
      setShowSpecialtyModal(true);
  };

  const handleSaveSpecialty = (e: React.FormEvent) => {
      e.preventDefault();
      if (specialtyForm.id) {
          updateSpecialty(specialtyForm.id, specialtyForm.name);
      } else {
          addSpecialty(specialtyForm.name);
      }
      setShowSpecialtyModal(false);
      setSpecialtyForm({ id: '', name: '' });
  };

  const handleDeleteSpecialty = (id: string) => {
      if (window.confirm('Tem certeza que deseja excluir esta especialidade?')) {
          deleteSpecialty(id);
      }
  };

  const togglePermission = (permId: string) => {
      setSelectedPermissions(prev => 
          prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
      );
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'PENDING': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
      'ASSIGNED': 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300',
      'WAITING_APPROVAL': 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700/50',
      'WAITING_PDF_UPLOAD': 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700/50',
      'WAITING_SIGNATURE': 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700/50',
      'SIGNED_BY_THERAPIST': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/50',
      'APPROVED_BY_ADMIN': 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
      'NEEDS_REVISION': 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 font-bold',
    };
    return <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${styles[status]}`}>{status.replace(/_/g, ' ')}</span>;
  };

  // Sidebar Item Component
  const SidebarItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors mb-1
        ${currentView === view 
          ? 'bg-blue-600 text-white rounded-r-full shadow-md' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
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
             <div className="bg-slate-800 dark:bg-slate-700 p-1.5 rounded-lg">
               <ShieldCheck className="text-white w-5 h-5" />
             </div>
             <span className="font-bold text-lg text-slate-800 dark:text-white">Admin</span>
           </div>
           <p className="text-xs text-gray-400 pl-9">Gestão Completa</p>
        </div>

        <div className="flex-1 pr-4">
          <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegação</p>
          <nav>
            <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem view="REQUESTS" icon={FileText} label="Solicitações" />
            <SidebarItem view="THERAPISTS" icon={Stethoscope} label="Terapeutas" />
            <SidebarItem view="ACCESS" icon={ShieldAlert} label="Acessos" />
            <SidebarItem view="SPECIALTIES" icon={Briefcase} label="Especialidades" />
            <SidebarItem view="USERS" icon={Users} label="Usuários" />
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* VIEW: DASHBOARD (Stats) */}
        {currentView === 'DASHBOARD' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h1>
             
             {/* Cards Topo */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-all">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Novas Solicitações</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{requests.filter(r => r.status === 'PENDING').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-all">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Requer Sua Atenção</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{requests.filter(r => actionStatuses.includes(r.status)).length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Finalizados</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{requests.filter(r => r.status === 'APPROVED_BY_ADMIN').length}</p>
                </div>
              </div>
              
              {/* CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bar Chart: Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <BarChartIcon size={20} className="text-blue-500"/> Solicitações por Categoria
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Últimos 30 dias</span>
                    </div>
                    
                    <div className="h-64 w-full">
                        {barChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94A3B8" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#94A3B8" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="solicitacoes" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <BarChartIcon size={48} className="opacity-20 mb-2"/>
                                <p className="text-sm">Sem dados recentes.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Status Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-purple-500"/> Status Ativos
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Distribuição</span>
                    </div>

                    <div className="h-64 w-full">
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                         contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                                         itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <PieChartIcon size={48} className="opacity-20 mb-2"/>
                                <p className="text-sm">Sem solicitações ativas.</p>
                            </div>
                        )}
                    </div>
                </div>

              </div>
          </div>
        )}

        {/* VIEW: REQUESTS (Table) */}
        {currentView === 'REQUESTS' && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-blue-600 dark:text-blue-400" /> Gerenciar Solicitações
                </h1>
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  {['ALL', 'PENDING', 'ACTION'].map((f) => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : 'Ações'}
                    </button>
                  ))}
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-gray-900/50 text-slate-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-4">Paciente</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Ações de Fluxo</th>
                        <th className="p-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredRequests.map(req => {
                        const patient = getPatientById(req.patientId);
                        return (
                          <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="p-4"><div className="font-medium text-slate-800 dark:text-gray-200">{patient?.name}</div></td>
                            <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400">{req.category}</td>
                            <td className="p-4">{getStatusBadge(req.status)}</td>
                            <td className="p-4 text-center">
                              {req.status === 'PENDING' && (
                                <button onClick={() => setAssignModalReq(req.id)} className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1 rounded text-xs hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">Encaminhar</button>
                              )}
                              {req.status === 'WAITING_APPROVAL' && (
                                <button onClick={() => setReviewContentModalReq(req.id)} className="bg-orange-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto hover:bg-orange-700 transition-colors"><Eye size={12}/> Revisar Texto</button>
                              )}
                              {req.status === 'WAITING_PDF_UPLOAD' && (
                                <button onClick={() => setUploadModalReq(req.id)} className="bg-purple-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto hover:bg-purple-700 transition-colors"><Upload size={12}/> Gerar/Upload PDF</button>
                              )}
                              {req.status === 'SIGNED_BY_THERAPIST' && (
                                <button onClick={() => setReviewPdfModalReq(req.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto hover:bg-green-700 transition-colors"><FileCheck size={12}/> Aprovar Final</button>
                              )}
                              {(req.status === 'WAITING_SIGNATURE' || req.status === 'ASSIGNED') && <span className="text-xs text-gray-400 italic">Aguardando Terapeuta...</span>}
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => deleteRequest(req.id)} className="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-2"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: THERAPISTS */}
        {currentView === 'THERAPISTS' && (
           <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Stethoscope className="text-blue-600 dark:text-blue-400" /> Terapeutas Cadastrados
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie a equipe clínica do sistema.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar terapeuta..." className="pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <button onClick={() => setShowTherapistModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
                        <UserPlus size={18} /> Novo Terapeuta
                    </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {therapists.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-md transition-shadow relative overflow-hidden group">
                       <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-400 mb-4 text-2xl font-bold relative">
                          {t.avatar ? <img src={t.avatar} className="w-full h-full rounded-full object-cover" /> : <Stethoscope size={32} />}
                          <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1 border border-gray-100 dark:border-gray-600">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                       </div>
                       <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t.name}</h3>
                       <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-1">{t.specialty || 'Especialidade N/A'}</p>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.email}</p>
                       
                       <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                          <div className="flex justify-between items-center w-full">
                              <span className="text-xs text-gray-400 dark:text-gray-500">Banco de Assinaturas</span>
                              {t.signatureUrl ? (
                                 <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full"><FileCheck size={12}/> Armazenada</span>
                              ) : (
                                 <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full"><AlertTriangle size={12}/> Ausente</span>
                              )}
                          </div>
                          
                          {/* Admin Upload Signature Button */}
                          <label className="mt-2 w-full text-xs flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400">
                             <Upload size={12} />
                             {t.signatureUrl ? 'Atualizar Assinatura' : 'Upload Assinatura'}
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                 if (e.target.files && e.target.files[0]) {
                                     handleUpdateTherapistSignature(t.id, e.target.files[0]);
                                 }
                             }} />
                          </label>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
        
        {/* VIEW: SPECIALTIES */}
        {currentView === 'SPECIALTIES' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Briefcase className="text-blue-600 dark:text-blue-400" /> Especialidades Clínicas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie as áreas de atuação disponíveis no sistema.</p>
                    </div>
                    <button onClick={() => handleOpenSpecialtyModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                        <Plus size={18} /> Nova Especialidade
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {specialties.length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
                            Nenhuma especialidade cadastrada.
                        </div>
                    )}
                    {specialties.map(spec => (
                        <div key={spec.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-50 dark:bg-indigo-900/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Briefcase size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{spec.name}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenSpecialtyModal(spec)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" 
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteSpecialty(spec.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" 
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* VIEW: ACCESS CONTROL */}
        {currentView === 'ACCESS' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ShieldAlert className="text-blue-600 dark:text-blue-400" /> Gerenciar Tipos de Acessos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Controle permissões e crie novos usuários no sistema.</p>
                    </div>
                    <button onClick={() => setShowUserModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Usuário</th>
                                <th className="p-4 font-medium">Função (Role)</th>
                                <th className="p-4 font-medium">Permissões Específicas</th>
                                <th className="p-4 font-medium text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{u.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                                            ${u.role === 'ADMIN' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 
                                              u.role === 'THERAPIST' ? 'bg-teal-600 dark:bg-teal-700 text-white' : 'bg-indigo-600 dark:bg-indigo-700 text-white'}`}>
                                            {u.role === 'PARENT' ? 'Responsável' : u.role === 'THERAPIST' ? 'Terapeuta' : 'Admin'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {u.permissions?.map(p => (
                                                <span key={p} className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-[10px] text-gray-600 dark:text-gray-300">
                                                    {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                                </span>
                                            ))}
                                            {(!u.permissions || u.permissions.length === 0) && <span className="text-gray-400 dark:text-gray-500 text-xs italic">Nenhuma permissão extra</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* PLACEHOLDER VIEWS */}
        {currentView === 'USERS' && (
           <div className="flex flex-col items-center justify-center h-96 text-gray-400 animate-in fade-in duration-300">
              <Users size={48} className="mb-4 opacity-20"/>
              <h2 className="text-xl font-semibold mb-2">Em Desenvolvimento</h2>
              <p>O módulo de Usuários estará disponível em breve.</p>
           </div>
        )}

      </main>

      {/* --- MODALS (Reused Logic) --- */}

      {/* 1. Assign */}
      {assignModalReq && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-4 dark:text-white">Encaminhar</h3>
            <select className="w-full p-2 border dark:border-gray-600 rounded mb-6 bg-white dark:bg-gray-700 dark:text-white" value={selectedTherapist} onChange={e => setSelectedTherapist(e.target.value)}>
              <option value="">Selecione...</option>
              {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex justify-end gap-2"><button onClick={() => setAssignModalReq(null)} className="px-3 py-1 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Cancelar</button><button onClick={handleAssign} className="px-3 py-1 bg-slate-800 dark:bg-slate-700 text-white rounded hover:bg-slate-700 dark:hover:bg-slate-600">Confirmar</button></div>
          </div>
        </div>
      )}

      {/* 2. Review Text Draft */}
      {reviewContentModalReq && (() => {
         const r = requests.find(req => req.id === reviewContentModalReq);
         const p = getPatientById(r?.patientId || '');
         const t = getUserById(r?.therapistId || '');
         const parent = getUserById(r?.parentId || '');
         return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl h-[80vh] flex flex-col">
              <h3 className="font-bold text-lg mb-2 dark:text-white">Revisão de Conteúdo (Texto)</h3>
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 rounded border dark:border-gray-700 overflow-y-auto mb-4 font-serif dark:text-gray-300">{r?.therapistContent}</div>
              <div className="flex justify-between items-center">
                 <button onClick={() => { if(r && p && t && parent) generatePDF(r, p, t, parent); }} className="text-xs text-blue-600 dark:text-blue-400 underline">Baixar Preview</button>
                 <div className="flex gap-2">
                    <button onClick={() => {requestRevision(r!.id); setReviewContentModalReq(null)}} className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded hover:bg-red-50 dark:hover:bg-red-900/20">Rejeitar/Revisar</button>
                    <button onClick={() => {approveContent(r!.id); setReviewContentModalReq(null)}} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Aprovar Texto</button>
                 </div>
              </div>
            </div>
          </div>
         );
      })()}

      {/* 3. Upload & Sign Choice PDF */}
      {uploadModalReq && (() => {
        const req = requests.find(r => r.id === uploadModalReq);
        const assignedTherapist = req?.therapistId ? getUserById(req.therapistId) : null;
        const hasStoredSignature = !!assignedTherapist?.signatureUrl;

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-xl shadow-xl">
              <h3 className="font-bold text-lg mb-2 dark:text-white">Geração e Assinatura do Relatório</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">O texto foi aprovado. Agora, gere o PDF oficial ou faça o upload de um arquivo externo e decida quem irá assinar.</p>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Opção 1: Geração Automática</p>
                <button 
                  onClick={() => {
                     // Simula a geração e download automático
                     const p = getPatientById(req?.patientId || '');
                     const t = getUserById(req?.therapistId || '');
                     const parent = getUserById(req?.parentId || '');
                     if(req && p && t && parent) generatePDF(req, p, t, parent);
                     // Setamos o arquivo como null para forçar o uso da URL simulada no handler
                     setUploadFile(null);
                  }} 
                  className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white py-2 px-4 rounded flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                   <Printer size={16} /> Gerar PDF Baseado no Texto (Simulado)
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Opção 2: Upload Manual</p>
                 <input type="file" accept="application/pdf" className="w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} />
              </div>

              <div className="flex flex-col gap-3">
                 <p className="text-sm font-bold text-gray-800 dark:text-white">Decisão de Assinatura:</p>
                 <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => handleUploadOrGenerate('STORED')} 
                        disabled={!hasStoredSignature}
                        className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all group ${hasStoredSignature ? 'border-gray-200 dark:border-gray-600 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'}`}
                    >
                        <Stamp className={`${hasStoredSignature ? 'text-gray-400 group-hover:text-teal-500' : 'text-gray-300'} mb-2`} size={20} />
                        <span className={`text-xs font-medium ${hasStoredSignature ? 'text-gray-600 dark:text-gray-300 group-hover:text-teal-600' : 'text-gray-400'}`}>Assinar pelo Terapeuta</span>
                        <span className="text-[10px] text-gray-400 text-center mt-1">{hasStoredSignature ? '(Banco de Dados)' : '(Não Disponível)'}</span>
                    </button>

                    <button onClick={() => handleUploadOrGenerate('THERAPIST')} className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                        <Send className="text-gray-400 group-hover:text-blue-500 mb-2" size={20} />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600">Enviar p/ Terapeuta</span>
                        <span className="text-[10px] text-gray-400 text-center mt-1">(Manual)</span>
                    </button>
                    
                    <button onClick={() => handleUploadOrGenerate('ADMIN')} className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                        <PenTool className="text-gray-400 group-hover:text-green-500 mb-2" size={20} />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-green-600">Assinar como Admin</span>
                        <span className="text-[10px] text-gray-400 text-center mt-1">(Finalizar)</span>
                    </button>
                 </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setUploadModalReq(null)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. Final Review (Signed) */}
      {reviewPdfModalReq && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl">
              <h3 className="font-bold text-lg mb-2 dark:text-white">Conferência Final</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">O terapeuta aplicou a assinatura. Verifique se está tudo correto.</p>
              <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded mb-6 flex flex-col items-center justify-center border-2 border-dashed dark:border-gray-600">
                 <FileCheck size={48} className="text-green-600 dark:text-green-400 mb-2" />
                 <p className="font-bold text-gray-700 dark:text-gray-300">PDF Assinado</p>
              </div>
              <div className="flex justify-end gap-2">
                 <button onClick={() => {requestRevision(requests.find(r => r.id === reviewPdfModalReq)!.id); setReviewPdfModalReq(null)}} className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded hover:bg-red-50 dark:hover:bg-red-900/20">Devolver</button>
                 <button onClick={() => {approveFinal(requests.find(r => r.id === reviewPdfModalReq)!.id); setReviewPdfModalReq(null)}} className="px-3 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700">Aprovar e Liberar</button>
              </div>
             </div>
          </div>
      )}
      
      {/* 5. CREATE USER MODAL with Permissions & Password */}
      {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl my-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Cadastrar Novo Usuário e Acessos</h3>
                  <form onSubmit={handleCreateUser} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome Completo</label>
                              <input type="text" required className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">E-mail</label>
                              <input type="email" required className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-sm font-medium mb-1 dark:text-gray-300">Função Principal</label>
                             <select className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                                 <option value="PARENT">Responsável (Pais)</option>
                                 <option value="THERAPIST">Terapeuta</option>
                                 <option value="ADMIN">Administrador</option>
                             </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300">
                                  Senha de Acesso <KeyRound size={14} className="text-gray-400" />
                              </label>
                              <input 
                                  type="password" 
                                  placeholder="Mínimo 6 caracteres" 
                                  required 
                                  className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" 
                                  value={newUser.password} 
                                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Lock size={16} /> Permissões de Acesso (Módulos)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                              {AVAILABLE_PERMISSIONS.map(perm => {
                                  // Separar visualmente as permissões "administrativas" das de "módulos" se a ID começar com 'acesso_'
                                  const isModule = perm.id.startsWith('acesso_');
                                  const isSelected = selectedPermissions.includes(perm.id);
                                  
                                  return (
                                    <label 
                                        key={perm.id} 
                                        className={`
                                            cursor-pointer p-3 rounded-lg border transition-all flex items-center gap-3 relative overflow-hidden
                                            ${isSelected 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className="hidden" // Esconde o checkbox padrão
                                            checked={isSelected}
                                            onChange={() => togglePermission(perm.id)}
                                        />
                                        <div className="flex-1 font-medium text-sm">
                                            {perm.label}
                                        </div>
                                        {isSelected && <CheckCircle size={16} className="text-white" />}
                                    </label>
                                  );
                              })}
                          </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Criar Usuário</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 6. CREATE THERAPIST MODAL */}
      {showTherapistModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                      <Stethoscope className="text-blue-600 dark:text-blue-400" /> Cadastrar Novo Terapeuta
                  </h3>
                  <form onSubmit={handleCreateTherapist} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome Completo</label>
                          <input 
                            type="text" 
                            required 
                            className="w-full p-2.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors" 
                            placeholder="Dr(a). Nome Sobrenome"
                            value={newTherapist.name} 
                            onChange={e => setNewTherapist({...newTherapist, name: e.target.value})} 
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Especialidade</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                required 
                                className="w-full pl-10 p-2.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors" 
                                placeholder="Ex: Psicologia, Fonoaudiologia, Terapia Ocupacional"
                                value={newTherapist.specialty} 
                                onChange={e => setNewTherapist({...newTherapist, specialty: e.target.value})} 
                            />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">E-mail de Acesso</label>
                              <input 
                                type="email" 
                                required 
                                className="w-full p-2.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors" 
                                value={newTherapist.email} 
                                onChange={e => setNewTherapist({...newTherapist, email: e.target.value})} 
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Senha Inicial</label>
                              <input 
                                  type="password" 
                                  placeholder="******" 
                                  required 
                                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors" 
                                  value={newTherapist.password} 
                                  onChange={e => setNewTherapist({...newTherapist, password: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                          <button type="button" onClick={() => setShowTherapistModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Cadastrar Terapeuta</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 7. CREATE/EDIT SPECIALTY MODAL */}
      {showSpecialtyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {specialtyForm.id ? 'Editar Especialidade' : 'Nova Especialidade'}
                      </h3>
                      <button onClick={() => setShowSpecialtyModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleSaveSpecialty}>
                      <div className="mb-6">
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Especialidade</label>
                          <input 
                            type="text" 
                            required 
                            className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-200 outline-none" 
                            placeholder="Ex: Fonoaudiologia"
                            value={specialtyForm.name} 
                            onChange={e => setSpecialtyForm({...specialtyForm, name: e.target.value})} 
                          />
                      </div>
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowSpecialtyModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Salvar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};