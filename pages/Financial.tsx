import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Download, UserCheck, Trophy, Filter, Calendar, X, Scissors, User, Clock, CreditCard, Banknote, Phone } from 'lucide-react';
import { useBarberStore } from '../store';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { CORES } from '../constants';

type PeriodFilter = 'HOJE' | 'SEMANA' | 'MES' | 'ANO' | 'TUDO' | 'CUSTOM';

const Financial: React.FC = () => {
  const { financialEntries, appointments, professionals, clients, addFinancialEntry, deleteFinancialEntry, theme } = useBarberStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [filterType, setFilterType] = useState<'RECEITA' | 'DESPESA' | 'TUDO'>('TUDO');
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('MES');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterProfId, setFilterProfId] = useState<string>('TODOS');
  const [newEntry, setNewEntry] = useState({ description: '', amount: 0, type: 'RECEITA' as 'RECEITA' | 'DESPESA', category: 'Geral', dueDate: '', isFixed: false });
  const [expenseTab, setExpenseTab] = useState<'TODAS' | 'FIXAS' | 'VARIAVEIS' | 'PENDENTES'>('TODAS');

  const EXPENSE_CATEGORIES = ['Aluguel', 'Energia', 'Água', 'Internet', 'Folha de pagamento', 'Produto', 'Equipamento', 'Marketing', 'Manutenção', 'Outros'];

  const isDark = theme !== 'light';
  const cardClass = isDark ? 'cartao-vidro border-white/5' : 'bg-white border border-zinc-200 shadow-sm';
  const inputClass = `w-full border p-4 rounded-xl outline-none font-bold transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`;

  // ── Calcular intervalo de datas para o filtro ─────────────────
  const dateRange = useMemo(() => {
    const now = new Date();
    // Usa data LOCAL para evitar bug de fuso horário (UTC vs Brasília)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    switch (filterPeriod) {
      case 'HOJE': return { start: todayStr, end: todayStr };
      case 'SEMANA': return { start: `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth()+1).padStart(2,'0')}-${String(startOfWeek.getDate()).padStart(2,'0')}`, end: todayStr };
      case 'MES': return { start: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth()+1).padStart(2,'0')}-${String(startOfMonth.getDate()).padStart(2,'0')}`, end: todayStr };
      case 'ANO': return { start: `${startOfYear.getFullYear()}-${String(startOfYear.getMonth()+1).padStart(2,'0')}-${String(startOfYear.getDate()).padStart(2,'0')}`, end: todayStr };
      case 'CUSTOM': return { start: customStart, end: customEnd };
      default: return { start: '', end: '' };
    }
  }, [filterPeriod, customStart, customEnd]);

  // ── Entradas filtradas por período + tipo ─────────────────────
  // Exclui entradas de fiado pendente (ainda não recebidas) de todo o extrato e métricas
  const paidEntries = useMemo(() =>
    financialEntries.filter(e => !(e as any).fiadoPending),
    [financialEntries]
  );

  const filteredEntries = useMemo(() => {
    return paidEntries.filter(e => {
      const matchType = filterType === 'TUDO' || e.type === filterType;
      const matchPeriod = !dateRange.start || (e.date >= dateRange.start && e.date <= dateRange.end);
      return matchType && matchPeriod;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [paidEntries, filterType, dateRange]);

  // ── Métricas do período selecionado ───────────────────────────
  const metrics = useMemo(() => {
    const periodEntries = paidEntries.filter(e => {
      return !dateRange.start || (e.date >= dateRange.start && e.date <= dateRange.end);
    });
    const receitas = periodEntries.filter(e => e.type === 'RECEITA').reduce((acc, e) => acc + e.amount, 0);
    const despesas = periodEntries.filter(e => e.type === 'DESPESA').reduce((acc, e) => acc + e.amount, 0);
    // Saldo total global
    const totalReceitas = paidEntries.filter(e => e.type === 'RECEITA').reduce((acc, e) => acc + e.amount, 0);
    const totalDespesas = paidEntries.filter(e => e.type === 'DESPESA').reduce((acc, e) => acc + e.amount, 0);
    const contasPendentes = financialEntries.filter(e => e.type === 'DESPESA' && (e as any).dueDate && !(e as any).paid);
    const totalPendente = contasPendentes.reduce((acc, e) => acc + e.amount, 0);
    const despesasFixas = periodEntries.filter(e => e.type === 'DESPESA' && (e as any).isFixed).reduce((acc, e) => acc + e.amount, 0);
    const despesasVarveis = despesas - despesasFixas;
    return { receitas, despesas, lucro: receitas - despesas, saldoGlobal: totalReceitas - totalDespesas, totalPendente, contasPendentes: contasPendentes.length, despesasFixas, despesasVarveis };
  }, [financialEntries, dateRange]);

  // ── Comissões por profissional ────────────────────────────────
  const barberStats = useMemo(() => {
    return professionals.map(p => {
      const pApps = appointments.filter(a =>
        a.professionalId === p.id &&
        a.status === 'CONCLUIDO_PAGO' &&
        (!dateRange.start || (a.date >= dateRange.start && a.date <= dateRange.end))
      );
      const totalGenerated = pApps.reduce((acc, curr) => acc + curr.price, 0);
      const commission = (totalGenerated * (p.commission || 0)) / 100;
      return { id: p.id, name: p.name, total: totalGenerated, commission, count: pApps.length };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  }, [appointments, professionals, dateRange]);

  // ── Gráfico por período (últimos dias do filtro) ───────────────
  const chartData = useMemo(() => {
    const days: { name: string; receita: number; despesa: number }[] = [];
    const endDate = dateRange.end ? new Date(dateRange.end + 'T12:00:00') : new Date();
    const startDate = dateRange.start ? new Date(dateRange.start + 'T12:00:00') : new Date(endDate.getTime() - 6 * 86400000);
    const diffDays = Math.min(Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1, 30);

    for (let i = Math.max(diffDays - 1, 0); i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const receita = paidEntries.filter(e => e.date === dateStr && e.type === 'RECEITA').reduce((acc, e) => acc + e.amount, 0);
      const despesa = paidEntries.filter(e => e.date === dateStr && e.type === 'DESPESA').reduce((acc, e) => acc + e.amount, 0);
      days.push({ name: label, receita, despesa });
    }
    return days;
  }, [financialEntries, dateRange]);

  const pieData = [
    { name: 'Receitas', value: metrics.receitas, color: '#10b981' },
    { name: 'Despesas', value: metrics.despesas, color: '#ef4444' },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#0A0A0A' : '#fff',
    border: 'none',
    borderRadius: '12px',
    color: isDark ? '#fff' : '#000',
  };

  const PERIODS: { key: PeriodFilter; label: string }[] = [
    { key: 'HOJE', label: 'Hoje' },
    { key: 'SEMANA', label: 'Semana' },
    { key: 'MES', label: 'Mês' },
    { key: 'ANO', label: 'Ano' },
    { key: 'TUDO', label: 'Tudo' },
    { key: 'CUSTOM', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-print h-full overflow-auto scrollbar-hide">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Centro de Resultados</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Controle de caixa e lucratividade.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className={`p-3.5 rounded-xl transition-all border ${isDark ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}><Download size={20} /></button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 gradiente-ouro text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
            <Plus size={16} /> LANÇAR NO CAIXA
          </button>
        </div>
      </div>

      {/* ── Filtros de Período ── */}
      <div className={`${cardClass} rounded-[2rem] p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Filter size={14} className="text-[#C58A4A]" />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Filtrar por Período</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setFilterPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                filterPeriod === p.key
                  ? 'bg-[#C58A4A] text-black border-transparent'
                  : isDark ? 'bg-white/5 text-zinc-500 border-white/5 hover:border-[#C58A4A]/30' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-[#C58A4A]/30'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {filterPeriod === 'CUSTOM' && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>De</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Até</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}
      </div>

      {/* ── Cards de métricas do período ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => setFilterType('RECEITA')}
          className={`${cardClass} rounded-[2rem] p-8 cursor-pointer hover:border-emerald-500/30 transition-all ${filterType === 'RECEITA' ? (isDark ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300') : ''}`}
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
          <h3 className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Receita do Período</h3>
          <p className={`text-3xl font-black mt-2 font-display italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>R$ {metrics.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div
          onClick={() => setFilterType('DESPESA')}
          className={`${cardClass} rounded-[2rem] p-8 cursor-pointer hover:border-red-500/30 transition-all ${filterType === 'DESPESA' ? (isDark ? 'bg-red-500/5 border-red-500/30' : 'bg-red-50 border-red-300') : ''}`}
        >
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6"><TrendingDown size={24} /></div>
          <h3 className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Despesa do Período</h3>
          <p className={`text-3xl font-black mt-2 font-display italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>R$ {metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div
          onClick={() => setFilterType('TUDO')}
          className={`${cardClass} rounded-[2rem] p-8 border-[#C58A4A]/20 cursor-pointer hover:border-[#C58A4A]/40 transition-all`}
        >
          <div className="w-12 h-12 bg-[#C58A4A]/10 text-[#C58A4A] rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24} /></div>
          <h3 className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Lucro do Período</h3>
          <p className={`text-3xl font-black mt-2 font-display italic ${metrics.lucro >= 0 ? 'text-[#C58A4A]' : 'text-red-500'}`}>
            R$ {metrics.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saldo Atual Global */}
        <div className={`${cardClass} rounded-[2rem] p-8 border-blue-500/20`}>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
          <h3 className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Saldo Atual (Global)</h3>
          <p className={`text-3xl font-black mt-2 font-display italic ${metrics.saldoGlobal >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
            R$ {metrics.saldoGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Custos Fixos vs Variáveis ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${cardClass} rounded-[2rem] p-6`}>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>📌 Custos Fixos</p>
          <p className="text-2xl font-black text-orange-400 font-display italic">R$ {metrics.despesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className={`text-[9px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Aluguel, salários, contratos</p>
        </div>
        <div className={`${cardClass} rounded-[2rem] p-6`}>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>🔀 Custos Variáveis</p>
          <p className="text-2xl font-black text-yellow-400 font-display italic">R$ {metrics.despesasVarveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className={`text-[9px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Produtos, manutenção, etc</p>
        </div>
        <div className={`${cardClass} rounded-[2rem] p-6 ${metrics.contasPendentes > 0 ? 'border-red-500/30 bg-red-500/5' : ''}`}>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${metrics.contasPendentes > 0 ? 'text-red-400' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>⏰ Contas a Vencer</p>
          <p className={`text-2xl font-black font-display italic ${metrics.contasPendentes > 0 ? 'text-red-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            R$ {metrics.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-[9px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{metrics.contasPendentes} conta(s) pendente(s)</p>
        </div>
      </div>

      {/* ── Repasse de Comissões ── */}
      <div className={`${cardClass} rounded-[2rem] p-8`}>
        <div className="flex items-center gap-3 mb-8">
          <UserCheck className="text-[#C58A4A]" />
          <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Repasse de Comissões — {PERIODS.find(p => p.key === filterPeriod)?.label}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barberStats.map(stat => (
            <div key={stat.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <p className={`text-sm font-black italic mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{stat.name}</p>
              <div className="space-y-2">
                <div className={`flex justify-between text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <span>Gerado Total:</span>
                  <span className={isDark ? 'text-white' : 'text-zinc-900'}>R$ {stat.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase font-black text-[#C58A4A]">
                  <span>Comissão:</span>
                  <span>R$ {stat.commission.toFixed(2)}</span>
                </div>
                <p className={`text-[8px] font-black uppercase mt-2 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>Baseado em {stat.count} serviços concluídos</p>
              </div>
            </div>
          ))}
          {barberStats.length === 0 && (
            <p className={`col-span-full text-center py-6 text-[10px] font-black uppercase italic ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Nenhum repasse no período selecionado.
            </p>
          )}
        </div>
      </div>

      {/* ── Ranking de Barbeiros ── */}
      <div className={`${cardClass} rounded-[2rem] p-8`}>
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="text-[#C58A4A]" />
          <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Ranking de Barbeiros</h3>
        </div>
        <div className="space-y-4">
          {barberStats.map((stat, idx) => (
            <div key={stat.id} className={`flex items-center gap-5 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                idx === 0 ? 'bg-yellow-400 text-black' :
                idx === 1 ? 'bg-zinc-400 text-black' :
                idx === 2 ? 'bg-amber-700 text-white' :
                isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-black italic truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{stat.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}>
                    <div
                      className="h-full bg-[#C58A4A] rounded-full transition-all duration-700"
                      style={{ width: barberStats[0]?.total > 0 ? `${(stat.total / barberStats[0].total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className={`text-[9px] font-black uppercase w-16 text-right shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{stat.count} serv.</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>R$ {stat.total.toFixed(2)}</p>
                <p className="text-[8px] font-black text-[#C58A4A] uppercase mt-0.5">R$ {stat.commission.toFixed(2)} comissão</p>
              </div>
            </div>
          ))}
          {barberStats.length === 0 && (
            <p className={`text-center py-8 text-[10px] font-black uppercase italic ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Nenhum serviço concluído no período.
            </p>
          )}
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${cardClass} rounded-[2rem] p-8`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Composição do Caixa</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, '']} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${cardClass} rounded-[2rem] p-8`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Receitas vs Despesas — Período</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff05' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#52525b' : '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#52525b' : '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, '']} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#10b981" strokeWidth={2} fill="url(#colorR)" />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} fill="url(#colorD)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Extrato ── */}
      <div className={`${cardClass} rounded-[2rem] p-8`}>
        <div className="flex items-center justify-between mb-8">
          <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Extrato de Fluxo</h3>
          <div className="flex gap-2">
            {(['TUDO', 'RECEITA', 'DESPESA'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  filterType === t
                    ? t === 'RECEITA' ? 'bg-emerald-500 text-white border-transparent'
                    : t === 'DESPESA' ? 'bg-red-500 text-white border-transparent'
                    : 'bg-[#C58A4A] text-black border-transparent'
                    : isDark ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b text-[9px] font-black uppercase tracking-widest ${isDark ? 'border-white/5 text-zinc-600' : 'border-zinc-200 text-zinc-400'}`}>
                <th className="pb-4">Descrição</th>
                <th className="pb-4">Categoria</th>
                <th className="pb-4">Data</th>
                <th className="pb-4 text-right">Valor</th>
                <th className="pb-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-zinc-100'}`}>
              {filteredEntries.map(e => (
                <tr key={e.id} onClick={() => setSelectedEntry(e)} className={`group transition-all cursor-pointer ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-50'}`}>
                  <td className={`py-4 text-xs font-bold italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>{e.description}</td>
                  <td className={`py-4 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{e.category}</td>
                  <td className={`py-4 text-[10px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className={`py-4 text-xs font-black text-right ${e.type === 'RECEITA' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {e.type === 'RECEITA' ? '+' : '-'} R$ {e.amount.toFixed(2)}
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => deleteFinancialEntry(e.id)} className={`p-2 opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-zinc-700 hover:text-red-500' : 'text-zinc-400 hover:text-red-500'}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <p className={`text-center py-10 text-[10px] font-black uppercase italic ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Nenhum movimento no período selecionado.
            </p>
          )}
        </div>
      </div>

      {/* ── Modal Lançamento ── */}
      {showAddModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${isDark ? 'bg-black/95' : 'bg-black/70'}`}>
          <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'cartao-vidro border-[#C58A4A]/20' : 'bg-white border border-zinc-200'}`}>
            <div className="p-8 pb-4 shrink-0">
              <h2 className={`text-2xl font-black font-display italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>Novo Lançamento</h2>
            </div>
            <div className="overflow-y-auto flex-1 px-8 pb-4 space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-3">
                {(['RECEITA', 'DESPESA'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: t })}
                    className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${newEntry.type === t ? (t === 'RECEITA' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500') : isDark ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                    {t === 'RECEITA' ? '📈 Receita' : '📉 Despesa'}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Descrição" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} className={inputClass} />
              <input type="number" placeholder="Valor R$" value={newEntry.amount || ''} onChange={e => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })} className={inputClass} />
              {/* Categoria */}
              {newEntry.type === 'DESPESA' ? (
                <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} className={inputClass}>
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Categoria (ex: Corte, Barba...)" value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value })} className={inputClass} />
              )}
              {/* Opções extras para despesa */}
              {newEntry.type === 'DESPESA' && (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10">
                    <input type="checkbox" id="isFixed" checked={newEntry.isFixed} onChange={e => setNewEntry({ ...newEntry, isFixed: e.target.checked })} className="w-5 h-5 rounded accent-amber-500"/>
                    <label htmlFor="isFixed" className={`text-sm font-black cursor-pointer ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      Custo Fixo <span className={`text-[9px] font-bold ml-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>(aluguel, salário, etc)</span>
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Data de vencimento (opcional)</label>
                    <input type="date" value={newEntry.dueDate} onChange={e => setNewEntry({ ...newEntry, dueDate: e.target.value })} className={inputClass} />
                  </div>
                </>
              )}
            </div>
            <div className="p-8 pt-4 flex gap-3 shrink-0 border-t border-white/5">
              <button onClick={() => setShowAddModal(false)} className={`flex-1 py-4 rounded-xl font-black text-[9px] uppercase ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-500'}`}>Cancelar</button>
              <button
                onClick={() => {
                  addFinancialEntry({ ...newEntry, date: new Date().toISOString().split('T')[0] } as any);
                  setShowAddModal(false);
                  setNewEntry({ description: '', amount: 0, type: 'RECEITA', category: 'Geral', dueDate: '', isFixed: false });
                }}
                className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black text-[9px] uppercase"
              >
                Lançar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Detalhes do Lançamento ───────────────────────────────── */}
      {selectedEntry && (() => {
        const e = selectedEntry;
        const linkedApp = e.appointmentId ? appointments.find((a: any) => a.id === e.appointmentId) : null;
        const linkedClient = linkedApp
          ? clients.find((c: any) => c.id === linkedApp.clientId || c.phone === linkedApp.clientPhone)
          : null;
        const linkedProf = linkedApp
          ? professionals.find((p: any) => p.id === linkedApp.professionalId)
          : null;
        const payMethodLabel: Record<string, string> = {
          PIX: '📲 PIX', CARTAO: '💳 Cartão', DINHEIRO: '💵 Dinheiro', LINK: '🔗 Link de Pagamento'
        };
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in zoom-in-95" onClick={e2 => { if (e2.target === e2.currentTarget) setSelectedEntry(null); }}>
            <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl border flex flex-col max-h-[90vh] ${isDark ? 'cartao-vidro border-[#C58A4A]/20' : 'bg-white border-zinc-200'}`}>
              {/* Header */}
              <div className="p-8 pb-4 flex items-start justify-between shrink-0">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#C58A4A] mb-1">
                    Detalhes do Lançamento
                  </p>
                  <h2 className={`text-xl font-black font-display italic leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {e.description}
                  </h2>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all ml-4 shrink-0">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              {/* Value badge */}
              <div className="px-8 pb-4 shrink-0">
                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-lg ${e.type === 'RECEITA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                  {e.type === 'RECEITA' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                  {e.type === 'RECEITA' ? '+' : '-'} R$ {Number(e.amount).toFixed(2)}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-8 pb-4 space-y-3">
                {/* Base info */}
                <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Categoria</span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{e.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Tipo</span>
                    <span className={`text-xs font-black uppercase ${e.type === 'RECEITA' ? 'text-emerald-400' : 'text-red-400'}`}>{e.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Data</span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {(e as any).isFixed !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Custo</span>
                      <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{(e as any).isFixed ? '📌 Fixo' : '🔀 Variável'}</span>
                    </div>
                  )}
                  {(e as any).dueDate && (
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Vencimento</span>
                      <span className="text-xs font-black text-orange-400">
                        {new Date((e as any).dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Linked appointment details */}
                {linkedApp && (
                  <>
                    <p className={`text-[9px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      📅 Agendamento Vinculado
                    </p>
                    <div className={`p-4 rounded-2xl space-y-3 border ${isDark ? 'bg-[#C58A4A]/5 border-[#C58A4A]/20' : 'bg-amber-50 border-amber-200'}`}>
                      {/* Client */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#C58A4A]/10 flex items-center justify-center shrink-0">
                          <User size={16} className="text-[#C58A4A]"/>
                        </div>
                        <div>
                          <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{linkedApp.clientName}</p>
                          {linkedClient?.phone && (
                            <a href={`https://wa.me/55${linkedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-[#C58A4A] hover:underline">
                              📞 {linkedClient.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Service */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#C58A4A]/10 flex items-center justify-center shrink-0">
                          <Scissors size={16} className="text-[#C58A4A]"/>
                        </div>
                        <div>
                          <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{linkedApp.serviceName}</p>
                          <p className={`text-[9px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>R$ {Number(linkedApp.price).toFixed(2)}</p>
                        </div>
                      </div>
                      {/* Professional */}
                      {linkedProf && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#C58A4A]/10 flex items-center justify-center shrink-0">
                            <User size={16} className="text-[#C58A4A]"/>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Barbeiro</p>
                            <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{linkedApp.professionalName}</p>
                          </div>
                        </div>
                      )}
                      {/* Date/Time */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#C58A4A]/10 flex items-center justify-center shrink-0">
                          <Clock size={16} className="text-[#C58A4A]"/>
                        </div>
                        <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Data e Horário</p>
                          <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {linkedApp.date?.split('-').reverse().join('/')} • {linkedApp.startTime} – {linkedApp.endTime}
                          </p>
                        </div>
                      </div>
                      {/* Payment method */}
                      {linkedApp.paymentMethod && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Forma de Pagamento</span>
                          <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {payMethodLabel[linkedApp.paymentMethod] || linkedApp.paymentMethod}
                          </span>
                        </div>
                      )}
                      {/* Additionals */}
                      {linkedApp.additionals && linkedApp.additionals.length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Adicionais</p>
                          {linkedApp.additionals.map((ad: any) => (
                            <div key={ad.id} className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{ad.qty}x {ad.name}</span>
                              <span className="text-[10px] font-black text-[#C58A4A]">R$ {(ad.price * ad.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Total */}
                      {linkedApp.totalPrice && (
                        <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-[#C58A4A]/20' : 'border-amber-200'}`}>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Cobrado</span>
                          <span className="text-sm font-black text-[#C58A4A]">R$ {Number(linkedApp.totalPrice).toFixed(2)}</span>
                        </div>
                      )}
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Status</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${linkedApp.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {linkedApp.status === 'CONCLUIDO_PAGO' ? '✅ Pago' : linkedApp.status}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className={`px-8 py-6 shrink-0 border-t ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
                <div className="flex gap-3">
                  <button
                    onClick={() => { if (window.confirm('Excluir este lançamento?')) { deleteFinancialEntry(e.id); setSelectedEntry(null); } }}
                    className="flex-1 py-3 rounded-xl font-black text-[9px] uppercase bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12}/> Excluir
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase border transition-all ${isDark ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Financial;
