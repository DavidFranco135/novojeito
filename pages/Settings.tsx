import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2, RotateCcw, Zap } from 'lucide-react';
import { useBarberStore } from '../store';

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser, resetAllLikes, theme } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({ 
    name: user?.name || '', 
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150' 
  });
  const [loading, setLoading] = useState(false);
  const [vipPlans, setVipPlans] = useState(config.vipPlans || [
    { id: '1', name: 'Plano Mensal', price: 99.90, duration: 'Mensal', features: ['Descontos exclusivos', '10% off em serviços'] },
    { id: '2', name: 'Plano Anual', price: 999.90, duration: 'Anual', features: ['Descontos exclusivos', '15% off em serviços', 'Agendamento prioritário'] }
  ]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newFeature, setNewFeature] = useState('');

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

  const handleAddPlan = () => {
    const newPlan = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      duration: 'Mensal',
      features: []
    };
    setVipPlans([...vipPlans, newPlan]);
    setEditingPlan(newPlan.id);
  };

  const handleDeletePlan = (id: string) => {
    setVipPlans(vipPlans.filter(p => p.id !== id));
  };

  const handleUpdatePlan = (id: string, field: string, value: any) => {
    setVipPlans(vipPlans.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddFeature = (planId: string) => {
    if (newFeature.trim()) {
      setVipPlans(vipPlans.map(p => p.id === planId ? { ...p, features: [...p.features, newFeature] } : p));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (planId: string, index: number) => {
    setVipPlans(vipPlans.map(p => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== index) } : p));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedConfig = { ...formData, logo: userData.avatar, vipPlans };
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

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'} space-y-10`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><Zap className="text-[#D4AF37]" /> Planos VIP</h3>
              <button 
                type="button"
                onClick={handleAddPlan}
                className="p-3 border-2 rounded-xl transition-all flex items-center gap-2"
                style={{ backgroundColor: '#66360f20', borderColor: '#66360f', color: '#66360f' }}
              >
                <Plus size={20} /> Novo Plano
              </button>
            </div>
            <div className="space-y-6">
              {vipPlans.map(plan => (
                <div key={plan.id} className={`p-6 rounded-2xl border-2 space-y-4 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      type="text" 
                      placeholder="Nome do Plano" 
                      value={plan.name}
                      onChange={e => handleUpdatePlan(plan.id, 'name', e.target.value)}
                      className={`border-2 p-4 rounded-xl font-black ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                    <input 
                      type="number" 
                      placeholder="Preço" 
                      value={plan.price}
                      onChange={e => handleUpdatePlan(plan.id, 'price', parseFloat(e.target.value))}
                      className={`border-2 p-4 rounded-xl font-black ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                    <select 
                      value={plan.duration}
                      onChange={e => handleUpdatePlan(plan.id, 'duration', e.target.value)}
                      className={`border-2 p-4 rounded-xl font-black ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Anual">Anual</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Benefícios</label>
                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                          <span className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{feature}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveFeature(plan.id, idx)}
                            className="text-red-500 hover:text-red-700 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Novo benefício" 
                        value={editingPlan === plan.id ? newFeature : ''}
                        onChange={e => setNewFeature(e.target.value)}
                        onFocus={() => setEditingPlan(plan.id)}
                        className={`flex-1 border-2 p-3 rounded-lg text-sm font-black ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                      />
                      <button 
                        type="button"
                        onClick={() => handleAddFeature(plan.id)}
                        className="px-4 py-3 bg-[#D4AF37] text-black rounded-lg font-black text-xs uppercase"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="w-full p-3 border-2 border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-all font-black text-xs uppercase"
                  >
                    Deletar Plano
                  </button>
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
    </div>
  );
};

export default Settings;
