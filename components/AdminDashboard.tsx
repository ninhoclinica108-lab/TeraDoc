
import React, { useState, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { 
  Users, CheckCircle, Bell, Trash2, Eye, Upload, FileCheck, AlertTriangle, Send,
  LayoutDashboard, FileText, Stethoscope, Briefcase, ShieldCheck, Search, Lock,
  Plus, ShieldAlert, KeyRound, UserPlus, Edit, X, BarChart as BarChartIcon,
  PieChart as PieChartIcon, PenTool, Printer, Stamp, Filter, AlertOctagon
} from 'lucide-react';
import { generatePDF } from '../services/utils';
import { Role, User as UserType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

type AdminView = 'DASHBOARD' | 'REQUESTS' | 'THERAPISTS' | 'USERS' | 'ACCESS' | 'SPECIALTIES';

const AVAILABLE_PERMISSIONS = [
  { id: 'acesso_relatorios', label: 'Relatórios', description: 'Visualizar e criar relatórios.' },
  { id: 'acesso_declaracoes', label: 'Declarações', description: 'Emitir declarações padrão.' },
  { id: 'acesso_falta_justificativa', label: 'Falta Justificativa', description: 'Gestão de faltas.' },
  { id: 'acesso_atualizacao_laudos', label: 'Atualização de Laudos', description: 'Gerenciar novos laudos.' },
  { id: 'acesso_desligamento', label: 'Desligamento/Suspensão', description: 'Processos de desligamento.' },
  { id: 'acesso_acessorio', label: 'Solicitação de Acessório', description: 'Gestão de itens como cordões.' },
  { id: 'gerenciar_usuarios', label: 'Gerenciar Usuários (Admin)', description: 'Acesso total ao cadastro.' },
  { id: 'configuracoes_sistema', label: 'Configurações', description: 'Acesso a ajustes globais.' }
];

export const AdminDashboard = () => {
  const { requests, users, specialties, addUser, updateUser, deleteUser, assignTherapist, getPatientById, getUserById, approveContent, uploadPdf, adminApplyStoredSignature, approveFinal, requestRevision, deleteRequest, addSpecialty, updateSpecialty, deleteSpecialty, updateUserSignature } = useStore();
  
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');
  const [requestFilter, setRequestFilter] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'PARENT' as Role });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionToEdit, setPermissionToEdit] = useState<string | null>(null);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialtyForm, setSpecialtyForm] = useState({ id: '', name: '' });

  // Confirmation Modals State
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    type: 'USER' | 'REQUEST' | 'SPECIALTY' | null;
    id: string | null;
    title: string;
    message: string;
  }>({ show: false, type: null, id: null, title: '', message: '' });

  // Request Modals
  const [assignModalReq, setAssignModalReq] = useState<string | null>(null);
  const [reviewContentModalReq, setReviewContentModalReq] = useState<string | null>(null);
  const [uploadModalReq, setUploadModalReq] = useState<string | null>(null);
  const [reviewPdfModalReq, setReviewPdfModalReq] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const actionStatuses = ['PENDING', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'SIGNED_BY_THERAPIST'];
  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ALL') return true;
    if (requestFilter === 'ACTION') return actionStatuses.includes(r.status);
    return r.status === requestFilter;
  });

  const therapists = users.filter(u => u.role === 'THERAPIST');

  // Charts Logic
  const barData = useMemo(() => {
    const counts: any = {};
    requests.forEach(r => counts[r.category] = (counts[r.category] || 0) + 1);
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [requests]);

  const pieData = useMemo(() => {
    const counts: any = {};
    requests.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
    return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] }));
  }, [requests]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Delete Prompt
  const promptDelete = (type: 'USER' | 'REQUEST' | 'SPECIALTY', id: string, name?: string) => {
    setConfirmConfig({
      show: true,
      type,
      id,
      title: `Confirmar Exclusão`,
      message: `Tem certeza que deseja excluir ${name || 'este item'}? Esta ação é irreversível.`
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmConfig.id) return;
    if (confirmConfig.type === 'USER') await deleteUser(confirmConfig.id);
    if (confirmConfig.type === 'REQUEST') await deleteRequest(confirmConfig.id);
    if (confirmConfig.type === 'SPECIALTY') await deleteSpecialty(confirmConfig.id);
    setConfirmConfig({ show: false, type: null, id: null, title: '', message: '' });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) updateUser(editingUser.id, { ...userForm, permissions: selectedPermissions });
    else addUser({ ...userForm, permissions: selectedPermissions });
    setShowUserModal(false);
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role });
    setSelectedPermissions(user.permissions || []);
    setShowUserModal(true);
  };

  const toggleUserPerm = (user: UserType, permId: string) => {
    const perms = user.permissions || [];
    const newPerms = perms.includes(permId) ? perms.filter(p => p !== permId) : [...perms, permId];
    updateUser(user.id, { permissions: newPerms });
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
    <button onClick={() => setCurrentView(view)} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors mb-1 ${currentView === view ? 'bg-blue-600 text-white rounded-r-full shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-900 -m-4 sm:-m-6 lg:-m-8">
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 py-6">
        <div className="px-6 mb-8 flex items-center gap-2">
          <ShieldAlert className="text-blue-600" /> <span className="font-bold text-lg dark:text-white">Admin</span>
        </div>
        <nav>
          <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" />
          <SidebarItem view="REQUESTS" icon={FileText} label="Solicitações" />
          <SidebarItem view="THERAPISTS" icon={Stethoscope} label="Terapeutas" />
          <SidebarItem view="USERS" icon={Users} label="Usuários" />
          <SidebarItem view="ACCESS" icon={ShieldAlert} label="Acessos" />
          <SidebarItem view="SPECIALTIES" icon={Briefcase} label="Especialidades" />
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {currentView === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold dark:text-white">Visão Geral do Sistema</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChartIcon size={18}/> Categorias</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#3B82F6"/></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700">
                <h3 className="font-bold mb-4 flex items-center gap-2"><PieChartIcon size={18}/> Status Ativos</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} dataKey="value" label>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {currentView === 'REQUESTS' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold dark:text-white">Solicitações</h1>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border dark:border-gray-700">
                <Filter size={16} className="text-gray-400" />
                <select value={requestFilter} onChange={e => setRequestFilter(e.target.value)} className="bg-transparent text-sm font-medium focus:ring-0 border-none dark:text-gray-300">
                  <option value="ALL">Todos os Status</option>
                  <option value="ACTION">⚠️ Requer Atenção</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="WAITING_APPROVAL">Aguardando Revisão</option>
                  <option value="APPROVED_BY_ADMIN">Concluídos</option>
                </select>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 border-b dark:border-gray-700">
                  <tr>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Ação</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredRequests.map(req => {
                    const patient = getPatientById(req.patientId);
                    return (
                      <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium dark:text-gray-200">{patient?.name}</td>
                        <td className="p-4 text-sm text-gray-500">{req.category}</td>
                        <td className="p-4"><span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">{req.status}</span></td>
                        <td className="p-4">
                          {req.status === 'PENDING' && <button onClick={() => setAssignModalReq(req.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Encaminhar</button>}
                          {req.status === 'WAITING_APPROVAL' && <button onClick={() => setReviewContentModalReq(req.id)} className="bg-orange-600 text-white px-3 py-1 rounded text-xs">Revisar</button>}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => promptDelete('REQUEST', req.id, patient?.name)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'ACCESS' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold mb-8 dark:text-white">Gestão de Permissões</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AVAILABLE_PERMISSIONS.map(perm => {
                const authorizedUsers = users.filter(u => u.permissions?.includes(perm.id));
                return (
                  <div key={perm.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><ShieldCheck size={24}/></div>
                      <span className="text-xs font-bold text-gray-400 uppercase">{authorizedUsers.length} Usuários</span>
                    </div>
                    <h3 className="font-bold dark:text-white mb-2">{perm.label}</h3>
                    <p className="text-xs text-gray-500 mb-4 h-10">{perm.description}</p>
                    <button onClick={() => setPermissionToEdit(perm.id)} className="w-full py-2 border dark:border-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Gerenciar Usuários</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ... Other views like USERS, SPECIALTIES can be added here with same pattern ... */}
      </main>

      {/* Confirmation Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border dark:border-gray-700">
            <AlertOctagon size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 dark:text-white">{confirmConfig.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmConfig.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmConfig({ ...confirmConfig, show: false })} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-bold dark:text-white">Cancelar</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Editor Modal */}
      {permissionToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[90] backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col border dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Gerenciar Permissão: {AVAILABLE_PERMISSIONS.find(p => p.id === permissionToEdit)?.label}</h3>
              <button onClick={() => setPermissionToEdit(null)}><X size={24} className="text-gray-400"/></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead><tr className="border-b dark:border-gray-700 text-xs text-gray-400 uppercase"><th className="pb-2">Usuário</th><th className="pb-2 text-right">Acesso</th></tr></thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {users.map(u => {
                    const hasPerm = u.permissions?.includes(permissionToEdit);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3">
                          <div className="font-bold dark:text-gray-200">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email} ({u.role})</div>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => toggleUserPerm(u, permissionToEdit)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasPerm ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasPerm ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
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
    </div>
  );
};
