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
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-[#F3F4F6]' : 'bg-[#050505]'}`}>
      
      {/* Sidebar - Fundo Branco e Borda Cinza no modo claro */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} ${theme === 'light' ? 'bg-white border-r border-zinc-200 shadow-xl lg:shadow-none' : 'bg-[#0A0A0A] border-r border-white/5'}`}>
        <div className="flex flex-col h-full">
          
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradiente-ouro rounded-lg flex items-center justify-center shadow-lg">
                  <Scissors size={18} className="text-black" />
                </div>
                <span className={`font-black italic text-xl tracking-tighter ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>ADMIN</span>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className={`hidden lg:flex p-2 rounded-xl transition-all ${theme === 'light' ? 'text-zinc-500 hover:bg-zinc-100 hover:text-black' : 'text-zinc-600 hover:bg-white/5'}`}>
              <ChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
              <X size={24} />
            </button>
          </div>

          {/* Menu de Navegação - Letras escuras no modo claro */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                    isActive 
                      ? 'gradiente-ouro text-black shadow-lg shadow-[#D4AF37]/30' 
                      : theme === 'light' 
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950' 
                        : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-black' : 'group-hover:scale-110 transition-transform'} />
                  {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className={`p-4 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
            <button onClick={logout} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-zinc-500 hover:bg-red-500/10 hover:text-red-500'}`}>
              <LogOut size={20} />
              {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair do Painel</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header - Letras escuras e Fundo branco no modo claro */}
        <header className={`h-24 flex items-center justify-between px-6 md:px-10 border-b transition-all ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#050505]/80 backdrop-blur-md border-white/5'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-3 rounded-xl ${theme === 'light' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-white/5 text-white'}`}>
              <Menu size={20} />
            </button>
            <div className="hidden md:block">
               <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Gestão Administrativa</h2>
               <p className={`text-xl font-black italic tracking-tight ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                {menuItems.find(m => m.id === activeTab)?.label || 'Bem-vindo'}
               </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Botão de Troca de Tema - Ícone Dourado e Fundo Cinza no modo claro */}
            <button 
              onClick={toggleTheme}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-sm border ${
                theme === 'light' 
                  ? 'bg-zinc-50 border-zinc-200 text-[#D4AF37] hover:bg-zinc-100' 
                  : 'bg-white/5 border-white/10 text-[#D4AF37] hover:bg-white/10'
              }`}
            >
              {theme === 'light' ? <Moon size={20} fill="currentColor" /> : <Sun size={20} />}
            </button>

            {/* Notificações - Ajustado para contraste */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 md:p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-950 hover:bg-zinc-100' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#050505]"></span>
                )}
              </button>
              
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                  <div className={`absolute right-0 mt-4 w-80 md:w-96 rounded-[2rem] shadow-2xl z-50 overflow-hidden border animate-in slide-in-from-top-2 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/10'}`}>
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#D4AF37]">
                       <h3 className="text-black font-black uppercase text-xs tracking-widest">Notificações</h3>
                       <button onClick={clearNotifications} className="text-[9px] font-black uppercase text-black/60 hover:text-black">Limpar</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                       {notifications.length === 0 && <p className={`p-10 text-center text-[10px] font-black uppercase italic ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`}>Nada por aqui.</p>}
                       {notifications.map(n => (
                         <div key={n.id} onClick={() => { markNotificationAsRead(n.id); setShowNotifs(false); setActiveTab('appointments'); }} className={`p-6 border-b cursor-pointer transition-all ${theme === 'light' ? 'border-zinc-200 hover:bg-zinc-50' : 'border-white/5 hover:bg-white/5'} ${!n.read ? 'bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]' : ''}`}>
                            <p className="text-xs font-black text-[#D4AF37]">{n.title}</p>
                            <p className={`text-[11px] mt-1 leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{n.message}</p>
                            <p className="text-[9px] text-zinc-500 mt-2 font-bold">{n.time}</p>
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

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
