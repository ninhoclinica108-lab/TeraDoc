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
  Stamp,
  Filter,
  AlertOctagon
} from 'lucide-react';
import { generatePDF } from '../services/utils';
import { Role, User as UserType } from '../types';
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
  { id: 'acesso_relatorios', label: 'Relatórios', description: 'Permite visualizar e criar relatórios.' },
  { id: 'acesso_declaracoes', label: 'Declarações', description: 'Permite emitir declarações padrão.' },
  { id: 'acesso_falta_justificativa', label: 'Falta Justificativa', description: 'Gestão de justificativas de falta.' },
  { id: 'acesso_atualizacao_laudos', label: 'Atualização de Laudos', description: 'Upload e visualização de novos laudos.' },
  { id: 'acesso_desligamento', label: 'Desligamento/Suspensão', description: 'Processos de desligamento de pacientes.' },
  { id: 'acesso_acessorio', label: 'Solicitação de Acessório', description: 'Gestão de crachás e cordões.' },
  { id: 'gerenciar_usuarios', label: 'Gerenciar Usuários (Admin)', description: 'Acesso total ao cadastro de usuários.' },
  { id: 'configuracoes_sistema', label: 'Configurações do Sistema', description: 'Acesso a configurações globais.' }
];

export const AdminDashboard = () => {
  const { requests, users, specialties, addUser, updateUser, deleteUser, assignTherapist, getPatientById, getUserById, approveContent, uploadPdf, adminApplyStoredSignature, approveFinal, requestRevision, deleteRequest, addSpecialty, updateSpecialty, deleteSpecialty, updateUserSignature } = useStore();
  
  // View State
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');

  // Filter State (Requests) - Changed to string to support specific statuses
  const [filter, setFilter] = useState<string>('ALL');
  
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | Role>('ALL');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Modals State
  const [assignModalReq, setAssignModalReq] = useState<string | null>(null);
  const [reviewContentModalReq, setReviewContentModalReq] = useState<string | null>(null);
  const [uploadModalReq, setUploadModalReq] = useState<string | null>(null);
  const [reviewPdfModalReq, setReviewPdfModalReq] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Access Control / User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'PARENT' as Role });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Access Management Specific State
  const [permissionToEdit, setPermissionToEdit] = useState<string | null>(null);

  // Therapist Registration Modal State
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [newTherapist, setNewTherapist] = useState({ name: '', email: '', password: '', specialty: '' });

  // Specialties Management State
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialtyForm, setSpecialtyForm] = useState({ id: '', name: '' });

  // Delete Confirmation State
  const [deleteConfig, setDeleteConfig] = useState<{
      show: boolean;
      type: 'USER' | 'REQUEST' | 'SPECIALTY' | null;
      id: string | null;
      title: string;
      message: string;
  }>({ show: false, type: null, id: null, title: '', message: '' });

  const therapists = users.filter(u => u.role === 'THERAPIST');
  const actionStatuses = ['PENDING', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'SIGNED_BY_THERAPIST'];

  const filteredRequests = requests.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTION') return actionStatuses.includes(r.status);
    return r.status === filter;
  });

  const filteredUsers = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
  });

  // --- CHART DATA PREPARATION ---
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
    return Object.keys(counts).map(key => ({ name: key, solicitacoes: counts[key] }));
  }, [requests]);

  const pieChartData = useMemo(() => {
    const activeStatuses = ['PENDING', 'ASSIGNED', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'WAITING_SIGNATURE', 'SIGNED_BY_THERAPIST', 'NEEDS_REVISION'];
    const counts: Record<string, number> = {};
    requests.forEach(req => {
      if (activeStatuses.includes(req.status)) {
        counts[req.status] = (counts[req.status] || 0) + 1;
      }
    });
    return Object.keys(counts).map(key => ({ name: key.replace(/_/g, ' '), value: counts[key] }));
  }, [requests]);

  const STATUS_COLORS: Record<string, string> = {
    'PENDING': '#EAB308', 'ASSIGNED': '#3B82F6', 'WAITING_APPROVAL': '#F97316', 'WAITING_PDF_UPLOAD': '#A855F7',
    'WAITING_SIGNATURE': '#14B8A6', 'SIGNED_BY_THERAPIST': '#6366F1', 'NEEDS_REVISION': '#EF4444'
  };

  const getStatusColor = (statusName: string) => {
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

  const handleUploadOrGenerate = (type: 'THERAPIST' | 'ADMIN' | 'STORED') => {
    if (uploadModalReq) {
      if (type === 'STORED') {
          adminApplyStoredSignature(uploadModalReq);
      } else {
          const fakeUrl = uploadFile ? URL.createObjectURL(uploadFile) : `relatorio_gerado_sistema_${uploadModalReq}.pdf`;
          uploadPdf(uploadModalReq, fakeUrl, type);
      }
      setUploadModalReq(null);
      setUploadFile(null);
    }
  };
  
  // Generic User Creation/Edition
  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
          updateUser(editingUser.id, {
              name: userForm.name, email: userForm.email, role: userForm.role, permissions: selectedPermissions,
              ...(userForm.password ? { password: userForm.password } : {})
          });
      } else {
          addUser({ name: userForm.name, email: userForm.email, password: userForm.password, role: userForm.role, permissions: selectedPermissions });
      }
      setShowUserModal(false);
      resetUserForm();
  };
  
  const handleEditUser = (user: UserType) => {
      setEditingUser(user);
      setUserForm({ name: user.name, email: user.email, password: '', role: user.role });
      setSelectedPermissions(user.permissions || []);
      setShowUserModal(true);
  };
  
  const resetUserForm = () => {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'PARENT' });
      setSelectedPermissions([]);
  };

  // Therapist Specific Creation
  const handleCreateTherapist = (e: React.FormEvent) => {
      e.preventDefault();
      addUser({ name: newTherapist.name, email: newTherapist.email, password: newTherapist.password, specialty: newTherapist.specialty, role: 'THERAPIST', permissions: ['assinar_documentos', 'criar_rascunho', 'acesso_relatorios'] });
      setShowTherapistModal(false);
      setNewTherapist({ name: '', email: '', password: '', specialty: '' });
  };

  const handleUpdateTherapistSignature = (userId: string, file: File) => {
      const fakeUrl = URL.createObjectURL(file);
      updateUserSignature(userId, fakeUrl);
  };

  // Specialty Logic
  const handleOpenSpecialtyModal = (spec?: { id: string, name: string }) => {
      if (spec) setSpecialtyForm(spec);
      else setSpecialtyForm({ id: '', name: '' });
      setShowSpecialtyModal(true);
  };

  const handleSaveSpecialty = (e: React.FormEvent) => {
      e.preventDefault();
      if (specialtyForm.id) updateSpecialty(specialtyForm.id, specialtyForm.name);
      else addSpecialty(specialtyForm.name);
      setShowSpecialtyModal(false);
      setSpecialtyForm({ id: '', name: '' });
  };

  // --- DELETE LOGIC WITH MODAL ---
  const promptDelete = (type: 'USER' | 'REQUEST' | 'SPECIALTY', id: string) => {
      let title = '';
      let message = '';
      
      switch(type) {
          case 'USER': 
            title = 'Excluir Usuário'; 
            message = 'Tem certeza que deseja excluir este usuário? Todos os dados vinculados serão perdidos permanentemente.';
            break;
          case 'REQUEST': 
            title = 'Excluir Solicitação'; 
            message = 'Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.';
            break;
          case 'SPECIALTY': 
            title = 'Excluir Especialidade'; 
            message = 'Tem certeza que deseja remover esta especialidade do sistema?';
            break;
      }
      
      setDeleteConfig({ show: true, type, id, title, message });
  };

  const handleConfirmDelete = () => {
      if (deleteConfig.type === 'USER' && deleteConfig.id) deleteUser(deleteConfig.id);
      if (deleteConfig.type === 'REQUEST' && deleteConfig.id) deleteRequest(deleteConfig.id);
      if (deleteConfig.type === 'SPECIALTY' && deleteConfig.id) deleteSpecialty(deleteConfig.id);
      
      setDeleteConfig({ ...deleteConfig, show: false, id: null });
  };

  const togglePermission = (permId: string) => {
      setSelectedPermissions(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
  };

  // New: Toggle permission for a specific user directly from the Access view
  const toggleUserPermissionFromAccessView = async (user: UserType, permId: string) => {
      const currentPerms = user.permissions || [];
      const hasPerm = currentPerms.includes(permId);
      const newPerms = hasPerm ? currentPerms.filter(p => p !== permId) : [...currentPerms, permId];
      
      await updateUser(user.id, { permissions: newPerms });
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
      
      {/* Sidebar Navigation - Reorganized */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-6 flex flex-col shrink-0 transition-colors duration-300">
        <div className="px-6 mb-8">
           <div className="flex items-center gap-2 mb-1">
             <img 
               src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" 
               alt="Logo" 
               className="w-10 h-10 object-contain"
             />
             <span className="font-bold text-lg text-slate-800 dark:text-white">Admin</span>
           </div>
           <p className="text-xs text-gray-400 pl-9">Gestão Completa</p>
        </div>

        <div className="flex-1 pr-4">
          <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegação</p>
          <nav>
            <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" />
            <SidebarItem view="REQUESTS" icon={FileText} label="Solicitações" />
            <SidebarItem view="THERAPISTS" icon={Stethoscope} label="Terapeutas" />
            <SidebarItem view="USERS" icon={Users} label="Usuários" />
            <SidebarItem view="ACCESS" icon={ShieldAlert} label="Acessos" />
            <SidebarItem view="SPECIALTIES" icon={Briefcase} label="Especialidades" />
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
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
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
                                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{value}</span>} />
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
                
                {/* Advanced Status Filter */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <Filter size={18} className="text-gray-500 dark:text-gray-400" />
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                    className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none min-w-[200px]"
                  >
                    <option value="ALL">Todas as Solicitações</option>
                    <option value="ACTION">⚠️ Requer Minha Atenção</option>
                    <option disabled>──────────</option>
                    <option value="PENDING">Pendentes (Novo)</option>
                    <option value="ASSIGNED">Encaminhados</option>
                    <option value="WAITING_APPROVAL">Aguardando Revisão de Texto</option>
                    <option value="NEEDS_REVISION">Em Revisão (Devolvido)</option>
                    <option value="WAITING_PDF_UPLOAD">Aguardando Upload PDF</option>
                    <option value="WAITING_SIGNATURE">Aguardando Assinatura</option>
                    <option value="SIGNED_BY_THERAPIST">Assinado (Verificação Final)</option>
                    <option value="APPROVED_BY_ADMIN">Concluído (Pronto)</option>
                  </select>
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
                      {filteredRequests.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Nenhuma solicitação encontrada com o filtro selecionado.
                            </td>
                        </tr>
                      ) : filteredRequests.map(req => {
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
                              {(req.status === 'APPROVED_BY_ADMIN') && <span className="text-xs text-green-600 dark:text-green-400 font-medium flex justify-center items-center gap-1"><CheckCircle size={12} /> Finalizado</span>}
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => promptDelete('REQUEST', req.id)} className="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-2"><Trash2 size={16} /></button>
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
                                    onClick={() => promptDelete('SPECIALTY', spec.id)}
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

        {/* VIEW: USERS (Full CRUD) */}
        {currentView === 'USERS' && (
           <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Users className="text-blue-600 dark:text-blue-400" /> Gerenciar Usuários
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">Controle total de contas e acessos.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            placeholder="Buscar por nome ou e-mail..." 
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                          />
                      </div>
                      <select 
                        className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                      >
                          <option value="ALL">Todos os Perfis</option>
                          <option value="ADMIN">Administradores</option>
                          <option value="THERAPIST">Terapeutas</option>
                          <option value="PARENT">Responsáveis</option>
                      </select>
                      <button onClick={() => { resetUserForm(); setShowUserModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm font-medium">
                          <UserPlus size={18} /> Novo Usuário
                      </button>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
                              <tr>
                                  <th className="p-4 font-medium">Usuário</th>
                                  <th className="p-4 font-medium">Função</th>
                                  <th className="p-4 font-medium">Acessos</th>
                                  <th className="p-4 font-medium text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {filteredUsers.length === 0 ? (
                                  <tr>
                                      <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                          Nenhum usuário encontrado.
                                      </td>
                                  </tr>
                              ) : filteredUsers.map(u => (
                                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="p-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">
                                                  {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover"/> : u.name.charAt(0)}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-slate-800 dark:text-white">{u.name}</div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase 
                                              ${u.role === 'ADMIN' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 
                                                u.role === 'THERAPIST' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'}`}>
                                              {u.role === 'PARENT' ? 'Responsável' : u.role === 'THERAPIST' ? 'Terapeuta' : 'Admin'}
                                          </span>
                                      </td>
                                      <td className="p-4">
                                          <div className="flex flex-wrap gap-1 max-w-xs">
                                              {u.permissions?.slice(0, 3).map(p => (
                                                  <span key={p} className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                                                      {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                                  </span>
                                              ))}
                                              {(u.permissions?.length || 0) > 3 && (
                                                  <span className="text-[10px] text-gray-400 px-1 py-0.5">+{(u.permissions?.length || 0) - 3}</span>
                                              )}
                                              {(!u.permissions || u.permissions.length === 0) && <span className="text-gray-400 text-xs italic">-</span>}
                                          </div>
                                      </td>
                                      <td className="p-4 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                              <button 
                                                  onClick={() => handleEditUser(u)}
                                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                  title="Editar Usuário"
                                              >
                                                  <Edit size={16} />
                                              </button>
                                              <button 
                                                  onClick={() => promptDelete('USER', u.id)}
                                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                  title="Excluir Usuário"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
           </div>
        )}

        {/* VIEW: ACCESS CONTROL (Reformulated) */}
        {currentView === 'ACCESS' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ShieldAlert className="text-blue-600 dark:text-blue-400" /> Controle de Permissões
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie quem tem acesso a cada módulo do sistema.</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AVAILABLE_PERMISSIONS.map(permission => {
                        const usersWithPermission = users.filter(u => u.permissions?.includes(permission.id));
                        
                        return (
                            <div key={permission.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col h-full group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {usersWithPermission.length} Usuários
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{permission.label}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1">{permission.description || 'Sem descrição.'}</p>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {usersWithPermission.slice(0, 5).map(u => (
                                            <div key={u.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300" title={u.name}>
                                                {u.name.charAt(0)}
                                            </div>
                                        ))}
                                        {usersWithPermission.length > 5 && (
                                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 font-medium">
                                                +{usersWithPermission.length - 5}
                                            </div>
                                        )}
                                        {usersWithPermission.length === 0 && (
                                            <span className="text-xs text-gray-400 italic pl-1">Nenhum usuário</span>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setPermissionToEdit(permission.id)}
                                    className="w-full mt-auto py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Editar Acessos
                                </button>
                            </div>
                        );
                    })}
                </div>
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
      
      {/* 5. CREATE/EDIT USER MODAL */}
      {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl my-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                      {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário e Acessos'}
                  </h3>
                  <form onSubmit={handleSaveUser} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome Completo</label>
                              <input type="text" required className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 dark:text-gray-300">E-mail</label>
                              <input type="email" required className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-sm font-medium mb-1 dark:text-gray-300">Função Principal</label>
                             <select className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}>
                                 <option value="PARENT">Responsável (Pais)</option>
                                 <option value="THERAPIST">Terapeuta</option>
                                 <option value="ADMIN">Administrador</option>
                             </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 flex items-center gap-1 dark:text-gray-300">
                                  {editingUser ? 'Nova Senha (Opcional)' : 'Senha de Acesso'} <KeyRound size={14} className="text-gray-400" />
                              </label>
                              <input 
                                  type="password" 
                                  placeholder={editingUser ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                                  required={!editingUser}
                                  className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" 
                                  value={userForm.password} 
                                  onChange={e => setUserForm({...userForm, password: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Lock size={16} /> Permissões de Acesso (Módulos)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                              {AVAILABLE_PERMISSIONS.map(perm => {
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
                          <button type="button" onClick={() => { setShowUserModal(false); resetUserForm(); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                          </button>
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

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteConfig.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{deleteConfig.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">{deleteConfig.message}</p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setDeleteConfig({ ...deleteConfig, show: false })}
                              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleConfirmDelete}
                              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                              <Trash2 size={18} /> Confirmar Exclusão
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 9. PERMISSION EDITOR MODAL (Access View) */}
      {permissionToEdit && (() => {
          const perm = AVAILABLE_PERMISSIONS.find(p => p.id === permissionToEdit);
          return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                  <ShieldCheck className="text-blue-600 dark:text-blue-400" /> Gerenciar Acesso: {perm?.label}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{perm?.description}</p>
                          </div>
                          <button onClick={() => setPermissionToEdit(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              <X size={24} />
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2">
                          <table className="w-full text-left">
                              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 text-gray-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                      <th className="p-3 font-medium">Usuário</th>
                                      <th className="p-3 font-medium">Perfil</th>
                                      <th className="p-3 font-medium text-right">Acesso</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {users.map(u => {
                                      const hasAccess = u.permissions?.includes(permissionToEdit);
                                      return (
                                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                              <td className="p-3">
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                          {u.name.charAt(0)}
                                                      </div>
                                                      <div>
                                                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.name}</div>
                                                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="p-3">
                                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 uppercase font-bold">{u.role}</span>
                                              </td>
                                              <td className="p-3 text-right">
                                                  <button 
                                                      onClick={() => toggleUserPermissionFromAccessView(u, permissionToEdit)}
                                                      className={`
                                                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                                                          ${hasAccess ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
                                                      `}
                                                  >
                                                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                                                  </button>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                          <button onClick={() => setPermissionToEdit(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                              Concluir Edição
                          </button>
                      </div>
                  </div>
              </div>
          );
      })()}

    </div>
  );
};