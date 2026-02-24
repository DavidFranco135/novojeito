// ============================================================
// pages/Partners.tsx — Parceiros + QR Code Único e Temporário
// Coloque em: src/pages/Partners.tsx
// ============================================================

import React, { useState, useMemo, useRef } from 'react';
import {
  QrCode, Plus, Trash2, RefreshCw, Copy, Check,
  Users, TrendingUp, Link, X, Edit2
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Partner } from '../types';

// Gera QR Code usando a API gratuita do QR Server (sem chave necessária)
const QR_API = (token: string, size = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    `${window.location.origin}?partner=${token}`
  )}`;

// Gera token único
const genToken = () => Math.random().toString(36).substring(2, 10).toUpperCase();

// Adiciona X dias a hoje
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const Partners: React.FC = () => {
  const { theme } = useBarberStore();
  const { partners, addPartner, updatePartner, deletePartner } = useBarberStore() as any;

  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<Partner | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    discount: 10,
    cashbackPercent: 5,
    expiryDays: 30,
  });

  const enriched = useMemo(() => {
    const ps: Partner[] = partners || [];
    const now = new Date();
    return ps.map(p => ({
      ...p,
      isExpired: new Date(p.qrCodeExpiry) < now,
    }));
  }, [partners]);

  const stats = useMemo(() => {
    const ps: Partner[] = partners || [];
    return {
      total: ps.length,
      ativos: ps.filter(p => p.status === 'ATIVO').length,
      totalReferrals: ps.reduce((a, p) => a + (p.totalReferrals || 0), 0),
    };
  }, [partners]);

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('Preencha nome e telefone!');
      return;
    }

    const payload = {
      name: formData.name,
      businessName: formData.businessName,
      phone: formData.phone,
      email: formData.email,
      discount: formData.discount,
      cashbackPercent: formData.cashbackPercent,
      qrCodeToken: genToken(),
      qrCodeExpiry: addDays(formData.expiryDays),
      totalReferrals: 0,
      status: 'ATIVO' as const,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      await updatePartner(editingId, { ...payload, totalReferrals: showQrModal?.totalReferrals || 0 });
    } else {
      await addPartner(payload);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', businessName: '', phone: '', email: '', discount: 10, cashbackPercent: 5, expiryDays: 30 });
  };

  const handleRegenerateQR = async (partner: Partner) => {
    if (!confirm('Gerar novo QR Code? O anterior deixará de funcionar.')) return;
    await updatePartner(partner.id, {
      qrCodeToken: genToken(),
      qrCodeExpiry: addDays(30),
      status: 'ATIVO',
    });
    alert('✅ Novo QR Code gerado!');
    setShowQrModal(null);
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}?partner=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeCard = theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
            Área de Parceiros
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            QR Codes únicos · Rastreamento de indicações
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 gradiente-ouro text-black px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
        >
          <Plus size={16} /> Novo Parceiro
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Parceiros', value: stats.total, color: '#C58A4A' },
          { label: 'Ativos', value: stats.ativos, color: '#10b981' },
          { label: 'Total Indicações', value: stats.totalReferrals, color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className={`rounded-[2rem] p-6 border ${themeCard}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">{s.label}</p>
            <p className="text-3xl font-black font-display" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de Parceiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enriched.length === 0 && (
          <div className={`col-span-full rounded-[2rem] p-16 text-center border ${themeCard}`}>
            <QrCode className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-[10px] font-black uppercase text-zinc-600">Nenhum parceiro cadastrado.</p>
          </div>
        )}
        {enriched.map(p => (
          <div key={p.id} className={`rounded-[2rem] p-6 border hover:border-[#C58A4A]/40 transition-all group ${themeCard}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className={`font-black text-lg ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{p.name}</p>
                {p.businessName && <p className="text-[10px] text-zinc-500 font-bold">{p.businessName}</p>}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => { setEditingId(p.id); setFormData({ name: p.name, businessName: p.businessName, phone: p.phone, email: p.email, discount: p.discount, cashbackPercent: p.cashbackPercent, expiryDays: 30 }); setShowModal(true); }}
                  className={`p-2 rounded-xl ${theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Excluir parceiro?')) deletePartner(p.id); }}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className={`p-3 rounded-xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[7px] font-black uppercase text-zinc-500">Desconto</p>
                <p className="text-sm font-black text-[#C58A4A]">{p.discount}%</p>
              </div>
              <div className={`p-3 rounded-xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[7px] font-black uppercase text-zinc-500">Cashback</p>
                <p className="text-sm font-black text-emerald-500">{p.cashbackPercent}%</p>
              </div>
              <div className={`p-3 rounded-xl text-center ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200' : 'bg-white/5 border border-white/5'}`}>
                <p className="text-[7px] font-black uppercase text-zinc-500">Indicações</p>
                <p className="text-sm font-black text-white">{p.totalReferrals}</p>
              </div>
            </div>

            {/* QR Code Status */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${p.isExpired ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
              <span className={`text-[9px] font-black uppercase ${p.isExpired ? 'text-red-500' : 'text-emerald-500'}`}>
                QR {p.isExpired ? 'Expirado' : 'Ativo'} • {new Date(p.qrCodeExpiry).toLocaleDateString('pt-BR')}
              </span>
              <button
                onClick={() => setShowQrModal(p)}
                className="p-2 bg-[#C58A4A] text-black rounded-lg hover:scale-105 transition-all"
              >
                <QrCode size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className={`w-full max-w-sm rounded-[3rem] p-10 space-y-8 border text-center shadow-2xl ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#C58A4A]/20'}`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C58A4A] mb-2">QR Code</p>
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {showQrModal.name}
              </h2>
            </div>

            {/* QR Code via API gratuita */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <img
                  src={QR_API(showQrModal.qrCodeToken)}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Token</p>
              <p className={`font-black text-xl tracking-widest ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {showQrModal.qrCodeToken}
              </p>
              <p className={`text-[9px] mt-1 ${(showQrModal as any).isExpired ? 'text-red-500' : 'text-emerald-500'}`}>
                Validade: {new Date(showQrModal.qrCodeExpiry).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCopyLink(showQrModal.qrCodeToken)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-[9px] border transition-all ${copied ? 'bg-emerald-500 text-white border-emerald-500' : theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/10 text-zinc-400'}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => handleRegenerateQR(showQrModal)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[9px] text-zinc-400 hover:text-white"
              >
                <RefreshCw size={14} /> Renovar
              </button>
            </div>
            <button
              onClick={() => setShowQrModal(null)}
              className={`w-full text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Formulário */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
          <div className={`w-full max-w-md rounded-[3rem] p-10 space-y-8 border shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-[#C58A4A]/20'}`}>
            <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              {editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
            </h2>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Nome do Responsável', type: 'text', placeholder: 'João Silva' },
                { key: 'businessName', label: 'Nome do Negócio', type: 'text', placeholder: 'Barbearia do João' },
                { key: 'phone', label: 'WhatsApp', type: 'tel', placeholder: '(21) 99999-9999' },
                { key: 'email', label: 'E-mail', type: 'email', placeholder: 'joao@empresa.com' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(formData as any)[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    className={`w-full border p-4 rounded-xl outline-none font-bold text-xs transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#C58A4A]'}`}
                  />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Desconto %</label>
                  <input type="number" min={0} max={100} value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })} className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Cashback %</label>
                  <input type="number" min={0} max={100} value={formData.cashbackPercent} onChange={e => setFormData({ ...formData, cashbackPercent: parseInt(e.target.value) || 0 })} className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Validade (dias)</label>
                  <input type="number" min={1} value={formData.expiryDays} onChange={e => setFormData({ ...formData, expiryDays: parseInt(e.target.value) || 30 })} className={`w-full border p-4 rounded-xl outline-none font-bold text-xs ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white/5 py-4 rounded-2xl font-black uppercase text-[9px] text-zinc-500">Cancelar</button>
              <button onClick={handleSave} className="flex-1 gradiente-ouro text-black py-4 rounded-2xl font-black uppercase text-[9px]">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
