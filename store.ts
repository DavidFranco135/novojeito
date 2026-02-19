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
  resetAllLikes: () => Promise<void>;
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
    name: "",
    description: "",
    aboutTitle: "",
    aboutText: "",
    address: "",
    city: "",
    state: "",
    whatsapp: "",
    instagram: "",
    logo: "",
    coverImage: "",
    loginBackground: "",
    locationUrl: "",
    openingTime: "08:00",
    closingTime: "20:00",
    email: "",
    cnpj: "",
    gallery: [],
    reviews: []
  });

  useEffect(() => {
    localStorage.setItem('brb_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) localStorage.setItem('brb_user', JSON.stringify(user));
    else localStorage.removeItem('brb_user');
  }, [user]);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, COLLECTIONS.CLIENTS), (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      }),
      onSnapshot(collection(db, COLLECTIONS.PROFESSIONALS), (snapshot) => {
        setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional)));
      }),
      onSnapshot(collection(db, COLLECTIONS.SERVICES), (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      }),
      onSnapshot(collection(db, COLLECTIONS.APPOINTMENTS), (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      }),
      onSnapshot(collection(db, COLLECTIONS.FINANCIAL), (snapshot) => {
        setFinancialEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialEntry)));
      }),
      onSnapshot(collection(db, COLLECTIONS.NOTIFICATIONS), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      }),
      onSnapshot(collection(db, COLLECTIONS.SUGGESTIONS), (snapshot) => {
        setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suggestion)));
      }),
      onSnapshot(doc(db, COLLECTIONS.CONFIG, 'main'), (doc) => {
        if (doc.exists()) {
          const configData = doc.data() as ShopConfig;
          setConfig(configData);
          
          // âœ… CORREÃ‡ÃƒO: Se houver usuÃ¡rio admin logado, atualizar com o nome do Firebase
          const savedUser = localStorage.getItem('brb_user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser.role === 'ADMIN' && configData.adminName) {
              const updatedUser = {
                ...parsedUser,
                name: configData.adminName,
                avatar: configData.logo
              };
              setUser(updatedUser);
              localStorage.setItem('brb_user', JSON.stringify(updatedUser));
            }
          }
        }
      })
    ];

    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const login = async (id: string, pass: string) => {
    if (id === 'srjoseadm@gmail.com' && pass === '654321') {
      // âœ… CORREÃ‡ÃƒO: Carregar nome do Firebase ao fazer login
      const adminName = config.adminName || 'Sr. JosÃ©';
      const adminAvatar = config.logo || 'https://i.pravatar.cc/150';
      
      setUser({ 
        id: 'admin', 
        name: adminName, 
        email: id, 
        role: 'ADMIN',
        avatar: adminAvatar
      });
      return;
    }
    const client = clients.find(c => (c.phone === id || c.email === id) && c.password === pass);
    if (client) {
      setUser({ id: client.id, name: client.name, email: client.email, role: 'CLIENTE', phone: client.phone });
    } else {
      throw new Error('Credenciais invÃ¡lidas');
    }
  };

  const logout = () => setUser(null);
  
  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('brb_user', JSON.stringify(updated));
      return updated;
    });
  };

  const addClient = async (data: any) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
      ...data,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data } as Client;
  };

  const updateClient = async (id: string, data: any) => {
    await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), data);
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
  };

  const addService = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.SERVICES), data);
  };

  const updateService = async (id: string, data: any) => {
    await updateDoc(doc(db, COLLECTIONS.SERVICES, id), data);
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, id));
  };

  const addProfessional = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.PROFESSIONALS), { ...data, likes: 0 });
  };

  const updateProfessional = async (id: string, data: any) => {
    await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), data);
  };

  const deleteProfessional = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PROFESSIONALS, id));
  };

  const likeProfessional = async (id: string) => {
    const professional = professionals.find(p => p.id === id);
    if (professional) {
      await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), { likes: (professional.likes || 0) + 1 });
    }
  };

  const resetAllLikes = async () => {
    const updates = professionals.map(prof => 
      updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, prof.id), { likes: 0 })
    );
    await Promise.all(updates);
  };

  const addAppointment = async (data: any, isPublic = false) => {
    await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), { ...data, status: 'PENDENTE' });
    if (isPublic) {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        title: 'Novo Agendamento',
        message: `${data.clientName} agendou ${data.serviceName}`,
        time: new Date().toISOString(),
        read: false,
        type: 'appointment'
      });
    }
  };

  const updateAppointmentStatus = async (id: string, status: any) => {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), { status });
    
    // Criar receita automÃ¡tica ao marcar como CONCLUÃDO_PAGO
    if (status === 'CONCLUIDO_PAGO') {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        const entryDescription = `Agendamento #${id.substring(0, 8)} - ${appointment.serviceName}`;
        
        const existingEntry = financialEntries.find(
          e => e.description === entryDescription
        );
        
        if (!existingEntry) {
          await addDoc(collection(db, COLLECTIONS.FINANCIAL), {
            description: entryDescription,
            amount: appointment.price,
            type: 'RECEITA',
            category: 'ServiÃ§os',
            date: new Date().toISOString().split('T')[0],
            appointmentId: id
          });
          
          console.log(`âœ… Receita criada automaticamente: R$ ${appointment.price}`);
        } else {
          console.log('â„¹ï¸ Receita jÃ¡ existe para este agendamento');
        }
      }
    }
  };

  const rescheduleAppointment = async (id: string, date: string, startTime: string, endTime: string) => {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), { date, startTime, endTime });
  };

  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id));
  };

  const addFinancialEntry = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.FINANCIAL), data);
  };

  const deleteFinancialEntry = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, id));
  };

  const addSuggestion = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.SUGGESTIONS), {
      ...data,
      date: new Date().toLocaleDateString('pt-BR')
    });
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      title: 'Nova SugestÃ£o',
      message: `${data.clientName} enviou uma sugestÃ£o`,
      time: new Date().toISOString(),
      read: false,
      type: 'suggestion',
      clientPhone: data.clientPhone
    });
  };

  const updateSuggestion = async (id: string, data: any) => {
    await updateDoc(doc(db, COLLECTIONS.SUGGESTIONS, id), data);
  };

  const deleteSuggestion = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SUGGESTIONS, id));
  };

  const markNotificationAsRead = async (id: string) => {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
  };

  const clearNotifications = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
    snapshot.docs.forEach(async (document) => {
      await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, document.id));
    });
  };

  const updateConfig = async (data: Partial<ShopConfig>) => {
    // Remove campos undefined recursivamente — o Firestore não aceita undefined em nenhum campo
    const sanitize = (obj: any): any => JSON.parse(JSON.stringify(obj));
    const merged = sanitize({ ...config, ...data });
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'main'), merged, { merge: true });
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
      addProfessional, updateProfessional, deleteProfessional, likeProfessional, resetAllLikes,
      addAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
      addFinancialEntry, deleteFinancialEntry, addSuggestion, updateSuggestion, deleteSuggestion,
      markNotificationAsRead, clearNotifications, updateConfig, addShopReview
    }
  }, children);
}

export const useBarberStore = () => {
  const context = useContext(BarberContext);
  if (!context) throw new Error('useBarberStore must be used within BarberProvider');
  return context;
};
