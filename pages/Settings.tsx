import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2 } from 'lucide-react';
import { useBarberStore } from '../store';

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser, resetAllLikes } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({ 
    name: user?.name || '', 
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150' 
  });
  const [loading, setLoading] = useState(false);

  // SUA CHAVE API MANTIDA
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
          <h1 className="text-4xl font-black text-color-main font-display italic tracking-tight">Painel Master</h1>
          <p className="text-color-sec text-[11px] font-black uppercase tracking-widest opacity-60">Configurações Avançadas Sr. José</p>
        </div>
        <button form="settings-form" type="submit" disabled={loading} className="flex items-center justify-center gap-4 gradiente-ouro text-black px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
          {loading ? 'Sincronizando...' : <><Save size={20} /> Gravar Tudo</>}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><UserIcon className="text-[#D4AF37]" /> Perfil Master</h3>
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
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Assinatura Digital (Seu Nome)</label>
                    <input type="text" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl outline-none font-black text-xl"/>
                  </div>
               </div>
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><Store className="text-[#D4AF37]" /> Identidade Signature</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Casa</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Resumo Header (Slogan)</label><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="md:col-span-2 space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Título Seção Sobre</label><input type="text" value={formData.aboutTitle} onChange={e => setFormData({...formData, aboutTitle: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="md:col-span-2 space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">História / Conteúdo Sobre</label><textarea rows={5} value={formData.aboutText} onChange={e => setFormData({...formData, aboutText: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-medium resize-none"/></div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Imagem da Seção Sobre</label>
                <div className="relative group w-full h-64 rounded-3xl overflow-hidden border-2 border-white/10 shadow-xl">
                  <img src={formData.aboutImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800'} className="w-full h-full object-cover" alt="Imagem Sobre" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-xs font-black uppercase tracking-widest gap-2">
                    <Upload size={28} /> {loading ? 'Enviando...' : 'Mudar Imagem'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('aboutImage', e)} disabled={loading} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><MapPin className="text-[#D4AF37]" /> Onde & Como</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp Business</label><input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Instagram (@user)</label><input type="text" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="md:col-span-2 space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Endereço Completo</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Cidade</label><input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Estado (UF)</label><input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="md:col-span-2 space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">URL Google Maps</label><input type="text" value={formData.locationUrl} onChange={e => setFormData({...formData, locationUrl: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black"/></div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Foto da Localização (Opcional)</label>
                <div className="relative group w-full h-48 rounded-3xl overflow-hidden border-2 border-white/10 shadow-xl">
                  <img src={formData.locationImage || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800'} className="w-full h-full object-cover" alt="Localização" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-xs font-black uppercase tracking-widest gap-2">
                    <Upload size={28} /> {loading ? 'Enviando...' : 'Mudar Foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('locationImage', e)} disabled={loading} />
                  </label>
                </div>
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-1">Se não adicionar foto, aparecerá o ícone de mapa</p>
              </div>
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><Clock className="text-[#D4AF37]" /> Horários de Funcionamento</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Abertura</label><input type="time" value={formData.openingTime} onChange={e => setFormData({...formData, openingTime: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black text-center"/></div>
              <div className="space-y-3"><label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Fechamento</label><input type="time" value={formData.closingTime} onChange={e => setFormData({...formData, closingTime: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-black text-center"/></div>
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><ImageIcon className="text-[#D4AF37]" /> Nosso Ambiente (Slides)</h3>
               <label className="gradiente-ouro text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase cursor-pointer flex items-center gap-2 shadow-lg"><Plus size={16}/> {loading ? '...' : 'ADICIONAR FOTO'} <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload}/></label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
               {(formData.gallery || []).map((img, i) => (
                 <div key={i} className="relative group aspect-video rounded-3xl overflow-hidden border-2 border-white/10 shadow-xl">
                    <img src={img} className="w-full h-full object-cover" alt=""/>
                    <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-110"><Trash2 size={16}/></button>
                 </div>
               ))}
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-5 md:p-7 border-white/5 space-y-3">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><UserIcon className="text-[#D4AF37]" /> Gestão de Barbeiros</h3>
            <p className="text-sm text-zinc-400">Reinicie os contadores de curtidas de todos os profissionais.</p>
            <button 
              type="button"
              onClick={async () => {
                if (confirm('Tem certeza que deseja reiniciar todos os contadores de curtidas dos barbeiros?')) {
                  await resetAllLikes();
                  alert('Contadores de curtidas reiniciados com sucesso!');
                }
              }}
              className="w-full bg-red-100/10 border-2 border-red-500/40 text-red-100 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100/10 transition-all"
            >
              Reiniciar Contadores de Curtidas
            </button>
          </div>
        </div>

        <aside className="space-y-10">
          <div className="cartao-vidro rounded-[3.5rem] p-12 border-white/10 text-center flex flex-col items-center">
            <h3 className="text-2xl font-black font-display italic mb-10">Logo Master</h3>
            <div className="relative group w-52 h-52 mb-6">
              <img src={formData.logo} className="w-full h-full rounded-[3.5rem] object-cover border-4 border-[#D4AF37]/40 shadow-2xl transition-all" alt="Logo" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[3.5rem] cursor-pointer"><Upload className="text-white" size={32} /><input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} /></label>
            </div>
          </div>

          <div className="cartao-vidro rounded-[3.5rem] p-12 border-white/10 space-y-10">
             <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-4"><ImageIcon size={20} className="text-[#D4AF37]"/> Visuais Master</h3>
             <div className="space-y-6">
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Capa da Home</p>
                   <div className="relative group w-full h-32 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-xl">
                     <img src={formData.coverImage} className="w-full h-full object-cover grayscale opacity-50" alt="Cover" />
                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white text-[10px] font-black uppercase">Mudar Capa <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('coverImage', e)} /></label>
                   </div>
                </div>
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fundo Tela de Login</p>
                   <div className="relative group w-full h-32 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-xl">
                     <img src={formData.loginBackground} className="w-full h-full object-cover grayscale opacity-50" alt="Login BG" />
                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white text-[10px] font-black uppercase">Mudar Login <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('loginBackground', e)} /></label>
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
