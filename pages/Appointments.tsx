import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, 
  Calendar, Scissors, LayoutGrid, List, UserPlus, DollarSign, RefreshCw
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Appointment, Client } from '../types';

const Appointments: React.FC = () => {
  const { 
    appointments, professionals, services, clients, theme,
    addAppointment, updateAppointmentStatus, addClient, rescheduleAppointment
  } = useBarberStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compactView, setCompactView] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [newApp, setNewApp] = useState({ clientId: '', serviceId: '', professionalId: '', startTime: '09:00' });
  const [quickClient, setQuickClient] = useState({ name: '', phone: '' });

  const hours = useMemo(() => Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`), []);
  const appointmentsToday = useMemo(() => appointments.filter(a => a.date === currentDate), [appointments, currentDate]);

  const handleQuickClient = async () => {
    if(!quickClient.name || !quickClient.phone) return alert("Preencha nome e telefone");
    const client = await addClient({ ...quickClient, email: '' });
    setNewApp({...newApp, clientId: client.id});
    setShowQuickClient(false);
    setQuickClient({ name: '', phone: '' });
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

  // Modo compacto em tela cheia
  if (compactView) {
    return (
      <div className={`fixed inset-0 z-[999] ${theme === 'light' ? 'bg-white' : 'bg-[#050505]'} flex flex-col`}>
        {/* Header em tela cheia */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'light' ? 'border-zinc-200 bg-white' : 'border-white/10 bg-[#050505]'}`}>
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agenda - Modo Compacto</h1>
            <button 
              onClick={() => setCompactView(false)} 
              className="px-2 py-1 rounded-lg text-xs font-black uppercase bg-red-500 text-white hover:bg-red-600 transition-all"
            >
              Sair Da Tela Cheia
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center border rounded-xl p-1 ${theme === 'light' ? 'bg-zinc-100 border-zinc-300' : 'bg-white/5 border-white/10'}`}>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 ${theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronLeft size={20} /></button>
              <span className={`px-4 text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 ${theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>

        {/* Grade em tela cheia */}
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(150px,1fr))] h-full">
              {/* Coluna de horários */}
              <div className={`border-r ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-white/5 bg-white/[0.02]'} sticky left-0 z-20`}>
                <div className={`flex items-center justify-center p-3 border-b ${theme === 'light' ? 'border-zinc-200 text-zinc-600' : 'border-white/5 text-zinc-500'} sticky top-0 ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/[0.02]'}`}>
                  <Clock size={16} />
                </div>
                {hours.map(hour => (
                  <div key={hour} className={`flex items-center justify-center p-3 border-b text-sm font-bold ${theme === 'light' ? 'border-zinc-200 text-zinc-700' : 'border-white/5 text-zinc-400'}`}>
                    {hour}
                  </div>
                ))}
              </div>

              {/* Colunas dos profissionais */}
              {professionals.map(prof => (
                <div key={prof.id} className={`border-r ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                  <div className={`flex items-center justify-center gap-2 p-3 border-b sticky top-0 z-10 ${theme === 'light' ? 'border-zinc-200 bg-white' : 'border-white/5 bg-white/[0.02]'}`}>
                    <img src={prof.avatar} className="w-8 h-8 rounded-lg object-cover border-2 border-[#D4AF37]" alt="" />
                    <span className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</span>
                  </div>
                  {hours.map(hour => {
                    const appsInSlot = appointmentsToday.filter(a => a.professionalId === prof.id && a.startTime === hour && a.status !== 'CANCELADO');
                    return (
                      <div key={hour} className={`p-2 border-b min-h-[60px] ${theme === 'light' ? 'border-zinc-200 hover:bg-zinc-50' : 'border-white/5 hover:bg-white/[0.02]'} transition-colors`}>
                        {appsInSlot.map(app => (
                          <div key={app.id} className={`p-2 rounded-lg border mb-1 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30'}`}>
                            <div className="space-y-1">
                              <p className={`text-xs font-black truncate ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName}</p>
                              <p className={`text-[9px] font-bold truncate ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{app.serviceName}</p>
                              <p className={`text-[8px] font-black ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>{app.startTime} - {app.endTime}</p>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`p-1 rounded transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white' : theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'}`} title="Marcar como Pago"><DollarSign size={10}/></button>
                              <button onClick={() => setShowRescheduleModal(app)} className={`p-1 rounded transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'}`} title="Reagendar"><RefreshCw size={10}/></button>
                              <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className={`p-1 rounded transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-red-100 hover:text-red-600' : 'bg-white/10 text-zinc-500 hover:text-red-500'}`} title="Cancelar"><X size={10}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agenda Digital</h1>
          <div className="flex gap-2 mt-2">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}><LayoutGrid size={16}/></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}><List size={16}/></button>
             {viewMode === 'grid' && (
               <button 
                 onClick={() => setCompactView(true)} 
                 className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${theme === 'light' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
               >
                 Compacto
               </button>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center border rounded-xl p-1 ${theme === 'light' ? 'bg-zinc-100 border-zinc-300' : 'bg-white/5 border-white/10'}`}>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 ${theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronLeft size={20} /></button>
            <span className={`px-4 text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 ${theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}><ChevronRight size={20} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="gradiente-ouro text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Agendar +</button>
        </div>
      </div>

      <div className={`flex-1 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
        {viewMode === 'grid' ? (
          <div className="overflow-auto h-full scrollbar-hide">
            <div className="min-w-[900px]">
              <div className={`border-b sticky top-0 z-10 grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))] ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-white/5 bg-white/[0.02]'}`}>
                <div className={`flex items-center justify-center p-4 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}><Clock size={18} /></div>
                {professionals.map(prof => (
                  <div key={prof.id} className={`flex items-center justify-center gap-3 border-r p-4 ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                    <img src={prof.avatar} className="w-8 h-8 rounded-lg object-cover border border-[#D4AF37]" alt="" />
                    <span className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</span>
                  </div>
                ))}
              </div>
              {hours.map(hour => (
                <div key={hour} className={`grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))] border-b ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                  <div className={`flex items-center justify-center p-4 text-xs font-bold ${theme === 'light' ? 'text-zinc-700 bg-zinc-50' : 'text-zinc-400 bg-white/[0.01]'}`}>{hour}</div>
                  {professionals.map(prof => {
                    const appsInSlot = appointmentsToday.filter(a => a.professionalId === prof.id && a.startTime === hour && a.status !== 'CANCELADO');
                    return (
                      <div key={prof.id} className={`p-3 border-r min-h-[80px] ${theme === 'light' ? 'border-zinc-200 hover:bg-zinc-50' : 'border-white/5 hover:bg-white/[0.02]'} transition-colors`}>
                        {appsInSlot.map(app => (
                          <div key={app.id} className={`p-3 rounded-xl border mb-2 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30'}`}>
                            <div className="space-y-1">
                              <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName}</p>
                              <p className={`text-[10px] font-bold ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{app.serviceName}</p>
                              <p className={`text-[9px] font-black ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>{app.startTime} - {app.endTime}</p>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-2">
                               <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`p-1.5 rounded-lg transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white' : theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'}`} title="Marcar como Pago"><DollarSign size={12}/></button>
                               <button onClick={() => setShowRescheduleModal(app)} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'}`} title="Reagendar"><RefreshCw size={12}/></button>
                               <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-red-100 hover:text-red-600' : 'bg-white/10 text-zinc-500 hover:text-red-500'}`} title="Cancelar"><X size={12}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3 overflow-y-auto h-full scrollbar-hide">
             {appointmentsToday.length === 0 && <p className={`text-center py-20 font-black uppercase text-[10px] italic ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`}>Nenhum agendamento para hoje.</p>}
             {appointmentsToday.map(app => (
               <div key={app.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 hover:border-blue-300' : 'bg-white/5 border-white/5 hover:border-[#D4AF37]/30'}`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${app.status === 'CONCLUIDO_PAGO' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'}`}>
                        {app.status === 'CONCLUIDO_PAGO' ? <Check size={20}/> : <Clock size={20}/>}
                     </div>
                     <div>
                        <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName} • <span className="text-[#D4AF37]">{app.startTime}</span></p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{app.serviceName} com {app.professionalName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`p-2 rounded-xl border transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white border-transparent' : theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}><DollarSign size={16}/></button>
                     <button onClick={() => setShowRescheduleModal(app)} className={`p-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}><RefreshCw size={16}/></button>
                     <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className={`p-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-red-100 hover:text-red-600' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-red-500'}`}><X size={16}/></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Modal de Reagendamento */}
      {showRescheduleModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
             <div className="text-center space-y-2">
               <h2 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Reagendar Ritual</h2>
               <p className={`text-[10px] uppercase font-black ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Escolha novo horário para {showRescheduleModal.clientName}</p>
             </div>
             <div className="space-y-4">
                <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
                <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowRescheduleModal(null)} className={`flex-1 py-4 rounded-xl font-black uppercase text-[9px] ${theme === 'light' ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-white/5 text-zinc-500'}`}>Voltar</button>
                <button onClick={handleReschedule} className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[9px]">Confirmar</button>
             </div>
          </div>
        </div>
      )}
      
      {/* Modal de Novo Agendamento */}
      {showAddModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 relative ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/20'}`}>
            <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Novo Agendamento</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-6">
               <div className="space-y-4">
                  <div className="flex gap-2">
                    <select required value={newApp.clientId} onChange={e => setNewApp({...newApp, clientId: e.target.value})} className={`flex-1 border p-4 rounded-xl outline-none text-xs font-black uppercase ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                      <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Selecione o Cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowQuickClient(true)} className="p-4 bg-[#D4AF37] text-black rounded-xl hover:scale-105 transition-all"><UserPlus size={20}/></button>
                  </div>
                  {showQuickClient && (
                    <div className={`p-4 rounded-xl border space-y-3 animate-in slide-in-from-top-2 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-white/5 border-[#D4AF37]/30'}`}>
                      <p className="text-[9px] font-black uppercase text-[#D4AF37]">Rápido: Novo Cliente</p>
                      <input type="text" placeholder="Nome" value={quickClient.name} onChange={e => setQuickClient({...quickClient, name: e.target.value})} className={`w-full border p-3 rounded-lg text-xs ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-black/20 border-white/5 text-white'}`} />
                      <input type="tel" placeholder="WhatsApp" value={quickClient.phone} onChange={e => setQuickClient({...quickClient, phone: e.target.value})} className={`w-full border p-3 rounded-lg text-xs ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-black/20 border-white/5 text-white'}`} />
                      <button type="button" onClick={handleQuickClient} className="w-full bg-[#D4AF37] text-black py-2 rounded-lg text-[9px] font-black uppercase">Salvar e Selecionar</button>
                    </div>
                  )}
                  <select required value={newApp.professionalId} onChange={e => setNewApp({...newApp, professionalId: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black uppercase ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                    <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Barbeiro</option>
                    {professionals.map(p => <option key={p.id} value={p.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{p.name}</option>)}
                  </select>
                  <select required value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black uppercase ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                    <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Serviço</option>
                    {services.map(s => <option key={s.id} value={s.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{s.name} • R$ {s.price}</option>)}
                  </select>
                  <input required type="time" value={newApp.startTime} onChange={e => setNewApp({...newApp, startTime: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
               </div>
               <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] ${theme === 'light' ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-white/5 text-zinc-500'}`}>Cancelar</button>
                  <button type="submit" className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px]">Agendar Agora</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
