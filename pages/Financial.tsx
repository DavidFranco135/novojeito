
import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Download, UserCheck } from 'lucide-react';
import { useBarberStore } from '../store';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { CORES } from '../constants';

const Financial: React.FC = () => {
  const { financialEntries, appointments, professionals, addFinancialEntry, deleteFinancialEntry } = useBarberStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'RECEITA' | 'DESPESA' | 'TUDO'>('TUDO');
  const [newEntry, setNewEntry] = useState({ description: '', amount: 0, type: 'RECEITA' as 'RECEITA' | 'DESPESA', category: 'Geral' });

  const metrics = useMemo(() => {
    const receitas = financialEntries.filter(e => e.type === 'RECEITA').reduce((acc, e) => acc + e.amount, 0);
    const despesas = financialEntries.filter(e => e.type === 'DESPESA').reduce((acc, e) => acc + e.amount, 0);
    return { receitas, despesas, lucro: receitas - despesas };
  }, [financialEntries]);

  const filteredEntries = useMemo(() => {
    if (filterType === 'TUDO') return financialEntries;
    return financialEntries.filter(e => e.type === filterType);
  }, [financialEntries, filterType]);

  const barberStats = useMemo(() => {
    return professionals.map(p => {
      const pApps = appointments.filter(a => a.professionalId === p.id && a.status === 'CONCLUIDO_PAGO');
      const totalGenerated = pApps.reduce((acc, curr) => acc + curr.price, 0);
      const commission = (totalGenerated * (p.commission || 0)) / 100;
      return {
        id: p.id,
        name: p.name,
        total: totalGenerated,
        commission: commission,
        count: pApps.length
      };
    }).filter(s => s.total > 0);
  }, [appointments, professionals]);

  const pieData = [{ name: 'Receitas', value: metrics.receitas, color: '#10b981' }, { name: 'Despesas', value: metrics.despesas, color: '#ef4444' }];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-print h-full overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white font-display italic tracking-tight">Centro de Resultados</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Controle de caixa e lucratividade.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-white/5 border border-white/10 p-3.5 rounded-xl text-zinc-400 hover:text-white transition-all"><Download size={20}/></button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 gradiente-ouro text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10"><Plus size={16}/> LANÇAR NO CAIXA</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setFilterType('RECEITA')} className={`cartao-vidro rounded-[2rem] p-8 border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all ${filterType === 'RECEITA' ? 'bg-emerald-500/5 border-emerald-500/30' : ''}`}>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24}/></div>
          <h3 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Receita Bruta</h3>
          <p className="text-3xl font-black text-white mt-2 font-display italic">R$ {metrics.receitas.toFixed(2)}</p>
        </div>
        <div onClick={() => setFilterType('DESPESA')} className={`cartao-vidro rounded-[2rem] p-8 border-white/5 cursor-pointer hover:border-red-500/30 transition-all ${filterType === 'DESPESA' ? 'bg-red-500/5 border-red-500/30' : ''}`}>
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6"><TrendingDown size={24}/></div>
          <h3 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Despesa Operacional</h3>
          <p className="text-3xl font-black text-white mt-2 font-display italic">R$ {metrics.despesas.toFixed(2)}</p>
        </div>
        <div onClick={() => setFilterType('TUDO')} className="cartao-vidro rounded-[2rem] p-8 border-[#D4AF37]/20 relative overflow-hidden group cursor-pointer">
          <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#C58A4A] rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24}/></div>
          <h3 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">EBITDA / Saldo</h3>
          <p className="text-3xl font-black text-[#D4AF37] mt-2 font-display italic">R$ {metrics.lucro.toFixed(2)}</p>
        </div>
      </div>

      {/* NOVO: Histórico por Barbeiro */}
      <div className="cartao-vidro rounded-[2rem] p-8 border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <UserCheck className="text-[#D4AF37]"/>
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Repasse de Comissões</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barberStats.map(stat => (
            <div key={stat.id} className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <p className="text-sm font-black italic text-white mb-4">{stat.name}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                  <span>Gerado Total:</span>
                  <span className="text-white">R$ {stat.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-black text-[#D4AF37]">
                  <span>Comissão:</span>
                  <span>R$ {stat.commission.toFixed(2)}</span>
                </div>
                <p className="text-[8px] font-black text-zinc-700 uppercase mt-2">Baseado em {stat.count} rituais concluídos</p>
              </div>
            </div>
          ))}
          {barberStats.length === 0 && <p className="col-span-full text-center py-6 text-zinc-600 text-[10px] font-black uppercase italic">Nenhum repasse registrado no período.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="cartao-vidro rounded-[2rem] p-8 border-white/5">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-8">Composição do Caixa</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: 'none' }} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="cartao-vidro rounded-[2rem] p-8 border-white/5">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-8">Performance Recente</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialEntries.slice(0, 5).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10}} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: 'none' }} />
                <Bar dataKey="amount" fill={CORES.primaria} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="cartao-vidro rounded-[2rem] p-8 border-white/5">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Extrato de Fluxo</h3>
           <button onClick={() => setFilterType('TUDO')} className="text-[9px] text-zinc-500 hover:text-white uppercase font-black">Resetar Filtros</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                <th className="pb-4">Descrição</th>
                <th className="pb-4">Categoria</th>
                <th className="pb-4">Data</th>
                <th className="pb-4 text-right">Valor</th>
                <th className="pb-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map(e => (
                <tr key={e.id} className="group hover:bg-white/[0.01] transition-all">
                  <td className="py-4 text-xs font-bold text-white italic">{e.description}</td>
                  <td className="py-4 text-[9px] text-zinc-500 font-black uppercase tracking-widest">{e.category}</td>
                  <td className="py-4 text-[10px] text-zinc-500 font-bold">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td className={`py-4 text-xs font-black text-right ${e.type === 'RECEITA' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {e.type === 'RECEITA' ? '+' : '-'} R$ {e.amount.toFixed(2)}
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => deleteFinancialEntry(e.id)} className="p-2 opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 && <p className="text-center py-10 text-[10px] text-zinc-600 font-black uppercase">Nenhum movimento registrado neste filtro.</p>}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className="cartao-vidro w-full max-w-md rounded-[2.5rem] p-10 space-y-6 border-[#D4AF37]/20 relative shadow-2xl">
            <h2 className="text-2xl font-black font-display italic">Lançamento Avulso</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Descrição" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-bold" />
              <input type="number" placeholder="Valor" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-bold" />
              <select value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-bold">
                <option value="RECEITA" className="bg-zinc-950">Entrada (Receita)</option>
                <option value="DESPESA" className="bg-zinc-950">Saída (Despesa)</option>
              </select>
              <input type="text" placeholder="Categoria" value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-bold" />
            </div>
            <div className="flex gap-3">
               <button onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-black text-[9px] uppercase text-zinc-500">Cancelar</button>
               <button onClick={() => { addFinancialEntry({...newEntry, date: new Date().toISOString().split('T')[0]}); setShowAddModal(false); }} className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black text-[9px] uppercase">Lançar Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
