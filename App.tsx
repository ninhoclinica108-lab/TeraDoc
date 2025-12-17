
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

  const isDark = themeMode === 'dark';

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
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Imagem de Fundo com Overlay Dinâmico */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('https://noticias.cruzeirodosuleducacional.edu.br/wp-content/uploads/2021/01/destaque-up-autismo.jpg')" }}
      >
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-slate-950/80' : 'bg-white/60'} backdrop-blur-[2px]`}></div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-500 ${isDark ? 'bg-teal-500/20' : 'bg-teal-500/10'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-500 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}></div>
      </div>
      
      <button 
        onClick={toggleTheme} 
        className={`absolute top-6 right-6 p-3 rounded-2xl z-20 transition-all border backdrop-blur-md shadow-xl active:scale-90 ${
          isDark 
            ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' 
            : 'bg-white/80 text-slate-800 border-slate-200 hover:bg-white'
        }`}
      >
        {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
      </button>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white rounded-3xl shadow-2xl mb-4 transform hover:scale-110 transition-transform cursor-pointer border border-teal-100">
            <img src="https://clinicaninho.com.br/wp-content/uploads/2024/10/favicon.png" className="w-12 h-12 object-contain" alt="Clinica Ninho Logo" />
          </div>
          <h1 className={`text-5xl font-black mb-1 tracking-tighter italic drop-shadow-lg transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>TeraDoc</h1>
          <p className="text-teal-600 dark:text-teal-400 font-bold tracking-[0.3em] text-[10px] uppercase drop-shadow-md">Gestão Terapêutica Inteligente</p>
        </div>

        <div className={`border p-8 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 ${
          isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white/90 border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-8 text-center tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {isRegistering ? 'Criar Nova Conta' : 'Acessar Sistema'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo" 
                  className={`w-full pl-12 p-4 border rounded-2xl outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500'
                  }`}
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
              <input 
                type="email" 
                placeholder="Seu E-mail" 
                className={`w-full pl-12 p-4 border rounded-2xl outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500'
                }`}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
              <input 
                type="password" 
                placeholder="Sua Senha" 
                className={`w-full pl-12 p-4 border rounded-2xl outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500'
                }`}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-200 text-xs flex items-center gap-3 rounded-2xl animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 text-red-500" /> 
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-200 text-xs flex items-center gap-3 rounded-2xl animate-in slide-in-from-top-2">
                <CheckCircle2 size={18} className="shrink-0 text-teal-500" /> 
                <span>{success}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Cadastrar Agora' : 'Entrar no Sistema'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }} 
              className={`font-bold text-sm transition-colors ${isDark ? 'text-slate-300 hover:text-teal-400' : 'text-slate-600 hover:text-teal-600'}`}
            >
              {isRegistering ? 'Já tem conta? Clique para entrar' : 'Não tem conta? Clique para criar'}
            </button>
          </div>
        </div>
        
        <footer className="mt-8 text-center">
           <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
             @2026 Todos os direitos reservados
           </p>
        </footer>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser, logout, themeMode, toggleTheme, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={48} />
        <p className="text-gray-400 dark:text-slate-500 font-black tracking-widest text-[10px] uppercase">Carregando TeraDoc...</p>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden text-slate-800 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 h-16 shrink-0 flex justify-between items-center px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="https://clinicaninho.com.br/wp-content/uploads/2024/10/favicon.png" className="w-8 h-8 object-contain" alt="Logo" />
          <span className="font-black text-2xl italic tracking-tighter text-teal-600">TeraDoc</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
            {themeMode === 'light' ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-yellow-400" />}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-teal-500 uppercase font-black mt-1 tracking-widest">
              {currentUser.role === 'PARENT' ? 'RESPONSÁVEL' : currentUser.role}
            </p>
          </div>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Sair">
            <LogOut size={20}/>
          </button>
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
