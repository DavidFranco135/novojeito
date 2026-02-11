import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2, RotateCcw, Crown, Check, X } from 'lucide-react';
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
    name: '',
    price: 0,
    period: 'MENSAL',
    benefits: [''],
    status: 'ATIVO'
  });

  const IMGBB_API_KEY = 'da736db48f154b9108b23a36d4393848';

  const uploadToImgBB = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: data
    });
    const resData = await response.json();
    if (resData.success) return resData.data.url;
    throw new Error('Erro no upload');
  };

  const handleImageChange = async (field: 'logo' | 'coverImage' | 'loginBackground' | 'aboutImage' | 'locationImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await uploadToImgBB(file);
        setFormData(prev => ({ ...prev, [field]: url }));
        if (field === 'logo') setUserData(prev => ({ ...prev, avatar: url }));
      } catch (err) { alert("Erro ao subir imagem."); }
      finally { setLoading(false); }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await uploadToImgBB(file);
        setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), url] }));
      } catch (err) { alert("Erro na galeria."); }
      finally { setLoading(false); }
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    // 1. Atualizar configurações
    const updatedConfig = { ...formData, logo: userData.avatar };
    await updateConfig(updatedConfig);
    
    // 2. Atualizar dados do usuário (CORREÇÃO)
    updateUser(userData);
    
    // 3. Persistir no localStorage (NOVO)
    if (user) {
      const updatedUser = { ...user, name: userData.name, avatar: userData.avatar };
      localStorage.setItem('brb_user', JSON.stringify(updatedUser));
    }
    
    alert("Configurações Master Sincronizadas!");
  } catch (err) { 
    alert("Erro ao sincronizar."); 
  } finally { 
    setLoading(false); 
  }
};

  const handleSaveVipPlan = () => {
    if (!newPlan.name || !newPlan.price || !newPlan.benefits || newPlan.benefits.filter(b => b.trim()).length === 0) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const plan: VipPlan = {
      id: editingPlan?.id || `vip${Date.now()}`,
      name: newPlan.name,
      price: newPlan.price,
      period: newPlan.period as 'MENSAL' | 'ANUAL',
      benefits: newPlan.benefits.filter(b => b.trim()),
      discount: newPlan.discount,
      status: newPlan.status as 'ATIVO' | 'INATIVO'
    };

    const currentPlans = formData.vipPlans || [];
    let updatedPlans;

    if (editingPlan) {
      updatedPlans = currentPlans.map(p => p.id === plan.id ? plan : p);
    } else {
      updatedPlans = [...currentPlans, plan];
    }

    setFormData(prev => ({ ...prev, vipPlans: updatedPlans }));
    setShowVipPlanModal(false);
    setEditingPlan(null);
    setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' });
  };

  const handleEditPlan = (plan: VipPlan) => {
    setEditingPlan(plan);
    setNewPlan(plan);
    setShowVipPlanModal(true);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Deseja realmente excluir este plano VIP?')) {
      setFormData(prev => ({ ...prev, vipPlans: (prev.vipPlans || []).filter(p => p.id !== planId) }));
    }
  };

  const handleAddNewPlan = () => {
    setEditingPlan(null);
    setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' });
    setShowVipPlanModal(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-4xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Painel Master</h1>
          <p className={`text-[11px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400 opacity-60'}`}>Configurações Avançadas Sr. José</p>
        </div>
        <button 
          form="settings-form" 
          type="submit" 
          disabled={loading} 
          className="flex items-center justify-center gap-4 text-white px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
          style={{ backgroundColor: '#66360f' }}
        >
          {loading ? 'Sincronizando...' : <><Save size={20} /> Gravar Tudo</>}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 space-y-10 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><UserIcon className="text-[#D4AF37]" /> Perfil Master</h3>
            <div className="flex flex-col sm:flex-row items-center gap-10">
               <div className="relative group w-40 h-40">
                  <img src={userData.avatar} className="w-full h-full rounded-[3rem] object-cover border-4 border-[#D4AF37]/30 shadow-2xl" alt="Avatar" />
                  <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center rounded-[3rem] cursor-pointer text-[10px] font-black uppercase tracking-widest gap-2 text-white">
                    <Upload size={24} /> {loading ? '...' : 'Trocar Foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} disabled={loading} />
                  </label>
               </div>
               <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Assinatura Digital (Seu Nome)</label>
                    <input type="text" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className={`w-full border-2 p-6 rounded-3xl outline-none font-black text-xl ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
                  </div>
               </div>
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'} flex items-center gap-4`}><Store className="text-[#D4AF37]" /> Identidade Signature</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Nome da Casa</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Resumo Header (Slogan)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Título Seção Sobre</label>
                <input type="text" value={formData.aboutTitle} onChange={e => setFormData({...formData, aboutTitle: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>História / Conteúdo Sobre</label>
                <textarea rows={5} value={formData.aboutText} onChange={e => setFormData({...formData, aboutText: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-medium resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'} flex items-center gap-4`}><MapPin className="text-[#D4AF37]" /> Onde & Como</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>WhatsApp Business</label>
                <input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Instagram (@user)</label>
                <input type="text" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Endereço Completo</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={`w-full border-2 p-6 rounded-3xl font-black ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}/>
              </div>
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                <Crown className="text-[#D4AF37]" /> Planos VIP
              </h3>
              <button 
                type="button"
                onClick={handleAddNewPlan}
                className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-xs font-black uppercase transition-all hover:scale-105"
              >
                <Plus size={16} /> Novo Plano
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(!formData.vipPlans || formData.vipPlans.length === 0) && (
                <p className={`col-span-2 text-center py-6 italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  Nenhum plano VIP cadastrado ainda.
                </p>
              )}
              {formData.vipPlans?.map(plan => (
                <div key={plan.id} className={`rounded-2xl p-6 border-2 ${plan.status === 'ATIVO' ? 'border-[#D4AF37]/30' : 'border-zinc-300/30 opacity-60'} ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className={`font-black text-lg ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h4>
                      <p className={`text-xs font-black mt-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        R$ {plan.price.toFixed(2)} / {plan.period === 'MENSAL' ? 'Mês' : 'Ano'}
                      </p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${plan.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-zinc-500/20 text-zinc-600'}`}>
                      {plan.status}
                    </span>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {plan.benefits.slice(0, 3).map((benefit, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        <Check size={12} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                    {plan.benefits.length > 3 && (
                      <li className={`text-xs italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                        +{plan.benefits.length - 3} benefícios
                      </li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditPlan(plan)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${theme === 'light' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${theme === 'light' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><UserIcon className="text-[#D4AF37]" /> Gestão de Barbeiros</h3>
              <button 
                type="button"
                onClick={async () => {
                  if (confirm('Tem certeza que deseja reiniciar todos os contadores de curtidas dos barbeiros?')) {
                    await resetAllLikes();
                    alert('Contadores de curtidas reiniciados com sucesso!');
                  }
                }}
                className="p-3 border-2 rounded-xl transition-all"
                style={{ backgroundColor: '#66360f20', borderColor: '#66360f', color: '#66360f' }}
              >
                <RotateCcw size={20} />
              </button>
            </div>
            <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Reinicie os contadores de curtidas de todos os profissionais.</p>
          </div>
        </div>

        <aside className="space-y-10">
          <div className={`rounded-[3.5rem] p-12 border-2 text-center flex flex-col items-center ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic mb-10 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Logo Master</h3>
            <div className="relative group w-52 h-52 mb-6">
              <img src={formData.logo} className="w-full h-full rounded-[3.5rem] object-cover border-4 border-[#D4AF37]/40 shadow-2xl transition-all" alt="Logo" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[3.5rem] cursor-pointer"><Upload className="text-white" size={32} /><input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} /></label>
            </div>
          </div>
        </aside>
      </form>

      {showVipPlanModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {editingPlan ? 'Editar' : 'Novo'} Plano VIP
              </h3>
              <button 
                onClick={() => {
                  setShowVipPlanModal(false);
                  setEditingPlan(null);
                  setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' });
                }}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
              >
                <X size={24} className={theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Nome do Plano</label>
                  <input 
                    type="text" 
                    value={newPlan.name} 
                    onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                    className={`w-full border-2 p-4 rounded-2xl font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="Ex: Plano Premium"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Preço (R$)</label>
                  <input 
                    type="number" 
                    value={newPlan.price} 
                    onChange={e => setNewPlan({...newPlan, price: parseFloat(e.target.value)})}
                    className={`w-full border-2 p-4 rounded-2xl font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="199.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Período</label>
                  <select 
                    value={newPlan.period} 
                    onChange={e => setNewPlan({...newPlan, period: e.target.value as 'MENSAL' | 'ANUAL'})}
                    className={`w-full border-2 p-4 rounded-2xl font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Status</label>
                  <select 
                    value={newPlan.status} 
                    onChange={e => setNewPlan({...newPlan, status: e.target.value as 'ATIVO' | 'INATIVO'})}
                    className={`w-full border-2 p-4 rounded-2xl font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Desconto (%)</label>
                  <input 
                    type="number" 
                    value={newPlan.discount || ''} 
                    onChange={e => setNewPlan({...newPlan, discount: e.target.value ? parseFloat(e.target.value) : undefined})}
                    className={`w-full border-2 p-4 rounded-2xl font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Benefícios</label>
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="flex items-center gap-1 bg-[#D4AF37] text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase"
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {newPlan.benefits?.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text" 
                        value={benefit}
                        onChange={e => handleBenefitChange(index, e.target.value)}
                        className={`flex-1 border-2 p-3 rounded-xl text-sm ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                        placeholder={`Benefício ${index + 1}`}
                      />
                      {newPlan.benefits && newPlan.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className={`p-3 rounded-xl ${theme === 'light' ? 'bg-red-500 text-white' : 'bg-red-600 text-white'}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowVipPlanModal(false);
                    setEditingPlan(null);
                    setNewPlan({ name: '', price: 0, period: 'MENSAL', benefits: [''], status: 'ATIVO' });
                  }}
                  className={`flex-1 py-4 rounded-xl text-xs font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveVipPlan}
                  className="flex-1 gradiente-ouro text-black py-4 rounded-xl text-xs font-black uppercase shadow-xl"
                >
                  Salvar Plano
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
