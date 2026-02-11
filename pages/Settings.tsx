import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2, RotateCcw, CreditCard } from 'lucide-react';
import { useBarberStore } from '../store';

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser, resetAllLikes, theme } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({ 
    name: user?.name || '', 
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150' 
  });
  const [loading, setLoading] = useState(false);

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

  const handleImageChange = async (field: 'logo' | 'coverImage' | 'loginBackground' | 'aboutImage' | 'locationImage', file: File) => {
    try {
      const url = await uploadToImgBB(file);
      setFormData(prev => ({ ...prev, [field]: url }));
      if (field === 'logo') setUserData(prev => ({ ...prev, avatar: url }));
    } catch (err) { alert("Erro no upload."); }
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

  // Funções para gerenciar planos VIP
  const addVipPlan = () => {
    const newPlan = { id: Date.now().toString(), name: 'Novo Plano', price: 0, period: 'Mensal', description: '' };
    setFormData(prev => ({ ...prev, vipPlans: [...(prev.vipPlans || []), newPlan] }));
  };

  const removeVipPlan = (id: string) => {
    setFormData(prev => ({ ...prev, vipPlans: (prev.vipPlans || []).filter((p: any) => p.id !== id) }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-4xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Painel Master</h1>
          <p className={`text-[11px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400 opacity-60'}`}>Configurações Avançadas Sr. José</p>
        </div>
        <button form="settings-form" type="submit" disabled={loading} className="flex items-center justify-center gap-4 text-white px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all" style={{ backgroundColor: '#66360f' }}>
          {loading ? 'Sincronizando...' : <><Save size={20} /> Gravar Tudo</>}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 space-y-8 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><UserIcon className="text-[#D4AF37]" /> Perfil Master</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-4">Nome do Administrador</label>
                  <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-4">Nome da Barbearia</label>
                  <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 space-y-8 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><Store className="text-[#D4AF37]" /> Informações Públicas</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-4">Slogan / Descrição Curta</label>
                  <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-4">Endereço Completo</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-[#D4AF37] transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
               </div>
            </div>
          </div>

          {/* NOVA SEÇÃO: GERENCIAR PLANOS VIP NO ADM */}
          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 space-y-8 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><CreditCard className="text-[#D4AF37]" /> Gerenciar Planos VIP</h3>
              <button type="button" onClick={addVipPlan} className="p-3 bg-[#D4AF37] text-black rounded-xl hover:scale-105 transition-all"><Plus size={20}/></button>
            </div>
            
            <div className="space-y-6">
              {(formData.vipPlans || []).map((plan: any, idx: number) => (
                <div key={plan.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-[#D4AF37]">Configuração do Plano</span>
                    <button type="button" onClick={() => removeVipPlan(plan.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#D4AF37]" placeholder="Nome do Plano" value={plan.name} onChange={e => {
                      const updated = [...formData.vipPlans];
                      updated[idx].name = e.target.value;
                      setFormData({...formData, vipPlans: updated});
                    }} />
                    <input type="number" className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#D4AF37]" placeholder="Preço (Ex: 150.00)" value={plan.price} onChange={e => {
                      const updated = [...formData.vipPlans];
                      updated[idx].price = Number(e.target.value);
                      setFormData({...formData, vipPlans: updated});
                    }} />
                  </div>
                  <select className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#D4AF37] text-xs font-black uppercase" value={plan.period} onChange={e => {
                    const updated = [...formData.vipPlans];
                    updated[idx].period = e.target.value;
                    setFormData({...formData, vipPlans: updated});
                  }}>
                    <option value="Mensal">Mensal</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                  <textarea className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#D4AF37] text-sm" placeholder="Descrição dos benefícios..." value={plan.description} onChange={e => {
                    const updated = [...formData.vipPlans];
                    updated[idx].description = e.target.value;
                    setFormData({...formData, vipPlans: updated});
                  }} />
                </div>
              ))}
              {(!formData.vipPlans || formData.vipPlans.length === 0) && (
                <p className="text-center text-xs opacity-40 font-black uppercase py-4">Nenhum plano cadastrado.</p>
              )}
            </div>
          </div>

          <div className={`rounded-[3.5rem] p-10 md:p-14 border-2 space-y-8 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-2xl font-black font-display italic flex items-center gap-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><RotateCcw className="text-[#D4AF37]" /> Limpeza de Dados</h3>
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => { if(confirm("Zerar todas as curtidas dos profissionais?")) resetAllLikes(); }}
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
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[3.5rem] cursor-pointer border-2 border-dashed border-[#D4AF37]">
                <Upload className="text-white" size={32} />
                <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageChange('logo', e.target.files[0])} />
              </label>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">PNG ou JPG (Recomendado: 512x512)</p>
          </div>

          <div className={`rounded-[3.5rem] p-12 border-2 space-y-8 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/10'}`}>
            <h3 className={`text-xl font-black font-display italic flex items-center gap-3 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><ImageIcon className="text-[#D4AF37]" size={20} /> Backgrounds</h3>
            
            <div className="space-y-6">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase opacity-40">Capa Principal</label>
                  <div className="h-24 rounded-2xl overflow-hidden relative group">
                     <img src={formData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                     <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"><Upload size={18}/><input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleImageChange('coverImage', e.target.files[0])} /></label>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase opacity-40">Fundo de Login</label>
                  <div className="h-24 rounded-2xl overflow-hidden relative group">
                     <img src={formData.loginBackground} className="w-full h-full object-cover" alt="Login BG" />
                     <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"><Upload size={18}/><input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleImageChange('loginBackground', e.target.files[0])} /></label>
                  </div>
               </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Settings;
