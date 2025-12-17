
import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistDashboard } from './components/TherapistDashboard';
import { LogOut, Moon, Sun, Mail, Lock, AlertCircle, ArrowRight, Loader2, User as UserIcon } from 'lucide-react';

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
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (isRegistering) {
      const result = await register(name, email, password);
      if (!result.success) setError(result.error || 'Erro ao criar conta.');
    } else {
      const success = await login(email, password);
      if (!success) setError('E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('https://bmcnews.com.br/wp-content/uploads/2024/08/Imagem-TEA.jpg')" }}>
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm z-0"></div>
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white z-20 transition-colors">
        {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8"><h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">TeraDoc</h1><p className="text-teal-100 font-medium">Gestão Terapêutica</p></div>
        <div className="bg-white/95 dark:bg-gray-800/95 p-8 rounded-2xl shadow-2xl border dark:border-gray-700 backdrop-blur-md transition-all">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">{isRegistering ? 'Cadastro de Responsável' : 'Acesse sua Conta'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && <div className="relative"><UserIcon className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="Seu Nome" className="w-full pl-10 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={name} onChange={e => setName(e.target.value)} /></div>}
            <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input type="email" placeholder="Email" className="w-full pl-10 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={18} /><input type="password" placeholder="Senha" className="w-full pl-10 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} /></div>
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 text-sm flex items-center gap-2 rounded-lg"><AlertCircle size={16}/> {error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Cadastrar Responsável' : 'Entrar'} <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                {isRegistering ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Criar Cadastro de Responsável'}
            </button>
            {!isRegistering && (
                <p className="mt-4 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Contas de Terapeuta e Admin são gerenciadas pela diretoria.
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser, logout, themeMode, toggleTheme } = useStore();
  if (!currentUser) return <LoginScreen />;
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40 h-16 shrink-0 flex justify-between items-center px-4 sm:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" className="w-8 h-8" alt="Logo" />
          <span className="font-bold text-xl text-teal-700 dark:text-white">TeraDoc</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-teal-500 transition-colors">{themeMode === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold dark:text-white leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
              {currentUser.role === 'PARENT' ? 'Responsável' : currentUser.role}
            </p>
          </div>
          <button onClick={logout} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><LogOut size={20}/></button>
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
