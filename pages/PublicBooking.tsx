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
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout, suggestions } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [suggestionText, setSuggestionText] = useState('');

  // Estados do agendamento
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' });

  const handleAddReview = async () => {
    if (!newReview.comment) return;
    addShopReview({
      rating: newReview.rating,
      comment: newReview.comment,
      userName: user?.name || 'Cliente',
      clientPhone: user?.phone || ''
    });
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
    alert('Avaliação enviada!');
  };

  const handleAddSuggestion = async () => {
    if (!suggestionText.trim()) return;
    await addSuggestion({
      clientName: user?.name || 'Anônimo',
      clientPhone: user?.phone || '',
      text: suggestionText,
      status: 'unread'
    });
    setSuggestionText('');
    alert('Sugestão enviada!');
  };

  const renderClientDashboard = () => {
    const clientApps = appointments.filter(a => a.clientPhone === user?.phone);
    const mySuggestions = suggestions.filter(s => s.clientPhone === user?.phone);

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[2rem] gradiente-ouro p-1">
              <div className="w-full h-full rounded-[1.8rem] bg-black flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="Avatar" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tight text-white">{user?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Membro Signature</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5">
            <LogOut size={16}/> Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="cartao-vidro p-8 rounded-[2.5rem] border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Agendamentos</p>
              <p className="text-4xl font-black italic text-white">{clientApps.length}</p>
           </div>
           <button onClick={() => setShowReviewModal(true)} className="cartao-vidro p-8 rounded-[2.5rem] border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all group text-left">
              <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-2 tracking-widest">Sua Opinião</p>
              <p className="text-xl font-black italic text-white flex items-center gap-2">Avaliar Experiência <ArrowRight size={20}/></p>
           </button>
        </div>

        {/* AGENDAMENTOS */}
        <div className="space-y-6">
           <h3 className="text-xl font-black italic flex items-center gap-3 text-white"><History className="text-[#D4AF37]"/> Histórico</h3>
           <div className="grid grid-cols-1 gap-4">
              {clientApps.map(app => (
                 <div key={app.id} className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10">
                          <span className="text-[8px] font-black uppercase text-[#D4AF37]">{app.date.split('-')[1]}</span>
                          <span className="text-xl font-black text-white">{app.date.split('-')[2]}</span>
                       </div>
                       <div>
                          <h4 className="font-black italic text-white uppercase">{app.serviceName}</h4>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{app.professionalName} • {app.startTime}</p>
                       </div>
                    </div>
                    <span className="px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#D4AF37]/10 text-[#D4AF37]">
                      {app.status}
                    </span>
                 </div>
              ))}
           </div>
        </div>

        {/* RESPOSTAS DO ADM */}
        <div className="space-y-6">
           <h3 className="text-xl font-black italic flex items-center gap-3 text-white"><MessageSquare className="text-[#D4AF37]"/> Minhas Sugestões</h3>
           <div className="grid grid-cols-1 gap-4">
              {mySuggestions.map(sug => (
                 <div key={sug.id} className="cartao-vidro p-6 rounded-[2rem] border-white/5 space-y-4">
                    <p className="text-sm text-zinc-300 italic">"{sug.text}"</p>
                    {sug.reply && (
                      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 rounded-2xl animate-in zoom-in duration-300">
                        <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-1">Resposta do Sr. José:</p>
                        <p className="text-xs text-white">{sug.reply}</p>
                      </div>
                    )}
                 </div>
              ))}
              <div className="mt-4 space-y-4">
                <textarea 
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Envie uma sugestão..." 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white text-sm focus:border-[#D4AF37]"
                  rows={3}
                />
                <button onClick={handleAddSuggestion} className="gradiente-ouro text-black px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
                  <Send size={14}/> Enviar
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="relative pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-32">
      <div className="text-center space-y-8 relative">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] animate-bounce">
          <Sparkles size={16}/>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Signature Experience</span>
        </div>
        <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter leading-none text-white uppercase">
          {config.name.split(' ')[0]} <br/>
          <span className="gradiente-ouro-texto">{config.name.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="max-w-2xl mx-auto text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed">
          {config.description}
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
          <button onClick={() => setView('BOOKING')} className="group relative px-12 py-6 gradiente-ouro rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95">
            <span className="relative z-10 text-black font-black uppercase tracking-widest text-sm flex items-center gap-3">Agendar Agora <ArrowRight size={20}/></span>
          </button>
          <button onClick={() => setView(user ? 'CLIENT_DASHBOARD' : 'LOGIN')} className="px-12 py-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all">
            {user ? 'Meu Portal' : 'Área do Membro'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen selection:bg-[#D4AF37]/30 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      {/* Botão de Voltar para Home se não estiver nela */}
      {view !== 'HOME' && (
        <button onClick={() => setView('HOME')} className="fixed top-8 left-8 z-[150] p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-[#D4AF37] hover:text-black transition-all">
          <ChevronLeft size={24}/>
        </button>
      )}

      {view === 'HOME' && renderHome()}
      {view === 'CLIENT_DASHBOARD' && renderClientDashboard()}
      {view === 'BOOKING' && (
        <div className="pt-32 pb-20 px-4 text-center text-white">
          <h2 className="text-3xl font-black italic">Sistema de Agendamento</h2>
          <p className="text-zinc-500 mt-4 uppercase text-[10px] tracking-widest">Selecione os serviços desejados</p>
          {/* Lógica de agendamento simplificada para o exemplo */}
          <button onClick={() => setView('HOME')} className="mt-8 px-8 py-4 bg-white/5 rounded-xl text-xs font-black uppercase">Voltar</button>
        </div>
      )}
      {view === 'LOGIN' && (
        <div className="flex items-center justify-center min-h-screen">
           <div className="cartao-vidro p-12 rounded-[3rem] w-full max-w-md text-center">
              <h2 className="text-2xl font-black italic text-white uppercase mb-8 tracking-tighter">Acesse seu Portal</h2>
              <input type="text" placeholder="CELULAR OU E-MAIL" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white mb-4 outline-none focus:border-[#D4AF37]"/>
              <button onClick={() => setView('HOME')} className="w-full gradiente-ouro py-5 rounded-2xl font-black uppercase text-sm text-black">Entrar</button>
           </div>
        </div>
      )}

      {/* Modal de Avaliação */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="cartao-vidro w-full max-w-lg rounded-[3.5rem] p-10 border-white/10 space-y-10">
              <div className="text-center space-y-4">
                 <Heart size={48} className="text-[#D4AF37] mx-auto"/>
                 <h2 className="text-3xl font-black italic text-white">Sua Experiência</h2>
              </div>
              <div className="space-y-8 text-center">
                 <div className="flex justify-center gap-3">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`transition-all ${newReview.rating >= star ? 'text-[#D4AF37] scale-125' : 'text-zinc-800'}`}>
                          <Star size={32} fill={newReview.rating >= star ? 'currentColor' : 'none'}/>
                       </button>
                    ))}
                 </div>
                 <textarea rows={4} placeholder="Conte-nos..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white focus:border-[#D4AF37]"/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-white/5 py-5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Fechar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
