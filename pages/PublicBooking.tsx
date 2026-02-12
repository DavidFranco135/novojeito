import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, CheckCircle2
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client, Suggestion } from '../types';

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
    const selectedService = services.find(s => s.id === selecao.serviceId);
    const selectedProf = professionals.find(p => p.id === selecao.professionalId);

    if (!selectedService || !selectedProf) {
      setBookingError("Serviço ou profissional não encontrado");
      setLoading(false);
      return;
    }

    const durationMin = selectedService.durationMinutes;
    const [hour, min] = selecao.time.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hour, min + durationMin);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    const existingClient = clients.find(c => c.phone === selecao.clientPhone || c.email === selecao.clientEmail);
    let clientId = existingClient?.id;

    if (!existingClient) {
      try {
        const newClient = await addClient({
          name: selecao.clientName,
          phone: selecao.clientPhone,
          email: selecao.clientEmail,
          password: Math.random().toString(36).substring(7)
        } as any);
        clientId = newClient.id;
      } catch (err) {
        setBookingError("Erro ao registrar cliente");
        setLoading(false);
        return;
      }
    }

    try {
      await addAppointment({
        serviceId: selecao.serviceId,
        professionalId: selecao.professionalId,
        clientId: clientId!,
        clientName: selecao.clientName,
        clientPhone: selecao.clientPhone,
        date: selecao.date,
        startTime: selecao.time,
        endTime,
        serviceName: selectedService.name,
        professionalName: selectedProf.name,
        price: selectedService.price
      }, true);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setView('HOME'); setPasso(1); }, 4000);
    } catch (err) {
      setBookingError("Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = () => {
    const client = clients.find(c => (c.phone === loginIdentifier || c.email === loginIdentifier) && c.password === loginPassword);
    if (client) {
      setLoggedClient(client);
      setEditData({ name: client.name, phone: client.phone, email: client.email });
      setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
      setView('CLIENT_DASHBOARD');
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleUpdateProfile = async () => {
    if (!loggedClient) return;
    try {
      await updateClient(loggedClient.id, editData);
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar perfil");
    }
  };

  const handleAddSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    try {
      await addSuggestion({ clientName: loggedClient.name, clientPhone: loggedClient.phone, message: suggestionText });
      setSuggestionText('');
      alert("Sugestão enviada com sucesso! Obrigado.");
    } catch (err) {
      alert("Erro ao enviar sugestão");
    }
  };

  const handleAddReview = async () => {
    if (!newReview.comment.trim() || !newReview.userName || !newReview.clientPhone) {
      alert("Preencha todos os campos da avaliação.");
      return;
    }
    await addShopReview({ rating: newReview.rating, comment: newReview.comment, userName: newReview.userName, clientPhone: newReview.clientPhone });
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: loggedClient?.name || '', clientPhone: loggedClient?.phone || '' });
    alert("Avaliação enviada com sucesso!");
  };

  const handleLogout = () => {
    setLoggedClient(null);
    logout();
    setView('HOME');
  };

  const handleProfessionalClick = (prof: Professional) => {
    setSelectedProfessional(prof);
    setShowProfessionalModal(true);
  };

  if (view === 'CLIENT_DASHBOARD' && loggedClient) {
    const clientAppointments = appointments.filter(a => a.clientId === loggedClient.id);
    const vipPlans = config.vipPlans || [];

    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
              <p className={`text-xs font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Bem-vindo, {loggedClient.name}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('HOME')} className={`px-6 py-3 rounded-2xl border font-black text-xs uppercase transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/10 text-white hover:border-[#D4AF37]'}`}>Início</button>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-xs uppercase"><LogOut size={14} /> Sair</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#D4AF37] rounded-2xl flex items-center justify-center"><Calendar className="text-black" size={20} /></div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Agendamentos</p>
                  <p className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{clientAppointments.length}</p>
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center"><Check className="text-white" size={20} /></div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Concluídos</p>
                  <p className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{clientAppointments.filter(a => a.status === 'CONCLUIDO_PAGO' || a.status === 'CONCLUIDO').length}</p>
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center"><Clock className="text-white" size={20} /></div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Próximos</p>
                  <p className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{clientAppointments.filter(a => a.status === 'PENDENTE' || a.status === 'CONFIRMADO').length}</p>
                </div>
              </div>
            </div>
          </div>

          {vipPlans.length > 0 && (
            <div className="mb-12">
              <h2 className={`text-2xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Planos VIP Exclusivos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vipPlans.filter(plan => plan.status === 'ATIVO').map(plan => (
                  <div key={plan.id} className={`p-8 rounded-[2rem] border relative overflow-hidden ${theme === 'light' ? 'bg-white border-zinc-200 shadow-lg' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                    <div className="absolute top-4 right-4">
                      <Crown className="text-[#D4AF37]" size={24} />
                    </div>
                    <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-black text-[#D4AF37]">R$ {plan.price}</span>
                      <span className={`text-xs font-black uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>/{plan.period === 'MENSAL' ? 'mês' : 'ano'}</span>
                      {plan.discount && <span className="text-xs font-black text-emerald-500">-{plan.discount}%</span>}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          <CheckCircle2 size={16} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <button className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Assinar Plano</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <h2 className={`text-2xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meu Perfil</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Nome</label>
                  <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>WhatsApp</label>
                  <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>E-mail</label>
                  <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                </div>
                <button onClick={handleUpdateProfile} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"><Save size={14} /> Salvar Alterações</button>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <h2 className={`text-2xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Envie uma Sugestão</h2>
              <div className="space-y-4">
                <textarea rows={6} placeholder="Sua opinião é muito importante para nós..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className={`w-full border p-4 rounded-xl text-xs font-medium resize-none outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                <button onClick={handleAddSuggestion} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"><Send size={14} /> Enviar Feedback</button>
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meu Histórico</h2>
              <button onClick={() => { setView('BOOKING'); setPasso(1); }} className="gradiente-ouro text-black px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg">Novo Agendamento</button>
            </div>
            <div className="space-y-4">
              {clientAppointments.length === 0 && (
                <p className={`text-center py-12 text-sm italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Nenhum agendamento ainda.</p>
              )}
              {clientAppointments.map(apt => {
                const svc = services.find(s => s.id === apt.serviceId);
                const prof = professionals.find(p => p.id === apt.professionalId);
                return (
                  <div key={apt.id} className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{apt.serviceName}</h3>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${apt.status === 'PENDENTE' ? 'bg-yellow-500/10 text-yellow-500' : apt.status === 'CONFIRMADO' ? 'bg-blue-500/10 text-blue-500' : apt.status === 'CONCLUIDO' || apt.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{apt.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            <User size={14} className="text-[#D4AF37]" />
                            <span className="font-bold">{apt.professionalName}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            <Calendar size={14} className="text-[#D4AF37]" />
                            <span className="font-bold">{new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            <Clock size={14} className="text-[#D4AF37]" />
                            <span className="font-bold">{apt.startTime}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-[#D4AF37] ml-4">R$ {apt.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'HOME') {
    const servicosAgrupados = services.reduce((acc, svc) => {
      if (!acc[svc.category]) acc[svc.category] = [];
      acc[svc.category].push(svc);
      return acc;
    }, {} as Record<string, Service[]>);

    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="relative h-screen overflow-hidden">
          <img src={config.coverImage} className={`absolute inset-0 w-full h-full object-cover grayscale transition-all ${theme === 'light' ? 'opacity-10' : 'opacity-30'}`} alt="Barbearia" />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'light' ? 'from-transparent via-[#F8F9FA]/80 to-[#F8F9FA]' : 'from-transparent via-[#050505]/80 to-[#050505]'}`}></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 h-full flex flex-col justify-center items-start py-24">
            <div className="space-y-8 max-w-2xl">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30">
                <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
              </div>

              <div className="space-y-6">
                <h1 className={`text-5xl md:text-7xl font-black font-display italic tracking-tighter leading-none ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h1>
                <p className={`text-lg md:text-xl leading-relaxed max-w-xl ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{config.description}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button onClick={() => { setView('BOOKING'); setPasso(1); }} className="gradiente-ouro text-black px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">Agendar Ritual</button>
                <button onClick={() => setShowReviewModal(true)} className={`px-10 py-5 rounded-[2rem] border font-black uppercase tracking-widest text-xs transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-white hover:border-[#D4AF37]'}`}>Avaliar</button>
                {loggedClient ? (
                  <button onClick={() => setView('CLIENT_DASHBOARD')} className={`px-10 py-5 rounded-[2rem] border font-black uppercase tracking-widest text-xs transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-white hover:border-[#D4AF37]'}`}>Meu Portal</button>
                ) : (
                  <button onClick={() => setView('LOGIN')} className={`px-10 py-5 rounded-[2rem] border font-black uppercase tracking-widest text-xs transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 text-white hover:border-[#D4AF37]'}`}><Lock size={14} className="inline mr-2" />Login Membro</button>
                )}
              </div>

              <div className="flex items-center gap-6 pt-6">
                <a href={`https://instagram.com/${config.instagram?.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-[#D4AF37]'}`}><Instagram size={18} /> {config.instagram}</a>
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-[#D4AF37]'}`}><Phone size={18} /> WhatsApp</a>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-[#D4AF37] py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[length:24px_24px]"></div></div>
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black font-display italic text-black">Rituais em Destaque</h2>
            </div>
            <div ref={destaqueRef} onMouseDown={(e) => handleMouseDown(e, destaqueRef)} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={(e) => handleMouseMove(e, destaqueRef)} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none">
              {sortedServicesForHighlights.slice(0, 6).map(svc => (
                <div key={svc.id} onClick={() => handleBookingStart(svc)} className="min-w-[280px] md:min-w-[320px] p-8 bg-black rounded-[2rem] cursor-pointer hover:scale-105 transition-all shadow-2xl group">
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 bg-zinc-900">
                    <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt={svc.name} />
                  </div>
                  <h3 className="text-2xl font-black font-display italic text-white mb-2">{svc.name}</h3>
                  <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-[#D4AF37]">R$ {svc.price}</span>
                    <span className="text-xs font-black uppercase text-zinc-500">{svc.durationMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`py-24 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-12">
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Experiências dos Membros</h2>
            </div>
            <div ref={experienciaRef} onMouseDown={(e) => handleMouseDown(e, experienciaRef)} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={(e) => handleMouseMove(e, experienciaRef)} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none">
              {config.reviews && config.reviews.slice(0, 8).map((rev, idx) => (
                <div key={idx} className={`min-w-[320px] md:min-w-[400px] p-8 rounded-[2rem] border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-1 mb-4">{Array.from({length: 5}).map((_, i) => <Star key={i} size={16} className={i < rev.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-700'} />)}</div>
                  <p className={`text-sm leading-relaxed mb-6 italic ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>"{rev.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center font-black text-black text-sm">{rev.userName.charAt(0)}</div>
                    <div>
                      <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{rev.userName}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Membro</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`py-24 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <h2 className={`text-4xl md:text-5xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Mestres da Arte</h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Profissionais dedicados à excelência em cada corte, barba e ritual de cuidado masculino.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {professionals.map(prof => (
                <div key={prof.id} className={`rounded-[2rem] overflow-hidden border transition-all hover:border-[#D4AF37]/50 group cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-200 shadow-lg' : 'bg-white/5 border-white/5'}`}>
                  <div className="relative h-80 overflow-hidden bg-zinc-900" onClick={() => handleProfessionalClick(prof)}>
                    <img src={prof.avatar} className="w-full h-full object-contain group-hover:scale-105 transition-all" alt={prof.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-3xl font-black font-display italic text-white mb-2">{prof.name}</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Mestre Barbeiro</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        <Clock size={14} className="text-[#D4AF37]" />
                        <span className="text-xs font-black">{prof.workingHours.start} - {prof.workingHours.end}</span>
                      </div>
                      <button onClick={() => likeProfessional(prof.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'light' ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' : 'bg-white/5 hover:bg-white/10 text-zinc-400'}`}>
                        <Heart size={14} className="text-[#D4AF37]" fill="currentColor" />
                        <span className="text-xs font-black">{prof.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`py-24 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'}`}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className={`text-4xl md:text-5xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.aboutTitle || 'Nossa História'}</h2>
            <p className={`text-lg leading-relaxed mb-12 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{config.aboutText || 'Tradição e excelência desde 1995.'}</p>
            <div className={`p-12 rounded-[3rem] border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
              <MapPin className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
              <h3 className={`text-2xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Venha nos Visitar</h3>
              <p className={`text-sm mb-2 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{config.address}</p>
              <p className={`text-sm mb-6 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{config.city}, {config.state}</p>
              <a href={config.locationUrl} target="_blank" rel="noopener noreferrer" className="inline-block gradiente-ouro text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Ver no Mapa</a>
            </div>
          </div>
        </div>

        <footer className={`py-16 border-t ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                  <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
                </div>
                <div>
                  <p className={`font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</p>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>© 2024 Todos os direitos reservados.</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <a href={`https://instagram.com/${config.instagram?.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={`transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-[#D4AF37]'}`}><Instagram size={20} /></a>
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-[#D4AF37]'}`}><Phone size={20} /></a>
                <a href={`mailto:${config.email}`} className={`transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-[#D4AF37]'}`}><Mail size={20} /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-10 shadow-2xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
          <button onClick={() => setView('HOME')} className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}>
            <ChevronLeft size={20}/> Voltar
          </button>
          
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-3xl mx-auto overflow-hidden border-2 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/20">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div>
              <h1 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-2 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Acesse sua área exclusiva</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>E-mail ou WhatsApp</label>
              <input type="text" placeholder="seuemail@gmail.com ou (21)..." value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none transition-all font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Senha</label>
              <input type="password" placeholder="••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none transition-all font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
            </div>
            <button onClick={handleClientLogin} className="w-full gradiente-ouro text-black py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl">Acessar Portal</button>
          </div>

          <p className={`text-center text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Ainda não tem conta? Faça seu primeiro agendamento para se cadastrar.</p>
        </div>
      </div>
    );
  }

  if (view === 'BOOKING') {
    const selectedService = services.find(s => s.id === selecao.serviceId);
    const selectedProf = professionals.find(p => p.id === selecao.professionalId);

    if (success) {
      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
          <div className="text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Check size={48} className="text-white"/>
            </div>
            <div>
              <h2 className={`text-4xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Agendamento Confirmado!
              </h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Seu ritual foi agendado com sucesso. Até breve!
              </p>
            </div>
          </div>
        </div>
      );
    }

    const servicosAgrupados = services.reduce((acc, svc) => {
      if (!acc[svc.category]) acc[svc.category] = [];
      acc[svc.category].push(svc);
      return acc;
    }, {} as Record<string, Service[]>);

    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <button onClick={() => { setView('HOME'); setPasso(1); }} className={`flex items-center gap-2 mb-8 text-sm font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}>
            <ChevronLeft size={20}/> Voltar
          </button>

          <div className={`rounded-[3rem] p-8 md:p-12 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-xl' : 'bg-[#0F0F0F] border-white/5'}`}>
            <div className="mb-12">
              <h1 className={`text-3xl md:text-5xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {passo === 1 && 'Escolha seu Ritual'}
                {passo === 2 && 'Escolha seu Mestre'}
                {passo === 3 && 'Data e Horário'}
                {passo === 4 && 'Confirmação'}
              </h1>
              
              <div className="flex gap-2">
                {[1,2,3,4].map(step => (
                  <div key={step} className={`h-2 flex-1 rounded-full transition-all ${step <= passo ? 'bg-[#D4AF37]' : theme === 'light' ? 'bg-zinc-200' : 'bg-white/10'}`}/>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {passo === 1 && (
                <div className="space-y-6">
                  {Object.entries(servicosAgrupados).map(([categoria, svcs]) => (
                    <div key={categoria}>
                      <button onClick={() => toggleCategory(categoria)} className={`w-full flex items-center justify-between p-4 rounded-2xl border mb-4 transition-all ${expandedCategories.includes(categoria) ? 'bg-[#D4AF37] text-black border-transparent' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/10 text-white'}`}>
                        <span className="font-black uppercase text-xs tracking-widest">{categoria}</span>
                        <ChevronRight className={`transition-transform ${expandedCategories.includes(categoria) ? 'rotate-90' : ''}`}/>
                      </button>
                      
                      {expandedCategories.includes(categoria) && (
                        <div className="grid gap-4 animate-in slide-in-from-top-2">
                          {svcs.map(svc => (
                            <button key={svc.id} onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }} className={`p-6 rounded-2xl border text-left transition-all hover:border-[#D4AF37]/50 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className={`text-lg font-black font-display italic mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                                  <p className={`text-xs mb-3 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{svc.description}</p>
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-[#D4AF37]">R$ {svc.price}</span>
                                    <span className={`text-xs font-black uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{svc.durationMinutes} min</span>
                                  </div>
                                </div>
                                <ArrowRight className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}/>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {passo === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-2">
                  {professionals.map(prof => (
                    <button key={prof.id} onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }} className={`p-6 rounded-2xl border text-left transition-all hover:border-[#D4AF37]/50 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={prof.avatar} className="w-16 h-16 rounded-xl object-cover border-2 border-white/10" alt={prof.name}/>
                        <div>
                          <h3 className={`font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h3>
                          <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Mestre</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[#D4AF37]"/>
                          <span className={`text-xs font-black ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{prof.workingHours.start} - {prof.workingHours.end}</span>
                        </div>
                        <ArrowRight className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}/>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split('T')[0];
                      return (
                        <button key={i} onClick={() => setSelecao({...selecao, date: dateStr})} className={`p-4 rounded-2xl border text-center transition-all ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
