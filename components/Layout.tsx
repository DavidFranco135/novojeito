
import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Briefcase, DollarSign, Settings, 
  Menu, LogOut, Bell, Sparkles, ChevronLeft, Sun, Moon, X, Trash2, ChevronRight
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
    { id: 'settings', label: 'Ajustes Master', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`flex h-screen overflow-hidden selection:bg-[#D4AF37]/30 ${theme === 'light' ? 'bg-[#F3F4F6]' : 'bg-[#050505]'}`}>
      
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] theme-transition border-r flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[85vw]' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-24' : 'w-72'} ${theme === 'light' ? 'bg-white border-zinc-300' : 'bg-[#0A0A0A] border-white/5'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 min-w-[3rem] rounded-2xl gradiente-ouro flex items-center justify-center shadow-lg">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            {!isCollapsed && <h1 className="text-xl font-black font-display italic tracking-tight theme-transition">Sr. José</h1>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex p-2 text-zinc-500 hover:text-[#D4AF37] transition-all">
            {isCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500"><X /></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${isActive ? 'bg-[#D4AF37] text-black font-black' : 'text-zinc-500 hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-black' : ''}`} />
                {!isCollapsed && <span className="text-sm uppercase tracking-widest truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className={`flex items-center gap-4 p-4 rounded-3xl border ${theme === 'light' ? 'bg-zinc-100 border-zinc-300' : 'bg-white/[0.03] border-white/5'}`}>
            <div className="w-10 h-10 min-w-[2.5rem] rounded-xl overflow-hidden">
               <img src={user?.avatar} className="w-full h-full object-cover" alt="User" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-color-main">{user?.name}</p>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest text-color-sec">Admin</p>
              </div>
            )}
            <button onClick={logout} className="text-zinc-500 hover:text-red-500 shrink-0"><LogOut size={20} /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`h-24 backdrop-blur-xl border-b flex items-center justify-between px-6 z-40 theme-transition ${theme === 'light' ? 'bg-white/90 border-zinc-300' : 'bg-[#050505]/95 border-white/5'}`}>
          <div className="flex items-center gap-4">
             <button className="lg:hidden p-2 text-color-main" onClick={() => setIsSidebarOpen(true)}><Menu size={28} /></button>
             <h2 className="text-lg md:text-2xl font-black font-display italic text-color-main truncate">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-3 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-black' : 'bg-white/5 border-white/10 text-white'}`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 rounded-2xl border transition-all relative ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-black' : 'bg-white/5 border-white/10 text-white'}`}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-black text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-current">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowNotifs(false)} />
                  <div className={`absolute right-0 mt-4 w-[90vw] sm:w-96 rounded-[2.5rem] border shadow-2xl z-[60] overflow-hidden ${theme === 'light' ? 'bg-white border-zinc-300' : 'bg-[#0F0F0F] border-white/10'}`}>
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#D4AF37]/5">
                       <p className="text-xs font-black uppercase tracking-widest">Notificações</p>
                       <button onClick={clearNotifications} className="text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                       {notifications.length === 0 && <p className="p-10 text-center text-xs text-zinc-500 italic">Nada por aqui.</p>}
                       {notifications.map(n => (
                         <div key={n.id} onClick={() => { markNotificationAsRead(n.id); setShowNotifs(false); setActiveTab('appointments'); }} className={`p-6 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${!n.read ? 'bg-[#D4AF37]/5 border-l-4 border-l-[#D4AF37]' : ''}`}>
                            <p className="text-xs font-black text-color-main">{n.title}</p>
                            <p className="text-[11px] text-color-sec mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-zinc-500 mt-2 font-bold">{n.time}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button onClick={() => setActiveTab('appointments')} className="gradiente-ouro px-5 py-3 rounded-2xl text-black font-black text-xs uppercase hidden sm:block">
               Agendar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
