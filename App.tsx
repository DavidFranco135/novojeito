import React, { useState } from 'react';
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
import Loyalty from './pages/Loyalty';
import Subscriptions from './pages/Subscriptions';
import Partners from './pages/Partners';
import Schedule from './pages/Schedule';
import BenefitValidator from './pages/BenefitValidator';  // ── NOVO ──
import Automacoes from './pages/Automacoes';
import Staff from './pages/Staff';
import Products from './pages/Products';
import Inbox from './pages/Inbox';
import FilaEspera from './pages/FilaEspera';
import { useBarberStore } from './store';
import { LogIn, Sparkles, Sun, Moon, LogOut, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  const { user, config, theme, login, toggleTheme, addClient, clients, logout, changePassword } = useBarberStore() as any;
  // Sempre começa no dashboard — o index.html já limpa #dashboard antes do React carregar
  const [activeTab, setActiveTab] = useState('dashboard');

  // Atualiza a URL hash apenas quando admin/staff estiver logado
  React.useEffect(() => {
    if (user && user.role !== 'CLIENTE') {
      window.location.hash = activeTab;
    } else {
      // Remove o hash para manter URL limpa e PWA abrindo na página pública
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [activeTab, user]);
  // Sempre começa na página pública — o admin acessa pelo botão de cadeado
  // Isso evita tela preta quando o PWA é salvo com #dashboard na URL
  const [isPublicView, setIsPublicView] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // ── Esqueci senha ADM ──────────────────────────────────────
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '', password: '' });

  // ── NOVO: Detecta se a URL contém ?validateBenefit=TOKEN ────
  const benefitToken = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('validateBenefit');
  }, []);

  const isFilaView = React.useMemo(() => {
    return new URLSearchParams(window.location.search).get('fila') === '1';
  }, []);

  if (isFilaView) {
    return <FilaEspera />;
  }

  if (benefitToken) {
    return (
      <BenefitValidator
        token={benefitToken}
        onBack={() => {
          // Remove o parâmetro da URL e recarrega o site normalmente
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  const handleLogin = async () => {
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      alert("Falha no acesso. Verifique suas credenciais.");
    }
  };



  const handleRegister = async () => {
    if (!registerData.name || !registerData.phone || !registerData.password) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await addClient({
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password
      } as any);
      alert("Cadastro realizado com sucesso! Agora faça o login.");
      setIsRegistering(false);
    } catch (err) {
      alert("Erro ao realizar cadastro.");
    }
  };

  // CORREÇÃO: Função para ir para visão do cliente (faz logout e vai para público)
  const handleGoToClientView = () => {
    logout();
    setIsPublicView(true);
  };

  // Se o usuário logado for um CLIENTE mas está acessando via botão admin (isPublicView=false), faz logout
  if (user && user.role === 'CLIENTE' && !isPublicView) {
    logout();
    localStorage.removeItem('brb_user');
    localStorage.removeItem('nj_client_session');
  }

  // Se o usuário logado for um CLIENTE, ele deve ver apenas o Portal do Membro
  if (user && user.role === 'CLIENTE' && isPublicView) {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900' : 'bg-[#C58A4A] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <PublicBooking initialView="CLIENT_DASHBOARD" />
      </div>
    );
  }

  // Se não houver usuário logado e estiver na visão pública (Padrão)
  if (!user && isPublicView) {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900' : 'bg-[#66360f] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button onClick={() => { localStorage.removeItem('nj_client_session'); localStorage.removeItem('brb_user'); logout(); setIsPublicView(false); }} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900' : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'}`}>
            <LogOut size={24} />
          </button>
        </div>
        <PublicBooking />
      </div>
    );
  }

  // Se não houver usuário logado e NÃO estiver na visão pública, mostra a tela de login (acesso ADM/Login Geral)
  if (!user && !isPublicView) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 selection:bg-[#C58A4A]/30 relative overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-[#F8F9FA] text-[#1A1A1A]' : 'bg-[#050505] text-[#f3f4f6]'}`}>
        <div className="absolute inset-0 z-0">
           <img src={config.loginBackground} className={`w-full h-full object-cover grayscale transition-all duration-1000 ${theme === 'light' ? 'opacity-5' : 'opacity-20'}`} alt="Login Background" />
           <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-[#F8F9FA]' : 'from-[#050505] via-transparent to-[#050505]'}`}></div>
        </div>

        <button onClick={toggleTheme} className={`absolute top-10 right-10 p-4 rounded-2xl border transition-all z-20 ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600 shadow-lg hover:text-zinc-900' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        <div className={`w-full max-w-lg rounded-[4rem] p-12 md:p-20 space-y-12 animate-in fade-in zoom-in duration-1000 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
          <div className={`absolute top-0 inset-x-0 h-1.5 gradiente-ouro rounded-t-[4rem]`}></div>
          
          <div className="text-center space-y-6">
            <div className="w-32 h-32 rounded-3xl mx-auto overflow-hidden shadow-2xl shadow-[#C58A4A]/30 border-2 border-[#C58A4A]/30">
               <img src={config.logo} className="w-full h-full object-cover" alt="Logo/Profile" />
            </div>
            <div className="space-y-2">
              <h1 className={`text-4xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{isRegistering ? 'Criar Conta' : 'Portal Novo Jeito'}</h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>{isRegistering ? 'Cadastre-se para agendar' : 'Acesse para gerir ou agendar'}</p>
            </div>
          </div>

          {!isRegistering ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme === 'light' ? 'text-zinc-600' : 'opacity-40'}`}>E-mail ou WhatsApp</label>
                  <input type="text" placeholder="novojeitoadm@gmail.com ou (21)..." value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-6 rounded-[2rem] outline-none focus:border-[#C58A4A] transition-all font-bold text-lg ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme === 'light' ? 'text-zinc-600' : 'opacity-40'}`}>Senha</label>
                  <input type="password" placeholder="••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={`w-full border p-6 rounded-[2rem] outline-none focus:border-[#C58A4A] transition-all font-bold text-lg ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                </div>
              </div>
              <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all">ACESSAR</button>
              <div className="text-center space-y-2">
                
                <button onClick={() => setIsRegistering(true)} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-[#C58A4A]'}`}>Ainda não tem conta? Cadastre-se</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <input type="text" placeholder="Nome Completo" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none focus:border-[#C58A4A] font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                <input type="tel" placeholder="WhatsApp" value={registerData.phone} onChange={e => setRegisterData({...registerData, phone: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none focus:border-[#C58A4A] font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                <input type="email" placeholder="E-mail" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none focus:border-[#C58A4A] font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                <input type="password" placeholder="Crie uma Senha" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none focus:border-[#C58A4A] font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
              </div>
              <button onClick={handleRegister} className="w-full gradiente-ouro text-black py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl">CADASTRAR E CONTINUAR</button>
              <div className="text-center">
                <button onClick={() => setIsRegistering(false)} className={`text-[10px] font-black uppercase tracking-widest hover:opacity-100 transition-opacity ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'opacity-40'}`}>Já tem conta? Voltar ao Login</button>
              </div>
            </div>
          )}

          <button onClick={() => setIsPublicView(true)} className={`w-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-blue-600' : 'opacity-40 hover:opacity-100 hover:text-[#C58A4A]'}`}>Visualizar Site (Site Público)</button>

              </div>
      </div>
    );
  }

  // Se o usuário logado for um COLABORADOR (BARBEIRO ou RECEPCAO)
  if (user && (user.role === 'BARBEIRO' || user.role === 'RECEPCAO')) {
    const allowedPages: string[] = (user as any).allowedPages || ['appointments'];
    const defaultPage: string   = (user as any).defaultPage  || allowedPages[0] || 'appointments';
    // Garantir que activeTab está numa página permitida
    const safeTab = allowedPages.includes(activeTab) ? activeTab : defaultPage;

    const staffRender = () => {
      switch (safeTab) {
        case 'dashboard':     return <Dashboard onNavigate={(t) => { if (allowedPages.includes(t)) setActiveTab(t); }} />;
        case 'appointments':  return <Appointments />;
        case 'clients':       return <Clients />;
        case 'professionals': return <Professionals />;
        case 'services':      return <Services />;
        case 'loyalty':       return <Loyalty />;
        case 'subscriptions': return <Subscriptions />;
        case 'partners':      return <Partners />;
        case 'schedule':      return <Schedule />;
        case 'financial':     return <Financial />;
        case 'suggestions':   return <Suggestions />;
        case 'automacoes':    return <Automacoes />;
        case 'galeria':       return <GaleriaCortes />;
        case 'settings':      return <Settings />;
        case 'products':      return <Products />;
        case 'inbox':         return <Inbox />;
        default:              return <Appointments />;
      }
    };

    return (
      <div className={`h-screen overflow-hidden theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <Layout activeTab={safeTab} setActiveTab={(t) => { if (allowedPages.includes(t)) setActiveTab(t); }} allowedPages={allowedPages}>
          {staffRender()}
        </Layout>
      </div>
    );
  }

  // Se o usuário logado for ADMIN, mostra o Layout de Gestão
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <Dashboard onNavigate={setActiveTab} />;
      case 'appointments':  return <Appointments />;
      case 'clients':       return <Clients />;
      case 'professionals': return <Professionals />;
      case 'services':      return <Services />;
      case 'loyalty':       return <Loyalty />;
      case 'subscriptions': return <Subscriptions />;
      case 'partners':      return <Partners />;
      case 'schedule':      return <Schedule />;
      case 'financial':     return <Financial />;
      case 'suggestions':   return <Suggestions />;
      case 'automacoes':    return <Automacoes />;
      case 'settings':      return <Settings />;
      case 'staff':         return <Staff />;
      case 'inbox':         return <Inbox />;
      case 'products':      return <Products />;
      default:              return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`h-screen overflow-hidden theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <button onClick={handleGoToClientView} className="fixed bottom-4 right-4 z-[100] gradiente-ouro text-black px-2 py-1 sm:px-4 sm:py-2 rounded-2xl sm:rounded-[2rem] font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">
        <span className="sm:hidden">👁 CLIENTE</span>
        <span className="hidden sm:inline">VISÃO DO CLIENTE</span>
      </button>
    </div>
  );
};

export default App;
