import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2, RotateCcw, Crown, Gift, X } from 'lucide-react';
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
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<VipPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Omit<VipPlan, 'id'>>({
    name: '',
    price: 0,
    duration: 'MENSAL',
    benefits: [''],
    discount: 0,
    image: '',
    active: true
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

  const handlePlanImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await uploadToImgBB(file);
        if (editingPlan) {
          setEditingPlan({ ...editingPlan, image: url });
        } else {
          setNewPlan(prev => ({ ...prev, image: url }));
        }
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

  const handleAddBenefit = () => {
    if (editingPlan) {
      setEditingPlan({ ...editingPlan, benefits: [...editingPlan.benefits, ''] });
    } else {
      setNewPlan(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
    }
  };

  const handleRemoveBenefit = (index: number) => {
    if (editingPlan) {
      setEditingPlan({ 
        ...editingPlan, 
        benefits: editingPlan.benefits.filter((_, i) => i !== index) 
      });
    } else {
      setNewPlan(prev => ({ 
        ...prev, 
        benefits: prev.benefits.filter((_, i) => i !== index) 
      }));
    }
  };

  const handleUpdateBenefit = (index: number, value: string) => {
    if (editingPlan) {
      const newBenefits = [...editingPlan.benefits];
      newBenefits[index] = value;
      setEditingPlan({ ...editingPlan, benefits: newBenefits });
    } else {
      const newBenefits = [...newPlan.benefits];
      newBenefits[index] = value;
      setNewPlan(prev => ({ ...prev, benefits: newBenefits }));
    }
  };

  const handleSavePlan = () => {
    const planToSave = editingPlan || newPlan;
    
    if (!planToSave.name || planToSave.price <= 0 || planToSave.benefits.filter(b => b.trim()).length === 0) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const filteredBenefits = planToSave.benefits.filter(b => b.trim());
    const currentPlans = formData.vipPlans || [];

    if (editingPlan) {
      // Atualizar plano existente
      const updatedPlans = currentPlans.map(p => 
        p.id === editingPlan.id ? { ...editingPlan, benefits: filteredBenefits } : p
      );
      setFormData(prev => ({ ...prev, vipPlans: updatedPlans }));
      setEditingPlan(null);
    } else {
      // Adicionar novo plano
      const newPlanWithId: VipPlan = {
        ...newPlan,
        id: `plan_${Date.now()}`,
        benefits: filteredBenefits
      };
      setFormData(prev => ({ ...prev, vipPlans: [...currentPlans, newPlanWithId] }));
      setNewPlan({
        name: '',
        price: 0,
        duration: 'MENSAL',
        benefits: [''],
        discount: 0,
        image: '',
        active: true
      });
    }
    
    setShowAddPlanModal(false);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      const updatedPlans = (formData.vipPlans || []).filter(p => p.id !== planId);
      setFormData(prev => ({ ...prev, vipPlans: updatedPlans }));
    }
  };

  const handleTogglePlanActive = (planId: string) => {
    const updatedPlans = (formData.vipPlans || []).map(p => 
      p.id === planId ? { ...p, active: !p.active } : p
    );
    setFormData(prev => ({ ...prev, vipPlans: updatedPlans }));
  };

  const handleEditPlan = (plan: VipPlan) => {
    setEditingPlan(plan);
    setShowAddPlanModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedConfig = { ...formData, logo: userData.avatar };
      await updateConfig(updatedConfig);
      updateUser(userData);
      alert("Configurações Master Sincronizadas!");
    } catch (err) { alert("Erro ao sincronizar."); }
    finally { setLoading(false); }
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

          {/* Gestão de Planos VIP */}
          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                <Crown className="text-[#D4AF37]" /> Planos VIP
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setEditingPlan(null);
                  setNewPlan({
                    name: '',
                    price: 0,
                    duration: 'MENSAL',
                    benefits: [''],
                    discount: 0,
                    image: '',
                    active: true
                  });
                  setShowAddPlanModal(true);
                }}
                className="gradiente-ouro text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                <Plus size={16} className="inline mr-2"/> Adicionar Plano
              </button>
            </div>
            
            <div className="space-y-4">
              {(!formData.vipPlans || formData.vipPlans.length === 0) && (
                <p className={`text-center py-10 italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  Nenhum plano VIP cadastrado ainda.
                </p>
              )}
              
              {formData.vipPlans?.map(plan => (
                <div key={plan.id} className={`rounded-2xl p-6 border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Crown className="text-[#D4AF37]" size={20}/>
                        <h4 className={`text-lg font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${plan.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {plan.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className={`text-2xl font-black ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>R$ {plan.price.toFixed(2)}</span>
                        <span className={`text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>/{plan.duration === 'MENSAL' ? 'mês' : 'ano'}</span>
                      </div>
                      {plan.discount > 0 && (
                        <div className="inline-block bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black mb-3">
                          <Gift size={10} className="inline mr-1"/> {plan.discount}% de desconto
                        </div>
                      )}
                      <div className="space-y-1">
                        {plan.benefits.slice(0, 3).map((benefit, idx) => (
                          <p key={idx} className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            • {benefit}
                          </p>
                        ))}
                        {plan.benefits.length > 3 && (
                          <p className={`text-xs italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            +{plan.benefits.length - 3} benefícios
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPlan(plan)}
                        className={`p-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        title="Editar"
                      >
                        <Save size={16}/>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePlanActive(plan.id)}
                        className={`p-2 rounded-xl border transition-all ${plan.active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}
                        title={plan.active ? 'Desativar' : 'Ativar'}
                      >
                        <Crown size={16}/>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
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

      {/* Modal Adicionar/Editar Plano VIP */}
      {showAddPlanModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-2xl rounded-[3rem] p-12 space-y-8 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {editingPlan ? 'Editar Plano VIP' : 'Novo Plano VIP'}
              </h2>
              <button onClick={() => setShowAddPlanModal(false)} className="p-2 rounded-xl hover:bg-white/5">
                <X className={theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'} size={24}/>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Nome do Plano</label>
                  <input 
                    type="text" 
                    value={editingPlan ? editingPlan.name : newPlan.name}
                    onChange={e => {
                      if (editingPlan) {
                        setEditingPlan({ ...editingPlan, name: e.target.value });
                      } else {
                        setNewPlan({ ...newPlan, name: e.target.value });
                      }
                    }}
                    className={`w-full border-2 p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="Ex: Plano Premium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Duração</label>
                  <select
                    value={editingPlan ? editingPlan.duration : newPlan.duration}
                    onChange={e => {
                      const duration = e.target.value as 'MENSAL' | 'ANUAL';
                      if (editingPlan) {
                        setEditingPlan({ ...editingPlan, duration });
                      } else {
                        setNewPlan({ ...newPlan, duration });
                      }
                    }}
                    className={`w-full border-2 p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Preço (R$)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editingPlan ? editingPlan.price : newPlan.price}
                    onChange={e => {
                      const price = parseFloat(e.target.value) || 0;
                      if (editingPlan) {
                        setEditingPlan({ ...editingPlan, price });
                      } else {
                        setNewPlan({ ...newPlan, price });
                      }
                    }}
                    className={`w-full border-2 p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Desconto (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={editingPlan ? editingPlan.discount : newPlan.discount}
                    onChange={e => {
                      const discount = parseInt(e.target.value) || 0;
                      if (editingPlan) {
                        setEditingPlan({ ...editingPlan, discount });
                      } else {
                        setNewPlan({ ...newPlan, discount });
                      }
                    }}
                    className={`w-full border-2 p-4 rounded-2xl outline-none font-bold ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Imagem do Plano (Opcional)</label>
                <div className="flex gap-4 items-center">
                  {(editingPlan?.image || newPlan.image) && (
                    <img 
                      src={editingPlan ? editingPlan.image : newPlan.image} 
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#D4AF37]"
                      alt="Preview"
                    />
                  )}
                  <label className={`flex-1 border-2 border-dashed p-4 rounded-2xl cursor-pointer text-center transition-all ${theme === 'light' ? 'border-zinc-300 hover:border-blue-400' : 'border-white/10 hover:border-[#D4AF37]'}`}>
                    <Upload size={20} className="mx-auto mb-2 text-[#D4AF37]"/>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {loading ? 'Enviando...' : 'Clique para upload'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePlanImageChange}
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Benefícios</label>
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="text-[#D4AF37] text-xs font-black flex items-center gap-1 hover:opacity-80"
                  >
                    <Plus size={14}/> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {(editingPlan ? editingPlan.benefits : newPlan.benefits).map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={e => handleUpdateBenefit(index, e.target.value)}
                        className={`flex-1 border-2 p-3 rounded-xl outline-none text-sm ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                        placeholder={`Benefício ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setShowAddPlanModal(false)}
                className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSavePlan}
                className="flex-1 gradiente-ouro text-black py-4 rounded-2xl text-xs font-black uppercase shadow-xl"
              >
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
