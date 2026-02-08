// ... (mantenha os imports e as funções handleLogin/handleRegister originais)

if (!user) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Ajuste da Imagem de Fundo para não cortar */}
      <div className="absolute inset-0 z-0">
        <img 
          src={config.loginBackground} 
          className="w-full h-full object-cover opacity-40 grayscale" 
          alt="Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className="w-full max-w-[400px] z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="relative inline-block group">
            <img 
              src={config.logo} 
              className="w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] object-cover border-2 border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.2)] mx-auto" 
              alt="Logo" 
            />
            <div className="absolute -inset-4 bg-[#D4AF37]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-all" />
          </div>
          
          <div>
            {/* Letras ajustadas (text-3xl em vez de 4xl) */}
            <h2 className="text-3xl font-black text-white font-display italic tracking-tight uppercase">
              {isRegistering ? 'Criar Conta' : 'Área Master'}
            </h2>
            <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-80">
              {config.name} Signature
            </p>
          </div>
        </div>

        <div className="cartao-vidro rounded-[3rem] p-8 md:p-10 border-white/10 shadow-2xl space-y-6">
          <div className="space-y-4">
            {isRegistering ? (
              <>
                <input type="text" placeholder="NOME COMPLETO" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white text-xs font-bold focus:border-[#D4AF37]/50 transition-all uppercase tracking-widest" />
                <input type="text" placeholder="WHATSAPP (DDD)" value={registerData.phone} onChange={e => setRegisterData({...registerData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white text-xs font-bold focus:border-[#D4AF37]/50 transition-all uppercase tracking-widest" />
              </>
            ) : null}
            
            <input 
              type="text" 
              placeholder="E-MAIL OU USUÁRIO" 
              value={loginIdentifier} 
              onChange={e => setLoginIdentifier(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white text-xs font-bold focus:border-[#D4AF37]/50 transition-all uppercase tracking-widest" 
            />
            <input 
              type="password" 
              placeholder="SENHA SECRETA" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-white text-xs font-bold focus:border-[#D4AF37]/50 transition-all uppercase tracking-widest" 
            />
          </div>

          <button 
            onClick={isRegistering ? handleRegister : handleLogin} 
            className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegistering ? 'FINALIZAR CADASTRO' : 'ENTRAR NO SISTEMA'}
          </button>

          <div className="pt-4 text-center border-t border-white/5">
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              className="text-white/40 hover:text-[#D4AF37] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isRegistering ? 'Já tenho acesso? Fazer Login' : 'Ainda não é cliente? Cadastre-se'}
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsPublicView(true)} 
          className="w-full text-white/30 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all"
        >
          — Voltar para a vitrine —
        </button>
      </div>
    </div>
  );
}
