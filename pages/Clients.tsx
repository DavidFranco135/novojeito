
import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Phone, Mail, Trash2, Edit2, X, Clock, Calendar, Scissors, CheckCircle2, History } from 'lucide-react';
import { useBarberStore } from '../store';
import { Client, Appointment } from '../types';

const Clients: React.FC = () => {
  const { clients, appointments, addClient, updateClient, deleteClient } = useBarberStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const clientAppointments = useMemo(() => {
    if (!selectedClient) return { past: [], future: [] };
    const filtered = appointments.filter(a => a.clientId === selectedClient.id || a.clientPhone === selectedClient.phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const now = new Date();
    now.setHours(0,0,0,0);

    return {
      past: filtered.filter(a => new Date(a.date) < now || a.status === 'CONCLUIDO_PAGO'),
      future: filtered.filter(a => new Date(a.date) >= now && a.status !== 'CONCLUIDO_PAGO' && a.status !== 'CANCELADO')
    };
  }, [selectedClient, appointments]);

  const handleSave = async () => {
    if (formData.name && formData.phone) {
      if (editingId) {
        await updateClient(editingId, formData);
      } else {
        await addClient(formData);
      }
      setFormData({ name: '', phone: '', email: '' });
      setShowAddModal(false);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full overflow-auto pb-20 scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white font-display italic tracking-tight">Membros do Clube</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">A base exclusiva da sua barbearia.</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', email:''}); setShowAddModal(true); }} className="flex items-center gap-2 gradiente-ouro text-black px-6 md:px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
          <UserPlus size={16} /> NOVO MEMBRO
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
        <input 
          type="text" 
          placeholder="Pesquisar Membros (Nome ou Celular)..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-sm focus:border-[#D4AF37]/50 outline-none transition-all placeholder:text-zinc-700 font-bold text-white"
        />
      </div>

      <div className="cartao-vidro rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-white/[0.01] text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-6">Membro</th>
                <th className="px-8 py-6">Contato</th>
                <th className="px-8 py-6">Frequência</th>
                <th className="px-8 py-6 text-right">Opções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center font-black text-[#D4AF37] text-sm italic group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-all">{client.name}</p>
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">Desde: {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-0.5">
                      <p className="text-xs text-white font-bold flex items-center gap-2">{client.phone}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{client.email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white italic">R$ {client.totalSpent.toFixed(2)}</span>
                      <span className="text-[9px] text-zinc-500 font-bold">Último: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR') : 'Nunca'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingId(client.id); setFormData(client); setShowAddModal(true); }} className="p-2.5 bg-white/5 text-zinc-500 hover:text-white rounded-xl transition-all"><Edit2 size={14}/></button>
                      <button onClick={() => deleteClient(client.id)} className="p-2.5 bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-xl transition-all"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-[10px] text-zinc-600 font-black uppercase italic tracking-widest">Nenhum membro encontrado na base.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico e Agendamentos Detalhados do Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className="cartao-vidro w-full max-w-2xl rounded-[3rem] p-8 md:p-12 space-y-8 border-[#D4AF37]/10 relative shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37] text-black flex items-center justify-center text-3xl font-black italic">{selectedClient.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-2xl font-black font-display italic text-white tracking-tight">{selectedClient.name}</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{selectedClient.phone}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedClient(null)} className="p-3 text-zinc-600 hover:text-white bg-white/5 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8 pr-2">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Investido</p>
                     <p className="text-xl font-black text-[#D4AF37] italic font-display">R$ {selectedClient.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Rituais Concluídos</p>
                     <p className="text-xl font-black text-white italic font-display">{clientAppointments.past.length}</p>
                  </div>
               </div>

               {/* Futuros Agendamentos */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CheckCircle2 size={14} /> Próximos Rituais</h3>
                  {clientAppointments.future.map(app => (
                    <div key={app.id} className="bg-white/5 border border-[#D4AF37]/20 p-4 rounded-2xl flex items-center justify-between group hover:bg-[#D4AF37]/5 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[#D4AF37]"><Calendar size={18}/></div>
                          <div>
                             <p className="text-sm font-bold text-white">{app.serviceName}</p>
                             <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{new Date(app.date).toLocaleDateString('pt-BR')} • {app.startTime}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-white">R$ {app.price}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest mt-1 text-blue-400">AGENDADO</p>
                       </div>
                    </div>
                  ))}
                  {clientAppointments.future.length === 0 && <p className="text-[10px] text-zinc-600 py-2 italic">Nenhum agendamento futuro.</p>}
               </div>

               {/* Histórico Passado */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><History size={14} className="text-zinc-600"/> Histórico de Sessões</h3>
                  {clientAppointments.past.map(app => (
                    <div key={app.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400"><Scissors size={18}/></div>
                          <div>
                             <p className="text-sm font-bold text-white">{app.serviceName}</p>
                             <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{new Date(app.date).toLocaleDateString('pt-BR')} • {app.startTime}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-white">R$ {app.price}</p>
                          <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${app.status === 'CONCLUIDO_PAGO' ? 'text-emerald-500' : 'text-zinc-500'}`}>{app.status.replace('_', ' ')}</p>
                       </div>
                    </div>
                  ))}
                  {clientAppointments.past.length === 0 && <p className="text-[10px] text-zinc-600 py-2 italic">Nenhum histórico encontrado.</p>}
               </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="cartao-vidro w-full max-w-lg rounded-[3rem] p-8 md:p-12 space-y-10 border-[#D4AF37]/20 shadow-2xl relative">
            <h2 className="text-2xl font-black font-display italic text-white tracking-tight">{editingId ? 'Refinar Cadastro' : 'Novo Membro Signature'}</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nome Completo</label>
                 <input type="text" placeholder="Ex: Carlos Alberto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white font-bold focus:border-[#D4AF37]/50" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">WhatsApp / Celular</label>
                 <input type="tel" placeholder="(21) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white font-bold focus:border-[#D4AF37]/50" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                 <input type="email" placeholder="email@provedor.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white font-bold focus:border-[#D4AF37]/50" />
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] text-zinc-600 hover:text-white transition-all">Cancelar</button>
                 <button onClick={handleSave} className="flex-1 gradiente-ouro text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] shadow-2xl">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
