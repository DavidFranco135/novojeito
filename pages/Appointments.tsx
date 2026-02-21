import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, 
  Calendar, Scissors, LayoutGrid, List, UserPlus, DollarSign, RefreshCw, Filter, CalendarRange, Phone, Mail, User
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Appointment, Client } from '../types';

const NOTIFICATION_SOUND_URL = 'https://raw.githubusercontent.com/DavidFranco135/iphone/main/iphone.mp3';

// ─── Helpers de data — sem new Date(string) para evitar bug UTC/fuso ──────
const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatDateLabel = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
const shiftDate = (dateStr: string, delta: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatMonthLabel = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

// ─── Áudio: variáveis globais fora do componente ──────────────────────────
let audioCtx: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let audioBufferLoading = false;
let audioReady = false;
let notifDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const preloadAudio = async (): Promise<void> => {
  if (audioReady || audioBufferLoading) return;
  audioBufferLoading = true;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const response = await fetch(NOTIFICATION_SOUND_URL);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioReady = true;
  } catch (_) { audioBufferLoading = false; }
};

const playNotificationSound = async (): Promise<void> => {
  if (!audioReady || !audioBuffer) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (_) {}
};

// Debounce 1 s absorve o duplo-snapshot do Firestore (cache + servidor)
const scheduleNotificationSound = (): void => {
  if (notifDebounceTimer) clearTimeout(notifDebounceTimer);
  notifDebounceTimer = setTimeout(() => {
    playNotificationSound();
    notifDebounceTimer = null;
  }, 1000);
};

