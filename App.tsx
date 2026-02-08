import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Professionals from './pages/Professionals';
import Services from './pages/Services';
import Financial from './pages/Financial';
import Settings from './pages/Settings';
import Suggestions from './pages/Suggestions';
import PublicBooking from './pages/PublicBooking';
import { useBarberStore } from './store';
import { LogIn, Sparkles, Sun, Moon, LogOut, UserPlus } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const App: React.FC = () => {
  const { user, config, theme, login, toggleTheme, addClient } = useBarberStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPublicView, setIsPublicView] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '', password: '' });

  // --- LÓGICA DE NOTIFICAÇÃO (SINO APPLE/IFOOD CORRIGIDO PARA PC) ---
  useEffect(() => {
    // Definimos o áudio globalmente para pré-carregamento no PC
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2638/2638-preview.mp3');
    audio.preload = 'auto'; // Força o PC a baixar o som assim que abre o site

    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Ignora agendamentos antigos do cache ao atualizar a página
      if (snapshot.metadata.hasPendingWrites) return;

      snapshot.docChanges().forEach((change) => {
        // change.type === 'added' significa que alguém acabou de agendar
        if (change.type === 'added' && !snapshot.metadata.fromCache) {
          // No PC, tentamos tocar o som. Se falhar, ele avisa no console
          audio.currentTime = 0; // Reinicia o som caso toque duas vezes seguido
          audio.play().catch(e => {
            console.warn("Navegador bloqueou o som. Clique na página para habilitar o áudio.");
          });
        }
      });
    });

    return () => unsubscribe();
  }, []);
  // -----------------------------------------------------------------

  const handleLogin = async () => {
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      alert("Falha no acesso.");
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.phone || !registerData.password) {
      alert("Preencha todos os campos.");
      return;
    }
    try {
      await addClient({
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password
      } as any);
      alert("Cadastro realizado!");
      setIsRegistering(false);
    } catch (err) {
      alert("Erro ao cadastrar.");
    }
  };

  // MANTENDO TODA A SUA ESTRUTURA ORIGINAL ABAIXO
  if (user && user.role === 'CLIENTE') {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-[#D4AF37] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <PublicBooking initialView="CLIENT_DASHBOARD" />
      </div>
    );
  }

  if (!user && isPublicView) {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-[#D4AF37] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button onClick={() => setIsPublicView(false)} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'}`}>
            <LogIn size={24} />
          </button>
        </div>
        <PublicBooking />
      </div>
    );
  }

  if (!user && !isPublicView) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-[#D4AF37]/30 relative overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-[#F8F9FA] text-[#1A1A1A]' : 'bg-[#050505] text-[#f3f4f6]'}`}>
        <div className="absolute inset-0 z-0">
           <img src={config.loginBackground} className={`w-full h-full object-cover grayscale transition-all duration-1000 ${theme === 'light' ? 'opacity-5' : 'opacity-25'}`} alt="Login Background" />
           <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-[#F8F9FA]' : 'from-[#050505] via-transparent to-[#050505]'}`}></div>
        </div>

        <div className="cartao-vidro w-full max-w-md rounded-[3.5rem] p-8 md:p-12 space-y-8 animate-in fade-in zoom-in duration-700 shadow-2xl relative z-10 border-white/5">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] mx-auto overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30">
               <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black font-display italic tracking-tight uppercase">{isRegistering ? 'Criar Conta' : 'Portal Sr. José'}</h1>
              <p className="opacity-40 text-[9px] font-black uppercase tracking-[0.3em]">Signature</p>
            </div>
          </div>

          {!isRegistering ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <input type="text" placeholder="E-MAIL OU WHATSAPP" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-4 rounded-2xl outline-none focus:border-[#D4AF37] font-bold text-base ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                <input type="password" placeholder="SENHA" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full border p-4 rounded-2xl outline-none focus:border-[#D4AF37] font-bold text-base ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
              </div>
              <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all">ACESSAR</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="NOME" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} className={`w-full border p-4 rounded-xl outline-none ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
              <input type="password" placeholder="SENHA" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} className={`w-full border p-4 rounded-xl outline-none ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
              <button onClick={handleRegister} className="w-full gradiente-ouro text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs">FINALIZAR</button>
            </div>
          )}
          <button onClick={() => setIsPublicView(true)} className="w-full opacity-40 hover:opacity-100 text-[9px] font-black uppercase tracking-[0.2em] transition-all">Visualizar Site</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'appointments': return <Appointments />;
      case 'clients': return <Clients />;
      case 'professionals': return <Professionals />;
      case 'services': return <Services />;
      case 'financial': return <Financial />;
      case 'suggestions': return <Suggestions />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`h-screen overflow-hidden theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <button onClick={() => setIsPublicView(true)} className="fixed bottom-6 right-6 z-[100] gradiente-ouro text-black px-8 py-4 rounded-[2rem] font-black text-xs uppercase shadow-2xl">VISÃO DO CLIENTE</button>
    </div>
  );
};

export default App;
