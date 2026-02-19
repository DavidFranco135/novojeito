import React, { useState } from 'react';
import { X, LogIn, UserPlus, Phone, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useBarberStore } from '../store';

interface PublicAuthModalProps {
  onSuccess: (clientId: string) => void;
  onClose: () => void;
}

type AuthMode = 'choose' | 'login' | 'register';

const PublicAuthModal: React.FC<PublicAuthModalProps> = ({ onSuccess, onClose }) => {
  const { clients, addClient } = useBarberStore();
  const [mode, setMode] = useState<AuthMode>('choose');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });

  // Registro
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { identifier, password } = loginData;
      const client = clients.find(c =>
        (c.phone === identifier || c.email === identifier) && c.password === password
      );

      if (!client) {
        setError('Email/telefone ou senha incorretos. Tente novamente.');
        setLoading(false);
        return;
      }

      setSuccess(`Bem-vindo, ${client.name}!`);
      setTimeout(() => onSuccess(client.id), 1000);
    } catch {
      setError('Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { name, phone, email, password, confirmPassword } = registerData;

      if (!name || !phone || !password) {
        setError('Preencha nome, telefone e senha.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }

      if (password.length < 4) {
        setError('Senha deve ter pelo menos 4 caracteres.');
        setLoading(false);
        return;
      }

      // ✅ Verifica se já existe usuário com mesmo telefone ou email
      const existsByPhone = clients.find(c => c.phone === phone);
      const existsByEmail = email && clients.find(c => c.email === email);

      if (existsByPhone || existsByEmail) {
        setError('Já existe um cadastro com este telefone ou e-mail. Faça login.');
        setLoading(false);
        return;
      }

      const newClient = await addClient({ name, phone, email, password });
      setSuccess(`Cadastro criado! Bem-vindo, ${name}!`);
      setTimeout(() => onSuccess(newClient.id), 1200);
    } catch {
      setError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-sm cartao-vidro rounded-[2.5rem] p-8 border border-[#D4AF37]/20 shadow-2xl space-y-6 relative">

        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>

        {/* Tela de escolha */}
        {mode === 'choose' && (
          <>
            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                <Lock size={24} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-black font-display italic text-white">Acesse sua conta</h2>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">para finalizar o agendamento</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setMode('login')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20">
                  <LogIn size={18} className="text-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white">Já tenho cadastro</p>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Entrar com email ou telefone</p>
                </div>
              </button>

              <button
                onClick={() => setMode('register')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20">
                  <UserPlus size={18} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-white">Quero me cadastrar</p>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Criar conta gratuitamente</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Tela de Login */}
        {mode === 'login' && (
          <>
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-xl font-black font-display italic text-white">Entrar</h2>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">use seu email ou telefone</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email ou Telefone</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="seu@email.com ou (11) 99999-9999"
                    value={loginData.identifier}
                    onChange={e => setLoginData({ ...loginData, identifier: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-4 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="sua senha"
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-10 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-[10px] text-red-400 font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[10px] text-emerald-400 font-bold">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button onClick={() => { setMode('choose'); setError(''); }} className="w-full text-center text-[9px] text-zinc-600 hover:text-zinc-400 font-black uppercase tracking-widest transition-colors">
              ← Voltar
            </button>
          </>
        )}

        {/* Tela de Registro */}
        {mode === 'register' && (
          <>
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-xl font-black font-display italic text-white">Criar Conta</h2>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">preencha seus dados</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nome completo</label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={registerData.name}
                  onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 px-4 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Telefone / WhatsApp *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={registerData.phone}
                    onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-4 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email (opcional)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-4 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="mínimo 4 dígitos"
                      value={registerData.password}
                      onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-9 pr-3 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Confirmar</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="repita a senha"
                      value={registerData.confirmPassword}
                      onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-9 pr-3 py-3.5 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-1.5 text-[9px] text-zinc-500 hover:text-zinc-300 font-black uppercase transition-colors">
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPassword ? 'Ocultar' : 'Mostrar'} senha
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-[10px] text-red-400 font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[10px] text-emerald-400 font-bold">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg disabled:opacity-60"
              >
                {loading ? 'Criando conta...' : 'Criar Conta e Agendar'}
              </button>
            </form>

            <button onClick={() => { setMode('choose'); setError(''); }} className="w-full text-center text-[9px] text-zinc-600 hover:text-zinc-400 font-black uppercase tracking-widest transition-colors">
              ← Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicAuthModal;