const Appointments: React.FC = () => {
  const { 
    appointments, professionals, services, clients,
    addAppointment, updateAppointmentStatus, addClient, rescheduleAppointment, theme
  } = useBarberStore();
  
  const prevAppCountRef = useRef<number | null>(null);

  // ── Pré-carrega áudio ao montar (admin já navegou até aqui, contexto permitido)
  useEffect(() => { preloadAudio(); }, []);

  // ── Data correta no fuso local, atualiza na virada de meia-noite
  useEffect(() => {
    const tick = () => setCurrentDate(getTodayString());
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Som: ignora carga inicial, debounce absorve duplo-snapshot do Firestore
  useEffect(() => {
    if (prevAppCountRef.current === null) {
      prevAppCountRef.current = appointments.length;
      return;
    }
    if (appointments.length > prevAppCountRef.current) scheduleNotificationSound();
    prevAppCountRef.current = appointments.length;
  }, [appointments.length]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compactView, setCompactView] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>(getTodayString);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [newApp, setNewApp] = useState({ clientId: '', serviceId: '', professionalId: '', startTime: '09:00' });
  const [quickClient, setQuickClient] = useState({ name: '', phone: '', email: '' });
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });

  const hours = useMemo(() => Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`), []);
  const appointmentsToday = useMemo(() => appointments.filter(a => a.date === currentDate), [appointments, currentDate]);
  
  const appointmentsFiltered = useMemo(() => {
    if (filterPeriod === 'day') {
      return appointments.filter(a => a.date === currentDate);
    } else if (filterPeriod === 'month') {
      return appointments.filter(a => a.date.startsWith(selectedMonth));
    } else {
      return appointments;
    }
  }, [appointments, currentDate, selectedMonth, filterPeriod]);

  const handleQuickClient = async () => {
    if(!quickClient.name || !quickClient.phone) return alert("Preencha nome e telefone");
    const client = await addClient({ ...quickClient, email: quickClient.email });
    setNewApp({...newApp, clientId: client.id});
    setShowQuickClient(false);
    setQuickClient({ name: '', phone: '', email: '' });
  };

  // NOVA FUNÇÃO: Criar agendamento ao clicar em um horário vazio
  const handleClickEmptySlot = (professionalId: string, timeSlot: string) => {
    setNewApp({
      ...newApp,
      professionalId: professionalId,
      startTime: timeSlot
    });
    setShowAddModal(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const service = services.find(s => s.id === newApp.serviceId);
      if (!service) return;
      const [h, m] = newApp.startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + service.durationMinutes;
      const endTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
      await addAppointment({ ...newApp, clientName: clients.find(c => c.id === newApp.clientId)?.name || '', clientPhone: clients.find(c => c.id === newApp.clientId)?.phone || '', serviceName: service.name, professionalName: professionals.find(p => p.id === newApp.professionalId)?.name || '', date: currentDate, endTime, price: service.price });
      setShowAddModal(false);
    } catch (err) { alert("Erro ao agendar."); }
  };

  const handleReschedule = () => {
    if (showRescheduleModal && rescheduleData.date && rescheduleData.time) {
      const service = services.find(s => s.id === showRescheduleModal.serviceId);
      const [h, m] = rescheduleData.time.split(':').map(Number);
      const endTime = `${Math.floor((h * 60 + m + (service?.durationMinutes || 30)) / 60).toString().padStart(2, '0')}:${((h * 60 + m + (service?.durationMinutes || 30)) % 60).toString().padStart(2, '0')}`;
      rescheduleAppointment(showRescheduleModal.id, rescheduleData.date, rescheduleData.time, endTime);
      setShowRescheduleModal(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agenda Digital</h1>
          <div className="flex gap-2 mt-2">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#C58A4A] text-black' : 'bg-white/5 text-zinc-500'}`}><LayoutGrid size={16}/></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#C58A4A] text-black' : 'bg-white/5 text-zinc-500'}`}><List size={16}/></button>
             {viewMode === 'grid' && (
               <button 
                 onClick={() => {
                   setCompactView(!compactView);
                   if (!compactView) {
                     document.documentElement.requestFullscreen?.();
                   } else {
                     document.exitFullscreen?.();
                   }
                 }} 
                 className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${compactView ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-500'}`}
               >
                 Compacto
               </button>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterPeriod('day')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'day' ? 'bg-[#C58A4A] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setFilterPeriod('month')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'month' ? 'bg-[#C58A4A] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => setFilterPeriod('all')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'all' ? 'bg-[#C58A4A] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Todos
            </button>
          </div>
          
          {filterPeriod === 'day' && (
            <div className={`flex items-center border rounded-xl p-1 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
              <button onClick={() => setCurrentDate(prev => shiftDate(prev, -1))} className={`p-2 transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronLeft size={20} /></button>
              <span className={`px-4 text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>{formatDateLabel(currentDate)}</span>
              <button onClick={() => setCurrentDate(prev => shiftDate(prev, +1))} className={`p-2 transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronRight size={20} /></button>
            </div>
          )}
          
          {filterPeriod === 'month' && (
            <div className={`flex items-center border rounded-xl p-1 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
              <button 
                onClick={() => { 
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const d = new Date(year, month - 2, 1);
                  setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }} 
                className={`p-2 transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={`px-4 text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                {formatMonthLabel(selectedMonth)}
              </span>
              <button 
                onClick={() => { 
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const d = new Date(year, month, 1);
                  setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }} 
                className={`p-2 transition-all ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          
          <button onClick={() => setShowAddModal(true)} className="gradiente-ouro text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Agendar +</button>
        </div>
      </div>

      <div className="flex-1 cartao-vidro rounded-[2rem] border-white/5 shadow-2xl overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className={`overflow-auto h-full scrollbar-hide ${compactView ? '' : ''}`}>
            <div className={compactView ? 'w-full' : 'min-w-[900px]'}>
              {/* CABEÇALHO: Reduzido padding vertical */}
              <div className={`border-b border-white/5 bg-white/[0.02] sticky top-0 z-10 ${compactView ? 'grid grid-cols-[60px_repeat(auto-fit,minmax(120px,1fr))]' : 'grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))]'}`}>
                <div className={`flex items-center justify-center text-zinc-500 ${compactView ? 'p-2' : 'p-3'}`}><Clock size={compactView ? 14 : 18} /></div>
                {professionals.map(prof => (
                  <div key={prof.id} className={`flex items-center justify-center gap-3 border-r border-white/5 ${compactView ? 'p-2 flex-col' : 'p-3'}`}>
                    <img src={prof.avatar} className={`rounded-lg object-cover border border-[#C58A4A] ${compactView ? 'w-6 h-6' : 'w-8 h-8'}`} alt="" />
                    <span className={`font-black uppercase tracking-widest ${compactView ? 'text-[8px]' : 'text-[10px]'}`}>{prof.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              {/* LINHAS DE HORÁRIO: Altura reduzida de 100px/50px para 60px/35px */}
              {hours.map(hour => (
                <div key={hour} className={`border-b border-white/[0.03] ${compactView ? 'grid grid-cols-[60px_repeat(auto-fit,minmax(120px,1fr))] min-h-[35px]' : 'grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))] min-h-[60px]'}`}>
                  <div className="flex items-center justify-center border-r border-white/5 bg-white/[0.01]"><span className={`font-black text-zinc-600 ${compactView ? 'text-[9px]' : 'text-[10px]'}`}>{hour}</span></div>
                  {professionals.map(prof => {
                    const app = appointmentsToday.find(a => a.professionalId === prof.id && a.startTime.split(':')[0] === hour.split(':')[0] && a.status !== 'CANCELADO');
                    return (
                      <div 
                        key={prof.id} 
                        className={`border-r border-white/5 last:border-r-0 ${compactView ? 'p-1' : 'p-1.5'} ${!app ? 'cursor-pointer hover:bg-white/5 transition-all' : ''}`}
                        onClick={() => !app && handleClickEmptySlot(prof.id, hour)}
                        title={!app ? `Clique para agendar às ${hour}` : ''}
                      >
                        {app ? (
                          <div className={`h-full w-full rounded-2xl border flex flex-col justify-between transition-all group ${app.status === 'CONCLUIDO_PAGO' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[#C58A4A]/30 bg-[#C58A4A]/5'} ${compactView ? 'p-1.5 rounded-lg' : 'p-2'}`}>
                            <div className="truncate">
                              <h4 
                                onClick={(e) => { e.stopPropagation(); setShowDetailModal(app); }}
                                className={`font-black uppercase truncate cursor-pointer hover:text-[#C58A4A] transition-colors ${compactView ? 'text-[8px]' : 'text-[10px]'} ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}
                                title="Ver detalhes do agendamento"
                              >{app.clientName}</h4>
                              {!compactView && <p className="text-[8px] font-black opacity-50 uppercase mt-1 truncate">{app.serviceName}</p>}
                            </div>
                            <div className={`flex items-center justify-end gap-1 ${compactView ? 'mt-0.5' : 'mt-1'}`}>
                               <button onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO'); }} className={`rounded-lg transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-500 hover:text-white'} ${compactView ? 'p-0.5' : 'p-1'}`} title="Marcar como Pago"><DollarSign size={compactView ? 9 : 11}/></button>
                               <button onClick={(e) => { e.stopPropagation(); setShowRescheduleModal(app); }} className={`bg-white/10 text-zinc-500 hover:text-white rounded-lg transition-all ${compactView ? 'p-0.5' : 'p-1'}`} title="Reagendar"><RefreshCw size={compactView ? 9 : 11}/></button>
                               <button onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(app.id, 'CANCELADO'); }} className={`bg-white/10 text-zinc-500 hover:text-red-500 rounded-lg transition-all ${compactView ? 'p-0.5' : 'p-1'}`} title="Cancelar"><X size={compactView ? 9 : 11}/></button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-40 transition-opacity">
                            <Plus size={compactView ? 12 : 16} className="text-[#C58A4A]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3 overflow-y-auto h-full scrollbar-hide">
             {appointmentsFiltered.length === 0 && (
               <p className={`text-center py-20 font-black uppercase text-[10px] italic ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
                 Nenhum agendamento {filterPeriod === 'day' ? 'para hoje' : filterPeriod === 'month' ? 'neste mês' : 'encontrado'}.
               </p>
             )}
             {appointmentsFiltered.map(app => (
               <div key={app.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#C58A4A]/30 transition-all">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${app.status === 'CONCLUIDO_PAGO' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-[#C58A4A] text-[#C58A4A] bg-[#C58A4A]/10'}`}>
                        {app.status === 'CONCLUIDO_PAGO' ? <Check size={20}/> : <Clock size={20}/>}
                     </div>
                     <div>
                        <p 
                          className="text-xs font-black cursor-pointer hover:text-[#C58A4A] transition-colors"
                          onClick={() => setShowDetailModal(app)}
                          title="Ver detalhes do agendamento"
                        >{app.clientName} • <span className="text-[#C58A4A]">{app.startTime}</span></p>
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{app.serviceName} com {app.professionalName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`p-2 rounded-xl border transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white border-transparent' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}><DollarSign size={16}/></button>
                     <button onClick={() => setShowRescheduleModal(app)} className="p-2 bg-white/5 border border-white/10 text-zinc-500 hover:text-white rounded-xl transition-all"><RefreshCw size={16}/></button>
                     <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className="p-2 bg-white/5 border border-white/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all"><X size={16}/></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Modais omitidos por brevidade mas restaurados conforme lógica anterior de novo cliente e novo agendamento */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className="cartao-vidro w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border-[#C58A4A]/30 shadow-2xl">
             <div className="text-center space-y-2"><h2 className="text-xl font-black font-display italic">Reagendar Ritual</h2><p className="text-[10px] text-zinc-500 uppercase font-black">Escolha novo horário para {showRescheduleModal.clientName}</p></div>
             <div className="space-y-4">
                <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black" />
                <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-black" />
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowRescheduleModal(null)} className="flex-1 bg-white/5 py-4 rounded-xl font-black uppercase text-[9px] text-zinc-500">Voltar</button>
                <button onClick={handleReschedule} className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[9px]">Confirmar</button>
             </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className="cartao-vidro w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 border-[#C58A4A]/20 relative">
            <h2 className="text-2xl font-black font-display italic">Novo Agendamento</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-6">
               <div className="space-y-4">
                  <div className="flex gap-2">
                    <select required value={newApp.clientId} onChange={e => setNewApp({...newApp, clientId: e.target.value})} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                      <option value="" className="bg-zinc-950">Selecione o Cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id} className="bg-zinc-950">{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowQuickClient(true)} className="p-4 bg-[#C58A4A] text-black rounded-xl hover:scale-105 transition-all"><UserPlus size={20}/></button>
                  </div>
                  {showQuickClient && (
                    <div className="p-4 bg-white/5 rounded-xl border border-[#C58A4A]/30 space-y-3 animate-in slide-in-from-top-2">
                      <p className="text-[9px] font-black uppercase text-[#C58A4A]">Rápido: Novo Cliente</p>
                      <input type="text" placeholder="Nome" value={quickClient.name} onChange={e => setQuickClient({...quickClient, name: e.target.value})} className="w-full bg-black/20 border border-white/5 p-3 rounded-lg text-xs" />
                      <input type="tel" placeholder="WhatsApp" value={quickClient.phone} onChange={e => setQuickClient({...quickClient, phone: e.target.value})} className="w-full bg-black/20 border border-white/5 p-3 rounded-lg text-xs" />
                      <input type="email" placeholder="E-mail" value={quickClient.email} onChange={e => setQuickClient({...quickClient, email: e.target.value})} className="w-full bg-black/20 border border-white/5 p-3 rounded-lg text-xs" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowQuickClient(false)} className="flex-1 bg-white/5 text-zinc-500 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-white/10 transition-all">Fechar</button>
                        <button type="button" onClick={handleQuickClient} className="flex-1 bg-[#C58A4A] text-black py-2 rounded-lg text-[9px] font-black uppercase">Salvar e Selecionar</button>
                      </div>
                    </div>
                  )}
                  <select required value={newApp.professionalId} onChange={e => setNewApp({...newApp, professionalId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                    <option value="" className="bg-zinc-950">Barbeiro</option>
                    {professionals.map(p => <option key={p.id} value={p.id} className="bg-zinc-950">{p.name}</option>)}
                  </select>
                  <select required value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                    <option value="" className="bg-zinc-950">Serviço</option>
                    {services.map(s => <option key={s.id} value={s.id} className="bg-zinc-950">{s.name} • R$ {s.price}</option>)}
                  </select>
                  <input required type="time" value={newApp.startTime} onChange={e => setNewApp({...newApp, startTime: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black" />
               </div>
               <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-black uppercase text-[10px] text-zinc-500">Cancelar</button>
                  <button type="submit" className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px]">Agendar Agora</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Detalhes do Agendamento ───────────────────────────────── */}
      {showDetailModal && (() => {
        const app = showDetailModal;
        const client = clients.find(c => c.name === app.clientName || c.phone === app.clientPhone);
        const service = services.find(s => s.id === app.serviceId);
        const professional = professionals.find(p => p.id === app.professionalId);
        const statusLabel = app.status === 'CONCLUIDO_PAGO' ? 'Concluído e Pago' : app.status === 'CANCELADO' ? 'Cancelado' : 'Pendente';
        const statusColor = app.status === 'CONCLUIDO_PAGO' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : app.status === 'CANCELADO' ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-[#C58A4A] bg-[#C58A4A]/10 border-[#C58A4A]/30';
        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
            <div className={`w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#C58A4A]/20'}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#C58A4A] mb-1">Detalhes do Agendamento</p>
                  <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName}</h2>
                </div>
                <button onClick={() => setShowDetailModal(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"><X size={20} className="text-zinc-400"/></button>
              </div>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                {app.status === 'CONCLUIDO_PAGO' ? <Check size={12}/> : app.status === 'CANCELADO' ? <X size={12}/> : <Clock size={12}/>}
                {statusLabel}
              </div>

              {/* Info grid */}
              <div className="space-y-3">
                <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                  <Scissors size={16} className="text-[#C58A4A] shrink-0"/>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Serviço</p>
                    <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.serviceName}</p>
                    {service && <p className="text-[9px] text-zinc-500 mt-0.5">{service.durationMinutes} min • R$ {app.price?.toFixed(2)}</p>}
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                  <User size={16} className="text-[#C58A4A] shrink-0"/>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Profissional</p>
                    <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.professionalName}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                  <Calendar size={16} className="text-[#C58A4A] shrink-0"/>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Data e Horário</p>
                    <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{formatDateLabel(app.date)} • {app.startTime} – {app.endTime}</p>
                  </div>
                </div>

                {client?.phone && (
                  <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                    <Phone size={16} className="text-[#C58A4A] shrink-0"/>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">WhatsApp</p>
                      <a href={`https://wa.me/55${client.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-sm font-black text-[#C58A4A] hover:underline">{client.phone}</a>
                    </div>
                  </div>
                )}

                {client?.email && (
                  <div className={`flex items-center gap-4 p-4 rounded-2xl ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                    <Mail size={16} className="text-[#C58A4A] shrink-0"/>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">E-mail</p>
                      <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{client.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowDetailModal(null); setShowRescheduleModal(app); }} 
                  className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-black uppercase text-[9px] text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12}/> Reagendar
                </button>
                <button 
                  onClick={() => { updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO'); setShowDetailModal(null); }} 
                  className="flex-1 gradiente-ouro text-black py-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"
                >
                  <DollarSign size={12}/> Pago
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Appointments;
