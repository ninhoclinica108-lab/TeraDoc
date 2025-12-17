import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistDashboard } from './components/TherapistDashboard';
import { LogOut, Activity, Moon, Sun, Mail, Lock, AlertCircle, ArrowRight, Loader2, User as UserIcon } from 'lucide-react';

const LoginScreen = () => {
  const { login, register, themeMode, toggleTheme, isLoading } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (isRegistering && !name)) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (isRegistering) {
        const result = await register(name, email, password);
        if (!result.success) {
             setError(result.error || 'Erro ao criar conta.');
        }
    } else {
        const success = await login(email, password);
        if (!success) setError('E-mail ou senha incorretos.');
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ 
        // Imagem atualizada conforme solicitação: Imagem TEA (Quebra-cabeça colorido em forma de coração)
        backgroundImage: "url('https://bmcnews.com.br/wp-content/uploads/2024/08/Imagem-TEA.jpg')" 
      }}
    >
      {/* Overlay Escuro com Desfoque suave para garantir leitura do texto sem esconder a imagem */}
      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px] z-0"></div>

      <button 
             onClick={toggleTheme} 
             className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md text-white hover:bg-white/20 transition-colors z-20"
             title="Alternar Tema"
      >
             {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="max-w-md w-full relative z-10">
         <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <img 
              src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" 
              alt="Logo TeraDoc" 
              className="w-24 h-24 mb-4 mx-auto object-contain drop-shadow-lg"
            />
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-md">TeraDoc</h1>
            <p className="text-teal-100 text-lg font-medium drop-shadow-sm">Sistema de Gestão Terapêutica</p>
         </div>

         <div className="bg-white/95 dark:bg-gray-800/95 p-8 rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700 backdrop-blur-md transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                {isRegistering ? 'Crie sua Conta' : 'Acesse sua Conta'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
               
               {isRegistering && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                     <div className="relative">
                        <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Seu Nome"
                          className={`w-full pl-10 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                        />
                     </div>
                   </div>
               )}

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="exemplo@teradoc.com"
                      className={`w-full pl-10 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className={`w-full pl-10 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                 </div>
               </div>

               {error && (
                 <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                 </div>
               )}

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processando...</span>
                    </>
                 ) : (
                    <>{isRegistering ? 'Cadastrar' : 'Entrar'} <ArrowRight size={18} /></>
                 )}
               </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button 
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                        className="ml-2 font-bold text-teal-600 dark:text-teal-400 hover:underline"
                        disabled={isLoading}
                    >
                        {isRegistering ? 'Fazer Login' : 'Criar Conta'}
                    </button>
                </p>
            </div>
         </div>
         
         <p className="text-center text-white/60 text-sm mt-6 font-medium">
           &copy; 2026 TeraDoc - Todos os direitos reservados.
         </p>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { currentUser, logout, themeMode, toggleTheme } = useStore();

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img 
               src="https://static.vecteezy.com/system/resources/previews/021/437/132/non_2x/world-autism-awareness-day-ribbon-free-png.png" 
               alt="Logo" 
               className="w-10 h-10 object-contain"
             />
             <div>
               <h1 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">TeraDoc</h1>
               <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-400">
                 Painel {currentUser.role === 'PARENT' ? 'dos Pais' : currentUser.role === 'ADMIN' ? 'Administrativo' : 'do Terapeuta'}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
               onClick={toggleTheme} 
               className="p-2 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
               {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">{currentUser.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'PARENT' && <ParentDashboard />}
        {currentUser.role === 'ADMIN' && <AdminDashboard />}
        {currentUser.role === 'THERAPIST' && <TherapistDashboard />}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <MainLayout />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;