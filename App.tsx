
import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistDashboard } from './components/TherapistDashboard';
import { LogOut, Moon, Sun, Mail, Lock, AlertCircle, ArrowRight, Loader2, User as UserIcon, ShieldCheck } from 'lucide-react';

const LoginScreen = () => {
  const { login, register, themeMode, toggleTheme, isLoading } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isRegistering && !name)) {
      setError('Preencha todos os campos.');
      return;
    }
    
    try {
      if (isRegistering) {
        const result = await register(name, email, password);
        if (!result.success) {
          setError(result.error === 'User already registered' ? 'Este e-mail já está cadastrado.' : (result.error || 'Erro ao criar conta.'));
        } else {
          setIsRegistering(false);
          setError('Conta criada! Agora você pode entrar.');
        }
      } else {
        const success = await login(email, password);
        if (!success) {
          setError('E-mail ou senha inválidos. Verifique se a conta foi criada no Supabase Auth.');
        }
      }
    } catch (err: any) {
      setError('Erro de conexão ou credenciais inválidas.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('https://bmcnews.com.br/wp-content/uploads/2024/08/Imagem-TEA.jpg')" }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>
      
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white z-20 hover:bg-white/20 transition-all">
        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-4 border border-white/20">
            <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" className="w-12 h-12" alt="Logo" />
          </div>
          <h1 className="text-4xl font-black text-white mb-1 tracking-tight drop-shadow-xl">TeraDoc</h1>
          <p className="text-teal-200 font-medium tracking-wide">SISTEMA DE GESTÃO TERAPÊUTICA</p>
        </div>

        <div className="bg-slate-800/90 dark:bg-slate-900/95 p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl transition-all">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isRegistering ? 'Criar Cadastro' : 'Acesse sua Conta'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  className="w-full pl-11 p-3.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="E-mail" 
                className="w-full pl-11 p-3.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-400 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Senha" 
                className="w-full pl-11 p-3.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <div className={`p-4 ${error.includes('sucesso') || error.includes('criada') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} text-sm flex items-center gap-3 rounded-xl border border-white/5`}>
                <AlertCircle size={18} className="shrink-0" /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Confirmar Cadastro' : 'Entrar Agora'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              className="w-full text-teal-400 font-bold text-sm hover:text-teal-300 transition-colors text-center"
            >
              {isRegistering ? 'Já possui uma conta? Entrar' : 'Não tem conta? Criar Cadastro de Responsável'}
            </button>
            
            {!isRegistering && (
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  <ShieldCheck size={12} />
                  Contas de Terapeuta e Admin são gerenciadas pela diretoria
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-8 text-center text-white/30 text-[10px] font-medium tracking-[0.2em] uppercase">
          &copy; 2024 TeraDoc - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser, logout, themeMode, toggleTheme, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-teal-500 relative" size={64} strokeWidth={1.5} />
        </div>
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">Sincronizando TeraDoc...</p>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 h-16 shrink-0 flex justify-between items-center px-4 sm:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-teal-500/10 rounded-lg">
            <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" className="w-6 h-6" alt="Logo" />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800 dark:text-white">TeraDoc</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-teal-500 transition-colors">
            {themeMode === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black dark:text-white leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-black mt-1 tracking-wider">
                {currentUser.role === 'PARENT' ? 'Responsável' : currentUser.role}
              </p>
            </div>
            <button onClick={logout} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        {currentUser.role === 'PARENT' && <ParentDashboard />}
        {currentUser.role === 'ADMIN' && <AdminDashboard />}
        {currentUser.role === 'THERAPIST' && <TherapistDashboard />}
      </main>
    </div>
  );
};

const App = () => (
  <StoreProvider>
    <HashRouter>
      <MainLayout />
    </HashRouter>
  </StoreProvider>
);

export default App;
