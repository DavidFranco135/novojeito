import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, 
  Calendar, Scissors, LayoutGrid, List, UserPlus, DollarSign, RefreshCw, Filter, CalendarRange
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Appointment, Client } from '../types';

const Appointments: React.FC = () => {
  const { 
    appointments, professionals, services, clients,
    addAppointment, updateAppointmentStatus, addClient, rescheduleAppointment, theme
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
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agenda Digital</h1>
          <div className="flex gap-2 mt-2">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}><LayoutGrid size={16}/></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}><List size={16}/></button>
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
                 className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${compactView ? 'bg-purple-600 text-white' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
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
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'day' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setFilterPeriod('month')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'month' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => setFilterPeriod('all')} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterPeriod === 'all' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
            >
              Todos
            </button>
          </div>
          
          {filterPeriod === 'day' && (
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 text-zinc-500 hover:text-white'}`}><ChevronLeft size={16}/></button>
              <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className={`px-4 py-2 rounded-lg text-xs font-black outline-none border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d.toISOString().split('T')[0]); }} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 text-zinc-500 hover:text-white'}`}><ChevronRight size={16}/></button>
            </div>
          )}
          
          {filterPeriod === 'month' && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className={`px-4 py-2 rounded-lg text-xs font-black outline-none border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
            />
          )}
          
          <button onClick={() => setShowAddModal(true)} className="gradiente-ouro text-black px-6 py-2 rounded-lg font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Plus size={16}/>AGENDAR</button>
        </div>
      </div>

      <div className={`flex-1 rounded-[2rem] overflow-hidden border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
        {viewMode === 'grid' && filterPeriod === 'day' ? (
          <div className={`h-full overflow-auto scrollbar-hide ${compactView ? 'text-[9px]' : ''}`}>
            <div className="grid grid-cols-[80px_repeat(auto-fill,minmax(150px,1fr))] min-w-max">
              <div className={`sticky left-0 z-20 border-r ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-white/5'}`}>
                <div className={`h-16 border-b flex items-center justify-center font-black uppercase text-[9px] ${theme === 'light' ? 'border-zinc-200 text-zinc-600' : 'border-white/5 text-zinc-600'}`}>Horário</div>
                {hours.map(h => (
                  <div key={h} className={`h-20 border-b flex items-center justify-center font-black ${compactView ? 'h-12 text-[8px]' : ''} ${theme === 'light' ? 'border-zinc-200 text-zinc-700' : 'border-white/5 text-zinc-500'}`}>{h}</div>
                ))}
              </div>

              {professionals.map(prof => (
                <div key={prof.id} className={`border-r ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                  <div className={`h-16 border-b flex flex-col items-center justify-center ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-white/5'}`}>
                    <p className={`font-black text-[10px] ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</p>
                    <p className={`text-[8px] font-black uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{prof.workingHours.start}-{prof.workingHours.end}</p>
                  </div>
                  {hours.map(h => {
                    const app = appointmentsToday.find(a => a.startTime === h && a.professionalId === prof.id);
                    return (
                      <div key={h} className={`h-20 border-b p-1 ${compactView ? 'h-12 p-0.5' : ''} ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
                        {app && (
                          <div className={`h-full rounded-lg p-2 border flex flex-col justify-between ${compactView ? 'p-1' : ''} ${
                            app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' :
                            app.status === 'CANCELADO' ? 'bg-red-500/10 border-red-500 text-red-600' :
                            theme === 'light' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                          }`}>
                            <div className="truncate">
                              <h4 className={`font-black uppercase truncate ${compactView ? 'text-[8px]' : 'text-[11px]'} ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName}</h4>
                              {!compactView && <p className={`text-[9px] font-black uppercase mt-1 truncate ${theme === 'light' ? 'text-zinc-600 opacity-70' : 'opacity-50'}`}>{app.serviceName}</p>}
                            </div>
                            <div className={`flex items-center justify-end gap-1 ${compactView ? 'mt-0.5' : 'mt-2'}`}>
                               <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`rounded-lg transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white' : theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'} ${compactView ? 'p-0.5' : 'p-1.5'}`} title="Marcar como Pago"><DollarSign size={compactView ? 9 : 12}/></button>
                               <button onClick={() => setShowRescheduleModal(app)} className={`rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-white/10 text-zinc-500 hover:text-white'} ${compactView ? 'p-0.5' : 'p-1.5'}`} title="Reagendar"><RefreshCw size={compactView ? 9 : 12}/></button>
                               <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className={`rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-200 text-zinc-600 hover:text-red-600' : 'bg-white/10 text-zinc-500 hover:text-red-500'} ${compactView ? 'p-0.5' : 'p-1.5'}`} title="Cancelar"><X size={compactView ? 9 : 12}/></button>
                            </div>
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
               <div key={app.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 hover:border-blue-400' : 'bg-white/5 border-white/5 hover:border-[#D4AF37]/30'}`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${app.status === 'CONCLUIDO_PAGO' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'}`}>
                        {app.status === 'CONCLUIDO_PAGO' ? <Check size={20}/> : <Clock size={20}/>}
                     </div>
                     <div>
                        <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.clientName} • <span className="text-[#D4AF37]">{app.startTime}</span></p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{app.serviceName} com {app.professionalName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => updateAppointmentStatus(app.id, 'CONCLUIDO_PAGO')} className={`p-2 rounded-xl border transition-all ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500 text-white border-transparent' : theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}><DollarSign size={16}/></button>
                     <button onClick={() => setShowRescheduleModal(app)} className={`p-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}><RefreshCw size={16}/></button>
                     <button onClick={() => updateAppointmentStatus(app.id, 'CANCELADO')} className={`p-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-red-600' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-red-500'}`}><X size={16}/></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {showRescheduleModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
             <div className="text-center space-y-2">
               <h2 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Reagendar Ritual</h2>
               <p className={`text-[10px] uppercase font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Escolha novo horário para {showRescheduleModal.clientName}</p>
             </div>
             <div className="space-y-4">
                <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-black outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-black outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowRescheduleModal(null)} className={`flex-1 py-4 rounded-xl font-black uppercase text-[9px] transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}>Voltar</button>
                <button onClick={handleReschedule} className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[9px]">Confirmar</button>
             </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 relative shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/20'}`}>
            <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Novo Agendamento</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-6">
               <div className="space-y-4">
                  <div className="flex gap-2">
                    <select required value={newApp.clientId} onChange={e => setNewApp({...newApp, clientId: e.target.value})} className={`flex-1 border p-4 rounded-xl outline-none text-xs font-black uppercase transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                      <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Selecione o Cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowQuickClient(true)} className="p-4 bg-[#D4AF37] text-black rounded-xl hover:scale-105 transition-all"><UserPlus size={20}/></button>
                  </div>
                  {showQuickClient && (
                    <div className={`p-4 rounded-xl border space-y-3 animate-in slide-in-from-top-2 ${theme === 'light' ? 'bg-blue-50 border-blue-300' : 'bg-white/5 border-[#D4AF37]/30'}`}>
                      <p className={`text-[9px] font-black uppercase ${theme === 'light' ? 'text-blue-700' : 'text-[#D4AF37]'}`}>Rápido: Novo Cliente</p>
                      <input type="text" placeholder="Nome" value={quickClient.name} onChange={e => setQuickClient({...quickClient, name: e.target.value})} className={`w-full border p-3 rounded-lg text-xs outline-none ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-black/20 border-white/5 text-white'}`} />
                      <input type="tel" placeholder="WhatsApp" value={quickClient.phone} onChange={e => setQuickClient({...quickClient, phone: e.target.value})} className={`w-full border p-3 rounded-lg text-xs outline-none ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-black/20 border-white/5 text-white'}`} />
                      <button type="button" onClick={handleQuickClient} className="w-full bg-[#D4AF37] text-black py-2 rounded-lg text-[9px] font-black uppercase">Salvar e Selecionar</button>
                    </div>
                  )}
                  <select required value={newApp.professionalId} onChange={e => setNewApp({...newApp, professionalId: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black uppercase transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                    <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Barbeiro</option>
                    {professionals.map(p => <option key={p.id} value={p.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{p.name}</option>)}
                  </select>
                  <select required value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black uppercase transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
                    <option value="" className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>Serviço</option>
                    {services.map(s => <option key={s.id} value={s.id} className={theme === 'light' ? 'bg-white' : 'bg-zinc-950'}>{s.name} • R$ {s.price}</option>)}
                  </select>
                  <input required type="time" value={newApp.startTime} onChange={e => setNewApp({...newApp, startTime: e.target.value})} className={`w-full border p-4 rounded-xl outline-none text-xs font-black transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
               </div>
               <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}>Cancelar</button>
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
