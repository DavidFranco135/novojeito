import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Client, Professional, Service, Appointment, ShopConfig, User, FinancialEntry, Notification, Review, Suggestion } from './types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

interface BarberContextType {
  user: User | null;
  clients: Client[];
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  financialEntries: FinancialEntry[];
  notifications: Notification[];
  suggestions: Suggestion[];
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
  
  addSuggestion: (data: Omit<Suggestion, 'id' | 'date'>) => Promise<void>;
  updateSuggestion: (id: string, data: Partial<Suggestion>) => Promise<void>;
  deleteSuggestion: (id: string) => Promise<void>;

  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateConfig: (data: Partial<ShopConfig>) => Promise<void>;
  addShopReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

const COLLECTIONS = {
  CLIENTS: 'clients',
  PROFESSIONALS: 'professionals',
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  FINANCIAL: 'financialEntries',
  CONFIG: 'config',
  NOTIFICATIONS: 'notifications',
  SUGGESTIONS: 'suggestions'
};

export function BarberProvider({ children }: { children?: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('brb_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('brb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [config, setConfig] = useState<ShopConfig>({
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
  });

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const unsubClients = onSnapshot(collection(db, COLLECTIONS.CLIENTS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(data);
    });
    unsubscribers.push(unsubClients);

    const unsubProfs = onSnapshot(collection(db, COLLECTIONS.PROFESSIONALS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional));
      setProfessionals(data);
    });
    unsubscribers.push(unsubProfs);

    const unsubServices = onSnapshot(collection(db, COLLECTIONS.SERVICES), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(data);
    });
    unsubscribers.push(unsubServices);

