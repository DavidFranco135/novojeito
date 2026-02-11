import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, Gift
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client, VipPlan } from '../types';

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

  const [suggestionText, setSuggestionText] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // Lógica de Scroll e Drag para os Destaques
  const destaqueRef = React.useRef<HTMLDivElement>(null);
  const experienciaRef = React.useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) setLoggedClient(client);
    }
  }, [user, clients]);

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
  };

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone) {
      alert("Por favor, preencha todos os dados.");
      return;
    }
    setLoading(true);
    try {
      const client = await addClient({ name: selecao.clientName, phone: selecao.clientPhone, email: selecao.clientEmail || '' });
      const serv = services.find(s => s.id === selecao.serviceId);
      const [h, m] = selecao.time.split(':').map(Number);
      const endTime = `${Math.floor((h * 60 + m + (serv?.durationMinutes || 30)) / 60).toString().padStart(2, '0')}:${((h * 60 + m + (serv?.durationMinutes || 30)) % 60).toString().padStart(2, '0')}`;
      
      await addAppointment({ 
        clientId: client.id, clientName: client.name, clientPhone: client.phone, 
        serviceId: selecao.serviceId, serviceName: serv?.name || '', 
        professionalId: selecao.professionalId, professionalName: professionals.find(p => p.id === selecao.professionalId)?.name || '', 
        date: selecao.date, startTime: selecao.time, endTime, price: serv?.price || 0 
      }, true);
      setSuccess(true);
    } catch (err) { alert("Erro ao agendar."); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center p-6 animate-in zoom-in ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <div className={`w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
        <div className="w-20 h-20 gradiente-ouro rounded-full mx-auto flex items-center justify-center"><Check className="w-10 h-10 text-black" /></div>
        <h2 className="text-3xl font-black italic text-[#D4AF37]">Reserva Confirmada!</h2>
        <button onClick={() => window.location.reload()} className="bg-[#D4AF37] text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase">Voltar ao Início</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-[#F3F4F6] text-black' : 'bg-[#050505] text-white'}`}>
      
      {view === 'HOME' && (
        <div className="animate-in fade-in flex flex-col min-h-screen">
          {/* HEADER */}
          <header className="relative h-[65vh] overflow-hidden flex flex-col items-center justify-center">
            <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Capa" />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA]' : 'from-[#050505]'} via-transparent to-transparent`}></div>
            <div className="absolute top-6 right-6 z-[100]">
              <button onClick={() => setView('LOGIN')} className="bg-[#D4AF37] text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105">
                <History size={16}/> PORTAL DO MEMBRO
              </button>
            </div>
            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-28 h-28 rounded-3xl gradiente-ouro p-1 mx-auto mb-6"><div className="w-full h-full rounded-[2.2rem] bg-black overflow-hidden"><img src={config.logo} className="w-full h-full object-cover" alt="Logo" /></div></div>
               <h1 className="text-5xl md:text-7xl font-black italic tracking-tight text-white">{config.name}</h1>
               <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-3">{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             
             {/* 1. DESTAQUES */}
             <section className="mb-20 pt-10">
                <h2 className="text-2xl font-black italic mb-8 flex items-center gap-6">Destaques da Casa <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div ref={destaqueRef} className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                   {sortedServicesForHighlights.map(svc => (
                     <div key={svc.id} className={`snap-center flex-shrink-0 w-64 md:w-72 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all ${theme === 'light' ? 'bg-white border' : 'cartao-vidro border-white/5'}`}>
                        <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" /></div>
                        <div className="p-6">
                           <h3 className="text-xl font-black italic leading-tight">{svc.name}</h3>
                           <p className="text-xl font-black mt-2 text-[#D4AF37]">R$ {svc.price.toFixed(2)}</p>
                           <button onClick={() => handleBookingStart(svc)} className="w-full mt-6 gradiente-ouro text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">RESERVAR</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* 2. QUEM SOMOS (RESTAURADO) */}
             <section className="mb-24">
                <div className={`rounded-[3rem] overflow-hidden border ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-white/10'}`}>
                   <div className="grid md:grid-cols-2">
                      <div className="h-80 md:h-auto overflow-hidden">
                         <img src={config.aboutImage} className="w-full h-full object-cover" alt="Sobre Nós" />
                      </div>
                      <div className="p-10 md:p-16 flex flex-col justify-center space-y-6">
                         <h2 className="text-4xl font-black italic text-[#D4AF37]">{config.aboutTitle}</h2>
                         <p className="text-lg leading-relaxed opacity-80">{config.aboutText}</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* 3. RITUAIS / SERVIÇOS */}
             <section className="mb-24">
                <h2 className="text-2xl font-black italic mb-10 flex items-center gap-6">Nossos Rituais <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="space-y-4">
                   {Array.from(new Set(services.map(s => s.category))).map(cat => (
                     <div key={cat} className={`rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-white border' : 'bg-white/5 border border-white/10'}`}>
                        <button onClick={() => setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className="w-full p-6 flex items-center justify-between">
                           <span className="text-lg font-black">{cat}</span>
                           <ChevronRight className={`transition-transform ${expandedCategories.includes(cat) ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedCategories.includes(cat) && (
                          <div className="border-t border-white/10">
                             {services.filter(s => s.category === cat).map(svc => (
                               <div key={svc.id} className="p-6 flex items-center justify-between hover:bg-white/5">
                                  <div><p className="font-bold">{svc.name}</p><p className="text-xl font-black text-[#D4AF37]">R$ {svc.price.toFixed(2)}</p></div>
                                  <button onClick={() => handleBookingStart(svc)} className="gradiente-ouro text-black px-6 py-2 rounded-xl text-[9px] font-black uppercase">Agendar</button>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                   ))}
                </div>
             </section>

             {/* 4. PLANOS VIP */}
             {config.vipPlans && config.vipPlans.length > 0 && (
                <section className="mb-24">
                  <h2 className="text-2xl font-black italic mb-10 flex items-center gap-6">Planos VIP <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {config.vipPlans.filter(p => p.active).map(plan => (
                      <div key={plan.id} className={`p-8 rounded-[2.5rem] relative overflow-hidden group border transition-all ${theme === 'light' ? 'bg-white' : 'cartao-vidro border-white/10'}`}>
                        <Crown className="absolute top-4 right-4 text-[#D4AF37] opacity-20" size={40}/>
                        <h3 className="text-2xl font-black italic mb-2">{plan.name}</h3>
                        <p className="text-3xl font-black text-[#D4AF37] mb-6">R$ {plan.price.toFixed(2)}</p>
                        <ul className="space-y-3 mb-8">
                          {plan.benefits.map((b, i) => (<li key={i} className="flex items-center gap-3 text-sm text-zinc-400"><Check size={14} className="text-[#D4AF37]"/> {b}</li>))}
                        </ul>
                        <button onClick={() => setView('LOGIN')} className="w-full py-4 rounded-xl gradiente-ouro text-black font-black text-[9px] uppercase">Tornar-se Membro</button>
                      </div>
                    ))}
                  </div>
                </section>
             )}

             {/* 5. REDES SOCIAIS (CORRIGIDO) */}
             <section className="mb-20 text-center">
                <h2 className="text-2xl font-black italic mb-10">Conecte-se Conosco</h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <a 
                    href="https://www.instagram.com/srjosebarberpub/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all"
                  >
                    <Instagram size={20}/> Instagram
                  </a>
                  <a 
                    href="https://wa.me/5521964340031" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-3 bg-[#25D366] text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all"
                  >
                    <MessageSquare size={20}/> WhatsApp
                  </a>
                </div>
             </section>

             {/* 6. ARTÍFICES */}
             <section className="mb-24">
                <h2 className="text-2xl font-black italic mb-10 flex items-center gap-6">Nossos Artífices <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {professionals.map(prof => (
                      <div key={prof.id} className={`rounded-[2rem] p-6 text-center space-y-4 group transition-all hover:scale-105 ${theme === 'light' ? 'bg-white border' : 'cartao-vidro border-white/5'}`}>
                         <img src={prof.avatar} className="w-24 h-24 rounded-2xl mx-auto object-cover border-2 border-[#D4AF37] cursor-pointer" alt="" onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }} />
                         <div><p className="font-black text-sm">{prof.name}</p><p className="text-[8px] uppercase tracking-widest font-black text-zinc-500">{prof.specialty}</p></div>
                      </div>
                   ))}
                </div>
             </section>
          </main>

          <footer className="py-10 text-center border-t border-white/5 opacity-50"><p className="text-[10px] font-black uppercase">© 2026 {config.name}. PRODUZIDO POR ©NIKLAUS.</p></footer>
        </div>
      )}

      {/* VIEW: LOGIN */}
      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-in zoom-in">
           <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-10 ${theme === 'light' ? 'bg-white border' : 'cartao-vidro border-[#D4AF37]/20'}`}>
              <div className="text-center space-y-4">
                 <h2 className="text-3xl font-black italic">Portal do Membro</h2>
                 <p className="text-[10px] uppercase font-black text-zinc-500">Acesse sua conta</p>
              </div>
              <div className="space-y-6">
                 <input type="text" placeholder="E-mail ou Celular" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full p-5 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-100' : 'bg-white/5 border border-white/10 text-white'}`} />
                 <input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full p-5 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-100' : 'bg-white/5 border border-white/10 text-white'}`} />
                 <button onClick={() => {
                    const cleanId = loginIdentifier.toLowerCase().replace(/\D/g, '');
                    const client = clients.find(c => c.email.toLowerCase() === loginIdentifier.toLowerCase() || c.phone.replace(/\D/g, '') === cleanId);
                    if (client && client.password === loginPassword) { setLoggedClient(client); setView('CLIENT_DASHBOARD'); } else { alert("Dados incorretos."); }
                 }} className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px]">ACESSAR</button>
              </div>
              <button onClick={() => setView('HOME')} className="w-full text-[10px] font-black uppercase text-zinc-600">Voltar</button>
           </div>
        </div>
      )}

      {/* VIEW: BOOKING (Agendamento Completo) */}
      {view === 'BOOKING' && (
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-10 animate-in slide-in-from-bottom-10">
           <button onClick={() => setView('HOME')} className="flex items-center gap-2 font-black text-[10px] uppercase opacity-50"><ChevronLeft size={16}/> Voltar</button>
           <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <h2 className="text-4xl font-black italic">Escolha o Momento</h2>
                 <div className="space-y-6">
                    <div className="p-6 rounded-3xl cartao-vidro border-[#D4AF37]/20">
                       <p className="text-[#D4AF37] font-black text-xs uppercase mb-1">Ritual</p>
                       <p className="text-2xl font-black italic">{services.find(s => s.id === selecao.serviceId)?.name}</p>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-zinc-500 px-2">Data e Profissional</label>
                       <input type="date" value={selecao.date} onChange={e => setSelecao({...selecao, date: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white" />
                       <select value={selecao.professionalId} onChange={e => setSelecao({...selecao, professionalId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white">
                          <option value="" className="text-black">Selecione o Artífice</option>
                          {professionals.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-zinc-500 px-2">Seus Dados</label>
                       <input type="text" placeholder="Nome Completo" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white" />
                       <input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white" />
                    </div>
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-xl font-black italic">Horários</h2>
                 <div className="grid grid-cols-3 gap-3">
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(h => (
                      <button key={h} onClick={() => setSelecao({...selecao, time: h})} className={`p-4 rounded-xl font-black text-xs transition-all ${selecao.time === h ? 'gradiente-ouro text-black scale-105' : 'bg-white/5 border border-white/10 text-zinc-400'}`}>{h}</button>
                    ))}
                 </div>
                 <button onClick={handleConfirmBooking} disabled={loading} className="w-full gradiente-ouro text-black py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl mt-10 transition-all active:scale-95">
                    {loading ? 'AGENDANDO...' : 'CONFIRMAR RESERVA'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PROFISSIONAL */}
      {showProfessionalModal && selectedProfessional && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 animate-in zoom-in">
           <div className="w-full max-w-2xl rounded-[3rem] overflow-hidden cartao-vidro border border-[#D4AF37]/30">
              <div className="relative h-96">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-contain bg-black" alt="" />
                 <button onClick={() => setShowProfessionalModal(false)} className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white"><X size={20} /></button>
                 <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-4xl font-black italic">{selectedProfessional.name}</h2>
                    <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">{selectedProfessional.specialty}</p>
                 </div>
              </div>
              <div className="p-10">
                 <h3 className="text-xl font-black italic mb-4">Minha História</h3>
                 <p className="text-sm leading-relaxed text-zinc-400">{selectedProfessional.description || "Dedicado à arte da barbearia clássica e moderna."}</p>
                 <button onClick={() => setShowProfessionalModal(false)} className="w-full mt-8 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-[10px]">Fechar</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
