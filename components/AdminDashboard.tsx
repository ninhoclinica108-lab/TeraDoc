
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
  const { requests, users, specialties, themeMode, addUser, updateUser, deleteUser, assignTherapist, getPatientById, getUserById, approveContent, uploadPdf, adminApplyStoredSignature, approveFinal, requestRevision, deleteRequest, addSpecialty, updateSpecialty, deleteSpecialty, updateUserSignature } = useStore();
  
  const [currentView, setCurrentView] = useState<AdminView>('DASHBOARD');
  const [requestFilter, setRequestFilter] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'PARENT' as Role });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionToEdit, setPermissionToEdit] = useState<string | null>(null);

  const actionStatuses = ['PENDING', 'WAITING_APPROVAL', 'WAITING_PDF_UPLOAD', 'SIGNED_BY_THERAPIST'];
  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ALL') return true;
    if (requestFilter === 'ACTION') return actionStatuses.includes(r.status);
    return r.status === requestFilter;
  });

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

  const COLORS = ['#0D9488', '#4F46E5', '#D97706', '#E11D48', '#7C3AED'];

  const SidebarItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)} 
      className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-black transition-all mb-1 ${currentView === view ? 'bg-teal-600 text-white rounded-r-3xl shadow-lg shadow-teal-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r dark:border-white/5 py-6 shrink-0 flex flex-col">
        <div className="px-6 mb-8 flex items-center gap-2">
          <ShieldAlert className="text-teal-600" /> 
          <span className="font-black text-lg dark:text-white tracking-tighter uppercase italic">Administração</span>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <SidebarItem view="DASHBOARD" icon={LayoutDashboard} label="VISÃO GERAL" />
          <SidebarItem view="REQUESTS" icon={FileText} label="PEDIDOS" />
          <SidebarItem view="THERAPISTS" icon={Stethoscope} label="TERAPEUTAS" />
          <SidebarItem view="USERS" icon={Users} label="USUÁRIOS" />
          <SidebarItem view="ACCESS" icon={ShieldAlert} label="PERMISSÕES" />
          <SidebarItem view="SPECIALTIES" icon={Briefcase} label="ESPECIALIDADES" />
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {currentView === 'DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h1 className="text-3xl font-black dark:text-white italic tracking-tighter">Painel de Controle</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-white/5 shadow-sm h-[400px]">
                <h3 className="font-black mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200 uppercase text-xs tracking-widest"><BarChartIcon size={18} className="text-teal-500" /> Volume por Categoria</h3>
                <div className="h-full pb-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeMode === 'dark' ? '#1e293b' : '#f1f5f9'} />
                        <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} stroke={themeMode === 'dark' ? '#64748b' : '#94a3b8'} />
                        <YAxis tick={{fontSize: 10, fontWeight: 'bold'}} stroke={themeMode === 'dark' ? '#64748b' : '#94a3b8'} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: themeMode === 'dark' ? '#0f172a' : '#fff'}} />
                        <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-white/5 shadow-sm h-[400px]">
                <h3 className="font-black mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200 uppercase text-xs tracking-widest"><PieChartIcon size={18} className="text-indigo-500" /> Distribuição de Status</h3>
                <div className="h-full pb-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" stroke="none" paddingAngle={5}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: themeMode === 'dark' ? '#0f172a' : '#fff'}} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'REQUESTS' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-black dark:text-white tracking-tighter italic">Gestão de Pedidos</h1>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border dark:border-white/5 shadow-sm">
                <Filter size={18} className="text-slate-400" />
                <select value={requestFilter} onChange={e => setRequestFilter(e.target.value)} className="bg-transparent text-sm font-black focus:ring-0 border-none dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer">
                  <option value="ALL">TODOS</option>
                  <option value="ACTION">🚨 ATENÇÃO</option>
                  <option value="PENDING">PENDENTES</option>
                  <option value="APPROVED_BY_ADMIN">CONCLUÍDOS</option>
                </select>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-white/5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b dark:border-white/5">
                    <tr>
                      <th className="p-6">Paciente</th>
                      <th className="p-6">Tipo</th>
                      <th className="p-6">Status</th>
                      <th className="p-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-white/5">
                    {filteredRequests.map(req => {
                      const patient = getPatientById(req.patientId);
                      return (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <p className="font-bold dark:text-white">{patient?.name}</p>
                          </td>
                          <td className="p-6">
                             <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg uppercase tracking-wider">{req.category}</span>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                req.status === 'APPROVED_BY_ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-6 text-right space-x-2">
                             <button onClick={() => deleteRequest(req.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10">
                                <Trash2 size={18}/>
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

        {currentView === 'ACCESS' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-black mb-8 dark:text-white italic tracking-tighter">Gestão de Permissões</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {AVAILABLE_PERMISSIONS.map(perm => {
                const authorizedUsers = users.filter(u => u.permissions?.includes(perm.id));
                return (
                  <div key={perm.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-white/5 hover:border-teal-500 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm"><ShieldCheck size={28}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{authorizedUsers.length} USUÁRIOS</span>
                    </div>
                    <h3 className="font-bold dark:text-white mb-2">{perm.label}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 h-10 line-clamp-2 leading-relaxed">{perm.description}</p>
                    <button 
                        onClick={() => setPermissionToEdit(perm.id)} 
                        className="w-full py-3 bg-gray-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all text-slate-600 dark:text-slate-300"
                    >
                        Configurar Acessos
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {permissionToEdit && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[90] backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-2xl w-full max-h-[85vh] flex flex-col border dark:border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black dark:text-white italic tracking-tighter">Nível de Acesso</h3>
                <p className="text-teal-600 font-bold text-xs uppercase tracking-widest mt-1">{AVAILABLE_PERMISSIONS.find(p => p.id === permissionToEdit)?.label}</p>
              </div>
              <button onClick={() => setPermissionToEdit(null)} className="p-3 bg-gray-100 dark:bg-slate-800 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest"><tr className="border-b dark:border-white/5"><th className="pb-4">USUÁRIO</th><th className="pb-4 text-right">AUTORIZADO</th></tr></thead>
                <tbody className="divide-y dark:divide-white/5">
                  {users.map(u => {
                    const hasPerm = u.permissions?.includes(permissionToEdit);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-5">
                          <div className="font-bold dark:text-white">{u.name}</div>
                          <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1">{u.role} | {u.email}</div>
                        </td>
                        <td className="py-5 text-right">
                          <button onClick={() => {
                                const newPerms = hasPerm ? u.permissions?.filter(p => p !== permissionToEdit) : [...(u.permissions || []), permissionToEdit];
                                updateUser(u.id, { permissions: newPerms });
                            }} 
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${hasPerm ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${hasPerm ? 'translate-x-6' : 'translate-x-1'}`} />
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
