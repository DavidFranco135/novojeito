
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Client, Professional, Service, Appointment, ShopConfig, User, FinancialEntry, Notification, Review } from './types';
import './firebase';

interface BarberContextType {
  user: User | null;
  clients: Client[];
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
  notifications: Notification[];
  config: ShopConfig;
  loading: boolean;
  theme: 'dark' | 'light';
  
  toggleTheme: () => void;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  
  addClient: (data: Omit<Client, 'id' | 'totalSpent' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addService: (data: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  addProfessional: (data: Omit<Professional, 'id' | 'likes'>) => Promise<void>;
  updateProfessional: (id: string, data: Partial<Professional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  likeProfessional: (id: string) => void;
  
  addAppointment: (data: Omit<Appointment, 'id' | 'status'>, isPublic?: boolean) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  rescheduleAppointment: (id: string, date: string, startTime: string, endTime: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  addFinancialEntry: (data: Omit<FinancialEntry, 'id'>) => Promise<void>;
  deleteFinancialEntry: (id: string) => Promise<void>;
  
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateConfig: (data: Partial<ShopConfig>) => Promise<void>;
  addShopReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CLIENTS: 'brb_clients_v10',
  PROFS: 'brb_profs_v10',
  SERVICES: 'brb_services_v10',
  APPS: 'brb_apps_v10',
  FINANCE: 'brb_finance_v10',
  CONFIG: 'brb_config_v10',
  NOTIFS: 'brb_notifs_v10',
  AUTH: 'brb_auth_v10',
  THEME: 'brb_theme_v10'
};

export function BarberProvider({ children }: { children?: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : null;
  });

  const [clients, setClients] = useState<Client[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'));
  const [professionals, setProfessionals] = useState<Professional[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFS) || '[]'));
  const [services, setServices] = useState<Service[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]'));
  const [appointments, setAppointments] = useState<Appointment[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.APPS) || '[]'));
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFS) || '[]'));
  
  const [config, setConfig] = useState<ShopConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : {
      name: "Barbearia Sr. José",
      description: "Tradição em São Gonçalo desde 1995. Excelência em cortes clássicos.",
      aboutTitle: "Nossa História Signature",
      aboutText: "Referência em cuidado masculino, unindo o old-school com as técnicas modernas.",
      address: "Rua Feliciano Sodré, 123",
      city: "São Gonçalo",
      state: "RJ",
      whatsapp: "21987654321",
      instagram: "@barbearia_srjose",
      logo: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=200",
      coverImage: "https://images.unsplash.com/photo-1512690196252-741ef294f260?q=80&w=2000",
      loginBackground: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000",
      locationUrl: "https://maps.google.com",
      openingTime: "08:00",
      closingTime: "20:00",
      email: "contato@srjose.com.br",
      cnpj: "00.000.000/0001-00",
      gallery: [],
      reviews: []
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.PROFS, JSON.stringify(professionals));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(financialEntries));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    setLoading(false);
  }, [clients, professionals, services, appointments, financialEntries, notifications, config, user, theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const login = async (emailOrPhone: string, pass: string) => {
    // Acesso livre admin
    if (emailOrPhone === 'srjoseadm@gmail.com' && pass === '654321') {
      const admin = { id: 'admin1', name: 'Sr. José', email: emailOrPhone, role: 'ADMIN' as const, avatar: 'https://i.pravatar.cc/150?u=admin' };
      setUser(admin);
      return;
    }

    // Login cliente
    const client = clients.find(c => (c.phone === emailOrPhone || c.email === emailOrPhone) && c.password === pass);
    if (client) {
      setUser({ id: client.id, name: client.name, email: client.email, role: 'CLIENTE', phone: client.phone, avatar: `https://i.pravatar.cc/150?u=${client.id}` });
      return;
    }

    throw new Error("Credenciais inválidas");
  };

  const logout = () => setUser(null);
  
  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...data } : null;
      if (updated && updated.role === 'ADMIN') {
        // Garantir que a foto de perfil seja persistida também na config se necessário
      }
      return updated;
    });
  };

  const addClient = async (data: Omit<Client, 'id' | 'totalSpent' | 'createdAt'>) => {
    const phoneClean = data.phone.replace(/\D/g, '');
    const existing = clients.find(c => c.phone.replace(/\D/g, '') === phoneClean);
    if (existing) return existing;
    const newClient: Client = { ...data, id: `cli_${Date.now()}`, totalSpent: 0, createdAt: new Date().toISOString() };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (id: string, data: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClient = async (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  const addService = async (data: Omit<Service, 'id'>) => setServices(prev => [...prev, { ...data, id: `svc_${Date.now()}` }]);
  const updateService = async (id: string, data: Partial<Service>) => setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteService = async (id: string) => setServices(prev => prev.filter(s => s.id !== id));
  const addProfessional = async (data: Omit<Professional, 'id' | 'likes'>) => setProfessionals(prev => [...prev, { ...data, id: `prof_${Date.now()}`, likes: 0 }]);
  const updateProfessional = async (id: string, data: Partial<Professional>) => setProfessionals(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProfessional = async (id: string) => setProfessionals(prev => prev.filter(p => p.id !== id));
  const likeProfessional = (id: string) => setProfessionals(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));

  const addAppointment = async (data: Omit<Appointment, 'id' | 'status'>, isPublic: boolean = false) => {
    const appointmentId = `app_${Date.now()}`;
    const newApp: Appointment = { ...data, id: appointmentId, status: 'AGENDADO' };
    setAppointments(prev => [newApp, ...prev]);
    if (isPublic) {
      // Som estilo iFood
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(() => {});
      
      setNotifications(prev => [{
        id: `not_${Date.now()}`,
        title: 'Novo Agendamento',
        message: `${data.clientName} agendou ${data.serviceName} para ${data.date}.`,
        time: new Date().toLocaleTimeString(),
        read: false,
        targetId: appointmentId
      }, ...prev]);
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        if (a.status === 'CONCLUIDO_PAGO' && status !== 'CONCLUIDO_PAGO') {
          setFinancialEntries(fin => fin.filter(f => f.appointmentId !== id));
          setClients(clis => clis.map(c => c.id === a.clientId ? { 
            ...c, totalSpent: Math.max(0, c.totalSpent - a.price) 
          } : c));
        } 
        else if (status === 'CONCLUIDO_PAGO' && a.status !== 'CONCLUIDO_PAGO') {
          addFinancialEntry({
            appointmentId: a.id,
            description: `Serviço: ${a.serviceName} - ${a.clientName}`,
            amount: a.price,
            type: 'RECEITA',
            date: a.date,
            category: 'Serviços'
          });
          setClients(clis => clis.map(c => c.id === a.clientId ? { 
            ...c, totalSpent: c.totalSpent + a.price, lastVisit: a.date 
          } : c));
        }
        return { ...a, status };
      }
      return a;
    }));
  };

  const rescheduleAppointment = async (id: string, date: string, startTime: string, endTime: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
         if (a.status === 'CONCLUIDO_PAGO') {
           setFinancialEntries(fin => fin.filter(f => f.appointmentId !== id));
           setClients(clis => clis.map(c => c.id === a.clientId ? { ...c, totalSpent: Math.max(0, c.totalSpent - a.price) } : c));
         }
         return { ...a, date, startTime, endTime, status: 'REAGENDADO' };
      }
      return a;
    }));
  };

  const deleteAppointment = async (id: string) => setAppointments(prev => prev.filter(a => a.id !== id));
  const addFinancialEntry = async (data: Omit<FinancialEntry, 'id'>) => setFinancialEntries(prev => [{ ...data, id: `fin_${Date.now()}` }, ...prev]);
  const deleteFinancialEntry = async (id: string) => setFinancialEntries(prev => prev.filter(f => f.id !== id));
  const markNotificationAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearNotifications = () => setNotifications([]);
  const updateConfig = async (data: Partial<ShopConfig>) => setConfig(prev => ({ ...prev, ...data }));
  const addShopReview = (review: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = { ...review, id: `rev_${Date.now()}`, date: new Date().toLocaleDateString('pt-BR') };
    setConfig(prev => ({ ...prev, reviews: [newReview, ...(prev.reviews || [])] }));
  };

  return React.createElement(BarberContext.Provider, {
    value: {
      user, clients, professionals, services, appointments, financialEntries, notifications, config, loading, theme,
      toggleTheme, login, logout, updateUser, addClient, updateClient, deleteClient,
      addService, updateService, deleteService,
      addProfessional, updateProfessional, deleteProfessional, likeProfessional,
      addAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
      addFinancialEntry, deleteFinancialEntry,
      markNotificationAsRead, clearNotifications, updateConfig, addShopReview
    }
  }, children);
}

export const useBarberStore = () => {
  const context = useContext(BarberContext);
  if (context === undefined) throw new Error('useBarberStore must be used within a BarberProvider');
  return context;
};
