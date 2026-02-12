import React, { useState } from 'react';
import { MessageSquare, Trash2, User, Phone, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { useBarberStore } from '../store';

const Suggestions: React.FC = () => {
  const { suggestions, deleteSuggestion, updateSuggestion, theme } = useBarberStore();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;
    try {
      await updateSuggestion(id, { 
        response: replyText[id],
        responseDate: new Date().toLocaleDateString('pt-BR')
      });
      setReplyText(prev => ({ ...prev, [id]: '' }));
      alert("✅ Resposta enviada com sucesso!");
    } catch (error) {
      alert("Erro ao responder.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
            Sugestões de Membros
          </h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Feedback direto do seu portal.
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl border ${theme === 'light' ? 'bg-white border-zinc-200' : 'cartao-vidro border-white/5'}`}>
          <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
          <p className={`font-black uppercase text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
            Nenhuma sugestão recebida ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.map((sug) => (
            <div 
              key={sug.id} 
              className={`rounded-[2.5rem] p-8 border relative group hover:border-[#D4AF37]/40 transition-all duration-500 ${
                theme === 'light' 
                  ? 'bg-white border-zinc-200 shadow-sm' 
                  : 'cartao-vidro border-white/5'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    <User size={24}/>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg leading-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      {sug.clientName}
                    </h3>
                    <p className={`font-bold uppercase tracking-widest flex items-center gap-2 text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      <Phone size={10}/> {sug.clientPhone}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Deseja excluir esta sugestão?')) {
                      deleteSuggestion(sug.id);
                    }
                  }}
                  className={`p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                    theme === 'light'
                      ? 'text-zinc-600 hover:text-red-600 bg-zinc-100'
                      : 'text-zinc-700 hover:text-red-500 bg-white/5'
                  }`}
                >
                  <Trash2 size={16}/>
                </button>
              </div>
              
              <div className={`p-6 rounded-2xl border italic text-sm leading-relaxed mb-6 ${
                theme === 'light'
                  ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  : 'bg-white/5 border-white/5 text-zinc-300'
              }`}>
                "{sug.text}"
              </div>

              {/* CAMPO DE RESPOSTA ADM */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea 
                    value={replyText[sug.id] || sug.response || ''}
                    onChange={(e) => setReplyText({...replyText, [sug.id]: e.target.value})}
                    placeholder="Escreva uma resposta para o cliente..."
                    className={`w-full border rounded-2xl p-4 text-xs outline-none focus:border-[#D4AF37] transition-all resize-none h-24 ${
                      theme === 'light'
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                        : 'bg-black/40 border-white/10 text-white placeholder:text-zinc-500'
                    }`}
                  />
                  <button 
                    onClick={() => handleReply(sug.id)}
                    className="absolute bottom-3 right-3 p-2 bg-[#D4AF37] text-black rounded-lg hover:scale-110 transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>
                {sug.response && (
                  <div className="flex items-center gap-2 px-2">
                    <CheckCircle2 size={12} className="text-[#D4AF37]" />
                    <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">
                      Respondido {sug.responseDate && `em ${sug.responseDate}`}
                    </span>
                  </div>
                )}
              </div>

              <div className={`mt-6 flex items-center justify-between border-t pt-4 ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/5'
              }`}>
                <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'
                }`}>
                  <Calendar size={12}/> Recebida em: {sug.date}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37]/30">
                  <MessageSquare size={14}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestions;
