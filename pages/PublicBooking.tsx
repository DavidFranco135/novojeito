
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send
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
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // States para o portal do membro
  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

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

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);
  const filteredServices = useMemo(() => selectedCategory === 'Todos' ? services : services.filter(s => s.category === selectedCategory), [services, selectedCategory]);

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
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

  const [selecao, setSelecao] = useState({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });

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
    if(!loginIdentifier) return;
    const cleanId = loginIdentifier.toLowerCase().replace(/\D/g, '');
    const client = clients.find(c => c.email.toLowerCase() === loginIdentifier.toLowerCase() || c.phone.replace(/\D/g, '') === cleanId);
    
    if (client) {
      setLoggedClient(client);
      setEditData({ name: client.name, phone: client.phone, email: client.email });
      setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
      setView('CLIENT_DASHBOARD');
    } else {
      alert("Membro não encontrado. Verifique seu e-mail ou celular cadastrado.");
    }
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
        text: suggestionText
      });
      setSuggestionText('');
      alert("Obrigado pela sua sugestão! O admin recebeu seu feedback.");
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] animate-in zoom-in">
      <div className="cartao-vidro w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 border-[#D4AF37]/30">
        <div className="w-20 h-20 gradiente-ouro rounded-full mx-auto flex items-center justify-center"><Check className="w-10 h-10 text-black" /></div>
        <h2 className="text-3xl font-black font-display italic text-[#D4AF37]">Reserva Confirmada!</h2>
        <p className="text-zinc-500 text-sm">Aguardamos você para o seu ritual signature.</p>
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
            <div className="absolute top-6 right-6 z-[100]"><button onClick={() => setView('LOGIN')} className="bg-[#D4AF37] text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"><History size={16}/> PORTAL DO MEMBRO</button></div>
            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-20 h-20 rounded-[2rem] gradiente-ouro p-1 mx-auto mb-6"><div className="w-full h-full rounded-[1.8rem] bg-black overflow-hidden"><img src={config.logo} className="w-full h-full object-cover" alt="Logo" /></div></div>
               <h1 className="text-5xl md:text-7xl font-black font-display italic tracking-tight">{config.name}</h1>
               <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-3">{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             {/* 1. Destaques da Casa */}
             <section className="mb-20 pt-10">
                <h2 className="text-2xl font-black font-display italic mb-8 flex items-center gap-6">Destaques da Casa <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                   {services.slice(0, 6).map(svc => (
                     <div key={svc.id} className="snap-center flex-shrink-0 w-64 md:w-72 cartao-vidro rounded-[2.5rem] overflow-hidden group shadow-2xl border-white/5 hover:border-[#D4AF37]/30 transition-all">
                        <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" /></div>
                        <div className="p-6">
                           <h3 className="text-xl font-black font-display italic leading-tight">{svc.name}</h3>
                           <p className="text-[#D4AF37] text-[9px] font-black mt-2">R$ {svc.price.toFixed(2)} • {svc.durationMinutes} min</p>
                           <button onClick={() => handleBookingStart(svc)} className="w-full mt-6 gradiente-ouro text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">RESERVAR</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* 2. Nossos Rituais (Menu) */}
             <section className="mb-24" id="catalogo">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                   <h2 className="text-2xl font-black font-display italic flex items-center gap-6">Nossos Rituais <div className="h-1 w-10 gradiente-ouro opacity-10"></div></h2>
                   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-white/5 text-zinc-500'}`}>{cat}</button>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredServices.map(svc => (
                     <div key={svc.id} className="cartao-vidro p-5 rounded-[2rem] flex items-center gap-6 hover:border-[#D4AF37]/30 transition-all group">
                        <img src={svc.image} className="w-20 h-20 rounded-2xl object-cover bg-zinc-900 flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                           <h3 className="text-lg font-black font-display italic leading-none">{svc.name}</h3>
                           <p className="text-zinc-500 text-xs mt-2 line-clamp-1">{svc.description}</p>
                           <div className="flex gap-4 mt-3">
                              <span className="text-[#D4AF37] text-[9px] font-black">R$ {svc.price.toFixed(2)}</span>
                              <span className="text-zinc-500 text-[9px] font-black">{svc.durationMinutes} min</span>
                           </div>
                        </div>
                        <button onClick={() => handleBookingStart(svc)} className="bg-[#D4AF37]/10 text-[#D4AF37] p-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all"><ArrowRight size={18}/></button>
                     </div>
                   ))}
                </div>
             </section>

             {/* 3. A Experiência Signature (Galeria) */}
             <section className="mb-24">
                <h2 className="text-2xl font-black font-display italic mb-8 flex items-center gap-6">A Experiência Signature <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                   {(Array.isArray(config.gallery) ? config.gallery : []).map((img, i) => (
                     <div key={i} className="snap-center flex-shrink-0 w-80 md:w-[500px] h-64 md:h-80 rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl transition-all hover:scale-[1.02]">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                     </div>
                   ))}
                   {(!config.gallery || config.gallery.length === 0) && <p className="text-zinc-600 italic py-10">Em breve, novas fotos do nosso ambiente.</p>}
                </div>
             </section>

             {/* 4. Voz dos Membros (Avaliações) */}
             <section className="mb-24 py-10">
                <h2 className="text-2xl font-black font-display italic mb-10 flex items-center gap-6">Voz dos Membros <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                   {config.reviews?.length === 0 && <p className="text-zinc-600 italic py-10 text-center w-full">Aguardando seu feedback para brilhar aqui.</p>}
                   {config.reviews?.map((rev, i) => (
                      <div key={i} className="snap-center flex-shrink-0 w-80 cartao-vidro p-8 rounded-[2rem] border-white/5 relative group">
                         <div className="absolute -top-4 -left-4 w-10 h-10 gradiente-ouro rounded-full flex items-center justify-center text-black shadow-lg"><Quote size={18} fill="currentColor"/></div>
                         <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map(s => (
                               <Star key={s} size={14} fill={s <= rev.rating ? '#D4AF37' : 'none'} className={s <= rev.rating ? 'text-[#D4AF37]' : 'text-zinc-800'}/>
                            ))}
                         </div>
                         <p className="text-sm italic text-zinc-300 leading-relaxed mb-6">"{rev.comment}"</p>
                         <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{rev.userName}</span>
                            <span className="text-[9px] font-bold text-zinc-600">{rev.date}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* 5. Mestres Artífices (Equipe) */}
             <section className="mb-24">
                <h2 className="text-2xl font-black font-display italic mb-12 flex items-center gap-6">Mestres Artífices <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                   {professionals.map(p => (
                     <div key={p.id} className="text-center group">
                        <div className="relative mb-6 mx-auto w-32 h-32 md:w-44 md:h-44">
                           <img src={p.avatar} className="w-full h-full object-cover rounded-[2.5rem] border-4 border-white/5 group-hover:border-[#D4AF37] transition-all duration-500" alt={p.name} />
                           <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-rose-500 p-3 rounded-xl shadow-2xl flex items-center gap-2 border border-rose-100">
                              <Heart size={14} fill="currentColor" />
                              <span className="text-[10px] font-black">{p.likes || 0}</span>
                           </div>
                        </div>
                        <h4 className="text-xl font-black font-display italic mt-4">{p.name}</h4>
                        <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest mt-1">Especialista Signature</p>
                     </div>
                   ))}
                </div>
             </section>

             {/* 6. Nossa História (Sobre) */}
             <section className="mb-24 py-16 border-y border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                   <div className="space-y-8">
                      <div>
                        <h4 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mb-4">Tradição & Excelência</h4>
                        <h2 className="text-4xl md:text-5xl font-black font-display italic leading-tight">{config.aboutTitle}</h2>
                      </div>
                      <p className="text-zinc-500 leading-relaxed italic text-lg">{config.aboutText}</p>
                      <div className="flex items-center gap-10">
                         <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-zinc-600 mb-1">Inaugurado em</span><span className="text-xl font-black italic">1995</span></div>
                         <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-zinc-600 mb-1">Localização</span><span className="text-xl font-black italic">{config.city}</span></div>
                      </div>
                   </div>
                   <div className="aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                      <img src={config.loginBackground} className="w-full h-full object-cover grayscale opacity-60" alt="" />
                   </div>
                </div>
             </section>

          </main>
        </div>
      )}

      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in">
           <div className="cartao-vidro w-full max-w-md rounded-[3rem] p-12 space-y-10 border-[#D4AF37]/30 shadow-2xl relative">
              <button onClick={() => setView('HOME')} className="absolute top-8 left-8 text-zinc-600 hover:text-white"><ChevronLeft size={24}/></button>
              <div className="text-center space-y-4">
                 <div className="w-16 h-16 gradiente-ouro rounded-2xl mx-auto flex items-center justify-center"><User size={32} className="text-black"/></div>
                 <h2 className="text-3xl font-black font-display italic">Portal do Membro</h2>
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Identifique-se para acessar seu histórico</p>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">E-mail ou Celular</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18}/>
                      <input type="text" placeholder="email@exemplo.com ou (21)..." value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]"/>
                    </div>
                 </div>
                 <button onClick={handleLoginPortal} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">ENTRAR NO PORTAL</button>
              </div>
           </div>
        </div>
      )}

      {view === 'CLIENT_DASHBOARD' && loggedClient && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 pb-40 animate-in fade-in">
           <header className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-5">
                 <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden gradiente-ouro p-0.5 shadow-2xl">
                      <img src={loggedClient.avatar || `https://ui-avatars.com/api/?name=${loggedClient.name}&background=D4AF37&color=000`} className="w-full h-full object-cover rounded-[1.1rem]" alt="Profile" />
                    </div>
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl cursor-pointer transition-all">
                       <Upload className="text-[#D4AF37]" size={24}/>
                       <input type="file" accept="image/*" className="hidden" onChange={handleUpdateProfilePhoto}/>
                    </label>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black font-display italic tracking-tight">{loggedClient.name}</h2>
                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Seja bem-vindo de volta!</p>
                 </div>
              </div>
              <button onClick={handleLogout} className="p-4 bg-white/5 rounded-2xl text-zinc-500 hover:text-red-500 transition-all"><LogOut size={24}/></button>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="cartao-vidro p-8 rounded-[2.5rem] border-white/5 space-y-6">
                 <h3 className="text-xl font-black font-display italic flex items-center gap-3"><Star className="text-[#D4AF37]"/> Seu Feedback</h3>
                 {config.reviews?.some(r => r.clientPhone === loggedClient.phone) ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 font-black text-[10px] uppercase text-center">Sua avaliação está no site!</div>
                 ) : (
                    <button onClick={() => setShowReviewModal(true)} className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-black uppercase text-[10px]">AVALIAR BARBEARIA</button>
                 )}
                 <div className="pt-6 border-t border-white/5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Sugestão para o Admin</label>
                    <textarea rows={3} value={suggestionText} onChange={e => setSuggestionText(e.target.value)} placeholder="Como podemos melhorar seu ritual?" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#D4AF37] mb-4"/>
                    <button onClick={handleSendSuggestion} disabled={loading} className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2">
                       <Send size={14}/> ENVIAR SUGESTÃO
                    </button>
                 </div>
              </div>

              <div className="cartao-vidro p-8 rounded-[2.5rem] border-white/5 space-y-6">
                 <h3 className="text-xl font-black font-display italic flex items-center gap-3"><Heart className="text-[#D4AF37]"/> Curtir Barbeiro</h3>
                 <p className="text-zinc-500 text-xs italic">Deixe seu like para seus barbeiros favoritos:</p>
                 <div className="grid grid-cols-2 gap-4">
                    {professionals.map(p => (
                       <button key={p.id} onClick={() => { likeProfessional(p.id); alert(`Você curtiu o trabalho de ${p.name}!`); }} className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                          <img src={p.avatar} className="w-12 h-12 rounded-xl object-cover grayscale" alt="" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.name.split(' ')[0]}</span>
                          <Heart size={16} className="text-[#D4AF37]"/>
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black font-display italic flex items-center gap-3"><History size={24} className="text-[#D4AF37]"/> Histórico de Rituais</h3>
              <div className="space-y-4">
                 {appointments.filter(a => a.clientId === loggedClient.id || a.clientPhone === loggedClient.phone).length === 0 && <p className="text-center py-20 text-zinc-600 italic">Ainda não há agendamentos concluídos.</p>}
                 {appointments.filter(a => a.clientId === loggedClient.id || a.clientPhone === loggedClient.phone).map(app => (
                    <div key={app.id} className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4AF37]"><Scissors size={24}/></div>
                          <div>
                             <p className="text-lg font-black italic">{app.serviceName}</p>
                             <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{new Date(app.date).toLocaleDateString('pt-BR')} • {app.startTime} com {app.professionalName}</p>
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
           <header className="flex items-center gap-4 mb-10"><button onClick={() => setView('HOME')} className="p-3 rounded-xl border border-white/10 text-zinc-400"><ChevronLeft size={24}/></button><h2 className="text-3xl font-black font-display italic">Reservar Ritual</h2></header>
           
           <div className="cartao-vidro rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-[#D4AF37]/10 flex flex-col gap-10">
              {passo === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-2 text-center">
                  <h3 className="text-2xl font-black font-display italic">Escolha o Artífice</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {professionals.map(p => (
                       <button key={p.id} onClick={() => { setSelecao({...selecao, professionalId: p.id}); setPasso(3); }} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-[#D4AF37] transition-all flex flex-col items-center gap-4 group">
                          <div className="relative">
                             <img src={p.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-[#D4AF37]" alt="" />
                             <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-black text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                                <Heart size={8} fill="currentColor"/> {p.likes || 0}
                             </div>
                          </div>
                          <span className="text-[11px] font-black uppercase group-hover:text-[#D4AF37]">{p.name}</span>
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div className="text-center space-y-2"><h3 className="text-2xl font-black font-display italic">Data e Horário</h3></div>
                  {bookingError && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase text-center">{bookingError}</div>}
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                     {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => {
                       const d = new Date(); d.setDate(d.getDate() + i);
                       const dateStr = d.toISOString().split('T')[0];
                       return (
                         <button key={i} onClick={() => { setSelecao({...selecao, date: dateStr}); setBookingError(null); }} className={`snap-center flex-shrink-0 w-24 h-28 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent scale-105 shadow-xl' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}>
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
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-4">{turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'} <div className="h-px flex-1 bg-white/5"></div></h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {horarios.map(t => {
                               const isOccupied = checkAvailability(selecao.date, t, selecao.professionalId);
                               return (
                                 <button key={t} disabled={isOccupied} onClick={() => { setSelecao({...selecao, time: t}); setPasso(4); }} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${isOccupied ? 'border-red-500/20 text-red-500/30 cursor-not-allowed bg-red-500/5' : selecao.time === t ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
                  <h3 className="text-2xl font-black font-display italic">Sua Identificação</h3>
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                     <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="text" placeholder="Nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
                     <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
                     <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="email" placeholder="E-mail para identificação" value={selecao.clientEmail} onChange={e => setSelecao({...selecao, clientEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
           <div className="cartao-vidro w-full max-w-md rounded-[3rem] p-12 space-y-8 border-[#D4AF37]/30 shadow-2xl">
              <div className="text-center space-y-4">
                 <MessageSquare className="w-12 h-12 text-[#D4AF37] mx-auto"/>
                 <h2 className="text-3xl font-black font-display italic">Sua Experiência</h2>
              </div>
              <div className="space-y-8 text-center">
                 <div className="flex justify-center gap-3">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`transition-all ${newReview.rating >= star ? 'text-[#D4AF37] scale-125' : 'text-zinc-800'}`}>
                          <Star size={32} fill={newReview.rating >= star ? 'currentColor' : 'none'}/>
                       </button>
                    ))}
                 </div>
                 <textarea rows={4} placeholder="Conte-nos como foi..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-medium text-white focus:border-[#D4AF37]"/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-white/5 py-5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Voltar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
