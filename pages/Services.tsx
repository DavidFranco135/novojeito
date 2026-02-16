import React, { useState, useMemo } from 'react';
import { Scissors, Plus, Trash2, Edit2, X, Clock, DollarSign, Check, Search, Upload, ImageIcon, Filter } from 'lucide-react';
import { useBarberStore } from '../store';
import { Service } from '../types';

const Services: React.FC = () => {
  const { services, addService, updateService, deleteService, theme } = useBarberStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);

  const initialFormData: Omit<Service, 'id'> = {
    name: '',
    price: 0,
    durationMinutes: 30,
    description: '',
    status: 'ATIVO',
    category: 'Cabelo',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400'
  };

  const [formData, setFormData] = useState<Omit<Service, 'id'>>(initialFormData);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'Todos' || s.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [services, searchTerm, activeCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await updateService(editingId, formData);
    else await addService(formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Serviços de Cortes</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Gerencie seu cardápio de cortes.</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData(initialFormData); setShowModal(true); }} className="gradiente-ouro text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`} size={18} />
          <input type="text" placeholder="Pesquisar rituais..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full border py-3 pl-12 pr-4 rounded-xl text-xs font-black outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${activeCategory === cat ? 'bg-[#D4AF37] text-black border-transparent' : theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-white/5 text-zinc-500 border-white/5'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(s => (
          <div key={s.id} className={`p-4 rounded-[2rem] border flex gap-4 transition-all group ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm hover:border-blue-400' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/40'}`}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0">
               <img src={s.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className={`text-sm font-black italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{s.name}</h3>
                <p className={`text-[10px] ${expandedDescriptions[s.id] ? '' : 'line-clamp-1'} ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{s.description}</p>
                {s.description && s.description.length > 50 && (
                  <button 
                    onClick={() => setExpandedDescriptions({...expandedDescriptions, [s.id]: !expandedDescriptions[s.id]})}
                    className="text-[9px] font-black text-[#D4AF37] hover:text-[#D4AF37]/80 mt-1 transition-all"
                  >
                    {expandedDescriptions[s.id] ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
                <div className="flex gap-3 mt-2">
                   <span className="text-[9px] font-black text-[#D4AF37]">R$ {s.price}</span>
                   <span className={`text-[9px] font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{s.durationMinutes} min</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setEditingId(s.id); setFormData(s); setShowModal(true); }} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}><Edit2 size={12}/></button>
                <button onClick={() => deleteService(s.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={12}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 border relative shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-white/10'}`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Configurar Ritual</h2>
              <button onClick={() => setShowModal(false)} className={`transition-colors ${theme === 'light' ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
               <div className="flex flex-col items-center gap-4">
                  <div className="relative group w-32 h-32">
                    <img src={formData.image} className="w-full h-full object-cover rounded-3xl border-2 border-white/5 shadow-lg" alt="Preview" />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-3xl cursor-pointer">
                       <Upload className="text-white" size={20}/>
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Nome</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Valor (R$)</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Duração (Min)</label>
                    <input required type="number" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Categoria</label>
                    <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Descrição</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold resize-none h-20 outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} placeholder="Descreva o serviço..."></textarea>
                  </div>
               </div>
               <button type="submit" className="w-full gradiente-ouro text-black py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Salvar Ritual</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
