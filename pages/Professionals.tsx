import React, { useState } from 'react';
import { Briefcase, UserPlus, Trash2, Edit2, X, Sparkles, Upload, Clock, DollarSign } from 'lucide-react';
import { useBarberStore } from '../store';
import { Professional } from '../types';

const Professionals: React.FC = () => {
  const { professionals, addProfessional, updateProfessional, deleteProfessional, theme } = useBarberStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Professional, 'id' | 'likes'>>({
    name: '',
    specialties: [],
    avatar: 'https://i.pravatar.cc/150?u=temp',
    commission: 50,
    workingHours: { start: '08:00', end: '20:00' },
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Preencha o nome");
    if (editingId) {
      await updateProfessional(editingId, formData);
    } else {
      await addProfessional(formData);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', specialties: [], avatar: 'https://i.pravatar.cc/150?u=temp', commission: 50, workingHours: { start: '08:00', end: '20:00' }, description: '' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 h-full overflow-auto pb-10 scrollbar-hide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Equipe Artística</h1>
          <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Os artífices do estilo.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 gradiente-ouro text-black px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
          <UserPlus size={16} /> NOVO BARBEIRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {professionals.map(p => (
          <div key={p.id} className={`rounded-[2.5rem] p-10 group relative overflow-hidden border hover:border-[#D4AF37]/40 transition-all duration-500 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
            <div className="flex items-start justify-between">
              <div className="relative">
                <img src={p.avatar} className="w-24 h-24 rounded-3xl object-cover border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-all shadow-2xl" alt={p.name} />
                <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-black p-2 rounded-xl shadow-xl"><Sparkles size={14} /></div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingId(p.id); setFormData(p); setShowModal(true); }} className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 hover:bg-white/10 text-zinc-400'}`}><Edit2 size={16}/></button>
                <button onClick={() => deleteProfessional(p.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{p.name}</h3>
              <p className={`text-[10px] uppercase tracking-widest font-black mt-2 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Mestre Barbeiro. Signature</p>
            </div>

            <div className="mt-10 flex gap-4">
              <div className={`flex-1 p-4 rounded-2xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                <p className={`text-[8px] uppercase font-black tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Comissão</p>
                <p className="text-xl font-black text-[#D4AF37] italic font-display">{p.commission}%</p>
              </div>
              <div className={`flex-1 p-4 rounded-2xl border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                <p className={`text-[8px] uppercase font-black tracking-widest mb-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Turno</p>
                <p className={`text-[10px] font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{p.workingHours.start} – {p.workingHours.end}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-lg rounded-[3rem] p-12 space-y-10 relative max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/10'}`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{editingId ? 'Refinar Perfil' : 'Novo Recrutamento'}</h2>
              <button onClick={() => setShowModal(false)} className={`transition-colors ${theme === 'light' ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}><X size={24} /></button>
            </div>

            <div className="flex flex-col items-center gap-6">
               <div className="relative group">
                  <img src={formData.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white/10" alt="Avatar" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-[2.5rem] cursor-pointer transition-all">
                    <Upload className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
               </div>
               <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Toque para carregar foto real</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Nome Artístico</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
              </div>
              
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>História / Descrição</label>
                <textarea 
                  rows={4} 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Conte a história e especialidades deste profissional..."
                  className={`w-full border p-5 rounded-2xl outline-none font-medium resize-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#D4AF37]'}`}
                />
                <p className={`text-[8px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Aparecerá ao cliente clicar na foto</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Comissão (%)</label>
                  <input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: parseInt(e.target.value)})} className={`w-full border p-5 rounded-2xl outline-none font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Início Turno</label>
                  <input type="time" value={formData.workingHours.start} onChange={e => setFormData({...formData, workingHours: {...formData.workingHours, start: e.target.value}})} className={`w-full border p-5 rounded-2xl outline-none font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                </div>
              </div>
              <button onClick={handleSave} className="w-full gradiente-ouro text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl">Confirmar Especialista</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Professionals;
