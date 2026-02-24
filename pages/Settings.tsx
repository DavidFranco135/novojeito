import React, { useState } from 'react';
import {
  Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus,
  MapPin, RotateCcw, Crown, X, Star, Image, Phone, Instagram,
  Clock, Link, Edit3
} from 'lucide-react';
import { useBarberStore } from '../store';
import { VipPlan } from '../types';

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser, resetAllLikes, theme } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150'
  });
  const [loading, setLoading] = useState(false);
  const [showVipPlanModal, setShowVipPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<VipPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<VipPlan>>({
    name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO'
  });

  const IMGBB_API_KEY = 'da736db48f154b9108b23a36d4393848';

  const uploadToImgBB = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: data });
    const json = await res.json();
    if (json.success) return json.data.url;
    throw new Error('Erro no upload');
  };

  const handleImageChange = async (
    field: 'logo' | 'coverImage' | 'loginBackground' | 'aboutImage' | 'locationImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({ ...prev, [field]: url }));
      if (field === 'logo') setUserData(prev => ({ ...prev, avatar: url }));
    } catch { alert('Erro ao subir imagem.'); }
    finally { setLoading(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), url] }));
    } catch { alert('Erro na galeria.'); }
    finally { setLoading(false); }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedConfig = { ...formData, logo: userData.avatar, adminName: userData.name };
      await updateConfig(updatedConfig);
      if (user) {
        const updatedUser = { ...user, name: userData.name, avatar: userData.avatar };
        updateUser(updatedUser);
        localStorage.setItem('brb_user', JSON.stringify(updatedUser));
      }
      alert('✅ Configurações Master Sincronizadas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao sincronizar.');
    } finally { setLoading(false); }
  };

  // ── VIP Plans helpers ────────────────────────────────────────
  const handleSaveVipPlan = () => {
    if (!newPlan.name || !newPlan.price || !newPlan.benefits?.filter(b => b.trim()).length) {
      alert('Preencha todos os campos!'); return;
    }
    const plan: VipPlan = {
      id: editingPlan?.id || `vip${Date.now()}`,
      name: newPlan.name!,
      price: newPlan.price!,
      period: newPlan.period!,
      benefits: newPlan.benefits!.filter(b => b.trim()),
      discount: newPlan.discount ?? 0,
      status: newPlan.status!
    };
    const current = formData.vipPlans || [];
    setFormData(prev => ({
      ...prev,
      vipPlans: editingPlan ? current.map(p => p.id === editingPlan.id ? plan : p) : [...current, plan]
    }));
    setShowVipPlanModal(false);
    setEditingPlan(null);
    setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' });
  };

  const handleEditPlan   = (plan: VipPlan) => { setEditingPlan(plan); setNewPlan(plan); setShowVipPlanModal(true); };
  const handleDeletePlan = (id: string)    => { if (confirm('Excluir plano?')) setFormData(prev => ({ ...prev, vipPlans: (prev.vipPlans || []).filter(p => p.id !== id) })); };
  const handleTogglePlan = (id: string)    => setFormData(prev => ({ ...prev, vipPlans: (prev.vipPlans || []).map(p => p.id === id ? { ...p, status: p.status === 'ATIVO' ? 'INATIVO' as const : 'ATIVO' as const } : p) }));

  const addBenefit    = ()                        => setNewPlan(prev => ({ ...prev, benefits: [...(prev.benefits || []), ''] }));
  const updateBenefit = (i: number, v: string)    => { const b = [...(newPlan.benefits || [])]; b[i] = v; setNewPlan(prev => ({ ...prev, benefits: b })); };
  const removeBenefit = (i: number)               => setNewPlan(prev => ({ ...prev, benefits: (prev.benefits || []).filter((_, idx) => idx !== i) }));

  // ── Styles ────────────────────────────────────────────────────
  const isDark = theme !== 'light';
  const inp  = `w-full border-2 p-5 rounded-2xl font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#C58A4A]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#C58A4A]'}`;
  const lbl  = `text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`;
  const card = `rounded-[3rem] p-8 md:p-12 border-2 space-y-8 ${isDark ? 'cartao-vidro border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`;
  const h3   = `text-xl font-black font-display italic flex items-center gap-3 ${isDark ? 'text-white' : 'text-zinc-900'}`;

  // Upload card helper
  const ImgCard = ({ label, field, src }: { label: string; field: any; src?: string }) => (
    <div className="space-y-3">
      <label className={lbl}>{label}</label>
      <div className={`relative group h-36 rounded-2xl overflow-hidden border-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
        {src ? (
          <img src={src} className="w-full h-full object-cover" alt={label} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={32} className="text-zinc-600" />
          </div>
        )}
        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer gap-2 text-white text-[10px] font-black uppercase tracking-widest">
          <Upload size={24} /> {loading ? 'Enviando...' : 'Trocar Foto'}
          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(field, e)} disabled={loading} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-4xl font-black font-display italic tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Painel Master</h1>
          <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Configurações Avançadas · Página Pública · Planos</p>
        </div>
        <button
          form="settings-form" type="submit" disabled={loading}
          className="flex items-center justify-center gap-3 text-white px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
          style={{ backgroundColor: '#66360f' }}
        >
          {loading ? '⏳ Sincronizando...' : <><Save size={20} /> Gravar Tudo</>}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ══ Coluna Principal ══ */}
        <div className="lg:col-span-2 space-y-10">

          {/* 1. Perfil Master */}
          <div className={card}>
            <h3 className={h3}><UserIcon size={22} className="text-[#C58A4A]" /> Perfil Master</h3>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group w-36 h-36 shrink-0">
                <img src={userData.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-4 border-[#C58A4A]/30 shadow-2xl" alt="Avatar" />
                <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center rounded-[2.5rem] cursor-pointer text-[10px] font-black uppercase tracking-widest gap-2 text-white">
                  <Upload size={22} /> {loading ? '...' : 'Trocar'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} disabled={loading} />
                </label>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2">
                  <label className={lbl}>Assinatura Digital (Seu Nome)</label>
                  <input type="text" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className={inp} placeholder="Sr. José" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Identidade */}
          <div className={card}>
            <h3 className={h3}><Store size={22} className="text-[#C58A4A]" /> Identidade do Barber Pub</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={lbl}>Nome da Casa</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inp} />
              </div>
              <div className="space-y-2">
                <label className={lbl}>Slogan / Resumo Header</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inp} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={lbl}>Título da Seção "Quem Somos"</label>
                <input type="text" value={formData.aboutTitle} onChange={e => setFormData({ ...formData, aboutTitle: e.target.value })} className={inp} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={lbl}>Texto "Quem Somos"</label>
                <textarea rows={5} value={formData.aboutText} onChange={e => setFormData({ ...formData, aboutText: e.target.value })}
                  className={`w-full border-2 p-5 rounded-2xl font-medium resize-none outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#C58A4A]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#C58A4A]'}`} />
              </div>
            </div>
          </div>

          {/* 3. Contato & Localização */}
          <div className={card}>
            <h3 className={h3}><MapPin size={22} className="text-[#C58A4A]" /> Contato & Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={lbl}>WhatsApp Business</label>
                <div className="relative">
                  <Phone size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className={`${inp} pl-10`} placeholder="21999999999" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Instagram</label>
                <div className="relative">
                  <Instagram size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input type="text" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                    className={`${inp} pl-10`} placeholder="@srjosebarberpub" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={lbl}>Endereço Completo</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inp} placeholder="Rua, número, bairro, cidade" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={lbl}>Link Google Maps (URL)</label>
                <div className="relative">
                  <Link size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input type="text" value={formData.locationUrl || ''} onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                    className={`${inp} pl-10`} placeholder="https://maps.google.com/..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Horário de Abertura</label>
                <div className="relative">
                  <Clock size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input type="time" value={formData.openingTime || '08:00'} onChange={e => setFormData({ ...formData, openingTime: e.target.value })}
                    className={`${inp} pl-10`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Horário de Fechamento</label>
                <div className="relative">
                  <Clock size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <input type="time" value={formData.closingTime || '20:00'} onChange={e => setFormData({ ...formData, closingTime: e.target.value })}
                    className={`${inp} pl-10`} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Imagens da Página Pública */}
          <div className={card}>
            <h3 className={h3}><ImageIcon size={22} className="text-[#C58A4A]" /> Imagens da Página Pública</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImgCard label="Foto Capa (Header)" field="coverImage" src={formData.coverImage} />
              <ImgCard label="Fundo da Tela de Login" field="loginBackground" src={formData.loginBackground} />
              <ImgCard label="Foto Seção 'Quem Somos'" field="aboutImage" src={formData.aboutImage} />
              <ImgCard label="Foto / Mapa Localização" field="locationImage" src={formData.locationImage} />
            </div>
          </div>

          {/* 5. Galeria "Nosso Ambiente" */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className={h3}><Image size={22} className="text-[#C58A4A]" /> Galeria — Nosso Ambiente</h3>
              <label className={`flex items-center gap-2 gradiente-ouro text-black px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-lg hover:scale-105 transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Plus size={14} /> {loading ? 'Enviando...' : 'Adicionar Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={loading} />
              </label>
            </div>
            {(!formData.gallery || formData.gallery.length === 0) && (
              <div className={`rounded-2xl p-10 text-center border-2 border-dashed ${isDark ? 'border-white/10 text-zinc-600' : 'border-zinc-300 text-zinc-400'}`}>
                <Image size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma foto ainda. Adicione imagens do ambiente.</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(formData.gallery || []).map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" alt={`Galeria ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'bg-black/70 text-zinc-300' : 'bg-white/80 text-zinc-600'}`}>
                    Foto {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Programa de Fidelidade */}
          <div className={card}>
            <h3 className={h3}><Star size={22} className="text-[#C58A4A]" /> Programa de Fidelidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={lbl}>Selos para Corte Grátis</label>
                <input type="number" min={1} max={50}
                  value={(formData as any).stampsForFreeCut ?? 10}
                  onChange={e => setFormData({ ...formData, stampsForFreeCut: parseInt(e.target.value) || 10 } as any)}
                  className={inp} />
                <p className={`text-[10px] font-bold ml-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Ex: 10 selos = 1 corte cortesia</p>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Cashback % por Serviço</label>
                <input type="number" min={0} max={20} step={0.5}
                  value={(formData as any).cashbackPercent ?? 5}
                  onChange={e => setFormData({ ...formData, cashbackPercent: parseFloat(e.target.value) || 0 } as any)}
                  className={inp} />
                <p className={`text-[10px] font-bold ml-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>% do valor do serviço retorna como crédito</p>
              </div>
            </div>
          </div>

          {/* 7. Planos VIP */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className={h3}><Crown size={22} className="text-[#C58A4A]" /> Planos VIP</h3>
              <button type="button"
                onClick={() => { setEditingPlan(null); setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' }); setShowVipPlanModal(true); }}
                className="flex items-center gap-2 gradiente-ouro text-black px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                <Plus size={14} /> Adicionar
              </button>
            </div>
            {(!formData.vipPlans || formData.vipPlans.length === 0) && (
              <p className={`text-center py-8 italic text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Nenhum plano VIP cadastrado.</p>
            )}
            <div className="space-y-4">
              {formData.vipPlans?.map(plan => (
                <div key={plan.id} className={`rounded-2xl p-6 border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{plan.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${plan.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{plan.status}</span>
                      </div>
                      <p className={`text-2xl font-black mb-2 ${isDark ? 'text-[#C58A4A]' : 'text-blue-600'}`}>
                        R$ {plan.price.toFixed(2)} <span className="text-sm font-bold">/{plan.period === 'MENSAL' ? 'mês' : 'ano'}</span>
                      </p>
                      <div className="space-y-1">
                        {plan.benefits.slice(0, 3).map((b, i) => (
                          <p key={i} className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>• {b}</p>
                        ))}
                        {plan.benefits.length > 3 && <p className="text-xs text-zinc-500 italic">+{plan.benefits.length - 3} benefícios</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => handleEditPlan(plan)} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}><Edit3 size={15} /></button>
                      <button type="button" onClick={() => handleTogglePlan(plan.id)} className={`p-2 rounded-xl border transition-all ${plan.status === 'ATIVO' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-400'}`}><Crown size={15} /></button>
                      <button type="button" onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Gestão de Barbeiros */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className={h3}><UserIcon size={22} className="text-[#C58A4A]" /> Gestão de Barbeiros</h3>
              <button type="button"
                onClick={async () => {
                  if (confirm('Reiniciar todos os contadores de curtidas?')) {
                    await resetAllLikes();
                    alert('Contadores reiniciados!');
                  }
                }}
                className="p-3 border-2 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: '#66360f20', borderColor: '#66360f', color: '#66360f' }}>
                <RotateCcw size={20} />
              </button>
            </div>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Reinicie os contadores de curtidas de todos os profissionais.</p>
          </div>

        </div>

        {/* ══ Aside ══ */}
        <aside className="space-y-8">

          {/* Logo */}
          <div className={`rounded-[3rem] p-8 border-2 text-center flex flex-col items-center ${isDark ? 'cartao-vidro border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <h3 className={`text-lg font-black font-display italic mb-6 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Logo Principal</h3>
            <div className="relative group w-44 h-44">
              <img src={formData.logo || userData.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-4 border-[#C58A4A]/40 shadow-2xl" alt="Logo" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[2.5rem] cursor-pointer flex-col gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                <Upload size={28} /> Trocar
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} />
              </label>
            </div>
            <p className={`text-[9px] font-bold uppercase tracking-widest mt-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Aparece no header e login</p>
          </div>

          {/* Preview rápido */}
          <div className={`rounded-[3rem] p-8 border-2 space-y-4 ${isDark ? 'cartao-vidro border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <h3 className={`text-lg font-black font-display italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>Preview Rápido</h3>
            <div className="space-y-3 text-sm">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Phone size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formData.whatsapp || 'WhatsApp não definido'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Instagram size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formData.instagram || 'Instagram não definido'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <MapPin size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formData.address || 'Endereço não definido'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Clock size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formData.openingTime || '08:00'} – {formData.closingTime || '20:00'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Image size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{(formData.gallery || []).length} foto(s) na galeria</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Crown size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{(formData.vipPlans || []).filter(p => p.status === 'ATIVO').length} plano(s) VIP ativo(s)</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                <Star size={14} className="text-[#C58A4A] shrink-0" />
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{(formData as any).stampsForFreeCut ?? 10} selos · {(formData as any).cashbackPercent ?? 5}% cashback</span>
              </div>
            </div>
            <button
              type="submit"
              form="settings-form"
              disabled={loading}
              className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all mt-2"
            >
              {loading ? '⏳ Salvando...' : '💾 Salvar Agora'}
            </button>
          </div>

        </aside>
      </form>

      {/* ── Modal Plano VIP ── */}
      {showVipPlanModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95">
          <div className={`w-full max-w-2xl rounded-[3rem] p-10 space-y-8 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide border ${isDark ? 'bg-[#111] border-[#C58A4A]/30' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black font-display italic ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {editingPlan ? 'Editar Plano' : 'Novo Plano VIP'}
              </h2>
              <button onClick={() => setShowVipPlanModal(false)} className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white"><X size={22} /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={lbl}>Nome do Plano</label>
                  <input type="text" value={newPlan.name || ''} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                    className={inp} placeholder="Ex: Plano Premium" />
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Período</label>
                  <select value={newPlan.period || 'MENSAL'} onChange={e => setNewPlan({ ...newPlan, period: e.target.value as 'MENSAL' | 'ANUAL' })} className={inp}>
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={lbl}>Preço (R$)</label>
                  <input type="number" min="0" step="0.01" value={newPlan.price || 0}
                    onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })} className={inp} />
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Desconto (%)</label>
                  <input type="number" min="0" max="100" value={newPlan.discount || 0}
                    onChange={e => setNewPlan({ ...newPlan, discount: parseInt(e.target.value) || 0 })} className={inp} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={lbl}>Benefícios</label>
                  <button type="button" onClick={addBenefit} className="text-[#C58A4A] text-xs font-black flex items-center gap-1 hover:opacity-80">
                    <Plus size={13} /> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {(newPlan.benefits || ['']).map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={b} onChange={e => updateBenefit(i, e.target.value)}
                        className={`flex-1 border-2 p-3 rounded-xl outline-none text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                        placeholder={`Benefício ${i + 1}`} />
                      {(newPlan.benefits || []).length > 1 && (
                        <button type="button" onClick={() => removeBenefit(i)} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setShowVipPlanModal(false)}
                className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-600'}`}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveVipPlan}
                className="flex-1 gradiente-ouro text-black py-4 rounded-2xl text-xs font-black uppercase shadow-xl">
                {editingPlan ? 'Atualizar' : 'Salvar'} Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
