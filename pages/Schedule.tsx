// ============================================================
// pages/Schedule.tsx — Bloqueio de Horários + Clientes Inativos
// Coloque em: src/pages/Schedule.tsx
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Lock, Unlock, Plus, Trash2, X, Bell, Phone,
  RefreshCw, AlertTriangle, Calendar, Clock, User
} from 'lucide-react';
import { useBarberStore } from '../store';
import { BlockedSlot, InactivityCampaign } from '../types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const Schedule: React.FC = () => {
  const { professionals, clients, appointments, config, theme } = useBarberStore();
  const {
    blockedSlots, addBlockedSlot, deleteBlockedSlot,
    inactivityCampaigns, addCampaign, updateCampaign, deleteCampaign
  } = useBarberStore() as any;

  const [activeTab, setActiveTab] = useState<'blocks' | 'inactive'>('blocks');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const [blockForm, setBlockForm] = useState({
    professionalId: '',
    date: '',
    startTime: '12:00',
    endTime: '13:00',
    reason: 'Almoço',
    recurring: false,
    recurringDays: [] as number[],
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    daysInactive: 30,
    message: `Olá {nome}! Sentimos sua falta no Sr. José Barber Pub! 🪒
Faz {dias} dias desde sua última visita.
Temos uma oferta especial para você voltar. 
Agende agora: {link}`,
    discount: 0,
  });

  // Clientes inativos calculados
  const inactiveClients = useMemo(() => {
    const threshold = 30; // dias padrão
    const now = new Date();
    return clients
      .map(c => {
        const lastAppt = appointments
          .filter(a => (a.clientId === c.id || a.clientPhone === c.phone) && a.status === 'CONCLUIDO_PAGO')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const lastDate = lastAppt ? new Date(lastAppt.date) : new Date(c.createdAt);
        const daysAgo = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, daysAgo, lastVisitDate: lastDate };
      })
      .filter(c => c.daysAgo >= threshold)
      .sort((a, b) => b.daysAgo - a.daysAgo);
  }, [clients, appointments]);

  const handleSaveBlock = async () => {
    if (!blockForm.professionalId) {
      alert('Selecione um profissional!');
      return;
    }
    if (!blockForm.recurring && !blockForm.date) {
      alert('Selecione uma data!');
      return;
    }
    await addBlockedSlot({
      ...blockForm,
      date: blockForm.recurring ? '*' : blockForm.date,
      createdAt: new Date().toISOString(),
    });
    setShowBlockModal(false);
    setBlockForm({ professionalId: '', date: '', startTime: '12:00', endTime: '13:00', reason: 'Almoço', recurring: false, recurringDays: [] });
  };

  // Gera link WhatsApp com mensagem personalizada
  const handleSendWhatsApp = (clientPhone: string, clientName: string, daysAgo: number) => {
    const bookingUrl = window.location.origin;
    const message = encodeURIComponent(
      `Olá ${clientName}! Sentimos sua falta no ${config.name}! 🪒\nFaz ${daysAgo} dias desde sua última visita.\nAgende agora: ${bookingUrl}`
    );
    const phone = clientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const themeCard = theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
            Controle de Agenda
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            Bloqueios · Clientes Inativos
          </p>
        </div>
        <button
          onClick={() => activeTab === 'blocks' ? setShowBlockModal(true) : setShowCampaignModal(true)}
          className="flex items-center gap-2 gradiente-ouro text-black px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
        >
          <Plus size={16} />
          {activeTab === 'blocks' ? 'Bloquear Horário' : 'Nova Campanha'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'blocks', label: 'Bloqueios de Horário', icon: Lock },
          { id: 'inactive', label: `Inativos (${inactiveClients.length})`, icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-[#C58A4A] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Bloqueios */}
      {activeTab === 'blocks' && (
        <div className="space-y-4">
          {/* Por profissional */}
          {professionals.map(prof => {
            const slots: BlockedSlot[] = (blockedSlots || []).filter(
              (s: BlockedSlot) => s.professionalId === prof.id
            );
            return (
              <div key={prof.id} className={`rounded-[2rem] p-6 border ${themeCard}`}>
                <div className="flex items-center gap-4 mb-6">
                  <img src={prof.avatar} className="w-12 h-12 rounded-2xl object-cover border border-[#C58A4A]/30" alt="" />
                  <div>
                    <p className={`font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{slots.length} bloqueios</p>
                  </div>
                  <button
                    onClick={() => { setBlockForm({ ...blockForm, professionalId: prof.id }); setShowBlockModal(true); }}
                    className="ml-auto p-2.5 bg-[#C58A4A]/10 text-[#C58A4A] hover:bg-[#C58A4A] hover:text-black rounded-xl transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {slots.length === 0 && (
                  <p className="text-[10px] text-zinc-600 italic text-center py-4">Nenhum bloqueio configurado.</p>
                )}

                <div className="space-y-3">
                  {slots.map((slot: BlockedSlot) => (
                    <div key={slot.id} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                          <Lock size={16} className="text-red-500" />
                        </div>
                        <div>
                          <p className={`font-black text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                            {slot.startTime} – {slot.endTime}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">
                            {slot.recurring
                              ? `Recorrente: ${slot.recurringDays?.map(d => DAYS[d]).join(', ')}`
                              : new Date(slot.date + 'T12:00:00').toLocaleDateString('pt-BR')
                            } • {slot.reason}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteBlockedSlot(slot.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Clientes Inativos */}
      {activeTab === 'inactive' && (
        <div className="space-y-4">
          <div className={`rounded-[2rem] p-6 border ${themeCard} flex items-center gap-4`}>
            <AlertTriangle className="text-amber-500" size={24} />
            <div>
              <p className={`font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {inactiveClients.length} clientes sem visita há mais de 30 dias
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                Clique em "WhatsApp" para enviar mensagem personalizada
              </p>
            </div>
          </div>

          {inactiveClients.map(client => (
            <div key={client.id} className={`rounded-[2rem] p-5 border flex items-center justify-between gap-4 ${themeCard}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${client.daysAgo > 60 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{client.name}</p>
                  <p className="text-[9px] text-zinc-500 font-bold">{client.phone}</p>
                  <p className={`text-[9px] font-black uppercase mt-0.5 ${client.daysAgo > 60 ? 'text-red-500' : 'text-amber-500'}`}>
                    {client.daysAgo} dias sem visita
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSendWhatsApp(client.phone, client.name, client.daysAgo)}
                className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase hover:scale-105 transition-all shadow-lg"
              >
                <Phone size={12} /> WhatsApp
              </button>
            </div>
          ))}

          {inactiveClients.length === 0 && (
            <div className={`rounded-[2rem] p-16 text-center border ${themeCard}`}>
              <Bell className="mx-auto mb-4 text-zinc-600" size={48} />
              <p className="text-[10px] font-black uppercase text-zinc-600">Todos os clientes estão ativos!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Bloqueio */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className={`w-full max-w-md rounded-[3rem] p-10 space-y-8 border shadow-2xl ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#C58A4A]/20'}`}>
            <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              Bloquear Horário
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Profissional</label>
                <select
                  value={blockForm.professionalId}
                  onChange={e => setBlockForm({ ...blockForm, professionalId: e.target.value })}
                  className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                >
                  <option value="">Selecione...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={blockForm.recurring}
                  onChange={e => setBlockForm({ ...blockForm, recurring: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="recurring" className={`text-sm font-black ${theme === 'light' ? 'text-zinc-700' : 'text-white'}`}>
                  Bloqueio Recorrente (toda semana)
                </label>
              </div>

              {blockForm.recurring ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dias da Semana</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const days = blockForm.recurringDays.includes(i)
                            ? blockForm.recurringDays.filter(d => d !== i)
                            : [...blockForm.recurringDays, i];
                          setBlockForm({ ...blockForm, recurringDays: days });
                        }}
                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${blockForm.recurringDays.includes(i) ? 'bg-[#C58A4A] text-black' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Data</label>
                  <input
                    type="date"
                    value={blockForm.date}
                    onChange={e => setBlockForm({ ...blockForm, date: e.target.value })}
                    className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Início</label>
                  <input
                    type="time"
                    value={blockForm.startTime}
                    onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fim</label>
                  <input
                    type="time"
                    value={blockForm.endTime}
                    onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Motivo</label>
                <select
                  value={blockForm.reason}
                  onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                >
                  {['Almoço', 'Folga', 'Férias', 'Reunião', 'Manutenção', 'Outro'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase text-[9px] text-zinc-500">Cancelar</button>
              <button onClick={handleSaveBlock} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[9px]">Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
