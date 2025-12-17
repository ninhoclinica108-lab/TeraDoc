
import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistDashboard } from './components/TherapistDashboard';
import { LogOut, Moon, Sun, Mail, Lock, AlertCircle, ArrowRight, Loader2, User as UserIcon, CheckCircle2 } from 'lucide-react';

const LoginScreen = () => {
  const { login, register, themeMode, toggleTheme, isLoading } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password || (isRegistering && !name)) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      if (isRegistering) {
        const result = await register(name, email, password);
        if (result.success) {
          setSuccess('Conta criada! Verifique seu e-mail (se ativado) ou tente entrar agora.');
          setIsRegistering(false);
          setPassword('');
        } else {
          setError(result.error || 'Erro ao criar conta.');
        }
      } else {
        const successLogin = await login(email, password);
        if (!successLogin) {
          setError('E-mail ou senha incorretos. Verifique também se confirmou o cadastro por e-mail.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado no servidor.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      </div>
      
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 z-20 hover:text-white transition-all">
        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-3xl shadow-2xl mb-6">
            <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" className="w-12 h-12 brightness-0 invert" alt="Logo" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">TeraDoc</h1>
          <p className="text-slate-400 font-bold tracking-[0.2em] text-[10px] uppercase">Gestão Terapêutica Inteligente</p>
        </div>

        <div className="bg-slate-900/50 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {isRegistering ? 'Criar Nova Conta' : 'Acessar Sistema'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-4 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo" 
                  className="w-full pl-12 p-4 border border-slate-700 rounded-2xl bg-slate-950/50 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
              <input 
                type="email" 
                placeholder="Seu E-mail" 
                className="w-full pl-12 p-4 border border-slate-700 rounded-2xl bg-slate-950/50 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
              <input 
                type="password" 
                placeholder="Sua Senha" 
                className="w-full pl-12 p-4 border border-slate-700 rounded-2xl bg-slate-950/50 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 rounded-2xl animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs flex items-center gap-3 rounded-2xl animate-in slide-in-from-top-2">
                <CheckCircle2 size={18} className="shrink-0" /> 
                <span>{success}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Cadastrar Agora' : 'Entrar no Sistema'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }} 
              className="text-slate-400 font-bold text-sm hover:text-teal-400 transition-colors"
            >
              {isRegistering ? 'Já tem conta? Clique para entrar' : 'Não tem conta? Clique para criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser, logout, themeMode, toggleTheme, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={48} />
        <p className="text-slate-500 font-black tracking-widest text-[10px] uppercase">Carregando TeraDoc...</p>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden text-slate-800 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 h-16 shrink-0 flex justify-between items-center px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" className="w-8 h-8" alt="Logo" />
          <span className="font-black text-2xl italic tracking-tighter text-teal-600">TeraDoc</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-teal-500 transition-colors">{themeMode === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-teal-500 uppercase font-black mt-1 tracking-widest">
              {currentUser.role === 'PARENT' ? 'RESPONSÁVEL' : currentUser.role}
            </p>
          </div>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={20}/></button>
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
