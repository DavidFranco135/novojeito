import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const [selecao, setSelecao] = useState({
    servico: null as Service | null,
    profissional: null as Professional | null,
    data: '',
    hora: '',
    cliente: {
      nome: user?.name || '',
      whatsapp: user?.whatsapp || '',
      email: user?.email || ''
    }
  });

  // LÓGICA DE DESTAQUES: Ordena por mais agendados e inclui o restante no final
  const popularServices = useMemo(() => {
    const stats = services.map(s => ({
      ...s,
      count: appointments.filter(a => a.serviceId === s.id).length
    }));
    
    // Ordena por popularidade (do maior para o menor)
    const sorted = [...stats].sort((a, b) => b.count - a.count);
    
    // Identifica os serviços que têm agendamentos (Top)
    const withAppointments = sorted.filter(s => s.count > 0);
    // Identifica os serviços que ainda não têm agendamentos
    const remaining = sorted.filter(s => s.count === 0);
    
    // Retorna a lista completa: Mais agendados PRIMEIRO, restantes DEPOIS
    return [...withAppointments, ...remaining];
  }, [services, appointments]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category)));
    return ['Todos', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return services;
    return services.filter(s => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [filteredServices]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleBooking = async () => {
    if (!selecao.servico || !selecao.profissional || !selecao.data || !selecao.hora || !selecao.cliente.nome || !selecao.cliente.whatsapp) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const existingClient = clients.find(c => c.whatsapp === selecao.cliente.whatsapp);
      let clientId = existingClient?.id;

      if (!existingClient) {
        const newClient: Client = {
          id: Math.random().toString(36).substr(2, 9),
          name: selecao.cliente.nome,
          whatsapp: selecao.cliente.whatsapp,
          email: selecao.cliente.email,
          totalAppointments: 1,
          lastVisit: new Date().toISOString().split('T')[0],
          memberSince: new Date().toISOString().split('T')[0],
          notes: 'Cliente registrado via agendamento público'
        };
        addClient(newClient);
        clientId = newClient.id;
      }

      const appointment = {
        id: Math.random().toString(36).substr(2, 9),
        serviceId: selecao.servico.id,
        professionalId: selecao.profissional.id,
        clientId: clientId!,
        clientName: selecao.cliente.nome,
        clientWhatsapp: selecao.cliente.whatsapp,
        date: selecao.data,
        time: selecao.hora,
        status: 'pending' as const
      };

      addAppointment(appointment);
      setSuccess(true);
      
      const msg = `Olá! Gostaria de confirmar meu agendamento na ${config.name}:\n\n` +
                  `*Serviço:* ${selecao.servico.name}\n` +
                  `*Profissional:* ${selecao.profissional.name}\n` +
                  `*Data:* ${new Date(selecao.data).toLocaleDateString('pt-BR')}\n` +
                  `*Horário:* ${selecao.hora}\n\n` +
                  `*Nome:* ${selecao.cliente.nome}`;
      
      setTimeout(() => {
        window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }, 2000);

    } catch (err) {
      alert("Erro ao realizar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="absolute inset-0 z-0">
          <img src={config.loginBackground} className="w-full h-full object-cover" alt="Background" />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="cartao-vidro border-white/10 p-10 rounded-[3.5rem] text-center space-y-8">
            <div className="w-24 h-24 mx-auto rounded-[2.5rem] overflow-hidden border-4 border-[#66360f]/30 shadow-2xl">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div>
              <h2 className="text-3xl font-black font-display italic text-white mb-2">Área do Cliente</h2>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Acesse seus agendamentos</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input type="text" placeholder="SEU WHATSAPP" className="w-full bg-white/5 border-2 border-white/10 p-6 pl-16 rounded-3xl text-white font-black focus:border-[#66360f] outline-none transition-all"/>
              </div>
              <button className="w-full gradiente-ouro text-black py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
                Entrar Agora
              </button>
            </div>
            <button onClick={() => setView('HOME')} className="text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
              Voltar para o Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'} pb-20`}>
      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b theme-transition ${theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-[#050505]/80 border-white/5'}`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setView('HOME'); setPasso(1); }}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#66360f]/20 shadow-lg">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <h1 className={`text-xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              {config.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {view === 'HOME' ? (
              <button onClick={() => setView('LOGIN')} className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                <User size={20} />
              </button>
            ) : (
              <button onClick={() => { setView('HOME'); setPasso(1); }} className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                <X size={20} />
              </button>
            )}
            <button 
              onClick={() => { setView('BOOKING'); setPasso(1); }} 
              className="px-8 py-4 rounded-2xl text-white font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: '#66360f' }}
            >
              Agendar
            </button>
          </div>
        </div>
      </header>

      {view === 'HOME' ? (
        <div className="pt-24 animate-in fade-in duration-700">
          {/* Hero Section */}
          <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 z-0 scale-110">
                <img src={config.coverImage} className="w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#050505]" />
             </div>
             
             <div className="relative z-10 text-center px-6 max-w-4xl space-y-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-bounce">
                  <Sparkles size={16} className="text-[#66360f]" />
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">A melhor experiência da cidade</span>
                </div>
                <h2 className="text-6xl md:text-8xl font-black font-display italic text-white tracking-tighter leading-none">
                  DOMINE SEU <br /> <span className="text-transparent bg-clip-text gradiente-ouro">ESTILO.</span>
                </h2>
                <p className="text-zinc-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-80">
                  {config.description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                   <button onClick={() => setView('BOOKING')} className="w-full sm:w-auto px-12 py-6 rounded-[2.5rem] gradiente-ouro text-black font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 group">
                      Começar Agora <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </button>
                   <div className="flex items-center gap-4 px-8 py-6 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-xs uppercase tracking-widest">
                      <Clock size={20} className="text-[#66360f]" /> {config.openingTime} - {config.closingTime}
                   </div>
                </div>
             </div>

             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#66360f] to-transparent" />
             </div>
          </section>

          {/* Destaques da Casa (Ordenação Solicitada) */}
          <section className="py-32 px-6 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="space-y-4">
                   <span className="text-[#66360f] text-xs font-black uppercase tracking-[0.4em]">Mais Procurados</span>
                   <h2 className={`text-5xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Destaques da Casa</h2>
                </div>
                <button onClick={() => setView('BOOKING')} className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] hover:text-[#66360f] transition-all flex items-center gap-3 group">
                   Ver menu completo <ChevronRight size={16} className="group-hover:translate-x-1 transition-all" />
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {popularServices.map((service, i) => (
                  <div key={service.id} className={`group p-10 rounded-[3.5rem] border-2 transition-all hover:scale-[1.02] cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-100 shadow-xl' : 'bg-white/5 border-white/10 hover:border-[#66360f]/30'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className={`p-5 rounded-3xl transition-all ${theme === 'light' ? 'bg-zinc-50 text-zinc-900 group-hover:bg-[#66360f] group-hover:text-white' : 'bg-white/5 text-[#66360f] group-hover:bg-[#66360f] group-hover:text-black'}`}>
                           <Scissors size={28} />
                        </div>
                        <span className="text-3xl font-black font-display italic tracking-tight" style={{ color: '#66360f' }}>
                          R$ {service.price}
                        </span>
                     </div>
                     <h3 className={`text-2xl font-black font-display italic mb-3 theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{service.name}</h3>
                     <p className={`text-sm mb-8 line-clamp-2 leading-relaxed ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>{service.description}</p>
                     <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-t border-white/5 pt-8">
                        <span className="flex items-center gap-2"><Clock size={14} className="text-[#66360f]" /> {service.duration} min</span>
                        <span className="flex items-center gap-2"><Sparkles size={14} className="text-[#66360f]" /> Premium</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Seção Sobre */}
          <section className={`py-32 px-6 theme-transition ${theme === 'light' ? 'bg-zinc-100' : 'bg-white/[0.02]'}`}>
             <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="relative">
                   <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border-8 border-white/10">
                      <img src={config.aboutImage} className="w-full h-full object-cover" alt="Sobre" />
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#66360f] rounded-[3rem] z-0 opacity-20 blur-3xl" />
                   <div className="absolute -top-10 -left-10 p-10 cartao-vidro border-white/10 rounded-[3rem] z-20 hidden md:block animate-bounce shadow-2xl">
                      <div className="flex items-center gap-4">
                         <div className="text-4xl font-black font-display italic text-[#66360f]">15+</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">Anos de <br /> Excelência</div>
                      </div>
                   </div>
                </div>
                <div className="space-y-10">
                   <span className="text-[#66360f] text-xs font-black uppercase tracking-[0.4em]">Nossa História</span>
                   <h2 className={`text-6xl font-black font-display italic leading-none tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      {config.aboutTitle}
                   </h2>
                   <p className={`text-lg leading-relaxed font-medium theme-transition ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {config.aboutText}
                   </p>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <div className="w-12 h-1 bg-[#66360f] rounded-full" />
                         <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Corte Clássico</p>
                      </div>
                      <div className="space-y-3">
                         <div className="w-12 h-1 bg-[#66360f] rounded-full" />
                         <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Barba Real</p>
                      </div>
                   </div>
                   <button onClick={() => setView('BOOKING')} className="px-12 py-6 rounded-3xl gradiente-ouro text-black font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 transition-all">
                      Conhecer Serviços
                   </button>
                </div>
             </div>
          </section>

          {/* Rodapé Dinâmico */}
          <footer className={`py-20 px-6 border-t theme-transition ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#050505] border-white/5'}`}>
             <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#66360f]/20 shadow-xl">
                   <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
                </div>
                <div className="space-y-4">
                   <h3 className={`text-3xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h3>
                   <p className={`text-sm font-medium theme-transition ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>© 2024 Todos os direitos reservados. Design by <span className="text-[#66360f]">Signature</span></p>
                </div>
                <div className="flex items-center gap-8">
                   <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:text-[#66360f] hover:border-[#66360f]/50 transition-all"><Instagram size={24} /></a>
                   <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:text-[#66360f] hover:border-[#66360f]/50 transition-all"><Phone size={24} /></a>
                   <a href={config.locationUrl} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:text-[#66360f] hover:border-[#66360f]/50 transition-all"><MapPin size={24} /></a>
                </div>
             </div>
          </footer>
        </div>
      ) : (
        <div className="pt-32 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
           {/* Fluxo de Agendamento - Passo a Passo */}
           <div className="flex items-center justify-between mb-16 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 -z-10" />
              {[1, 2, 3, 4].map(num => (
                <div key={num} className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all border-2 ${passo >= num ? 'gradiente-ouro text-black border-transparent shadow-2xl scale-110' : 'bg-[#0A0A0A] border-white/10 text-zinc-600'}`}>
                  {passo > num ? <Check size={24} /> : num}
                </div>
              ))}
           </div>

           {passo === 1 && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                   <h2 className={`text-4xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>O que vamos fazer hoje?</h2>
                   <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Escolha um dos nossos serviços premium</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                   {services.map(service => (
                     <button key={service.id} onClick={() => { setSelecao({...selecao, servico: service}); setPasso(2); }} className={`group w-full p-8 rounded-[2.5rem] border-2 text-left transition-all hover:scale-[1.02] flex items-center justify-between ${selecao.servico?.id === service.id ? 'border-[#66360f] bg-[#66360f]/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                        <div className="flex items-center gap-8">
                           <div className="p-5 bg-[#66360f]/10 rounded-2xl text-[#66360f] group-hover:scale-110 transition-transform">
                              <Scissors size={28} />
                           </div>
                           <div>
                              <h3 className={`text-xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{service.name}</h3>
                              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{service.duration} min • Premium</p>
                           </div>
                        </div>
                        <div className="text-3xl font-black font-display italic" style={{ color: '#66360f' }}>R$ {service.price}</div>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {passo === 2 && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                   <button onClick={() => setPasso(1)} className="text-[#66360f] text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 mx-auto hover:opacity-70 transition-all"><ChevronLeft size={14}/> Voltar aos serviços</button>
                   <h2 className={`text-4xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Quem vai te atender?</h2>
                   <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nossos especialistas estão prontos</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {professionals.map(pro => (
                     <div key={pro.id} className="relative group">
                        <button onClick={() => { setSelecao({...selecao, profissional: pro}); setPasso(3); }} className={`w-full p-10 rounded-[3.5rem] border-2 text-center transition-all hover:scale-[1.05] ${selecao.profissional?.id === pro.id ? 'border-[#66360f] bg-[#66360f]/10 shadow-2xl' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                           <div className="w-32 h-32 mx-auto rounded-[2.5rem] overflow-hidden mb-6 border-4 border-white/10 shadow-2xl relative">
                              <img src={pro.avatar} className="w-full h-full object-cover" alt={pro.name} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-4">
                                <Heart size={20} className="text-red-500 fill-red-500" />
                              </div>
                           </div>
                           <h3 className={`text-2xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{pro.name}</h3>
                           <p className="text-[#66360f] text-[10px] font-black uppercase tracking-[0.2em] mt-3">{pro.specialty}</p>
                           <div className="flex items-center justify-center gap-4 mt-6">
                              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest"><Star size={12} className="text-[#66360f]" /> 5.0</div>
                              <div className="w-1 h-1 rounded-full bg-zinc-800" />
                              <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{pro.likes} curtidas</div>
                           </div>
                        </button>
                        <button 
                          onClick={() => { setSelectedProfessional(pro); setShowProfessionalModal(true); }}
                          className="absolute top-6 right-6 p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-[#66360f] transition-all"
                        >
                          <Info size={18} />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {passo === 3 && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                   <button onClick={() => setPasso(2)} className="text-[#66360f] text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 mx-auto hover:opacity-70 transition-all"><ChevronLeft size={14}/> Voltar aos barbeiros</button>
                   <h2 className={`text-4xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Quando será?</h2>
                   <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Selecione o melhor horário</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className={`p-10 rounded-[3.5rem] border-2 theme-transition ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                      <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-6 ml-2">1. Selecione a Data</label>
                      <input type="date" value={selecao.data} onChange={e => setSelecao({...selecao, data: e.target.value})} className={`w-full p-6 rounded-3xl font-black focus:border-[#66360f] outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-zinc-900' : 'bg-black/40 border-white/5 text-white'}`} />
                   </div>
                   <div className={`p-10 rounded-[3.5rem] border-2 theme-transition ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                      <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-6 ml-2">2. Horários Disponíveis</label>
                      <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scrollbar-hide p-2">
                         {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(h => (
                           <button key={h} onClick={() => { setSelecao({...selecao, hora: h}); setPasso(4); }} className={`p-5 rounded-2xl font-black text-sm transition-all border-2 ${selecao.hora === h ? 'gradiente-ouro text-black border-transparent shadow-xl scale-105' : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                              {h}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {passo === 4 && (
             <div className="space-y-10 animate-in fade-in duration-500 max-w-xl mx-auto">
                <div className="text-center space-y-4">
                   <button onClick={() => setPasso(3)} className="text-[#66360f] text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 mx-auto hover:opacity-70 transition-all"><ChevronLeft size={14}/> Voltar ao horário</button>
                   <h2 className={`text-4xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Quase lá...</h2>
                   <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Confirme seus dados para finalizar</p>
                </div>
                
                <div className={`p-10 rounded-[3.5rem] border-2 space-y-6 theme-transition ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Seu Nome Completo</label>
                      <input type="text" value={selecao.cliente.nome} onChange={e => setSelecao({...selecao, cliente: {...selecao.cliente, nome: e.target.value}})} className={`w-full p-6 rounded-3xl font-black focus:border-[#66360f] outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-zinc-900' : 'bg-black/40 border-white/5 text-white'}`} placeholder="Ex: José Silva" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Seu WhatsApp</label>
                      <input type="text" value={selecao.cliente.whatsapp} onChange={e => setSelecao({...selecao, cliente: {...selecao.cliente, whatsapp: e.target.value}})} className={`w-full p-6 rounded-3xl font-black focus:border-[#66360f] outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-zinc-900' : 'bg-black/40 border-white/5 text-white'}`} placeholder="(00) 00000-0000" />
                   </div>
                   
                   <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest opacity-60">
                         <span className={theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}>Total do Serviço</span>
                         <span className={theme === 'light' ? 'text-zinc-900' : 'text-white'}>R$ {selecao.servico?.price}</span>
                      </div>
                      <button onClick={handleBooking} disabled={loading} className="w-full gradiente-ouro text-black py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                         {loading ? 'Finalizando...' : <><Check size={20}/> Confirmar Agendamento</>}
                      </button>
                   </div>
                </div>
                <p className="text-[9px] text-zinc-600 text-center font-bold uppercase tracking-widest">Ao confirmar, você receberá o comprovante no WhatsApp</p>
             </div>
           )}
        </div>
      )}

      {/* Modal de Sucesso */}
      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <div className="bg-[#0A0A0A] border border-[#66360f]/30 p-12 rounded-[4rem] max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
              <div className="w-24 h-24 bg-[#66360f] text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                 <Check size={48} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-4xl font-black font-display italic text-white tracking-tight">Tudo Pronto!</h3>
                 <p className="text-zinc-400 font-medium leading-relaxed">Seu agendamento foi realizado com sucesso. Estamos te redirecionando para o WhatsApp.</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-2">
                 <p className="text-[#66360f] text-[10px] font-black uppercase tracking-widest">Horário Confirmado</p>
                 <p className="text-white text-2xl font-black font-display italic">{selecao.hora} • {new Date(selecao.data).toLocaleDateString('pt-BR')}</p>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Detalhes do Profissional */}
      {showProfessionalModal && selectedProfessional && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80">
           <div className={`relative w-full max-w-2xl rounded-[4rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A] border border-white/10'}`}>
              <button onClick={() => setShowProfessionalModal(false)} className="absolute top-8 right-8 z-10 p-4 bg-black/50 text-white rounded-2xl hover:bg-[#66360f] transition-all"><X size={20}/></button>
              
              <div className="h-64 relative">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-cover" alt={selectedProfessional.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                 <div className="absolute bottom-8 left-8 flex items-end gap-6">
                    <div className="w-24 h-24 rounded-3xl border-4 border-[#66360f] overflow-hidden shadow-2xl">
                       <img src={selectedProfessional.avatar} className="w-full h-full object-cover" alt={selectedProfessional.name} />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black font-display italic text-white">{selectedProfessional.name}</h2>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="text-[#66360f] text-[10px] font-black uppercase tracking-widest">{selectedProfessional.specialty}</span>
                          <div className="w-1 h-1 rounded-full bg-zinc-700" />
                          <div className="flex items-center gap-1 text-white text-[10px] font-black uppercase tracking-widest"><Star size={10} className="text-[#66360f]" /> 5.0</div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-10">
                 <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Experiência</p>
                       <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>8 Anos de Estrada</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Disponibilidade</p>
                       <div className="text-transparent bg-clip-text gradiente-ouro text-xs font-black uppercase tracking-widest">
                          {selectedProfessional.workingHours.start} - {selectedProfessional.workingHours.end}
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-10">
                 {selectedProfessional.description ? (
                   <>
                     <h3 className={`text-xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>História</h3>
                     <p className={`text-sm leading-relaxed whitespace-pre-line ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                       {selectedProfessional.description}
                     </p>
                   </>
                 ) : (
                   <p className={`text-sm italic text-center py-6 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                     Este profissional ainda não compartilhou sua história.
                   </p>
                 )}
                 
                 <button 
                   onClick={() => setShowProfessionalModal(false)} 
                   className="w-full mt-8 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                 >
                   Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