    const unsubApps = onSnapshot(collection(db, COLLECTIONS.APPOINTMENTS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    unsubscribers.push(unsubApps);

    const unsubFinancial = onSnapshot(collection(db, COLLECTIONS.FINANCIAL), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialEntry));
      setFinancialEntries(data);
    });
    unsubscribers.push(unsubFinancial);

    const unsubNotifs = onSnapshot(collection(db, COLLECTIONS.NOTIFICATIONS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
    });
    unsubscribers.push(unsubNotifs);

    const unsubSuggestions = onSnapshot(collection(db, COLLECTIONS.SUGGESTIONS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suggestion));
      setSuggestions(data);
    });
    unsubscribers.push(unsubSuggestions);

    const unsubConfig = onSnapshot(doc(db, COLLECTIONS.CONFIG, 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ShopConfig);
      }
    });
    unsubscribers.push(unsubConfig);

    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    localStorage.setItem('brb_theme', theme);
    localStorage.setItem('brb_user', JSON.stringify(user));
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
  }, [theme, user]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const login = async (emailOrPhone: string, pass: string) => {
    if (emailOrPhone === 'srjoseadm@gmail.com' && pass === '654321') {
      const admin = { id: 'admin1', name: 'Sr. José', email: emailOrPhone, role: 'ADMIN' as const, avatar: 'https://i.pravatar.cc/150?u=admin' };
      setUser(admin);
      return;
    }
    const client = clients.find(c => (c.phone === emailOrPhone || c.email === emailOrPhone) && c.password === pass);
    if (client) {
      setUser({ id: client.id, name: client.name, email: client.email, role: 'CLIENTE', phone: client.phone, avatar: client.avatar || `https://i.pravatar.cc/150?u=${client.id}` });
      return;
    }
    throw new Error("Credenciais inválidas");
  };

  const logout = () => setUser(null);
  const updateUser = (data: Partial<User>) => setUser(prev => prev ? { ...prev, ...data } : null);

  const addClient = async (data: Omit<Client, 'id' | 'totalSpent' | 'createdAt'>): Promise<Client> => {
    const phoneClean = data.phone.replace(/\D/g, '');
    const existing = clients.find(c => c.phone.replace(/\D/g, '') === phoneClean || c.email.toLowerCase() === data.email.toLowerCase());
    if (existing) return existing;
    const newClient: Omit<Client, 'id'> = { ...data, totalSpent: 0, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), newClient);
    return { id: docRef.id, ...newClient };
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), data as any);
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
  };

  const addService = async (data: Omit<Service, 'id'>) => {
    await addDoc(collection(db, COLLECTIONS.SERVICES), data);
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    await updateDoc(doc(db, COLLECTIONS.SERVICES, id), data as any);
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, id));
  };

  const addProfessional = async (data: Omit<Professional, 'id' | 'likes'>) => {
    await addDoc(collection(db, COLLECTIONS.PROFESSIONALS), { ...data, likes: 0 });
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), data as any);
  };

  const deleteProfessional = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PROFESSIONALS, id));
  };

  const likeProfessional = async (id: string) => {
    const prof = professionals.find(p => p.id === id);
    if (prof) {
      await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), { likes: (prof.likes || 0) + 1 });
    }
  };

  const addAppointment = async (data: Omit<Appointment, 'id' | 'status'>, isPublic: boolean = false) => {
    const newApp = { ...data, status: 'AGENDADO' as const };
    const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), newApp);
    if (isPublic) {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        title: 'Novo Agendamento',
        message: `${data.clientName} agendou ${data.serviceName} para ${data.date}.`,
        time: new Date().toLocaleTimeString(),
        read: false,
        targetId: docRef.id
      });
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    if (app.status === 'CONCLUIDO_PAGO' && status !== 'CONCLUIDO_PAGO') {
      const finEntry = financialEntries.find(f => f.appointmentId === id);
      if (finEntry) await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, finEntry.id));
      const client = clients.find(c => c.id === app.clientId);
      if (client) {
        await updateDoc(doc(db, COLLECTIONS.CLIENTS, app.clientId), {
          totalSpent: Math.max(0, client.totalSpent - app.price)
        });
      }
    } else if (status === 'CONCLUIDO_PAGO' && app.status !== 'CONCLUIDO_PAGO') {
      await addDoc(collection(db, COLLECTIONS.FINANCIAL), {
        appointmentId: app.id,
        description: `Serviço: ${app.serviceName} - ${app.clientName}`,
        amount: app.price,
        type: 'RECEITA',
        date: app.date,
        category: 'Serviços'
      });
      const client = clients.find(c => c.id === app.clientId);
      if (client) {
        await updateDoc(doc(db, COLLECTIONS.CLIENTS, app.clientId), {
          totalSpent: client.totalSpent + app.price,
          lastVisit: app.date
        });
      }
    }
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), { status });
  };

  const rescheduleAppointment = async (id: string, date: string, startTime: string, endTime: string) => {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), { date, startTime, endTime, status: 'REAGENDADO' });
  };

  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id));
  };

  const addFinancialEntry = async (data: Omit<FinancialEntry, 'id'>) => {
    await addDoc(collection(db, COLLECTIONS.FINANCIAL), data);
  };

  const deleteFinancialEntry = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, id));
  };

  const addSuggestion = async (data: Omit<Suggestion, 'id' | 'date'>) => {
    const newSug = { ...data, date: new Date().toLocaleDateString('pt-BR') };
    await addDoc(collection(db, COLLECTIONS.SUGGESTIONS), newSug);
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      title: 'Nova Sugestão',
      message: `De ${data.clientName}: "${data.text.substring(0, 30)}..."`,
      time: new Date().toLocaleTimeString(),
      read: false
    });
  };

  const updateSuggestion = async (id: string, data: Partial<Suggestion>) => {
    await updateDoc(doc(db, COLLECTIONS.SUGGESTIONS, id), data as any);
  };

  const deleteSuggestion = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SUGGESTIONS, id));
  };

  const markNotificationAsRead = async (id: string) => {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
  };

  const clearNotifications = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, document.id));
    }
  };

  const updateConfig = async (data: Partial<ShopConfig>) => {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'main'), { ...config, ...data }, { merge: true });
  };

  const addShopReview = async (review: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = { ...review, id: `rev_${Date.now()}`, date: new Date().toLocaleDateString('pt-BR') };
    await updateConfig({ reviews: [newReview, ...(config.reviews || [])] });
  };

  return React.createElement(BarberContext.Provider, {
    value: {
      user, clients, professionals, services, appointments, financialEntries, notifications, suggestions, config, loading, theme,
      toggleTheme, login, logout, updateUser, addClient, updateClient, deleteClient,
      addService, updateService, deleteService,
      addProfessional, updateProfessional, deleteProfessional, likeProfessional,
      addAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
      addFinancialEntry, deleteFinancialEntry, addSuggestion, updateSuggestion, deleteSuggestion,
      markNotificationAsRead, clearNotifications, updateConfig, addShopReview
    }
  }, children);
}

export const useBarberStore = () => {
  const context = useContext(BarberContext);
  if (context === undefined) throw new Error('useBarberStore must be used within a BarberProvider');
  return context;
};
