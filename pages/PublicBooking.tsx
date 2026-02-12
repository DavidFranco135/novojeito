import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout, suggestions } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selecao, setSelecao] = useState({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // States para o portal do membro
  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

  // State para modal de história do barbeiro
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // ✅ NOVO: State para aba ativa no portal do cliente
  const [activeClientTab, setActiveClientTab] = useState<'appointments' | 'suggestions'>('appointments');

  // LOGICA PARA DESTAQUES: Mais agendados primeiro, depois o restante
  const sortedServicesForHighlights = useMemo(() => {
    const counts = appointments.reduce((acc: Record<string, number>, curr) => {
      acc[curr.serviceId] = (acc[curr.serviceId] || 0) + 1;
      return acc;
    }, {});

    const withAppts = services.filter(s => (counts[s.id] || 0) > 0);
    const withoutAppts = services.filter(s => (counts[s.id] || 0) === 0);

    withAppts.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

    return [...withAppts, ...withoutAppts];
  }, [services, appointments]);

  // Sincroniza o usuário logado do store com o loggedClient deste componente
  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) {
        setLoggedClient(client);
        setEditData({ name: client.name, phone: client.phone, email: client.email });
        setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
        if (initialView === 'CLIENT_DASHBOARD') setView('CLIENT_DASHBOARD');
      }
    }
  }, [user, clients, initialView]);

  // Estados para drag scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const destaqueRef = React.useRef<HTMLDivElement>(null);
  const experienciaRef = React.useRef<HTMLDivElement>(null);
  const membroRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const checkAvailability = (date: string, time: string, profId: string) => {
    return appointments.some(a => a.date === date && a.startTime === time && a.professionalId === profId && a.status !== 'CANCELADO');
  };

  const turnos = useMemo(() => {
    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    return {
      manha: times.filter(t => parseInt(t.split(':')[0]) < 12),
      tarde: times.filter(t => parseInt(t.split(':')[0]) >= 12 && parseInt(t.split(':')[0]) < 18),
      noite: times.filter(t => parseInt(t.split(':')[0]) >= 18)
    };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);
  const filteredServices = useMemo(() => selectedCategory === 'Todos' ? services : services.filter(s => s.category === selectedCategory), [services, selectedCategory]);

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone || !selecao.clientEmail) {
      alert("Por favor, preencha todos os dados de identificação.");
      return;
    }
    setLoading(true); setBookingError(null);
    try {
      const service = services.find(s => s.id === selecao.serviceId);
      const professional = professionals.find(p => p.id === selecao.professionalId);
      if (!service || !professional) { throw new Error('Serviço ou profissional não encontrado'); }
      const [h, m] = selecao.time.split(':').map(Number);
      const totalMinutes = h * 60 + m + service.durationMinutes;
      const endTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
      await addAppointment({
        clientId: loggedClient?.id || `guest_${Date.now()}`,
        clientName: selecao.clientName,
        clientPhone: selecao.clientPhone,
        serviceId: selecao.serviceId,
        serviceName: service.name,
        professionalId: selecao.professionalId,
        professionalName: professional.name,
        date: selecao.date,
        startTime: selecao.time,
        endTime,
        price: service.price
      }, true);
      setSuccess(true);
      setTimeout(() => {
        setView('HOME'); setPasso(1);
        setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      setBookingError(error.message || 'Erro ao agendar. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleAddReview = async () => {
    if (!newReview.userName || !newReview.comment) {
      alert("Por favor, preencha seu nome e comentário.");
      return;
    }
    try {
      await addShopReview(newReview);
      setShowReviewModal(false);
      setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
      alert("Avaliação enviada! Obrigado pelo feedback.");
    } catch (error) {
      alert("Erro ao enviar avaliação. Tente novamente.");
    }
  };

  const handleLikeProfessional = (profId: string) => {
    likeProfessional(profId);
  };

  const handleUpdateProfile = async () => {
    if (!loggedClient) return;
    try {
      await updateClient(loggedClient.id, editData);
      alert("Perfil atualizado!");
      const updated = clients.find(c => c.id === loggedClient.id);
      if (updated) setLoggedClient(updated);
    } catch (error) {
      alert("Erro ao atualizar perfil.");
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    try {
      await addSuggestion({
        clientName: loggedClient.name,
        clientPhone: loggedClient.phone,
        text: suggestionText
      });
      setSuggestionText('');
      alert("Sugestão enviada! Obrigado.");
    } catch (error) {
      alert("Erro ao enviar sugestão.");
    }
  };

  // ✅ NOVO: Filtrar agendamentos e sugestões do cliente logado
  const myAppointments = useMemo(() => 
    loggedClient ? appointments.filter(a => a.clientPhone === loggedClient.phone) : [],
    [appointments, loggedClient]
  );

  const mySuggestions = useMemo(() =>
    loggedClient ? suggestions.filter(s => s.clientPhone === loggedClient.phone) : [],
    [suggestions, loggedClient]
  );

  // ✅ NOVO: Função para abrir WhatsApp com mensagem do plano VIP
  const handleVipPlanClick = (plan: any) => {
    const message = `Olá! Gostaria de saber mais sobre o *${plan.name}* - ${plan.period === 'MENSAL' ? 'Mensal' : 'Anual'} por R$ ${plan.price.toFixed(2)}.`;
    const whatsappUrl = `https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ✅ CORREÇÃO: Planos VIP ativos
  const activePlans = config.vipPlans?.filter(p => p.status === 'ATIVO') || [];

  if (view === 'CLIENT_DASHBOARD' && loggedClient) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#050505] text-white'}`}>
        <header className={`border-b sticky top-0 z-50 backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-[#0A0A0A]/80 border-white/10'}`}>
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={config.logo} className="w-16 h-16 rounded-3xl border-2 border-[#D4AF37]/40" alt={config.name} />
              <div>
                <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Bem-vindo, {loggedClient.name}</p>
              </div>
            </div>
            <button onClick={() => { logout(); setView('HOME'); }} className={`p-3 rounded-xl transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-400 hover:text-white'}`}><LogOut size={20}/></button>
          </div>
        </header>

        {/* ✅ NOVO: Tabs para alternar entre Agendamentos e Sugestões */}
        <div className={`border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-6xl mx-auto px-6 flex gap-8">
            <button 
              onClick={() => setActiveClientTab('appointments')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeClientTab === 'appointments' 
                  ? 'border-[#D4AF37] text-[#D4AF37]' 
                  : theme === 'light' ? 'border-transparent text-zinc-500' : 'border-transparent opacity-40'
              }`}
            >
              Meus Agendamentos
            </button>
            <button 
              onClick={() => setActiveClientTab('suggestions')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeClientTab === 'suggestions' 
                  ? 'border-[#D4AF37] text-[#D4AF37]' 
                  : theme === 'light' ? 'border-transparent text-zinc-500' : 'border-transparent opacity-40'
              }`}
            >
              Minhas Sugestões
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {activeClientTab === 'appointments' ? (
            <div className="space-y-6">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meus Agendamentos</h2>
              {myAppointments.length === 0 ? (
                <div className={`text-center py-20 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                  <Calendar className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  <p className={`font-black uppercase text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>Nenhum agendamento encontrado</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myAppointments.map(apt => (
                    <div key={apt.id} className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${
                              apt.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' :
                              apt.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-500' :
                              apt.status === 'CANCELADO' ? 'bg-red-500/10 text-red-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>{apt.status}</div>
                          </div>
                          <h3 className={`text-lg font-black mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{apt.serviceName}</h3>
                          <div className={`space-y-1 text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            <p className="flex items-center gap-2"><User size={14} className="text-[#D4AF37]" /><span className="font-bold">Barbeiro:</span> {apt.professionalName}</p>
                            <p className="flex items-center gap-2"><Calendar size={14} className="text-[#D4AF37]" /><span className="font-bold">Data:</span> {new Date(apt.date).toLocaleDateString('pt-BR')}</p>
                            <p className="flex items-center gap-2"><Clock size={14} className="text-[#D4AF37]" /><span className="font-bold">Horário:</span> {apt.startTime}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {apt.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // ✅ NOVO: Aba de Sugestões com respostas do admin
            <div className="space-y-6">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Minhas Sugestões</h2>
              {mySuggestions.length === 0 ? (
                <div className={`text-center py-20 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                  <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  <p className={`font-black uppercase text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>Nenhuma sugestão enviada</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {mySuggestions.map(sug => (
                    <div key={sug.id} className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-start gap-4">
                        <MessageSquare className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Enviado em {sug.date}</p>
                          <p className={`text-sm mb-4 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>{sug.text}</p>
                          
                          {sug.response ? (
                            <div className={`mt-4 p-4 rounded-2xl border ${theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="text-emerald-500" size={16} />
                                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-500'}`}>
                                  Resposta do Admin {sug.responseDate && `- ${sug.responseDate}`}
                                </p>
                              </div>
                              <p className={`text-sm ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-100'}`}>{sug.response}</p>
                            </div>
                          ) : (
                            <div className={`mt-4 p-4 rounded-2xl border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-amber-700' : 'text-amber-500'}`}>Aguardando resposta do administrador</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden ${theme === 'light' ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#050505] text-white'}`}>
      
      {/* HERO */}
      <section className={`relative min-h-[70vh] flex items-center border-b overflow-hidden ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/10'}`}>
        <div className="absolute inset-0 z-0">
          <img src={config.coverImage} className={`w-full h-full object-cover ${theme === 'light' ? 'opacity-10 grayscale' : 'opacity-20 grayscale'}`} alt="Cover" />
          <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-r from-white via-white/95 to-transparent' : 'bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent'}`}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl space-y-10">
            <div className="flex items-center gap-6">
              <img src={config.logo} className="w-32 h-32 rounded-[3rem] object-cover border-4 border-[#D4AF37]/40 shadow-2xl" alt={config.name} />
              <div>
                <h1 className={`text-6xl md:text-7xl font-black font-display italic leading-none mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h1>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Tradição & Modernidade</p>
              </div>
            </div>
            <p className={`text-xl leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{config.description}</p>
            <div className="flex flex-wrap gap-4">
              {/* ✅ CORREÇÃO: Link do Instagram */}
              <a href="https://www.instagram.com/srjosebarberpub/" target="_blank" rel="noopener noreferrer" className={`p-5 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}><Instagram size={24}/></a>
              {/* ✅ NOVO: Botão WhatsApp */}
              <a href="https://wa.me/5521964340031" target="_blank" rel="noopener noreferrer" className="p-5 rounded-2xl border bg-[#25D366] border-transparent text-white hover:bg-[#20BD5A] transition-all"><MessageSquare size={24}/></a>
              <a href={config.locationUrl} target="_blank" rel="noopener noreferrer" className={`p-5 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}><MapPin size={24}/></a>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Destaques</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Nossos rituais mais procurados</p>
            </div>
          </div>
          <div 
            ref={destaqueRef}
            onMouseDown={(e) => handleMouseDown(e, destaqueRef)}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={(e) => handleMouseMove(e, destaqueRef)}
            className="flex gap-6 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {sortedServicesForHighlights.slice(0, 6).map(svc => (
              <div key={svc.id} className={`flex-shrink-0 w-80 rounded-[2.5rem] overflow-hidden border group hover:border-[#D4AF37]/50 transition-all ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                {svc.image && (
                  <div className="relative h-64 overflow-hidden">
                    <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={svc.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white text-2xl font-black font-display italic mb-1">{svc.name}</h3>
                      <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">{svc.category}</p>
                    </div>
                  </div>
                )}
                <div className="p-6 space-y-6">
                  <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                  <div className="flex items-end justify-between pt-6 border-t border-white/10">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Investimento</p>
                      <p className={`text-3xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {svc.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => handleBookingStart(svc)} className="gradiente-ouro text-black px-8 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl hover:scale-105 transition-all">Reservar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ NOVO: Seção de Planos VIP */}
      {activePlans.length > 0 && (
        <section className={`py-20 border-b ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <Crown className="w-16 h-16 mx-auto mb-6 text-[#D4AF37]" />
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Planos VIP</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Benefícios exclusivos para você</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePlans.map(plan => (
                <div 
                  key={plan.id}
                  className={`relative rounded-[2.5rem] p-8 border-2 transition-all hover:scale-105 ${
                    plan.discount 
                      ? theme === 'light' ? 'bg-gradient-to-br from-amber-50 to-white border-amber-300' : 'bg-gradient-to-br from-[#D4AF37]/10 to-transparent border-[#D4AF37]'
                      : theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'
                  }`}
                >
                  {plan.discount && (
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-black">
                      {plan.discount}% OFF
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h3>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                      {plan.period === 'MENSAL' ? 'Plano Mensal' : 'Plano Anual'}
                    </p>
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className={`text-5xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {plan.price.toFixed(2)}</p>
                    <p className={`text-xs font-bold mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      por {plan.period === 'MENSAL' ? 'mês' : 'ano'}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {plan.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>{benefit}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleVipPlanClick(plan)}
                    className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all"
                  >
                    <MessageSquare size={16} />
                    Assinar Agora
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EXPERIÊNCIAS (SERVIÇOS) */}
      <section className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Experiências Completas</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Escolha seu ritual perfeito</p>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-[#D4AF37] text-black shadow-lg' : theme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{cat}</button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map(svc => (
              <div key={svc.id} className={`rounded-[2.5rem] overflow-hidden border group hover:border-[#D4AF37]/50 transition-all ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                {svc.image && (
                  <div className="relative h-56 overflow-hidden">
                    <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={svc.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-black font-display italic">{svc.name}</h3>
                    </div>
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Investimento</p>
                      <p className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {svc.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Duração</p>
                      <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>{svc.durationMinutes} min</p>
                    </div>
                  </div>
                  <button onClick={() => handleBookingStart(svc)} className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl hover:scale-105 transition-all">Reservar Agora</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROFISSIONAIS */}
      <section className={`py-20 border-b ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Mestres</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Especialistas em arte capilar</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionals.map(prof => (
              <div key={prof.id} className={`group text-center rounded-[2.5rem] p-8 border transition-all ${theme === 'light' ? 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <div className="relative inline-block mb-6 cursor-pointer" onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}>
                  <img src={prof.avatar} className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-all" alt={prof.name} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-[2.5rem] transition-all flex items-center justify-center">
                    <Sparkles className="opacity-0 group-hover:opacity-100 text-white" size={32} />
                  </div>
                </div>
                <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h3>
                <p className={`text-xs mb-6 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{prof.specialties.length} especialidades</p>
                <button onClick={() => handleLikeProfessional(prof.id)} className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                  <Heart size={16} className="text-[#D4AF37]" />
                  <span className="text-xs font-black">{prof.likes || 0} Curtidas</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUGESTÕES */}
      <section className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/10'}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Sua Opinião Importa</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Envie suas sugestões</p>
          </div>
          <div className={`rounded-[3rem] p-10 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
            <div className="space-y-6">
              <div className="space-y-4">
                <input type="text" placeholder="Seu nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className={`w-full border p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                <input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className={`w-full border p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
                <textarea rows={6} placeholder="Sua sugestão ou feedback..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className={`w-full border p-4 rounded-2xl outline-none resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <button onClick={handleSendSuggestion} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                <Send size={16} />
                Enviar Sugestão
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      <section className={`py-20 ${theme === 'light' ? 'bg-zinc-50' : 'bg-[#050505]'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>O que dizem sobre nós</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Experiências autênticas</p>
          </div>
          {config.reviews && config.reviews.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {config.reviews.slice(0, 6).map(rev => (
                <div key={rev.id} className={`rounded-[2.5rem] p-8 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex gap-1 mb-4">{Array.from({length: 5}).map((_, i) => <Star key={i} size={16} className={i < rev.rating ? 'text-[#D4AF37] fill-current' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-700'} />)}</div>
                  <p className={`text-sm mb-4 italic ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>"{rev.comment}"</p>
                  <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>— {rev.userName}</p>
                </div>
              ))}
            </div>
          )}
          <div className="text-center">
            <button onClick={() => setShowReviewModal(true)} className="gradiente-ouro text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all">Deixar Avaliação</button>
          </div>
        </div>
      </section>

      {/* MODAL DE AGENDAMENTO */}
      {view === 'BOOKING' && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            {success ? (
              <div className="p-20 text-center space-y-8 animate-in zoom-in-95">
                <div className="w-32 h-32 rounded-full bg-emerald-500/10 border-4 border-emerald-500 mx-auto flex items-center justify-center">
                  <Check size={64} className="text-emerald-500"/>
                </div>
                <div>
                  <h2 className={`text-4xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Ritual Agendado!</h2>
                  <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Você receberá uma confirmação em breve</p>
                </div>
              </div>
            ) : (
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agende sua Experiência</h2>
                  <button onClick={() => { setView('HOME'); setPasso(1); }} className={`p-3 rounded-xl transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-400 hover:text-white'}`}><X size={24}/></button>
                </div>

                <div className="flex items-center justify-between mb-10">
                  {[1,2,3,4].map(n => (
                    <React.Fragment key={n}>
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 font-black transition-all ${passo >= n ? 'bg-[#D4AF37] border-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-400' : 'bg-white/5 border-white/10 text-zinc-600'}`}>{n}</div>
                      {n < 4 && <div className={`flex-1 h-1 mx-2 ${passo > n ? 'bg-[#D4AF37]' : theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'}`}></div>}
                    </React.Fragment>
                  ))}
                </div>

                {bookingError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold">{bookingError}</div>}

                {passo === 1 && (
                  <div className="space-y-8 animate-in slide-in-from-right-2">
                    <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha o Ritual</h3>
                    <div className="grid gap-4 max-h-96 overflow-y-auto scrollbar-hide">
                      {services.map(svc => (
                        <button key={svc.id} onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }} className={`text-left p-6 rounded-2xl border-2 transition-all ${selecao.serviceId === svc.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'border-zinc-200 bg-white hover:border-zinc-300' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h4>
                              <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.durationMinutes} min</p>
                            </div>
                            <p className={`text-xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {svc.price.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {passo === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-2">
                    <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha o Barbeiro</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {professionals.map(prof => (
                        <button key={prof.id} onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }} className={`text-left p-6 rounded-2xl border-2 transition-all ${selecao.professionalId === prof.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'border-zinc-200 bg-white hover:border-zinc-300' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                          <div className="flex items-center gap-4">
                            <img src={prof.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={prof.name} />
                            <div>
                              <h4 className={`font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h4>
                              <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{prof.specialties.length} especialidades</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setPasso(1)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>← Voltar</button>
                  </div>
                )}

                {passo === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-2">
                    <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Data e Horário</h3>
                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {Array.from({length: 14}).map((_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().split('T')[0];
                        return (
                          <button key={i} onClick={() => setSelecao({...selecao, date: dateStr})} className={`py-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
                            <span className="text-[8px] font-black uppercase opacity-60">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            <span className="text-2xl font-black font-display">{d.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selecao.date && (
                      <div className="space-y-6">
                        {(Object.entries(turnos) as [string, string[]][]).map(([turno, horarios]) => (
                          <div key={turno} className="space-y-4">
                            <h4 className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-4 ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>{turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'} <div className={`h-px flex-1 ${theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'}`}></div></h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {horarios.map(t => {
                                const isOccupied = checkAvailability(selecao.date, t, selecao.professionalId);
                                return (
                                  <button key={t} disabled={isOccupied} onClick={() => { setSelecao({...selecao, time: t}); setPasso(4); }} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${isOccupied ? 'border-red-500/20 text-red-500/30 cursor-not-allowed bg-red-500/5' : selecao.time === t ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setPasso(2)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>← Voltar</button>
                  </div>
                )}

                {passo === 4 && (
                  <div className="space-y-8 animate-in slide-in-from-right-2 text-center">
                    <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Sua Identificação</h3>
                    <div className="space-y-4 max-w-sm mx-auto w-full">
                      <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="text" placeholder="Nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
                      <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
                      <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="email" placeholder="E-mail para identificação" value={selecao.clientEmail} onChange={e => setSelecao({...selecao, clientEmail: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
                    </div>
                    <button onClick={handleConfirmBooking} disabled={loading} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">
                      {loading ? 'Processando...' : 'Confirmar Ritual'}
                    </button>
                    <button onClick={() => setPasso(3)} className={`w-full px-6 py-3 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>← Voltar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AVALIAÇÃO */}
      {showReviewModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-8 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="text-center space-y-4">
              <MessageSquare className="w-12 h-12 text-[#D4AF37] mx-auto"/>
              <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Sua Experiência</h2>
            </div>
            <div className="space-y-8 text-center">
              <div className="flex justify-center gap-3">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`transition-all ${newReview.rating >= star ? 'text-[#D4AF37] scale-125' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    <Star size={32} fill={newReview.rating >= star ? 'currentColor' : 'none'}/>
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Seu nome" value={newReview.userName} onChange={e => setNewReview({...newReview, userName: e.target.value})} className={`w-full border p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white'}`} />
              <textarea rows={4} placeholder="Conte-nos como foi..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none font-medium transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowReviewModal(false)} className={`flex-1 py-5 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>Voltar</button>
              <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PROFISSIONAL */}
      {showProfessionalModal && selectedProfessional && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="relative h-96">
              <img src={selectedProfessional.avatar} className="w-full h-full object-contain bg-black" alt={selectedProfessional.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <button onClick={() => setShowProfessionalModal(false)} className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all"><X size={20} /></button>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-4xl font-black font-display italic text-white mb-2">{selectedProfessional.name}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Heart size={14} fill="currentColor" />
                    <span className="text-xs font-black">{selectedProfessional.likes || 0} curtidas</span>
                  </div>
                  <div className="text-white text-xs font-black uppercase tracking-widest">{selectedProfessional.workingHours.start} - {selectedProfessional.workingHours.end}</div>
                </div>
              </div>
            </div>
            <div className="p-10">
              {selectedProfessional.description ? (
                <>
                  <h3 className={`text-xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>História</h3>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{selectedProfessional.description}</p>
                </>
              ) : (
                <p className={`text-sm italic text-center py-6 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Este profissional ainda não compartilhou sua história.</p>
              )}
              <button onClick={() => setShowProfessionalModal(false)} className="w-full mt-8 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
