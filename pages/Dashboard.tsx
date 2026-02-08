
import React from 'react';
import { 
  Users, CalendarCheck, Scissors, ArrowUpRight, Wallet, Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CORES } from '../constants';
import { useBarberStore } from '../store';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { appointments, clients, financialEntries, services, theme } = useBarberStore();

  const totalRevenue = financialEntries
    .filter(e => e.type === 'RECEITA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const estatisticas = [
    { id: 'financial', label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(2)}`, change: '+12%', icon: Wallet, color: '#D4AF37' },
    { id: 'appointments', label: 'Reservas', value: appointments.length.toString(), change: '+5', icon: CalendarCheck, color: '#10b981' },
    { id: 'clients', label: 'Clientes', value: clients.length.toString(), change: '+8%', icon: Users, color: '#3b82f6' },
    { id: 'services', label: 'Serviços', value: services.length.toString(), change: '+2', icon: Scissors, color: '#a855f7' },
  ];

  const dadosGrafico = financialEntries.slice(0, 7).map(e => ({ name: e.date.split('-').reverse().slice(0,2).join('/'), value: e.amount }));

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-color-main font-display tracking-tight flex items-center gap-3">
            Gestão <span className="text-[#D4AF37] italic">Sr. José</span>
          </h1>
          <p className="text-color-sec mt-1 text-sm md:text-lg font-medium opacity-60">Controle completo da sua unidade signature.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {estatisticas.map((stat) => (
          <div 
            key={stat.id} 
            onClick={() => onNavigate(stat.id)}
            className="cartao-vidro p-6 md:p-8 rounded-[2rem] hover:border-[#D4AF37]/50 transition-all duration-500 group relative cursor-pointer overflow-hidden border-white/5"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all">
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded-full border border-emerald-400/10">
                <ArrowUpRight className="w-3 h-3" /> {stat.change}
              </div>
            </div>
            <div className="mt-6 md:mt-8">
              <h3 className="text-color-sec text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
              <p className="text-2xl md:text-3xl font-black text-color-main mt-1 md:mt-2 font-display">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 cartao-vidro rounded-[2rem] p-6 md:p-10 border-white/5">
          <h3 className="text-lg md:text-xl font-bold text-color-main mb-8 md:mb-10 tracking-tight italic">Performance Financeira</h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico.length > 0 ? dadosGrafico : [{name: 'Sem dados', value: 0}]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CORES.primaria} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={CORES.primaria} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'light' ? '#71717a' : '#52525b', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'light' ? '#71717a' : '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0F0F0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: theme === 'light' ? '#000' : '#fff' }} />
                <Area type="monotone" dataKey="value" stroke={CORES.primaria} strokeWidth={3} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cartao-vidro rounded-[2rem] p-6 md:p-10 border-white/5 overflow-hidden">
          <h3 className="text-lg md:text-xl font-bold text-color-main mb-6 md:mb-8 tracking-tight italic">Próximos Atendimentos</h3>
          <div className="space-y-4 md:space-y-6">
            {appointments.slice(0, 5).map((app) => (
              <div 
                key={app.id} 
                onClick={() => onNavigate('appointments')}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer border border-transparent hover:border-white/5 group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-[#D4AF37] border border-white/5 group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                  {app.clientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-color-main truncate">{app.clientName}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <Clock size={10} className="text-color-sec opacity-40" />
                     <p className="text-[9px] text-color-sec font-black uppercase truncate">{app.startTime} — {app.serviceName}</p>
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-[10px] text-color-sec text-center py-10 italic opacity-40">Nenhum agendamento futuro.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
