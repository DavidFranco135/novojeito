import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, CreditCard
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
  const [selecao, setSelecao] = useState({
    serviceId: '',
    professionalId: '',
    date: '',
    time: '',
    clientName: '',
    clientPhone: '',
    clientEmail: ''
  });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // Nova aba interna para o portal do membro
  const [memberTab, setMemberTab] = useState<'MEUS_DADOS' | 'PLANOS_VIP' | 'RESPOSTAS'>('MEUS_DADOS');

  const sortedServicesForHighlights = useMemo(() => {
    const serviceCounts = appointments.reduce((acc: Record<string, number>, curr) => {
      acc[curr.serviceId] = (acc[curr.serviceId] || 0) + 1;
      return acc;
    }, {});

    const servicesWithAppointments = services.filter(s => (serviceCounts[s.id] || 0) > 0);
    const servicesWithoutAppointments = services.filter(s => (serviceCounts[s.id] || 0) === 0);

    servicesWithAppointments.sort((a, b) => (serviceCounts[b.id] || 0) - (serviceCounts[a.id] || 0));

    return [...servicesWithAppointments, ...servicesWithoutAppointments];
  }, [services, appointments]);

  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) {
        setLoggedClient(client);
        setEditData({
          name: client.name,
          phone: client.phone,
          email: client.email
        });
        setNewReview(prev => ({
          ...prev,
          userName: client.name,
          clientPhone: client.phone
        }));
        if (initialView === 'CLIENT_DASHBOARD') {
          setView('CLIENT_DASHBOARD');
        }
      }
    }
  }, [user, clients, initialView]);

  const destaqueRef = React.useRef<HTMLDivElement>(null);
  const experienciaRef = React.useRef<HTMLDivElement>(null);

  const scrollDestaque = (direction: 'left' | 'right') => {
    if (destaqueRef.current) {
      const scrollAmount = 300;
      destaqueRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollExperiencia = (direction: 'left' | 'right') => {
    if (experienciaRef.current) {
      const scrollAmount = 350;
      experienciaRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING');
    setPasso(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => 
      (c.phone === loginIdentifier || c.email === loginIdentifier) && 
      c.password === loginPassword
    );

    if (client) {
      setLoggedClient(client);
      setEditData({
        name: client.name,
        phone: client.phone,
        email: client.email
      });
      setView('CLIENT_DASHBOARD');
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      alert("Credenciais inválidas. Use seu telefone ou email e a senha cadastrada.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedClient) return;
    setLoading(true);
    try {
      await updateClient(loggedClient.id, editData);
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    setLoading(true);
    try {
      await addSuggestion({
        clientId: loggedClient.id,
        clientName: loggedClient.name,
        text: suggestionText,
        date: new Date().toISOString()
      });
      setSuggestionText('');
      alert("Obrigado pela sua sugestão! Ela será analisada por nossa equipe.");
    } catch (err) {
      alert("Erro ao enviar sugestão.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone || !selecao.clientEmail) {
      alert("Por favor, preencha todos os dados de identificação.");
      return;
    }

    setLoading(true);
    try {
      const client = await addClient({
        name: selecao.clientName,
        phone: selecao.clientPhone,
        email: selecao.clientEmail
      });

      const service = services.find(s => s.id === selecao.serviceId);
      const professional = professionals.find(p => p.id === selecao.professionalId);

      const [hours, minutes] = selecao.time.split(':').map(Number);
      const startTimeInMinutes = hours * 60 + minutes;
      const endTimeInMinutes = startTimeInMinutes + (service?.durationMinutes || 30);
      const endHours = Math.floor(endTimeInMinutes / 60);
      const endMinutes = endTimeInMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      await addAppointment({
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        serviceId: selecao.serviceId,
        serviceName: service?.name || '',
        professionalId: selecao.professionalId,
        professionalName: professional?.name || '',
        date: selecao.date,
        startTime: selecao.time,
        endTime,
        price: service?.price || 0
      }, true);

      setSuccess(true);
    } catch (err) {
      alert("Erro ao realizar agendamento. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedClient(null);
    logout();
    setView('HOME');
  };

  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = selectedCategory === 'Todos' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 animate-in zoom-in ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className={`w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
          <div className="w-20 h-20 gradiente-ouro rounded-full mx-auto flex items-center justify-center">
            <Check className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-black font-display italic text-[#D4AF37]">Reserva Confirmada!</h2>
          <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
            Seu ritual signature foi agendado com sucesso. Enviamos os detalhes para o seu contato.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#D4AF37] text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col theme-transition ${theme === 'light' ? 'bg-[#F3F4F6] text-black' : 'bg-[#050505] text-white'}`}>
      
      {view === 'HOME' && (
        <div className="animate-in fade-in flex flex-col min-h-screen">
          <header className="relative h-[65vh] overflow-hidden flex flex-col items-center justify-center">
            <img 
              src={config.coverImage} 
              className="absolute inset-0 w-full h-full object-cover brightness-50"
              alt="Capa"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-transparent' : 'from-[#050505] via-transparent to-transparent'}`}></div>
            
            <div className="absolute top-6 right-6 z-[100]">
              <button 
                onClick={() => setView('LOGIN')}
                className="bg-[#D4AF37] text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <History size={16}/> PORTAL DO MEMBRO
              </button>
            </div>

            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-28 h-28 rounded-3xl gradiente-ouro p-1 mx-auto mb-6">
                  <div className="w-full h-full rounded-[2.2rem] bg-black overflow-hidden">
                    <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
                  </div>
               </div>
               <h1 className={`text-5xl md:text-7xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-white drop-shadow-lg' : 'text-white'}`}>
                {config.name}
               </h1>
               <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-3">
                 {config.description}
               </p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             <section className="mb-24">
                <div className="flex items-center justify-between mb-8">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      Destaques <div className="h-1 w-24 gradiente-ouro opacity-30"></div>
                   </h2>
                   <div className="flex gap-2">
                      <button onClick={() => scrollDestaque('left')} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black transition-all"><ChevronLeft size={18}/></button>
                      <button onClick={() => scrollDestaque('right')} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black transition-all"><ChevronRight size={18}/></button>
                   </div>
                </div>
                <div ref={destaqueRef} className="flex gap-6 overflow-x-auto scrollbar-hide snap-x pb-4">
                   {sortedServicesForHighlights.slice(0, 5).map((svc) => (
                     <div key={svc.id} className={`min-w-[300px] snap-start p-8 rounded-[2.5rem] border-2 transition-all hover:scale-105 group ${theme === 'light' ? 'bg-white border-zinc-100 shadow-xl' : 'cartao-vidro border-white/5'}`}>
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-14 h-14 gradiente-ouro rounded-2xl flex items-center justify-center text-black shadow-lg group-hover:rotate-12 transition-transform">
                              <Scissors size={24} />
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{svc.category}</p>
                              <p className="text-xl font-black italic">R$ {svc.price}</p>
                           </div>
                        </div>
                        <h3 className="text-lg font-black italic mb-2">{svc.name}</h3>
                        <p className={`text-xs mb-8 line-clamp-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400 opacity-60'}`}>{svc.description}</p>
                        <button 
                          onClick={() => handleBookingStart(svc)}
                          className="w-full bg-[#D4AF37] text-black py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 group"
                        >
                          Agendar Agora <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                   ))}
                </div>
             </section>

             <section className="mb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      Serviços <div className="h-1 w-24 gradiente-ouro opacity-30"></div>
                   </h2>
                   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-white/5 border border-white/10 text-zinc-500'}`}
                        >
                          {cat}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredServices.map(svc => (
                     <div key={svc.id} className={`p-6 rounded-[2rem] border transition-all flex justify-between items-center group ${theme === 'light' ? 'bg-white border-zinc-100 hover:shadow-xl' : 'bg-white/5 border-white/5 hover:border-[#D4AF37]/30'}`}>
                        <div className="flex-1">
                           <h4 className="font-black italic text-sm mb-1">{svc.name}</h4>
                           <div className="flex items-center gap-4">
                              <span className="text-[#D4AF37] font-black text-xs italic">R$ {svc.price}</span>
                              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1"><Clock size={12}/> {svc.durationMinutes}min</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleBookingStart(svc)}
                          className={`p-4 rounded-2xl transition-all ${theme === 'light' ? 'bg-zinc-100 text-black hover:bg-[#D4AF37]' : 'bg-white/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}
                        >
                          <Calendar size={18} />
                        </button>
                     </div>
                   ))}
                </div>
             </section>

             {/* NOVO: SEÇÃO PLANOS VIP NA PAGINA PUBLICA */}
             <section className="mb-24">
                <div className="flex items-center justify-between mb-12">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      Planos VIP <div className="h-1 w-24 gradiente-ouro opacity-30"></div>
                   </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {(config.vipPlans || [
                     { id: '1', name: 'Plano Mensal', price: 150, period: 'Mensal', description: 'Cortes ilimitados e barba durante o mês.' },
                     { id: '2', name: 'Plano Anual', price: 1500, period: 'Anual', description: 'O melhor custo benefício para o ano todo.' }
                   ]).map((plan: any) => (
                     <div key={plan.id} className={`p-10 rounded-[3rem] border-2 transition-all hover:scale-[1.02] ${theme === 'light' ? 'bg-white border-zinc-100 shadow-xl' : 'cartao-vidro border-[#D4AF37]/20'}`}>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h3 className="text-3xl font-black italic">{plan.name}</h3>
                              <p className="text-[#D4AF37] font-black text-xs uppercase tracking-widest mt-1">{plan.period}</p>
                           </div>
                           <CreditCard className="text-[#D4AF37]" size={40} />
                        </div>
                        <p className={`text-sm mb-10 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{plan.description}</p>
                        <div className="text-4xl font-black mb-10 text-[#D4AF37]">R$ {plan.price.toFixed(2)}</div>
                        <button className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.25em] shadow-lg">Assinar Agora</button>
                     </div>
                   ))}
                </div>
             </section>

             <section className="mb-24 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      Experiência <div className="h-1 w-24 gradiente-ouro opacity-30"></div>
                   </h2>
                   <div className="flex gap-2">
                      <button onClick={() => scrollExperiencia('left')} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black transition-all"><ChevronLeft size={18}/></button>
                      <button onClick={() => scrollExperiencia('right')} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] hover:text-black transition-all"><ChevronRight size={18}/></button>
                   </div>
                </div>
                <div ref={experienciaRef} className="flex gap-8 overflow-x-auto scrollbar-hide snap-x pb-4">
                   {professionals.map(prof => (
                     <div 
                        key={prof.id} 
                        className={`min-w-[320px] snap-start rounded-[3rem] overflow-hidden border-2 transition-all group relative cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-100 shadow-xl' : 'cartao-vidro border-white/5'}`}
                        onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}
                      >
                        <div className="h-64 relative overflow-hidden">
                           <img src={prof.avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prof.name} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                           <div className="absolute bottom-6 left-6">
                              <h3 className="text-xl font-black italic text-white">{prof.name}</h3>
                              <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">{prof.role}</p>
                           </div>
                        </div>
                        <div className="p-8">
                           <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-2">
                                 <Star className="text-[#D4AF37] fill-[#D4AF37]" size={16} />
                                 <span className="text-sm font-black italic">4.9</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); likeProfessional(prof.id); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-400'} hover:bg-red-500/10 hover:text-red-500`}
                              >
                                <Heart size={14} className={prof.likes > 0 ? 'fill-red-500 text-red-500' : ''} /> {prof.likes}
                              </button>
                           </div>
                           <button className="w-full border-2 border-[#D4AF37] text-[#D4AF37] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">Ver Perfil</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             <section className="mb-24">
                <div className={`p-10 md:p-20 rounded-[4rem] relative overflow-hidden flex flex-col items-center text-center ${theme === 'light' ? 'bg-white shadow-2xl' : 'cartao-vidro'}`}>
                   <div className="absolute top-0 right-0 w-64 h-64 gradiente-ouro opacity-10 blur-[100px] -mr-32 -mt-32"></div>
                   <Quote className="text-[#D4AF37] mb-8 opacity-40" size={60} />
                   <h2 className={`text-4xl md:text-6xl font-black font-display italic mb-12 tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      O que dizem os <br/> <span className="text-[#D4AF37]">nossos clientes</span>
                   </h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                      {config.shopReviews?.slice(0, 3).map((rev: Review) => (
                        <div key={rev.id} className={`p-8 rounded-[2.5rem] text-left border ${theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-white/5 border-white/5'}`}>
                           <div className="flex gap-1 mb-4">
                              {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < rev.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-zinc-600'} />)}
                           </div>
                           <p className={`text-sm italic mb-6 leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>"{rev.comment}"</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{rev.userName}</p>
                        </div>
                      ))}
                   </div>

                   <button 
                     onClick={() => setShowReviewModal(true)}
                     className="mt-16 bg-[#D4AF37] text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all"
                   >
                     Deixar meu feedback
                   </button>
                </div>
             </section>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-10 rounded-[3rem] border ${theme === 'light' ? 'bg-white border-zinc-100' : 'cartao-vidro border-white/5'}`}>
                   <MapPin className="text-[#D4AF37] mb-6" size={32} />
                   <h3 className="text-2xl font-black italic mb-4">Onde Estamos</h3>
                   <p className={`text-sm mb-6 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400 opacity-60'}`}>{config.address}</p>
                   <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`} target="_blank" rel="noreferrer" className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">Ver no Google Maps <ArrowRight size={14}/></a>
                </div>
                <div className={`p-10 rounded-[3rem] border ${theme === 'light' ? 'bg-white border-zinc-100' : 'cartao-vidro border-white/5'}`}>
                   <Clock className="text-[#D4AF37] mb-6" size={32} />
                   <h3 className="text-2xl font-black italic mb-4">Horários</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="opacity-40">Terça - Sexta</span>
                         <span className="font-black italic">09:00 - 20:00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="opacity-40">Sábado</span>
                         <span className="font-black italic">09:00 - 18:00</span>
                      </div>
                   </div>
                </div>
             </section>
          </main>

          <footer className={`py-20 px-6 border-t ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-black border-white/5'}`}>
             <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex flex-col md:flex-row items-center gap-4">
                   <a 
                    href="https://www.instagram.com/srjosebarberpub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-tr from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                   >
                     <Instagram size={20} /> Siga no Instagram
                   </a>
                   <a 
                    href="https://wa.me/5521964340031" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                   >
                     <MessageSquare size={20} /> WhatsApp
                   </a>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">© {new Date().getFullYear()} {config.name} • Signature Experience</p>
             </div>
          </footer>
        </div>
      )}

      {view === 'CLIENT_DASHBOARD' && loggedClient && (
        <div className="animate-in slide-in-from-right duration-500 flex-1 flex flex-col p-6 md:p-12 overflow-auto">
          <div className="max-w-4xl mx-auto w-full space-y-10">
            <div className="flex items-center justify-between">
               <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/> Sair</button>
               <button onClick={() => setView('HOME')} className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest border border-[#D4AF37]/30 px-6 py-2 rounded-lg">Página Inicial</button>
            </div>

            <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide">
               <button onClick={() => setMemberTab('MEUS_DADOS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${memberTab === 'MEUS_DADOS' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-zinc-500'}`}>Meus Dados</button>
               <button onClick={() => setMemberTab('PLANOS_VIP')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${memberTab === 'PLANOS_VIP' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-zinc-500'}`}>Planos VIP</button>
               <button onClick={() => setMemberTab('RESPOSTAS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${memberTab === 'RESPOSTAS' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-zinc-500'}`}>Respostas Adm</button>
            </div>

            {memberTab === 'MEUS_DADOS' && (
              <div className="space-y-10">
                <header>
                   <h2 className="text-4xl font-black italic font-display">Bem-vindo, {loggedClient.name}</h2>
                   <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-2">Membro Diamond • Desde {new Date().getFullYear()}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h3 className="text-xl font-black italic flex items-center gap-3"><User size={20} className="text-[#D4AF37]"/> Seus Dados</h3>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-2">Nome Completo</label>
                            <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-2">WhatsApp</label>
                            <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-2">E-mail</label>
                            <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                         </div>
                         <button type="submit" disabled={loading} className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Salvar Alterações</button>
                      </form>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-xl font-black italic flex items-center gap-3"><History size={20} className="text-[#D4AF37]"/> Histórico</h3>
                      <div className="space-y-3">
                         {appointments.filter(a => a.clientId === loggedClient.id).length === 0 ? (
                           <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] text-center opacity-40">
                              <Calendar size={32} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase">Nenhum agendamento encontrado</p>
                           </div>
                         ) : (
                           appointments.filter(a => a.clientId === loggedClient.id).map(apt => (
                             <div key={apt.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                                <div>
                                   <p className="text-sm font-black italic">{apt.serviceName}</p>
                                   <p className="text-[10px] opacity-40">{new Date(apt.date).toLocaleDateString('pt-BR')} • {apt.startTime}</p>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full">{apt.status}</span>
                             </div>
                           ))
                         )}
                      </div>
                   </div>
                </div>

                <div className={`p-10 rounded-[3rem] border-2 border-dashed border-white/10 space-y-6`}>
                   <h3 className="text-xl font-black italic flex items-center gap-3"><MessageSquare size={20} className="text-[#D4AF37]"/> Sugestões para Melhorias</h3>
                   <textarea 
                     className="w-full bg-white/5 p-6 rounded-[2rem] outline-none min-h-[120px] text-sm leading-relaxed" 
                     placeholder="Como podemos tornar sua experiência ainda mais memorável?"
                     value={suggestionText}
                     onChange={e => setSuggestionText(e.target.value)}
                   />
                   <button 
                     onClick={handleSendSuggestion}
                     disabled={loading || !suggestionText.trim()}
                     className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20"
                   >
                     Enviar Sugestão
                   </button>
                </div>
              </div>
            )}

            {memberTab === 'PLANOS_VIP' && (
              <div className="space-y-10">
                 <h2 className="text-3xl font-black italic font-display">Seu Status VIP</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {(config.vipPlans || []).map((plan: any) => (
                      <div key={plan.id} className="p-8 cartao-vidro border-2 border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-all"><CreditCard size={48} /></div>
                        <h4 className="text-2xl font-black italic mb-2">{plan.name}</h4>
                        <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest mb-6">{plan.period}</p>
                        <p className="text-sm text-zinc-400 mb-8">{plan.description}</p>
                        <div className="text-3xl font-black text-[#D4AF37] mb-8">R$ {plan.price.toFixed(2)}</div>
                        <button className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Contratar Plano</button>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            {memberTab === 'RESPOSTAS' && (
               <div className="space-y-10">
                  <h2 className="text-3xl font-black italic font-display">Minhas Sugestões e Respostas</h2>
                  <div className="space-y-6">
                    {/* Placeholder para as sugestões enviadas por este cliente */}
                    <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] text-center opacity-40">
                      <MessageSquare size={32} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase">Visualize aqui o retorno da administração às suas sugestões.</p>
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* RESTANTE DO CÓDIGO ORIGINAL (LOGINS, MODAIS, ETC) */}
      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img src={config.loginBackground} className="w-full h-full object-cover brightness-[0.3]" alt="Background" />
             <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
          </div>
          <div className="relative z-10 w-full max-w-md animate-in zoom-in duration-500">
             <div className="cartao-vidro p-10 md:p-14 rounded-[3.5rem] border-white/10 space-y-10">
                <div className="text-center">
                   <h2 className="text-4xl font-black italic font-display mb-2">Member Portal</h2>
                   <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em]">Signature Experience</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                   <div className="space-y-4">
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                        <input 
                          required
                          type="text"
                          placeholder="Telefone ou E-mail"
                          className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-[#D4AF37] transition-all text-sm"
                          value={loginIdentifier}
                          onChange={e => setLoginIdentifier(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                        <input 
                          required
                          type="password"
                          placeholder="Sua Senha"
                          className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-[#D4AF37] transition-all text-sm"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                        />
                      </div>
                   </div>
                   <button className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] transition-all">Acessar Portal</button>
                </form>
                <button onClick={() => setView('HOME')} className="w-full text-zinc-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">Voltar para o site</button>
             </div>
          </div>
        </div>
      )}

      {view === 'BOOKING' && (
        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom duration-700">
           <header className={`p-8 sticky top-0 z-50 flex items-center justify-between ${theme === 'light' ? 'bg-white border-b border-zinc-100' : 'bg-black/80 backdrop-blur-xl border-b border-white/5'}`}>
              <button onClick={() => { if(passo === 1) setView('HOME'); else setPasso(passo-1); }} className="p-3 rounded-full hover:bg-white/5 transition-all"><ChevronLeft size={24}/></button>
              <div className="flex flex-col items-center">
                 <h2 className="text-lg font-black italic">Reserva Online</h2>
                 <div className="flex gap-2 mt-2">
                    {[1, 2, 3].map(i => <div key={i} className={`h-1 rounded-full transition-all ${i === passo ? 'w-8 bg-[#D4AF37]' : 'w-4 bg-white/10'}`}></div>)}
                 </div>
              </div>
              <div className="w-10"></div>
           </header>

           <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
              {passo === 1 && (
                <div className="space-y-12 animate-in fade-in">
                  <h3 className="text-3xl md:text-5xl font-black italic font-display text-center">Escolha o Ritual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {services.map(svc => (
                        <button 
                          key={svc.id}
                          onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }}
                          className={`p-10 rounded-[3rem] border-2 text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-72 ${selecao.serviceId === svc.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/5 bg-white/5'}`}
                        >
                           <div>
                              <div className="flex justify-between items-start mb-4">
                                 <div className="w-12 h-12 gradiente-ouro rounded-2xl flex items-center justify-center text-black shadow-lg"><Scissors size={20}/></div>
                                 <span className="text-2xl font-black italic">R$ {svc.price}</span>
                              </div>
                              <h4 className="text-xl font-black italic">{svc.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">{svc.durationMinutes} minutos de ritual</p>
                           </div>
                           <p className="text-xs text-zinc-400 line-clamp-2">{svc.description}</p>
                        </button>
                     ))}
                  </div>
                </div>
              )}

              {passo === 2 && (
                <div className="space-y-12 animate-in fade-in">
                  <h3 className="text-3xl md:text-5xl font-black italic font-display text-center">Data e Mestre</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5">
                           <input 
                             type="date" 
                             className="w-full bg-transparent text-2xl font-black italic outline-none color-scheme-dark"
                             value={selecao.date}
                             onChange={e => setSelecao({...selecao, date: e.target.value})}
                           />
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                           {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                             <button 
                               key={time}
                               onClick={() => setSelecao({...selecao, time})}
                               className={`py-4 rounded-2xl text-xs font-black transition-all ${selecao.time === time ? 'bg-[#D4AF37] text-black shadow-lg scale-105' : 'bg-white/5 hover:bg-white/10'}`}
                             >
                               {time}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-6">
                        {professionals.map(prof => (
                          <button 
                            key={prof.id}
                            onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }}
                            className={`w-full p-6 rounded-[2.5rem] border-2 flex items-center gap-6 transition-all ${selecao.professionalId === prof.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/5 bg-white/5'}`}
                          >
                             <img src={prof.avatar} className="w-20 h-20 rounded-2xl object-cover" alt={prof.name} />
                             <div className="text-left">
                                <h4 className="font-black italic text-lg">{prof.name}</h4>
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{prof.role}</p>
                             </div>
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="max-w-md mx-auto space-y-12 animate-in zoom-in">
                   <h3 className="text-3xl md:text-5xl font-black italic font-display text-center">Identificação</h3>
                   <div className="space-y-4">
                      <input 
                        placeholder="Nome Completo"
                        className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl outline-none focus:border-[#D4AF37] transition-all text-sm"
                        value={selecao.clientName}
                        onChange={e => setSelecao({...selecao, clientName: e.target.value})}
                      />
                      <input 
                        placeholder="Seu WhatsApp"
                        className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl outline-none focus:border-[#D4AF37] transition-all text-sm"
                        value={selecao.clientPhone}
                        onChange={e => setSelecao({...selecao, clientPhone: e.target.value})}
                      />
                      <input 
                        placeholder="Seu E-mail"
                        className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl outline-none focus:border-[#D4AF37] transition-all text-sm"
                        value={selecao.clientEmail}
                        onChange={e => setSelecao({...selecao, clientEmail: e.target.value})}
                      />
                   </div>
                   <button 
                     onClick={handleConfirmBooking}
                     disabled={loading}
                     className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all"
                   >
                     {loading ? 'Processando Ritual...' : 'Finalizar Agendamento'}
                   </button>
                </div>
              )}
           </main>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className={`w-full max-w-lg p-10 md:p-14 rounded-[3.5rem] border-2 relative ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-white/10'}`}>
              <button onClick={() => setShowReviewModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X/></button>
              <h3 className="text-3xl font-black italic font-display mb-8">Seu Feedback</h3>
              <div className="space-y-6">
                 <div className="flex gap-4 justify-center py-6">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setNewReview({...newReview, rating: star})}><Star className={star <= newReview.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-zinc-600'} size={32}/></button>
                    ))}
                 </div>
                 <input 
                   placeholder="Seu Nome"
                   className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-sm"
                   value={newReview.userName}
                   onChange={e => setNewReview({...newReview, userName: e.target.value})}
                 />
                 <textarea 
                   placeholder="Conte sua experiência..."
                   className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-sm min-h-[120px]"
                   value={newReview.comment}
                   onChange={e => setNewReview({...newReview, comment: e.target.value})}
                 />
                 <button 
                   onClick={() => { addShopReview({ ...newReview, id: Date.now().toString(), date: new Date().toISOString() }); setShowReviewModal(false); alert("Avaliação enviada com sucesso!"); }}
                   className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                 >
                   Enviar Avaliação
                 </button>
              </div>
           </div>
        </div>
      )}

      {showProfessionalModal && selectedProfessional && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className={`w-full max-w-2xl rounded-[4rem] overflow-hidden border-2 relative ${theme === 'light' ? 'bg-white border-zinc-100' : 'cartao-vidro border-white/10'}`}>
              <div className="h-80 relative">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-cover" alt={selectedProfessional.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                 <div className="absolute bottom-10 left-10">
                    <h2 className="text-4xl font-black italic text-white mb-2">{selectedProfessional.name}</h2>
                    <div className="flex items-center gap-4">
                       <span className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em]">{selectedProfessional.role}</span>
                       <div className="h-1 w-8 bg-white/20 rounded-full"></div>
                       <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest">
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
