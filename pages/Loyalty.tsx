// ============================================================
// pages/Loyalty.tsx — Programa de Fidelidade Completo
// Coloque em: src/pages/Loyalty.tsx
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Star, Gift, CreditCard, Trophy, Plus, Minus, Search,
  Stamp, Zap, TrendingUp, Users, Award, ChevronRight
} from 'lucide-react';
import { useBarberStore } from '../store';
import { LoyaltyCard } from '../types';

const STAMPS_FOR_FREE_CUT = 10; // padrão: 10 selos = 1 corte grátis
const CASHBACK_PERCENT = 5;     // padrão: 5% de cashback

const Loyalty: React.FC = () => {
  const { clients, appointments, config, theme } = useBarberStore();
  const {
    loyaltyCards, addLoyaltyCard, updateLoyaltyCard
  } = useBarberStore() as any; // cast pois será adicionado ao store

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualAction, setManualAction] = useState<{
    type: 'add_stamp' | 'add_credit' | 'use_free_cut' | 'remove_credit';
    amount: number;
    reason: string;
  }>({ type: 'add_stamp', amount: 1, reason: '' });

  const stampsForFreeCut = (config as any).stampsForFreeCut || STAMPS_FOR_FREE_CUT;
  const cashbackPercent = (config as any).cashbackPercent || CASHBACK_PERCENT;

  // Enriquecer cards com dados do cliente
  const enrichedCards = useMemo(() => {
    const cards: LoyaltyCard[] = loyaltyCards || [];
    return cards.map(card => {
      const client = clients.find(c => c.id === card.clientId);
      const clientApps = appointments.filter(
        a => a.clientId === card.clientId && a.status === 'CONCLUIDO_PAGO'
      );
      return { ...card, client, totalServices: clientApps.length };
    }).filter(c => {
      if (!searchTerm) return true;
      const name = c.client?.name?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase()) ||
        c.client?.phone?.includes(searchTerm);
    });
  }, [loyaltyCards, clients, appointments, searchTerm]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const cards: LoyaltyCard[] = loyaltyCards || [];
    return {
      totalCards: cards.length,
      totalCredits: cards.reduce((a, c) => a + (c.credits || 0), 0),
      totalFreeCutsUsed: cards.reduce((a, c) => a + (c.freeCutsEarned || 0), 0),
      totalStamps: cards.reduce((a, c) => a + (c.totalStamps || 0), 0),
    };
  }, [loyaltyCards]);

  const selectedCard = enrichedCards.find(c => c.clientId === selectedClient);

  const handleSave = async () => {
    if (!selectedClient || !selectedCard) return;
    let updates: Partial<LoyaltyCard> = {};

    if (manualAction.type === 'add_stamp') {
      const newStamps = (selectedCard.stamps || 0) + manualAction.amount;
      const stampsCycle = newStamps >= stampsForFreeCut;
      updates = {
        stamps: stampsCycle ? newStamps - stampsForFreeCut : newStamps,
        totalStamps: (selectedCard.totalStamps || 0) + manualAction.amount,
        freeCutsPending: stampsCycle
          ? (selectedCard.freeCutsPending || 0) + 1
          : selectedCard.freeCutsPending,
        freeCutsEarned: stampsCycle
          ? (selectedCard.freeCutsEarned || 0) + 1
          : selectedCard.freeCutsEarned,
      };
    } else if (manualAction.type === 'add_credit') {
      updates = { credits: (selectedCard.credits || 0) + manualAction.amount };
    } else if (manualAction.type === 'remove_credit') {
      updates = { credits: Math.max(0, (selectedCard.credits || 0) - manualAction.amount) };
    } else if (manualAction.type === 'use_free_cut') {
      if ((selectedCard.freeCutsPending || 0) < 1) {
        alert('Este cliente não possui cortes cortesia disponíveis!');
        return;
      }
      updates = { freeCutsPending: (selectedCard.freeCutsPending || 1) - 1 };
    }

    await updateLoyaltyCard(selectedClient, { ...updates, updatedAt: new Date().toISOString() });
    setShowManualModal(false);
    alert('✅ Fidelidade atualizada com sucesso!');
  };

  // Criar cartão se cliente não tiver
  const handleCreateCard = async (clientId: string) => {
    await addLoyaltyCard({
      clientId,
      stamps: 0,
      totalStamps: 0,
      credits: 0,
      freeCutsEarned: 0,
      freeCutsPending: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSelectedClient(clientId);
  };

  const themeCard = theme === 'light'
    ? 'bg-white border-zinc-200 shadow-sm'
    : 'cartao-vidro border-white/5';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
            Programa de Fidelidade
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            Selos · Cashback · Cortes Cortesia
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cartões Ativos', value: stats.totalCards, icon: CreditCard, color: '#C58A4A' },
          { label: 'Créditos em Circulação', value: `R$ ${stats.totalCredits.toFixed(2)}`, icon: Zap, color: '#10b981' },
          { label: 'Cortes Cortesia Dados', value: stats.totalFreeCutsUsed, icon: Gift, color: '#a855f7' },
          { label: 'Total de Selos', value: stats.totalStamps, icon: Star, color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className={`rounded-[2rem] p-6 border ${themeCard}`}>
            <s.icon size={22} style={{ color: s.color }} className="mb-4" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
        <input
          type="text"
          placeholder="Buscar cliente pelo nome ou telefone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`w-full border rounded-2xl py-4 pl-16 pr-8 text-sm focus:border-[#C58A4A]/50 outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/[0.03] border-white/10 text-white'}`}
        />
      </div>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Clientes SEM cartão */}
        {clients
          .filter(c => {
            const hasCard = (loyaltyCards || []).some((lc: LoyaltyCard) => lc.clientId === c.id);
            if (hasCard) return false;
            if (!searchTerm) return true;
            return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.phone.includes(searchTerm);
          })
          .slice(0, 6)
          .map(client => (
            <div key={client.id} className={`rounded-[2rem] p-6 border border-dashed cursor-pointer hover:border-[#C58A4A]/50 transition-all group ${theme === 'light' ? 'bg-zinc-50 border-zinc-300' : 'border-white/10 bg-white/[0.01]'}`}
              onClick={() => handleCreateCard(client.id)}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#C58A4A]/20 flex items-center justify-center font-black text-[#C58A4A] text-lg">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{client.name}</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">{client.phone}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest text-center py-3 group-hover:text-[#C58A4A] transition-colors">
                + Criar Cartão Fidelidade
              </p>
            </div>
          ))}

        {/* Clientes COM cartão */}
        {enrichedCards.map(card => {
          const progress = Math.round(((card.stamps || 0) / stampsForFreeCut) * 100);
          return (
            <div
              key={card.id}
              onClick={() => { setSelectedClient(card.clientId); setShowManualModal(true); }}
              className={`rounded-[2rem] p-6 border cursor-pointer hover:border-[#C58A4A]/50 transition-all group ${themeCard}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C58A4A]/10 flex items-center justify-center font-black text-[#C58A4A] text-lg">
                    {card.client?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      {card.client?.name || 'Cliente'}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-bold">{card.client?.phone}</p>
                  </div>
                </div>
                {(card.freeCutsPending || 0) > 0 && (
                  <span className="bg-[#C58A4A] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase">
                    {card.freeCutsPending}x Grátis!
                  </span>
                )}
              </div>

              {/* Selos */}
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 mb-2">
                  <span>Selos</span>
                  <span>{card.stamps || 0}/{stampsForFreeCut}</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: stampsForFreeCut }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 rounded-md transition-all ${i < (card.stamps || 0)
                        ? 'bg-[#C58A4A]'
                        : theme === 'light' ? 'bg-zinc-200' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className={`mt-1.5 h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-zinc-200' : 'bg-white/10'}`}>
                  <div
                    className="h-full bg-[#C58A4A] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Créditos */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <span className="text-[9px] font-black uppercase text-zinc-500">Cashback Disponível</span>
                <span className="font-black text-emerald-500">R$ {(card.credits || 0).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Ações Manuais */}
      {showManualModal && selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className={`w-full max-w-md rounded-[3rem] p-10 space-y-8 border shadow-2xl ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#C58A4A]/20'}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C58A4A] text-black flex items-center justify-center text-2xl font-black">
                {selectedCard.client?.name?.charAt(0)}
              </div>
              <div>
                <h2 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  {selectedCard.client?.name}
                </h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase">Gerenciar Fidelidade</p>
              </div>
            </div>

            {/* Resumo atual */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Selos</p>
                <p className="text-xl font-black text-[#C58A4A]">{selectedCard.stamps || 0}<span className="text-xs">/{stampsForFreeCut}</span></p>
              </div>
              <div className={`p-4 rounded-2xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Créditos</p>
                <p className="text-xl font-black text-emerald-500">R${(selectedCard.credits || 0).toFixed(0)}</p>
              </div>
              <div className={`p-4 rounded-2xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Grátis</p>
                <p className="text-xl font-black text-purple-400">{selectedCard.freeCutsPending || 0}</p>
              </div>
            </div>

            {/* Ação */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ação</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'add_stamp' as const, label: '+ Selo', color: 'bg-[#C58A4A] text-black' },
                  { type: 'add_credit' as const, label: '+ Crédito', color: 'bg-emerald-600 text-white' },
                  { type: 'remove_credit' as const, label: '- Crédito', color: 'bg-red-600 text-white' },
                  { type: 'use_free_cut' as const, label: 'Usar Corte Grátis', color: 'bg-purple-600 text-white' },
                ].map(a => (
                  <button
                    key={a.type}
                    onClick={() => setManualAction({ ...manualAction, type: a.type })}
                    className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase transition-all ${manualAction.type === a.type ? a.color : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {manualAction.type !== 'use_free_cut' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setManualAction(p => ({ ...p, amount: Math.max(1, p.amount - 1) }))}
                    className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white"
                  >
                    <Minus size={16} />
                  </button>
                  <span className={`flex-1 text-center text-2xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    {manualAction.type === 'add_stamp' ? manualAction.amount : `R$ ${manualAction.amount}`}
                  </span>
                  <button
                    onClick={() => setManualAction(p => ({ ...p, amount: p.amount + 1 }))}
                    className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase text-[9px] text-zinc-500"
              >
                Fechar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-[9px]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loyalty;
