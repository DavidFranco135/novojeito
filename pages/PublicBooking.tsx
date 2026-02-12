import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Scissors, Star, MapPin, Instagram, MessageCircle, Heart, Send, Sparkles, Crown, Check, ChevronRight, MessageSquare } from 'lucide-react';
import { useBarberStore } from '../store';

interface PublicBookingProps {
  initialView?: 'HOME' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { 
    config, services, professionals, addAppointment, likeProfessional, 
    addSuggestion, addShopReview, user, appointments, suggestions, theme 
  } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'CLIENT_DASHBOARD'>(initialView);
  const [activeSection, setActiveSection] = useState<'appointments' | 'suggestions'>('appointments');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: user?.name || '',
    clientPhone: user?.phone || '',
    serviceId: '',
    professionalId: '',
    date: '',
    startTime: '09:00'
  });
  const [suggestionText, setSuggestionText] = useState('');
  const [reviewData, setReviewData] = useState({ userName: '', rating: 5, comment: '' });
  const [likedProf, setLikedProf] = useState<string[]>([]);

  // Popular nome e telefone automaticamente se usuário logado
  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      setFormData(prev => ({
        ...prev,
        clientName: user.name,
        clientPhone: user.phone || ''
      }));
    }
  }, [user]);

  const selectedService = useMemo(() => 
    services.find(s => s.id === formData.serviceId), 
    [formData.serviceId, services]
  );

  const availableTimes = useMemo(() => {
    const start = 8;
    const end = 20;
    const times = [];
    for (let h = start; h < end; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  }, []);

  const handleSubmitBooking = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.serviceId || !formData.professionalId || !formData.date) {
      alert('Preencha todos os campos');
      return;
    }
    
    try {
      const service = services.find(s => s.id === formData.serviceId);
      const professional = professionals.find(p => p.id === formData.professionalId);
      
      if (!service || !professional) return;
      
      const [h, m] = formData.startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + service.durationMinutes;
      const endTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
      
      await addAppointment({
        clientId: user?.id || `public_${Date.now()}`,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        serviceId: formData.serviceId,
        serviceName: service.name,
        professionalId: formData.professionalId,
        professionalName: professional.name,
        date: formData.date,
        startTime: formData.startTime,
        endTime,
        price: service.price
      }, true);
      
      alert('✅ Agendamento realizado com sucesso!');
      setStep(1);
      setFormData(prev => ({
        clientName: user?.name || '',
        clientPhone: user?.phone || '',
        serviceId: '',
        professionalId: '',
        date: '',
        startTime: '09:00'
      }));
    } catch (err) {
      alert('Erro ao agendar. Tente novamente.');
    }
  };

  const handleLikeProfessional = (profId: string) => {
    if (!likedProf.includes(profId)) {
      likeProfessional(profId);
      setLikedProf([...likedProf, profId]);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !formData.clientName || !formData.clientPhone) {
      alert('Preencha seu nome, telefone e a sugestão');
      return;
    }
    
    try {
      await addSuggestion({
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        text: suggestionText
      });
      alert('✅ Sugestão enviada com sucesso!');
      setSuggestionText('');
    } catch (err) {
      alert('Erro ao enviar sugestão.');
    }
  };

  const handleSendReview = async () => {
    if (!reviewData.userName || !reviewData.comment) {
      alert('Preencha todos os campos da avaliação');
      return;
    }
    
    try {
      await addShopReview(reviewData);
      alert('✅ Avaliação enviada com sucesso!');
      setReviewData({ userName: '', rating: 5, comment: '' });
    } catch (err) {
      alert('Erro ao enviar avaliação.');
    }
  };

  // Filtrar agendamentos e sugestões do usuário logado
  const myAppointments = useMemo(() => 
    user ? appointments.filter(a => a.clientPhone === user.phone) : [],
    [appointments, user]
  );

  const mySuggestions = useMemo(() =>
    user ? suggestions.filter(s => s.clientPhone === user.phone) : [],
    [suggestions, user]
  );

  // ✅ Função para enviar mensagem de plano VIP no WhatsApp
  const handleVipPlanClick = (plan: any) => {
    const message = `Olá! Gostaria de saber mais sobre o *${plan.name}* - ${plan.period === 'MENSAL' ? 'Mensal' : 'Anual'} por R$ ${plan.price.toFixed(2)}.`;
    const whatsappUrl = `https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // PORTAL DO MEMBRO (Cliente Logado)
  if (view === 'CLIENT_DASHBOARD' && user) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        {/* Header */}
        <header className={`border-b sticky top-0 z-50 backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-[#0A0A0A]/80 border-white/5'}`}>
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={config.logo} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4AF37]/40" alt="Logo" />
              <div>
                <h1 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Bem-vindo, {user.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className={`border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-6xl mx-auto px-6 flex gap-8">
            <button 
              onClick={() => setActiveSection('appointments')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeSection === 'appointments' 
                  ? 'border-[#D4AF37] text-[#D4AF37]' 
                  : theme === 'light' ? 'border-transparent text-zinc-500' : 'border-transparent opacity-40'
              }`}
            >
              Meus Agendamentos
            </button>
            <button 
              onClick={() => setActiveSection('suggestions')}
              className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeSection === 'suggestions' 
                  ? 'border-[#D4AF37] text-[#D4AF37]' 
                  : theme === 'light' ? 'border-transparent text-zinc-500' : 'border-transparent opacity-40'
              }`}
            >
              Minhas Sugestões
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          {activeSection === 'appointments' ? (
            <div className="space-y-6">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Meus Agendamentos
              </h2>
              
              {myAppointments.length === 0 ? (
                <div className={`text-center py-20 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                  <Calendar className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  <p className={`font-black uppercase text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
                    Nenhum agendamento encontrado
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myAppointments.map(apt => (
                    <div 
                      key={apt.id} 
                      className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${
                              apt.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' :
                              apt.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-500' :
                              apt.status === 'CANCELADO' ? 'bg-red-500/10 text-red-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {apt.status}
                            </div>
                          </div>
                          <h3 className={`text-lg font-black mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                            {apt.serviceName}
                          </h3>
                          <div className={`space-y-1 text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            <p className="flex items-center gap-2">
                              <User size={14} className="text-[#D4AF37]" />
                              <span className="font-bold">Barbeiro:</span> {apt.professionalName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#D4AF37]" />
                              <span className="font-bold">Data:</span> {new Date(apt.date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock size={14} className="text-[#D4AF37]" />
                              <span className="font-bold">Horário:</span> {apt.startTime}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                            R$ {apt.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Minhas Sugestões
              </h2>
              
              {mySuggestions.length === 0 ? (
                <div className={`text-center py-20 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                  <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  <p className={`font-black uppercase text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
                    Nenhuma sugestão enviada
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {mySuggestions.map(sug => (
                    <div 
                      key={sug.id} 
                      className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}
                    >
                      <div className="flex items-start gap-4">
                        <MessageSquare className="text-[#D4AF37] flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                            Enviado em {sug.date}
                          </p>
                          <p className={`text-sm mb-4 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            {sug.text}
                          </p>
                          
                          {sug.response ? (
                            <div className={`mt-4 p-4 rounded-2xl border ${theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="text-emerald-500" size={16} />
                                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-500'}`}>
                                  Resposta do Admin {sug.responseDate && `- ${sug.responseDate}`}
                                </p>
                              </div>
                              <p className={`text-sm ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-100'}`}>
                                {sug.response}
                              </p>
                            </div>
                          ) : (
                            <div className={`mt-4 p-4 rounded-2xl border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-amber-700' : 'text-amber-500'}`}>
                                Aguardando resposta do administrador
                              </p>
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

  // SITE PÚBLICO
  const activeServices = services.filter(s => s.status === 'ATIVO');
  const activePlans = config.vipPlans?.filter(p => p.status === 'ATIVO') || [];

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      {/* Hero */}
      <section className={`relative overflow-hidden border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
        <div className="absolute inset-0 z-0">
          <img 
            src={config.coverImage} 
            className={`w-full h-full object-cover ${theme === 'light' ? 'opacity-10 grayscale' : 'opacity-20 grayscale'}`} 
            alt="Cover" 
          />
          <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-b from-white/50 to-white' : 'bg-gradient-to-b from-[#0A0A0A]/50 to-[#0A0A0A]'}`}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <img 
              src={config.logo} 
              className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] object-cover border-4 border-[#D4AF37]/40 shadow-2xl" 
              alt="Logo" 
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-4xl md:text-6xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {config.name}
              </h1>
              <p className={`text-lg mb-8 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {config.description}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {/* ✅ Link do Instagram Corrigido */}
                <a 
                  href="https://www.instagram.com/srjosebarberpub/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <Instagram size={24} />
                </a>
                {/* ✅ Botão WhatsApp Adicionado */}
                <a 
                  href="https://wa.me/5521964340031" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border bg-[#25D366] border-transparent text-white hover:bg-[#20BD5A] transition-all"
                >
                  <MessageCircle size={24} />
                </a>
                <a 
                  href={config.locationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <MapPin size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Nossos Rituais
            </h2>
            <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
              Escolha sua experiência
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeServices.map(service => (
              <div 
                key={service.id} 
                className={`group rounded-[2.5rem] overflow-hidden border hover:border-[#D4AF37]/50 transition-all duration-500 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}
              >
                {service.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={service.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-black font-display italic">{service.name}</h3>
                    </div>
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                        Investimento
                      </p>
                      <p className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                        Duração
                      </p>
                      <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {service.durationMinutes} min
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ Seção de Planos VIP */}
      {activePlans.length > 0 && (
        <section id="planos-vip" className={`py-20 border-b ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/5'}`}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <Crown className="w-16 h-16 mx-auto mb-6 text-[#D4AF37]" />
              <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Planos VIP
              </h2>
              <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                Benefícios exclusivos para você
              </p>
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
                    <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                      {plan.period === 'MENSAL' ? 'Plano Mensal' : 'Plano Anual'}
                    </p>
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className={`text-5xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      R$ {plan.price.toFixed(2)}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      por {plan.period === 'MENSAL' ? 'mês' : 'ano'}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {plan.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleVipPlanClick(plan)}
                    className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all"
                  >
                    <MessageCircle size={16} />
                    Assinar Agora
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Profissionais */}
      <section id="profissionais" className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Nossos Mestres
            </h2>
            <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
              Equipe de especialistas
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionals.map(prof => (
              <div 
                key={prof.id} 
                className={`group text-center rounded-[2.5rem] p-8 border transition-all ${theme === 'light' ? 'bg-white border-zinc-200 hover:border-zinc-300' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              >
                <div className="relative inline-block mb-6">
                  <img 
                    src={prof.avatar} 
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-[#D4AF37]/40 mx-auto" 
                    alt={prof.name} 
                  />
                </div>
                <h3 className={`text-xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  {prof.name}
                </h3>
                <p className={`text-xs mb-6 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {prof.specialties.length} especialidades
                </p>
                <button
                  onClick={() => handleLikeProfessional(prof.id)}
                  disabled={likedProf.includes(prof.id)}
                  className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${
                    likedProf.includes(prof.id)
                      ? 'bg-red-500/10 border-red-500 text-red-500 cursor-not-allowed'
                      : theme === 'light' 
                        ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Heart size={16} className={likedProf.includes(prof.id) ? 'fill-current' : ''} />
                  <span className="text-xs font-black">{prof.likes} Curtidas</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agendamento */}
      <section id="agendar" className={`py-20 border-b ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/5'}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Agende sua Experiência
            </h2>
            <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
              Reserve seu horário em poucos passos
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black transition-all ${
                  step >= s 
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                    : theme === 'light' ? 'bg-white border-zinc-300 text-zinc-400' : 'bg-white/5 border-white/10 text-zinc-600'
                }`}>
                  {s}
                </div>
                {s < 4 && <ChevronRight className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'} />}
              </div>
            ))}
          </div>

          <div className={`rounded-[3rem] p-10 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
            {step === 1 && (
              <div className="space-y-6">
                <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Dados Pessoais
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp (21) 9xxxx-xxxx"
                    value={formData.clientPhone}
                    onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.clientName || !formData.clientPhone}
                  className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Escolha o Serviço
                </h3>
                <div className="grid gap-4">
                  {activeServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setFormData({...formData, serviceId: service.id})}
                      className={`text-left p-6 rounded-2xl border-2 transition-all ${
                        formData.serviceId === service.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : theme === 'light' ? 'border-zinc-200 bg-white hover:border-zinc-300' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                            {service.name}
                          </h4>
                          <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {service.durationMinutes} minutos
                          </p>
                        </div>
                        <p className={`text-xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                          R$ {service.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.serviceId}
                    className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Escolha o Barbeiro
                </h3>
                <div className="grid gap-4">
                  {professionals.map(prof => (
                    <button
                      key={prof.id}
                      onClick={() => setFormData({...formData, professionalId: prof.id})}
                      className={`text-left p-6 rounded-2xl border-2 transition-all ${
                        formData.professionalId === prof.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : theme === 'light' ? 'border-zinc-200 bg-white hover:border-zinc-300' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={prof.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={prof.name} />
                        <div>
                          <h4 className={`font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                            {prof.name}
                          </h4>
                          <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {prof.specialties.length} especialidades
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!formData.professionalId}
                    className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Data e Horário
                </h3>
                <div className="space-y-4">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                  <select
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    {availableTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                {selectedService && (
                  <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
                      Resumo do Agendamento
                    </h4>
                    <div className="space-y-2">
                      <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span className="font-black">Cliente:</span> {formData.clientName}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span className="font-black">Serviço:</span> {selectedService.name}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span className="font-black">Barbeiro:</span> {professionals.find(p => p.id === formData.professionalId)?.name}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span className="font-black">Data:</span> {formData.date ? new Date(formData.date).toLocaleDateString('pt-BR') : '-'}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span className="font-black">Horário:</span> {formData.startTime}
                      </p>
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <p className={`text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                          Total: R$ {selectedService.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={!formData.date}
                    className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Confirmar Agendamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sugestões */}
      <section id="sugestoes" className={`py-20 border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Envie sua Sugestão
            </h2>
            <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
              Sua opinião é importante
            </p>
          </div>

          <div className={`rounded-[3rem] p-10 border space-y-6 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
            <textarea
              placeholder="Digite sua sugestão aqui..."
              value={suggestionText}
              onChange={e => setSuggestionText(e.target.value)}
              rows={6}
              className={`w-full p-4 rounded-2xl border outline-none resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
            />
            <button
              onClick={handleSendSuggestion}
              className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Enviar Sugestão
            </button>
          </div>
        </div>
      </section>

      {/* Avaliações */}
      <section id="avaliacoes" className={`py-20 ${theme === 'light' ? 'bg-zinc-50' : 'bg-[#050505]'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              O que dizem sobre nós
            </h2>
            <p className={`text-sm uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>
              Avaliações dos clientes
            </p>
          </div>

          {config.reviews && config.reviews.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {config.reviews.slice(0, 6).map(review => (
                <div 
                  key={review.id} 
                  className={`rounded-[2.5rem] p-8 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < review.rating ? 'text-[#D4AF37] fill-current' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-700'} 
                      />
                    ))}
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    "{review.comment}"
                  </p>
                  <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    — {review.userName}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className={`rounded-[3rem] p-10 border max-w-2xl mx-auto ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Deixe sua Avaliação
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={reviewData.userName}
                onChange={e => setReviewData({...reviewData, userName: e.target.value})}
                className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
              />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setReviewData({...reviewData, rating})}
                    className="p-2"
                  >
                    <Star 
                      size={32} 
                      className={rating <= reviewData.rating ? 'text-[#D4AF37] fill-current' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-700'} 
                    />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Conte sua experiência..."
                value={reviewData.comment}
                onChange={e => setReviewData({...reviewData, comment: e.target.value})}
                rows={4}
                className={`w-full p-4 rounded-2xl border outline-none resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
              />
              <button
                onClick={handleSendReview}
                className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Enviar Avaliação
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicBooking;
