import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Clock, MapPin } from 'lucide-react';
import { useBarberStore } from '../store';
import { storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({ 
    name: user?.name || '', 
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150' 
  });
  const [loading, setLoading] = useState(false);

  // Função auxiliar para fazer upload e retornar a URL
  const handleFileUpload = async (file: File, folder: string) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          await uploadString(storageRef, base64, 'data_url');
          const url = await getDownloadURL(storageRef);
          resolve(url);
        } catch (err) { reject(err); }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (field: 'logo' | 'coverImage' | 'loginBackground', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await handleFileUpload(file, 'config');
        setFormData(prev => ({ ...prev, [field]: url }));
        if (field === 'logo') setUserData(prev => ({ ...prev, avatar: url }));
      } catch (err) {
        alert("Erro ao carregar imagem.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await handleFileUpload(file, 'gallery');
        setFormData(prev => ({ 
          ...prev, 
          gallery: [...(prev.gallery || []), url] 
        }));
      } catch (err) {
        alert("Erro no upload da galeria.");
      } finally {
        setLoading(false);
      }
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
          
          {/* Perfil Master */}
          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><UserIcon className="text-[#D4AF37]" /> Perfil Master</h3>
            <div className="flex flex-col sm:flex-row items-center gap-10">
               <div className="relative group w-40 h-40">
                  <img src={userData.avatar} className="w-full h-full rounded-[3rem] object-cover border-4 border-[#D4AF37]/30 shadow-2xl" alt="Avatar" />
                  <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center rounded-[3rem] cursor-pointer text-[10px] font-black uppercase tracking-widest gap-2 text-white">
                    <Upload size={24} /> {loading ? '...' : 'Trocar Foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} />
                  </label>
               </div>
               <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Assinatura Digital</label>
                    <input type="text" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl outline-none font-black text-xl"/>
                  </div>
               </div>
            </div>
          </div>

          {/* Galeria de Ambiente */}
          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black font-display italic flex items-center gap-4"><ImageIcon className="text-[#D4AF37]" /> Nosso Ambiente (Slides)</h3>
               <label className="gradiente-ouro text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase cursor-pointer flex items-center gap-2 shadow-lg">
                 <Plus size={16}/> {loading ? 'CARREGANDO...' : 'ADICIONAR FOTO'}
                 <input type="file" accept="image/*" className="hidden" disabled={loading} onChange={handleGalleryUpload}/>
               </label>
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
        </div>

        {/* Sidebar */}
        <aside className="space-y-10">
          <div className="cartao-vidro rounded-[3.5rem] p-12 border-white/10 text-center flex flex-col items-center">
            <h3 className="text-2xl font-black font-display italic mb-10">Logo Master</h3>
            <div className="relative group w-52 h-52 mb-6">
              <img src={formData.logo} className="w-full h-full rounded-[3.5rem] object-cover border-4 border-[#D4AF37]/40 shadow-2xl transition-all" alt="Logo" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[3.5rem] cursor-pointer">
                <Upload className="text-white" size={32} />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} />
              </label>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Settings;
