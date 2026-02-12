import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, CheckCircle2
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
    setLoading(true);
    setBookingError(null);

    const agora = new Date();
    const [h, m] = selecao.time.split(':');
    const dataHora = new Date(`${selecao.date}T${h}:${m}`);

    if (dataHora < agora) {
      setBookingError("Você não pode agendar para uma data/hora passada.");
      setLoading(false);
      return;
    }

    const svc = services.find(s => s.id === selecao.serviceId);
    if (!svc) { setLoading(false); return; }

    const durationParts = (svc.duration || '30min').match(/(\d+)/);
    const duration = durationParts ? parseInt(durationParts[1]) : 30;

    const endHour = dataHora.getHours();
    const endMin = dataHora.getMinutes() + duration;
    const endDate = new Date(dataHora);
    endDate.setMinutes(endMin);

    const endTime = `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`;

    let cliente = clients.find(c => c.email === selecao.clientEmail || c.phone === selecao.clientPhone);

    if (!cliente) {
      const newClientId = `client_${Date.now()}`;
      cliente = {
        id: newClientId,
        name: selecao.clientName,
        email: selecao.clientEmail,
        phone: selecao.clientPhone,
        password: selecao.clientPhone,
        role: 'CLIENTE'
      };
      addClient(cliente);
    }

    const apptId = `appt_${Date.now()}`;
    addAppointment({
      id: apptId,
      clientId: cliente.id,
      clientName: cliente.name,
      clientPhone: cliente.phone,
      professionalId: selecao.professionalId,
      serviceId: selecao.serviceId,
      date: selecao.date,
      startTime: selecao.time,
      endTime,
      status: 'AGENDADO'
    });

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPasso(1);
        setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
        setView('HOME');
      }, 3000);
    }, 1500);
  };

  const handleLogin = () => {
    const c = clients.find(cl => (cl.email === loginIdentifier || cl.phone === loginIdentifier) && cl.password === loginPassword);
    if (!c) {
      alert("Credenciais inválidas.");
      return;
    }
    setLoggedClient(c);
    setEditData({ name: c.name, phone: c.phone, email: c.email });
    setNewReview(prev => ({ ...prev, userName: c.name, clientPhone: c.phone }));
    setView('CLIENT_DASHBOARD');
    setLoginIdentifier('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    setLoggedClient(null);
    logout();
    setView('HOME');
  };

  const handleAddReview = () => {
    if (newReview.rating < 1 || !newReview.comment.trim()) {
      alert("Por favor, escolha uma avaliação e escreva um comentário.");
      return;
    }
    const userName = loggedClient ? loggedClient.name : (newReview.userName.trim() || 'Anônimo');
    const clientPhone = loggedClient ? loggedClient.phone : newReview.clientPhone;
    
    addShopReview({
      id: `review_${Date.now()}`,
      userName,
      clientPhone,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0]
    });
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
    alert("Obrigado pelo seu feedback!");
  };

  const handleSendSuggestion = () => {
    if (!loggedClient) {
      alert("Você precisa estar logado para enviar sugestões.");
      return;
    }
    if (!suggestionText.trim()) {
      alert("Por favor, escreva uma sugestão.");
      return;
    }
    addSuggestion({
      id: `sug_${Date.now()}`,
      clientId: loggedClient.id,
      clientName: loggedClient.name,
      clientPhone: loggedClient.phone,
      message: suggestionText,
      date: new Date().toISOString().split('T')[0]
    });
    setSuggestionText('');
    alert("Sugestão enviada com sucesso!");
  };

  const handleUpdateClientData = () => {
    if (!loggedClient) return;
    if (!editData.name.trim() || !editData.phone.trim() || !editData.email.trim()) {
      alert("Preencha todos os campos.");
      return;
    }
    updateClient({ ...loggedClient, name: editData.name, phone: editData.phone, email: editData.email });
    setLoggedClient(prev => prev ? { ...prev, name: editData.name, phone: editData.phone, email: editData.email } : null);
    alert("Dados atualizados com sucesso!");
  };

  const clientAppointments = useMemo(() => {
    if (!loggedClient) return [];
    return appointments.filter(a => a.clientId === loggedClient.id).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [loggedClient, appointments]);

  return (
    <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-gradient-to-br from-gray-50 to-blue-50' : 'bg-zinc-950'}`}>
      {view === 'HOME' && (
        <div>
          <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b shadow-xl ${theme === 'light' ? 'bg-white/90 border-zinc-200' : 'bg-black/40 border-white/5'}`}>
            <div className="container mx-auto px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl gradiente-ouro flex items-center justify-center shadow-lg">
                    <Scissors className="text-black" size={24} />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-black font-display italic leading-none ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      {config?.shopName || 'Barbearia Luxo'}
                    </h1>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Premium Grooming</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  {loggedClient ? (
                    <>
                      <button onClick={() => setView('CLIENT_DASHBOARD')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        <User className="inline-block mr-2" size={14} />
                        Portal
                      </button>
                      <button onClick={handleLogout} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                        <LogOut size={14} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setView('LOGIN')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      Área do Membro
                    </button>
                  )}
                  <a 
                    href="https://wa.me/5521964340031?text=Olá!%20Gostaria%20de%20conhecer%20mais%20sobre%20o%20Plano%20VIP%20da%20barbearia." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg gradiente-ouro text-black hover:shadow-2xl"
                  >
                    <Crown className="inline-block mr-2" size={14} />
                    Plano VIP
                  </a>
                </div>
              </div>
            </div>
          </header>

          <section className={`pt-40 pb-32 relative overflow-hidden ${theme === 'light' ? '' : ''}`}>
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-20 left-10 w-96 h-96 bg-[#D4AF37] rounded-full blur-[150px]"></div>
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[150px]"></div>
            </div>
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-4xl mx-auto text-center space-y-10">
                <div className="space-y-6">
                  <h2 className={`text-6xl md:text-8xl font-black font-display italic leading-none ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    A Arte do <span className="gradiente-texto">Estilo</span>
                  </h2>
                  <p className={`text-lg md:text-xl max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Transforme sua imagem com maestria e exclusividade. Cada corte é uma obra de arte.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 justify-center">
                  <button onClick={() => setView('BOOKING')} className="gradiente-ouro text-black px-12 py-6 rounded-2xl font-black uppercase text-xs shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                    <Calendar size={20} />
                    Agendar Agora
                  </button>
                  <button onClick={() => setShowReviewModal(true)} className={`px-12 py-6 rounded-2xl font-black uppercase text-xs border-2 transition-all flex items-center gap-3 ${theme === 'light' ? 'border-zinc-300 text-zinc-700 hover:border-blue-500 hover:bg-blue-50' : 'border-white/20 text-white hover:border-[#D4AF37] hover:bg-white/5'}`}>
                    <Star size={20} />
                    Avaliar Serviço
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Redes Sociais */}
          <section className="py-16 container mx-auto px-6">
            <div className="max-w-md mx-auto">
              <div className={`rounded-3xl p-10 text-center space-y-8 shadow-xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
                <div className="space-y-3">
                  <h3 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Conecte-se</h3>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Siga nossa jornada e fique por dentro das novidades</p>
                </div>
                <div className="flex gap-4 justify-center">
                  {config?.instagram && (
                    <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full gradiente-ouro flex items-center justify-center text-black shadow-lg hover:scale-110 transition-all">
                      <Instagram size={20} />
                    </a>
                  )}
                  <a 
                    href="https://wa.me/5521964340031?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informações." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-full gradiente-ouro flex items-center justify-center text-black shadow-lg hover:scale-110 transition-all"
                  >
                    <MessageSquare size={20} />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Seção Serviços em Destaque */}
          <section className="py-20 container mx-auto px-6">
            <div className="mb-12 text-center space-y-4">
              <h2 className={`text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Serviços <span className="gradiente-texto">Exclusivos</span></h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Experimente o melhor em cuidado masculino</p>
            </div>
            
            <div 
              ref={destaqueRef}
              onMouseDown={(e) => handleMouseDown(e, destaqueRef)}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={(e) => handleMouseMove(e, destaqueRef)}
              className="flex gap-8 overflow-x-auto pb-8 cursor-grab active:cursor-grabbing scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sortedServicesForHighlights.slice(0, 6).map((svc) => (
                <div key={svc.id} className="min-w-[340px] snap-start">
                  <div className={`rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-all duration-300 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                    <div className="relative h-56">
                      <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 bg-[#D4AF37] text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                        {svc.category}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-black font-display italic text-white mb-2">{svc.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#D4AF37] font-black text-xl">R$ {svc.price.toFixed(2)}</span>
                          <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{svc.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                      <button onClick={() => handleBookingStart(svc)} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2">
                        Agendar Agora <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seção Nossos Mestres */}
          <section className="py-20 container mx-auto px-6">
            <div className="mb-12 text-center space-y-4">
              <h2 className={`text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos <span className="gradiente-texto">Mestres</span></h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Profissionais dedicados à excelência</p>
            </div>
            
            <div 
              ref={experienciaRef}
              onMouseDown={(e) => handleMouseDown(e, experienciaRef)}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={(e) => handleMouseMove(e, experienciaRef)}
              className="flex gap-8 overflow-x-auto pb-8 cursor-grab active:cursor-grabbing scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {professionals.map((prof) => (
                <div key={prof.id} className="min-w-[300px] snap-start">
                  <div className={`rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-all duration-300 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                    <div className="relative h-80">
                      <img src={prof.avatar} alt={prof.name} className="w-full h-full object-contain bg-black" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 space-y-3">
                        <h3 className="text-3xl font-black font-display italic text-white">{prof.name}</h3>
                        <div className="flex items-center gap-3 text-[#D4AF37]">
                          <Heart size={14} fill="currentColor" />
                          <span className="text-xs font-black">{prof.likes || 0} curtidas</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        {prof.workingHours.start} - {prof.workingHours.end}
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => likeProfessional(prof.id)} 
                          className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${theme === 'light' ? 'border-zinc-200 text-zinc-700 hover:border-red-400 hover:bg-red-50' : 'border-white/10 text-white hover:border-red-500/50 hover:bg-red-500/10'}`}
                        >
                          <Heart size={14} className="inline-block mr-2" />
                          Curtir
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProfessional(prof);
                            setShowProfessionalModal(true);
                          }}
                          className="flex-1 gradiente-ouro text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-lg"
                        >
                          <Quote size={14} className="inline-block mr-2" />
                          História
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Todos os Serviços */}
          <section className="py-20 container mx-auto px-6">
            <div className="mb-12 text-center space-y-4">
              <h2 className={`text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Catálogo <span className="gradiente-texto">Completo</span></h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Explore todos os nossos serviços premium</p>
            </div>

            <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'gradiente-ouro text-black shadow-lg' : theme === 'light' ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((svc) => (
                <div key={svc.id} className={`rounded-3xl overflow-hidden shadow-xl hover:scale-105 transition-all duration-300 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                  <div className="relative h-64">
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 bg-[#D4AF37] text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                      {svc.category}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black font-display italic text-white mb-2">{svc.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[#D4AF37] font-black text-xl">R$ {svc.price.toFixed(2)}</span>
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{svc.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                    <button onClick={() => handleBookingStart(svc)} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2">
                      Reservar <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className={`py-16 border-t ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-white/5'}`}>
            <div className="container mx-auto px-6 text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl gradiente-ouro flex items-center justify-center shadow-lg">
                  <Scissors className="text-black" size={20} />
                </div>
                <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  {config?.shopName || 'Barbearia Luxo'}
                </h3>
              </div>
              <div className={`flex items-center justify-center gap-2 text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                <MapPin size={14} className="text-[#D4AF37]" />
                {config?.address || 'Endereço da barbearia'}
              </div>
              <p className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                © 2024 {config?.shopName || 'Barbearia Luxo'}. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </div>
      )}

      {view === 'LOGIN' && (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'light' ? 'bg-gradient-to-br from-gray-50 to-blue-50' : 'bg-zinc-950'}`}>
          <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-10 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl gradiente-ouro flex items-center justify-center mx-auto shadow-lg">
                <Lock className="text-black" size={28} />
              </div>
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h2>
              <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Acesse sua área exclusiva</p>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                <input 
                  type="text" 
                  placeholder="E-mail ou Telefone" 
                  value={loginIdentifier} 
                  onChange={e => setLoginIdentifier(e.target.value)}
                  className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)}
                  className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:shadow-3xl transition-all">
                Entrar
              </button>
              <button onClick={() => setView('HOME')} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>
                Voltar
              </button>
            </div>

            <div className={`text-center pt-6 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
              <p className={`text-[10px] ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                Primeiro agendamento? Use seu telefone como senha para acessar.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'CLIENT_DASHBOARD' && loggedClient && (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gradient-to-br from-gray-50 to-blue-50' : 'bg-zinc-950'}`}>
          <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b shadow-xl ${theme === 'light' ? 'bg-white/90 border-zinc-200' : 'bg-black/40 border-white/5'}`}>
            <div className="container mx-auto px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl gradiente-ouro flex items-center justify-center shadow-lg">
                    <User className="text-black" size={20} />
                  </div>
                  <div>
                    <h1 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      Olá, {loggedClient.name}
                    </h1>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Membro VIP</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setView('HOME')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    Início
                  </button>
                  <button onClick={handleLogout} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-6 py-12 space-y-12">
            {/* Meus Dados */}
            <section className={`rounded-3xl p-10 shadow-xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="flex items-center gap-4 mb-8">
                <User className="text-[#D4AF37]" size={24} />
                <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meus Dados</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nome" 
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                  <input 
                    type="tel" 
                    placeholder="Telefone" 
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                    className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                  />
                </div>
                <div className="relative md:col-span-2">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    value={editData.email} 
                    onChange={e => setEditData({...editData, email: e.target.value})}
                    className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                  />
                </div>
              </div>
              <button onClick={handleUpdateClientData} className="mt-6 gradiente-ouro text-black px-8 py-4 rounded-xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2">
                <Save size={16} />
                Salvar Alterações
              </button>
            </section>

            {/* Meus Agendamentos */}
            <section className={`rounded-3xl p-10 shadow-xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="flex items-center gap-4 mb-8">
                <History className="text-[#D4AF37]" size={24} />
                <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meus Agendamentos</h2>
              </div>
              {clientAppointments.length === 0 ? (
                <p className={`text-center py-12 text-sm italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  Você ainda não possui agendamentos.
                </p>
              ) : (
                <div className="space-y-4">
                  {clientAppointments.map(appt => {
                    const svc = services.find(s => s.id === appt.serviceId);
                    const prof = professionals.find(p => p.id === appt.professionalId);
                    return (
                      <div key={appt.id} className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className={`text-lg font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                              {svc?.name || 'Serviço'}
                            </h3>
                            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                              com {prof?.name || 'Profissional'}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase ${
                            appt.status === 'AGENDADO' ? 'bg-green-500/20 text-green-500' :
                            appt.status === 'CANCELADO' ? 'bg-red-500/20 text-red-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {appt.status}
                          </div>
                        </div>
                        <div className="flex gap-6 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#D4AF37]" />
                            <span className={theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}>
                              {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#D4AF37]" />
                            <span className={theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}>
                              {appt.startTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Enviar Sugestão */}
            <section className={`rounded-3xl p-10 shadow-xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="flex items-center gap-4 mb-8">
                <Send className="text-[#D4AF37]" size={24} />
                <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Enviar Sugestão</h2>
              </div>
              <div className="space-y-6">
                <textarea 
                  rows={4} 
                  placeholder="Compartilhe suas ideias para melhorarmos..." 
                  value={suggestionText} 
                  onChange={e => setSuggestionText(e.target.value)}
                  className={`w-full border p-5 rounded-2xl outline-none font-medium transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}
                />
                <button onClick={handleSendSuggestion} className="gradiente-ouro text-black px-8 py-4 rounded-xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2">
                  <Send size={16} />
                  Enviar Sugestão
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {view === 'BOOKING' && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-2xl rounded-[3rem] shadow-2xl max-h-[90vh] overflow-y-auto ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className={`sticky top-0 z-10 backdrop-blur-2xl border-b p-8 ${theme === 'light' ? 'bg-white/95 border-zinc-200' : 'bg-black/40 border-white/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="text-[#D4AF37]" size={28} />
                  <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Novo Agendamento</h2>
                </div>
                <button onClick={() => { setView('HOME'); setPasso(1); setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' }); }} className={`p-3 rounded-full transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                  <X size={20} />
                </button>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-4 mt-8">
                {[1,2,3,4].map(step => (
                  <div key={step} className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${passo >= step ? 'gradiente-ouro text-black shadow-lg' : theme === 'light' ? 'bg-zinc-200 text-zinc-400' : 'bg-white/5 text-zinc-700'}`}>
                      {passo > step ? <Check size={16} /> : step}
                    </div>
                    {step < 4 && <div className={`h-px flex-1 ${passo > step ? 'bg-[#D4AF37]' : theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'}`}></div>}
                  </div>
                ))}
              </div>
            </div>

            {bookingError && (
              <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold">
                {bookingError}
              </div>
            )}

            {success && (
              <div className="p-16 text-center space-y-6 animate-in zoom-in-95">
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
                <h3 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agendamento Confirmado!</h3>
                <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Em breve você receberá a confirmação.</p>
              </div>
            )}

            <div className="p-10">
              {passo === 1 && (
                <div className="space-y-8 animate-in slide-in-from-left-2">
                  <h3 className={`text-2xl font-black font-display italic text-center ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha o Serviço</h3>
                  <div className="space-y-4">
                    {services.map(svc => (
                      <button key={svc.id} onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }} className={`w-full p-6 rounded-2xl border transition-all text-left ${selecao.serviceId === svc.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'border-zinc-200 bg-zinc-50 hover:border-blue-400' : 'border-white/10 bg-white/5 hover:border-[#D4AF37]/50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h4 className={`text-lg font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h4>
                            <p className={`text-[10px] ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{svc.description}</p>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <span className="text-[#D4AF37]">R$ {svc.price.toFixed(2)}</span>
                              <span className={theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}>{svc.duration}</span>
                            </div>
                          </div>
                          <ArrowRight className="text-[#D4AF37]" size={24} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {passo === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <h3 className={`text-2xl font-black font-display italic text-center ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha o Profissional</h3>
                  <div className="space-y-4">
                    {professionals.map(prof => (
                      <button key={prof.id} onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }} className={`w-full p-6 rounded-2xl border transition-all text-left ${selecao.professionalId === prof.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'border-zinc-200 bg-zinc-50 hover:border-blue-400' : 'border-white/10 bg-white/5 hover:border-[#D4AF37]/50'}`}>
                        <div className="flex items-center gap-6">
                          <img src={prof.avatar} alt={prof.name} className="w-16 h-16 rounded-xl object-contain bg-black" />
                          <div className="flex-1 space-y-2">
                            <h4 className={`text-lg font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h4>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-[#D4AF37]">
                                <Heart size={12} fill="currentColor" />
                                <span className="text-[10px] font-black">{prof.likes || 0}</span>
                              </div>
                              <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                {prof.workingHours.start} - {prof.workingHours.end}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="text-[#D4AF37]" size={24} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <h3 className={`text-2xl font-black font-display italic text-center ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha Data e Horário</h3>
                  <div className="grid grid-cols-7 gap-2 mb-8">
                    {Array.from({length: 14}, (_, i) => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split('T')[0];
                      return (
                        <button key={i} onClick={() => setSelecao({...selecao, date: dateStr})} className={`py-4 rounded-xl border text-center transition-all ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
               </div>
              )}
           </div>
        </div>
      )}

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
                 <textarea rows={4} placeholder="Conte-nos como foi..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none font-medium transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className={`flex-1 py-5 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>Voltar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}

      {showProfessionalModal && selectedProfessional && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
           <div className={`w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="relative h-96">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-contain bg-black" alt={selectedProfessional.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                 <button 
                   onClick={() => setShowProfessionalModal(false)} 
                   className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all"
                 >
                   <X size={20} />
                 </button>
                 <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-4xl font-black font-display italic text-white mb-2">{selectedProfessional.name}</h2>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 text-[#D4AF37]">
                          <Heart size={14} fill="currentColor" />
                          <span className="text-xs font-black">{selectedProfessional.likes || 0} curtidas</span>
                       </div>
                       <div className="text-white text-xs font-black uppercase tracking-widest">
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
