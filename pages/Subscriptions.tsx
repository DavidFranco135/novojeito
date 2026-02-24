import React, { useState, useMemo } from 'react';
import { Crown, Plus, X, Check, Clock, AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useBarberStore } from '../store';
import { Subscription } from '../types';

const Subscriptions: React.FC = () => {
  const store = useBarberStore() as any;
  const { clients, config, theme } = store;
  const { subscriptions, addSubscription, updateSubscription } = store;

  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'TODAS' | 'ATIVA' | 'VENCIDA' | 'CANCELADA'>('TODAS');
  const [formData, setFormData] = useState({
    clientId: '',
    planId: '',
    usageLimit: 0,
    paymentMethod: 'PIX',
  });

  const plans = config.vipPlans?.filter((p: any) => p.status === 'ATIVO') || [];

  const enriched = useMemo(() => {
    const subs: Subscription[] = subscriptions || [];
    const today = new Date();
    return subs
      .map(sub => {
        const end = new Date(sub.endDate);
        let computedStatus = sub.status;
        if (sub.status === 'ATIVA' && end < today) computedStatus = 'VENCIDA';
        const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...sub, computedStatus, daysLeft };
      })
      .filter(s => filterStatus === 'TODAS' || s.computedStatus === filterStatus);
  }, [subscriptions, filterStatus]);

  const stats = useMemo(() => {
    const subs: Subscription[] = subscriptions || [];
    const ativas = subs.filter(s => s.status === 'ATIVA');
    const mrr = ativas.reduce((a, s) => a + s.price, 0);
    return { total: subs.length, ativas: ativas.length, mrr, vencidas: subs.filter(s => s.status === 'VENCIDA').length };
  }, [subscriptions]);

  const handleCreate = async () => {
    if (!formData.clientId || !formData.planId) { alert('Selecione cliente e plano!'); return; }
    const client = clients.find((c: any) => c.id === formData.clientId);
    const plan = plans.find((p: any) => p.id === formData.planId);
    if (!client || !plan) return;

    const startDate = new Date();
    const endDate = new Date();
    if (plan.period === 'MENSAL') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    await addSubscription({
      clientId: formData.clientId,
      clientName: client.name,
      planId: formData.planId,
      planName: plan.name,
      price: plan.price,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'ATIVA',
      usageCount: 0,
      usageLimit: formData.usageLimit || undefined,
      paymentHistory: [{
        id: `pay_${Date.now()}`,
        date: new Date().toLocaleDateString('pt-BR'),
        amount: plan.price,
        method: formData.paymentMethod,
        status: 'PAGO'
      }],
      createdAt: new Date().toISOString(),
    });
    setShowModal(false);
    setFormData({ clientId: '', planId: '', usageLimit: 0, paymentMethod: 'PIX' });
    alert('✅ Assinatura criada com sucesso!');
  };

  const statusConfig = {
    ATIVA:    { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: Check },
    VENCIDA:  { color: 'text-red-500 bg-red-500/10 border-red-500/20',           icon: AlertCircle },
    CANCELADA:{ color: 'text-zinc-500 bg-white/5 border-white/10',               icon: X },
    PAUSADA:  { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',     icon: Clock },
  };

  const isDark    = theme !== 'light';
  const bg        = isDark ? 'bg-[#111] border-white/10' : 'bg-white border-zinc-200 shadow-sm';
  const txt       = isDark ? 'text-white' : 'text-zinc-900';
  const inp       = `w-full border p-4 rounded-xl outline-none font-bold text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`;
  const overlay   = 'fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in zoom-in-95';
  const mdl       = `w-full max-w-md rounded-[3rem] p-10 space-y-7 border shadow-2xl ${isDark ? 'bg-[#111] border-[#C58A4A]/30' : 'bg-white border-zinc-200'}`;
  const btnCancel = `flex-1 py-4 rounded-2xl font-black uppercase text-[9px] ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-600'}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${txt}`}>Assinaturas</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Controle de planos mensais e anuais.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 gradiente-ouro text-black px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
          <Plus size={16} /> Nova Assinatura
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: '#C58A4A' },
          { label: 'Ativas', value: stats.ativas, icon: Crown, color: '#10b981' },
          { label: 'MRR', value: `R$ ${stats.mrr.toFixed(2)}`, icon: TrendingUp, color: '#3b82f6' },
          { label: 'Vencidas', value: stats.vencidas, icon: AlertCircle, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className={`rounded-[2rem] p-6 border ${bg}`}>
            <s.icon size={22} style={{ color: s.color }} className="mb-4" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['TODAS', 'ATIVA', 'VENCIDA', 'CANCELADA'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[#C58A4A] text-black' : isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {enriched.length === 0 && (
          <div className={`rounded-[2rem] p-16 text-center border ${bg}`}>
            <Crown className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-[10px] font-black uppercase text-zinc-600">Nenhuma assinatura encontrada.</p>
          </div>
        )}
        {enriched.map(sub => {
          const sc = statusConfig[sub.computedStatus as keyof typeof statusConfig] || statusConfig.ATIVA;
          const StatusIcon = sc.icon;
          const usagePercent = sub.usageLimit ? Math.min(100, Math.round((sub.usageCount / sub.usageLimit) * 100)) : null;

          return (
            <div key={sub.id} className={`rounded-[2rem] p-6 md:p-8 border ${bg}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#C58A4A]/10 flex items-center justify-center text-2xl font-black text-[#C58A4A]">
                    {sub.clientName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`font-black text-lg ${txt}`}>{sub.clientName}</p>
                    <p className="text-zinc-500 text-[9px] font-black uppercase">{sub.planName}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${sc.color}`}>
                        <StatusIcon size={10} /> {sub.computedStatus}
                      </span>
                      {sub.computedStatus === 'ATIVA' && (
                        <span className="text-[9px] text-zinc-500 font-bold">
                          {sub.daysLeft > 0 ? `${sub.daysLeft}d restantes` : 'Vence hoje'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Usos</p>
                    <p className={`font-black text-xl ${txt}`}>{sub.usageCount}{sub.usageLimit ? `/${sub.usageLimit}` : ''}</p>
                    {usagePercent !== null && (
                      <div className={`mt-1 w-16 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`}>
                        <div className="h-full bg-[#C58A4A] rounded-full" style={{ width: `${usagePercent}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Valor</p>
                    <p className="font-black text-xl text-[#C58A4A]">R$ {sub.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    {sub.computedStatus === 'ATIVA' && (
                      <button onClick={() => updateSubscription(sub.id, { usageCount: (sub.usageCount || 0) + 1 })}
                        className="p-3 gradiente-ouro text-black rounded-xl font-black text-[10px]">+Uso</button>
                    )}
                    <button onClick={() => updateSubscription(sub.id, { status: sub.status === 'ATIVA' ? 'CANCELADA' : 'ATIVA' })}
                      className={`p-3 rounded-xl text-[9px] font-black border transition-all ${isDark ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                      {sub.status === 'ATIVA' ? 'Cancelar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal Nova Assinatura ── */}
      {showModal && (
        <div className={overlay}>
          <div className={mdl}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black font-display italic ${txt}`}>Nova Assinatura</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliente</label>
                <select value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className={inp}>
                  <option value="">Selecione...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Plano</label>
                <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} className={inp}>
                  <option value="">Selecione...</option>
                  {plans.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} — R$ {p.price}/{p.period === 'MENSAL' ? 'mês' : 'ano'}</option>
                  ))}
                </select>
                {plans.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-bold">⚠️ Nenhum plano VIP ativo. Crie um em Ajustes Master.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Limite de Usos (0 = ilimitado)</label>
                <input type="number" min={0} value={formData.usageLimit}
                  onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })} className={inp} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Forma de Pagamento</label>
                <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className={inp}>
                  {['PIX', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className={btnCancel}>Cancelar</button>
              <button onClick={handleCreate} className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-[9px]">Criar Assinatura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
