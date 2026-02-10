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
    if (checkAvailability(selecao.date, selecao.time, selecao.professionalId)) {
      setBookingError("Este horário acabou de ser ocupado. Por favor, escolha outro.");
      return;
    }

    setLoading(true);
    try {
      const client = await addClient({ name: selecao.clientName, phone: selecao.clientPhone, email: selecao.clientEmail });
      const serv = services.find(s => s.id === selecao.serviceId);
      const [h, m] = selecao.time.split(':').map(Number);
      const endTime = `${Math.floor((h * 60 + m + (serv?.durationMinutes || 30)) / 60).toString().padStart(2, '0')}:${((h * 60 + m + (serv?.durationMinutes || 30)) % 60).toString().padStart(2, '0')}`;
      await addAppointment({ clientId: client.id, clientName: client.name, clientPhone: client.phone, serviceId: selecao.serviceId, serviceName: serv?.name || '', professionalId: selecao.professionalId, professionalName: professionals.find(p => p.id === selecao.professionalId)?.name || '', date: selecao.date, startTime: selecao.time, endTime, price: serv?.price || 0 }, true);
      setSuccess(true);
    } catch (err) { alert("Erro ao agendar."); }
    finally { setLoading(false); }
  };

  const handleLoginPortal = () => {
    if(!loginIdentifier || !loginPassword) {
      alert("Preencha e-mail/celular e senha.");
      return;
    }
    const cleanId = loginIdentifier.toLowerCase().replace(/\D/g, '');
    const client = clients.find(c => c.email.toLowerCase() === loginIdentifier.toLowerCase() || c.phone.replace(/\D/g, '') === cleanId);
    
    if (client && client.password === loginPassword) {
      setLoggedClient(client);
      setEditData({ name: client.name, phone: client.phone, email: client.email });
      setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
      setView('CLIENT_DASHBOARD');
      setLoginPassword(''); // Limpa senha após login
    } else if (client && client.password !== loginPassword) {
      alert("Senha incorreta.");
    } else {
      alert("Membro não encontrado. Verifique seu e-mail ou celular cadastrado.");
    }
  };

  const handleLikeProfessional = async (profId: string) => {
    if (!loggedClient) {
      alert("Faça login para curtir um barbeiro.");
      return;
    }
    
    // Verifica se o cliente já curtiu este profissional
    const alreadyLiked = loggedClient.likedProfessionals?.includes(profId);
    
    if (alreadyLiked) {
      alert("Você já curtiu este barbeiro!");
      return;
    }
    
    // Adiciona like no store
    await likeProfessional(profId);
    
    // Atualiza lista de profissionais curtidos pelo cliente
    const updatedLikedProfessionals = [...(loggedClient.likedProfessionals || []), profId];
    await updateClient(loggedClient.id, { likedProfessionals: updatedLikedProfessionals });
    setLoggedClient({ ...loggedClient, likedProfessionals: updatedLikedProfessionals });
    
    alert("Curtida registrada com sucesso!");
  };

  const handleUpdateProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && loggedClient) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateClient(loggedClient.id, { avatar: base64 });
        setLoggedClient({ ...loggedClient, avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    setLoading(true);
    try {
      await addSuggestion({
        clientName: loggedClient.name,
        clientPhone: loggedClient.phone,
        text: suggestionText,
        date: new Date().toISOString()
      });
      setSuggestionText('');
      alert("Sugestão enviada com sucesso!");
    } catch (err) {
      alert("Erro ao enviar sugestão.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    if (!newReview.comment) return alert("Escreva um comentário!");
    if (config.reviews?.some(r => r.clientPhone === loggedClient?.phone)) {
        return alert("Você já deixou sua avaliação exclusiva!");
    }
    addShopReview(newReview);
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: loggedClient?.name || '', clientPhone: loggedClient?.phone || '' });
    alert("Obrigado pela sua avaliação!");
  };

  const handleLogout = () => {
    setLoggedClient(null);
    logout();
    setView('HOME');
  };

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center p-6 animate-in zoom-in ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <div className={`w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
        <div className="w-20 h-20 gradiente-ouro rounded-full mx-auto flex items-center justify-center"><Check className="w-10 h-10 text-black" /></div>
        <h2 className="text-3xl font-black font-display italic text-[#D4AF37]">Reserva Confirmada!</h2>
        <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Aguardamos você para o seu ritual signature.</p>
        <button onClick={() => window.location.reload()} className="bg-[#D4AF37] text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase">Voltar à Início</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col theme-transition ${theme === 'light' ? 'bg-[#F3F4F6] text-black' : 'bg-[#050505] text-white'}`}>
      {view === 'HOME' && (
        <div className="animate-in fade-in flex flex-col min-h-screen">
          <header className="relative h-[65vh] overflow-hidden flex flex-col items-center justify-center">
            <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Capa" />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-transparent' : 'from-[#050505] via-transparent to-transparent'}`}></div>
            <div className="absolute top-6 right-6 z-[100]"><button onClick={() => setView('LOGIN')} className="bg-[#D4AF37] text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"><History size={16}/> PORTAL DO MEMBRO</button></div>
            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-28 h-28 rounded-3xl gradiente-ouro p-1 mx-auto mb-6"><div className="w-full h-full rounded-[2.2rem] bg-black overflow-hidden"><img src={config.logo} className="w-full h-full object-cover" alt="Logo" /></div></div>
               <h1 className={`text-5xl md:text-7xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-white drop-shadow-lg' : 'text-white'}`}>{config.name}</h1>
               <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-3">{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             {/* 1. Destaques da Casa */}
             <section className="mb-20 pt-10">
                <h2 className={`text-2xl font-black font-display italic mb-8 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Destaques da Casa <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div 
                  ref={destaqueRef}
                  className="flex gap-4 overflow-x-auto pb-6 snap-x cursor-grab active:cursor-grabbing scrollbar-hide"
                  style={{ scrollBehavior: 'smooth' }}
                  onMouseDown={(e) => handleMouseDown(e, destaqueRef)}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={(e) => handleMouseMove(e, destaqueRef)}
                >
                   {services.slice(0, 6).map(svc => (
                     <div key={svc.id} className={`snap-center flex-shrink-0 w-64 md:w-72 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all ${theme === 'light' ? 'bg-white border border-zinc-200 hover:border-blue-300' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/30'}`}>
                        <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" /></div>
                        <div className="p-6">
                           <h3 className={`text-xl font-black font-display italic leading-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                           <p className={`text-[9px] font-black mt-2 ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>R$ {svc.price.toFixed(2)} • {svc.durationMinutes} min</p>
                           <button onClick={() => handleBookingStart(svc)} className="w-full mt-6 gradiente-ouro text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">RESERVAR</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* 2. Nossos Rituais - CATEGORIAS EXPANSÍVEIS */}
             <section className="mb-24" id="catalogo">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Todos os serviços <div className="h-1 w-10 gradiente-ouro opacity-10"></div></h2>
                </div>
                <div className="space-y-4">
                   {categories.filter(cat => cat !== 'Todos').map(cat => {
                     const categoryServices = services.filter(s => s.category === cat);
                     const isExpanded = expandedCategories.includes(cat);
                     
                     return (
                       <div key={cat} className={`rounded-2xl overflow-hidden transition-all ${theme === 'light' ? 'bg-white border border-zinc-200' : 'bg-white/5 border border-white/10'}`}>
                          {/* Header da Categoria */}
                          <button 
                            onClick={() => toggleCategory(cat)}
                            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
                          >
                             <span className={`text-lg font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{cat}</span>
                             <ChevronRight 
                               className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`} 
                               size={20}
                             />
                          </button>
                          
                          {/* Lista de Serviços Expansível */}
                          {isExpanded && (
                            <div className={`border-t animate-in slide-in-from-top-2 ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
                               {categoryServices.map(svc => (
                                 <div key={svc.id} className={`p-6 border-b last:border-b-0 flex items-center justify-between hover:bg-white/5 transition-all ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
                                    <div className="flex-1">
                                       <h4 className={`text-base font-bold mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h4>
                                       <p className={`text-xs mb-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                                       <div className="flex gap-4">
                                          <span className={`text-xs font-black ${theme === 'light' ? 'text-blue-600' : 'text-[#B8860B]'}`}>R$ {svc.price.toFixed(2)}</span>
                                          <span className={`text-xs font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{svc.durationMinutes} min</span>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => handleBookingStart(svc)} 
                                      className="ml-4 gradiente-ouro text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                                    >
                                       Agendar
                                    </button>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </section>

             {/* 3. A Experiência Signature (Galeria) */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-8 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>A Experiência Signature <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div 
                  ref={experienciaRef}
                  className="flex gap-4 overflow-x-auto pb-6 snap-x cursor-grab active:cursor-grabbing scrollbar-hide"
                  style={{ scrollBehavior: 'smooth' }}
                  onMouseDown={(e) => handleMouseDown(e, experienciaRef)}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={(e) => handleMouseMove(e, experienciaRef)}
                >
                   {(Array.isArray(config.gallery) ? config.gallery : []).map((img, i) => (
                     <div key={i} className={`snap-center flex-shrink-0 w-80 md:w-[500px] h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] ${theme === 'light' ? 'border-4 border-zinc-200' : 'border-4 border-white/5'}`}>
                        <img src={img} className="w-full h-full object-cover" alt="" />
                     </div>
                   ))}
                   {(!config.gallery || config.gallery.length === 0) && <p className={`italic py-10 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Em breve, novas fotos do nosso ambiente.</p>}
                </div>
             </section>

             {/* 4. Voz dos Membros (Avaliações) */}
             <section className="mb-24 py-10 -mx-6 px-6 bg-black">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 text-white`}>Voz dos Membros <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div 
                  ref={membroRef}
                  className="flex gap-6 overflow-x-auto pb-6 snap-x cursor-grab active:cursor-grabbing scrollbar-hide"
                  style={{ scrollBehavior: 'smooth' }}
                  onMouseDown={(e) => handleMouseDown(e, membroRef)}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={(e) => handleMouseMove(e, membroRef)}
                >
                   {config.reviews?.length === 0 && <p className={`italic py-10 text-center w-full text-zinc-500`}>Aguardando seu feedback para brilhar aqui.</p>}
                   {config.reviews?.map((rev, i) => (
                      <div key={i} className={`snap-center flex-shrink-0 w-80 p-8 rounded-[2rem] relative group cartao-vidro border-white/5`}>
                         <div className="absolute -top-4 -left-4 w-10 h-10 gradiente-ouro rounded-full flex items-center justify-center text-black shadow-lg"><Quote size={18} fill="currentColor"/></div>
                         <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map(s => (
                               <Star key={s} size={14} fill={s <= rev.rating ? '#D4AF37' : 'none'} className={s <= rev.rating ? 'text-[#D4AF37]' : 'text-zinc-800'}/>
                            ))}
                         </div>
                         <p className={`text-sm italic leading-relaxed mb-6 text-zinc-300`}>"{rev.comment}"</p>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                               <User size={18} className="text-[#D4AF37]"/>
                            </div>
                            <p className={`text-[10px] font-black text-white`}>{rev.userName}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* 5. Nossos Artífices */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Artífices <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {professionals.map(prof => (
                      <div key={prof.id} className={`rounded-[2rem] p-6 text-center space-y-4 group transition-all hover:scale-105 ${theme === 'light' ? 'bg-white border border-zinc-200 hover:border-blue-300' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/30'}`}>
                         <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <img 
                              src={prof.avatar} 
                              className="w-full h-full rounded-2xl object-cover border-2 border-[#D4AF37] cursor-pointer" 
                              alt="" 
                              onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}
                            />
                            <div className="absolute -right-10 top-1 text-red-500 text-xs font-black flex items-center gap-0.5 whitespace-nowrap">
                               <Heart size={12} fill="currentColor" /> <span className="text-red-500">{prof.likes || 0}</span>
                            </div>
                         </div>
                         <div>
                            <p className={`font-black text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</p>
                            <p className={`text-[8px] uppercase tracking-widest font-black mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{prof.specialty}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* 6. Onde Nos Encontrar */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Onde Nos Encontrar <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className={`rounded-[2.5rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'border border-zinc-200' : 'border border-white/5'}`}>
                   <div className="h-48 bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-all" onClick={() => config.locationUrl && window.open(config.locationUrl, '_blank')}>
                      {config.locationImage ? (
                        <img src={config.locationImage} className="w-full h-full object-cover" alt="Nossa localização" />
                      ) : (
                        <MapPin className="text-[#D4AF37]" size={48}/>
                      )}
                   </div>
                   <div className={`p-8 ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}>
                      <p className={`text-sm font-bold mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.address}</p>
                      <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{config.phone}</p>
                   </div>
                </div>
             </section>

             {/* 7. Redes Sociais */}
             <section className="mb-20 text-center">
                <h2 className={`text-2xl font-black font-display italic mb-10 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Conecte-se Conosco</h2>
                <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all">
                   <Instagram size={20}/> Siga no Instagram
                </a>
             </section>

             {/* 8. Quem Somos */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.aboutTitle || 'Quem Somos'} <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className={`rounded-[2.5rem] p-8 md:p-12 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
                   <div className="grid md:grid-cols-2 gap-8 items-center">
                      {config.aboutImage && (
                        <div className="h-64 md:h-80 rounded-2xl overflow-hidden">
                           <img src={config.aboutImage} className="w-full h-full object-cover" alt="Sobre nós" />
                        </div>
                      )}
                      <p className={`text-base leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                         {config.aboutText || 'Tradição, estilo e excelência em cada serviço. Nossa barbearia é mais que um lugar para cortar cabelo - é um espaço de encontro, cultura e cuidado pessoal.'}
                      </p>
                   </div>
                </div>
             </section>
          </main>

          <footer className={`py-10 text-center border-t ${theme === 'light' ? 'border-zinc-200 bg-zinc-50 text-zinc-600' : 'border-white/5 bg-white/[0.01] text-zinc-600'}`}>
             <p className="text-[10px] font-black uppercase tracking-widest">© 2025 {config.name}. Todos os direitos reservados.</p>
          </footer>
        </div>
      )}

      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in">
           <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-10 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/20'}`}>
              <div className="text-center space-y-4">
                 <div className="w-16 h-16 rounded-2xl gradiente-ouro p-1 mx-auto"><div className="w-full h-full rounded-[1.8rem] bg-black overflow-hidden flex items-center justify-center"><Lock className="text-[#D4AF37]" size={24}/></div></div>
                 <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h2>
                 <p className={`text-[10px] uppercase tracking-widest font-black ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Acesse com seu e-mail ou celular</p>
              </div>
              <div className="space-y-6">
                 <input type="text" placeholder="E-mail ou WhatsApp" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                 <input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                 <button onClick={handleLoginPortal} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all">ACESSAR PORTAL</button>
              </div>
              <button onClick={() => setView('HOME')} className={`w-full text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-600 hover:text-[#D4AF37]'}`}>Voltar ao Início</button>
           </div>
        </div>
      )}

      {view === 'CLIENT_DASHBOARD' && loggedClient && (
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 pb-20 animate-in fade-in">
           <div className="flex items-center justify-between mb-10">
              <h1 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meu Portal</h1>
              <button onClick={handleLogout} className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}>
                 <LogOut size={16}/> Sair
              </button>
           </div>

           <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className={`md:col-span-1 rounded-[2rem] p-8 text-center space-y-6 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
                 <div className="relative inline-block">
                    <img src={loggedClient.avatar || 'https://via.placeholder.com/120'} className="w-28 h-28 rounded-3xl object-cover border-4 border-[#D4AF37]" alt="" />
                    <label className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-black p-2 rounded-xl cursor-pointer hover:scale-110 transition-all shadow-lg">
                       <Upload size={14}/>
                       <input type="file" accept="image/*" onChange={handleUpdateProfilePhoto} className="hidden"/>
                    </label>
                 </div>
                 <div>
                    <p className={`text-xl font-black font-display ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{loggedClient.name}</p>
                    <p className={`text-[9px] uppercase tracking-widest font-black mt-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Membro Exclusivo</p>
                 </div>
                 <div className={`space-y-2 text-left ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    <p className="text-xs flex items-center gap-2"><Phone size={12} className="text-[#D4AF37]"/> {loggedClient.phone}</p>
                    <p className="text-xs flex items-center gap-2"><Mail size={12} className="text-[#D4AF37]"/> {loggedClient.email}</p>
                 </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                 <div className={`rounded-[2rem] p-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
                    <h3 className={`text-lg font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Enviar Sugestão</h3>
                    <textarea rows={4} placeholder="Conte-nos suas ideias..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className={`w-full border p-4 rounded-xl outline-none text-sm ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}/>
                    <button onClick={handleSendSuggestion} disabled={loading} className="mt-4 w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] shadow-xl">
                       {loading ? 'Enviando...' : <><Send size={14} className="inline mr-2"/> Enviar Sugestão</>}
                    </button>
                 </div>

                 <div className={`rounded-[2rem] p-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
                    <h3 className={`text-lg font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Avaliar Experiência</h3>
                    <button onClick={() => setShowReviewModal(true)} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] shadow-xl">
                       <Star size={14} className="inline mr-2"/> Deixar Avaliação
                    </button>
                 </div>
              </div>
           </div>

           {/* Curtir Barbeiros */}
           <div className={`rounded-[2rem] p-8 mb-10 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
              <h3 className={`text-lg font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Barbeiros</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {professionals.map(prof => {
                    const isLiked = loggedClient.likedProfessionals?.includes(prof.id);
                    return (
                      <div key={prof.id} className={`rounded-2xl p-4 text-center space-y-3 transition-all ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/10'}`}>
                         <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                            <img 
                              src={prof.avatar} 
                              className="w-full h-full rounded-xl object-cover border-2 border-[#B8860B] cursor-pointer" 
                              alt="" 
                              onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}
                            />
                            <div className="absolute -right-8 top-0.5 text-red-500 text-[8px] font-black flex items-center gap-0.5 whitespace-nowrap">
                               <Heart size={8} fill="currentColor"/> <span className="text-red-500">{prof.likes || 0}</span>
                            </div>
                         </div>
                         <div>
                            <p className={`font-bold text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</p>
                            <p className={`text-[8px] uppercase tracking-widest font-black mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{prof.specialty}</p>
                         </div>
                         <button 
                           onClick={() => handleLikeProfessional(prof.id)} 
                           disabled={isLiked}
                           className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                             isLiked 
                               ? 'bg-emerald-500 text-white cursor-not-allowed' 
                               : 'gradiente-ouro text-black hover:scale-105'
                           }`}
                         >
                            {isLiked ? (
                              <><Check size={10} className="inline mr-1"/> Curtido</>
                            ) : (
                              <><Heart size={10} className="inline mr-1"/> Curtir</>
                            )}
                         </button>
                      </div>
                    );
                 })}
              </div>
           </div>

           <div className={`rounded-[2rem] p-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
              <h3 className={`text-lg font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Meus Agendamentos</h3>
              <div className="space-y-4">
                 {appointments.filter(a => a.clientPhone === loggedClient.phone).length === 0 && (
                    <p className={`text-center py-10 italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Nenhum agendamento ainda.</p>
                 )}
                 {appointments.filter(a => a.clientPhone === loggedClient.phone).map(app => (
                    <div key={app.id} className={`flex items-center justify-between p-5 rounded-2xl transition-all ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'}`}>
                             {app.status === 'CONCLUIDO_PAGO' ? <Check size={20}/> : <Calendar size={20}/>}
                          </div>
                          <div>
                             <p className={`text-lg font-black italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.serviceName}</p>
                             <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{new Date(app.date).toLocaleDateString('pt-BR')} • {app.startTime} com {app.professionalName}</p>
                          </div>
                       </div>
                       <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'}`}>
                          {app.status.replace('_', ' ')}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {view === 'BOOKING' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 pb-20 animate-in fade-in">
           <header className="flex items-center gap-4 mb-10">
             <button onClick={() => setView('HOME')} className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}><ChevronLeft size={24}/></button>
             <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Reservar Ritual</h2>
           </header>
           
           <div className={`rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col gap-10 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/10'}`}>
              {passo === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-2 text-center">
                  <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha o Artífice</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {professionals.map(p => (
                       <button key={p.id} onClick={() => { setSelecao({...selecao, professionalId: p.id}); setPasso(3); }} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 group ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 hover:border-blue-400' : 'bg-white/5 border-white/5 hover:border-[#D4AF37]'}`}>
                          <div className="relative">
                             <img src={p.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-[#D4AF37]" alt="" />
                             <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-black text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                                <Heart size={8} fill="currentColor"/> {p.likes || 0}
                             </div>
                          </div>
                          <span className={`text-[11px] font-black uppercase group-hover:text-[#D4AF37] ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{p.name}</span>
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div className="text-center space-y-2"><h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Data e Horário</h3></div>
                  {bookingError && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase text-center">{bookingError}</div>}
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                     {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => {
                       const d = new Date(); d.setDate(d.getDate() + i);
                       const dateStr = d.toISOString().split('T')[0];
                       return (
                         <button key={i} onClick={() => { setSelecao({...selecao, date: dateStr}); setBookingError(null); }} className={`snap-center flex-shrink-0 w-24 h-28 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent scale-105 shadow-xl' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}>
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

      {/* Modal de História do Barbeiro */}
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
