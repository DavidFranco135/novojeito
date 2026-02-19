import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Briefcase, DollarSign, Settings, 
  Menu, LogOut, Bell, Sparkles, ChevronLeft, Sun, Moon, X, Trash2, ChevronRight, MessageSquare
} from 'lucide-react';
import { useBarberStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set mobile browser bar color
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = '#C58A4A';
  }, []);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { logout, user, notifications, clearNotifications, markNotificationAsRead, theme, toggleTheme } = useBarberStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda Digital', icon: Calendar },
    { id: 'clients', label: 'Membros', icon: Users },
    { id: 'professionals', label: 'Barbeiros', icon: Briefcase },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'financial', label: 'Fluxo de Caixa', icon: DollarSign },
    { id: 'suggestions', label: 'Sugestões', icon: MessageSquare },
    { id: 'settings', label: 'Ajustes Master', icon: Settings },
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'light' ? 'bg-zinc-50' : 'bg-[#050505]'}`}>
      {/* Sidebar - CORRIGIDO */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} ${theme === 'light' ? 'bg-white border-r border-zinc-200 shadow-sm' : 'bg-[#0A0A0A] border-r border-white/5'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradiente-ouro rounded-lg flex items-center justify-center">
                  <Scissors size={18} className="text-black" />
                </div>
                <span className={`font-black italic text-xl tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>ADMIN</span>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className={`hidden lg:flex p-2 rounded-xl transition-all ${theme === 'light' ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' : 'text-zinc-500 hover:bg-white/5'}`}>
              <ChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500'}`}>
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'gradiente-ouro text-black shadow-lg shadow-[#C58A4A]/20' 
                      : theme === 'light' 
                        ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900' 
                        : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-black' : theme === 'light' ? 'text-zinc-700 group-hover:text-zinc-900' : 'text-zinc-500 group-hover:text-[#C58A4A]'} transition-colors`} />
                  {!isCollapsed && <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-black' : theme === 'light' ? 'text-zinc-700 group-hover:text-zinc-900' : 'text-zinc-500 group-hover:text-white'}`}>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className={`p-4 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
            <button onClick={logout} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'}`}>
              <LogOut size={22} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-black text-[11px] uppercase tracking-widest">Sair do Painel</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-20 flex items-center justify-between px-6 md:px-10 border-b ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-2 rounded-xl transition-all ${theme === 'light' ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900' : 'text-zinc-500 hover:bg-white/5'}`}>
              <Menu size={24} />
            </button>
            <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de tema com cores do site público */}
            <button onClick={toggleTheme} className={`p-3 rounded-2xl border transition-all ${theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300' : 'bg-zinc-900 border-zinc-800 text-amber-500 hover:bg-zinc-800 hover:border-zinc-700'}`}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 rounded-2xl border transition-all relative ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:border-zinc-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-[#C58A4A]'}`}>
                <Bell size={18} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-[#0A0A0A]'}`}></span>
                )}
              </button>
              
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                  <div className={`absolute right-0 mt-4 w-80 rounded-[2rem] shadow-2xl z-50 border overflow-hidden animate-in slide-in-from-top-2 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#111111] border-white/10'}`}>
                    <div className={`p-6 border-b flex justify-between items-center bg-[#C58A4A]`}>
                       <h3 className="text-xs font-black text-black uppercase">Notificações</h3>
                       <button onClick={clearNotifications} className="text-black/50 hover:text-black transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                       {notifications.length === 0 && <p className={`p-10 text-center text-xs italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Nada por aqui.</p>}
                       {notifications.map(n => (
                         <div key={n.id} onClick={() => { markNotificationAsRead(n.id); setShowNotifs(false); setActiveTab('appointments'); }} className={`p-6 border-b cursor-pointer transition-all ${theme === 'light' ? 'border-zinc-200 hover:bg-zinc-50' : 'border-white/5 hover:bg-white/5'} ${!n.read ? 'bg-[#C58A4A]/5 border-l-4 border-l-[#C58A4A]' : ''}`}>
                            <p className="text-xs font-black text-[#C58A4A]">{n.title}</p>
                            <p className={`text-[11px] mt-1 leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{n.message}</p>
                            <p className={`text-[9px] mt-2 font-bold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{n.time}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button onClick={() => setActiveTab('appointments')} className="gradiente-ouro px-5 py-3 rounded-2xl text-black font-black text-xs uppercase hidden sm:block shadow-lg hover:scale-105 transition-all">
               Agendar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
