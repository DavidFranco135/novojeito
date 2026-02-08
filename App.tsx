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
// Importação do Firebase para o som em tempo real
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

  // --- LÓGICA DO SOM DE NOTIFICAÇÃO (ESTILO IFOOD) ---
  useEffect(() => {
    // Link do som de alerta (pode ser trocado por qualquer link de áudio)
    const notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    // Referência para a coleção de notificações
    const q = query(collection(db, 'notifications'), orderBy('time', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Ignora a primeira carga para não tocar ao abrir o site
      if (!snapshot.metadata.hasPendingWrites && !snapshot.empty) {
        const source = snapshot.docs[0].data();
        // Só toca se a notificação for nova (menos de 10 segundos atrás)
        // Isso evita que toque sons antigos ao recarregar
        notificationAudio.play().catch(e => console.log("Som bloqueado pelo browser até interação."));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await login(loginIdentifier, loginPassword);
      setIsPublicView(false);
    } catch (error) {
      alert('Credenciais inválidas');
    }
  };

  const handleRegister = async () => {
    try {
      if (!registerData.name || !registerData.phone || !registerData.password) {
        alert('Preencha os campos obrigatórios');
        return;
      }
      await addClient(registerData);
      alert('Registo realizado! Agora faça login.');
      setIsRegistering(false);
    } catch (error) {
      alert('Erro ao registar');
    }
  };

  if (isPublicView) {
    return <PublicBooking />;
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="cartao-vidro p-12 rounded-[3.5rem] w-full max-w-md border-white/5 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 gradiente-ouro rounded-[2rem] mx-auto flex items-center justify-center p-1">
              <div className="w-full h-full bg-black rounded-[1.8rem] flex items-center justify-center">
                <Scissors className="text-[#D4AF37]" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white">PORTAL ADM</h1>
          </div>

          {!isRegistering ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="E-MAIL OU TELEFONE"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white font-bold text-xs"
              />
              <input
                type="password"
                placeholder="PALAVRA-PASSE"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white font-bold text-xs"
              />
              <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                <LogIn size={16} /> ACEDER
              </button>
              <button onClick={() => setIsRegistering(true)} className="w-full text-[9px] font-black uppercase opacity-40 hover:opacity-100 text-white tracking-widest transition-all">Novo por aqui? Criar Conta</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" placeholder="NOME COMPLETO" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white text-xs" />
              <input type="text" placeholder="TELEMÓVEL" value={registerData.phone} onChange={e => setRegisterData({...registerData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white text-xs" />
              <input type="email" placeholder="E-MAIL" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white text-xs" />
              <input type="password" placeholder="CRIAR PALAVRA-PASSE" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] text-white text-xs" />
              <button onClick={handleRegister} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs">FINALIZAR REGISTO</button>
              <button onClick={() => setIsRegistering(false)} className="w-full text-[9px] font-black uppercase opacity-40 text-white">Voltar</button>
            </div>
          )}

          <button onClick={() => setIsPublicView(true)} className="w-full opacity-40 hover:opacity-100 text-[9px] font-black uppercase tracking-[0.2em] transition-all text-white">Visualizar Site Público</button>
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
      <button 
        onClick={() => setIsPublicView(true)} 
        className="fixed bottom-6 right-6 z-[100] gradiente-ouro text-black px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        Visualizar Site
      </button>
    </div>
  );
};

export default App;
