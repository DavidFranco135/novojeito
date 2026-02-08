import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Client, Professional, Service, Appointment, ShopConfig, User, FinancialEntry, Notification, Review, Suggestion } from './types';
import { db } from './firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc, query, orderBy } from 'firebase/firestore';

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
  updateSuggestion: (id: string, data: Partial<Suggestion>) => Promise<void>; // FUNÇÃO DE RESPOSTA
  deleteSuggestion: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateConfig: (data: Partial<ShopConfig>) => Promise<void>;
  addShopReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);
const COLLECTIONS = { CLIENTS: 'clients', PROFESSIONALS: 'professionals', SERVICES: 'services', APPOINTMENTS: 'appointments', FINANCIAL: 'financialEntries', CONFIG: 'config', NOTIFICATIONS: 'notifications', SUGGESTIONS: 'suggestions' };

export function BarberProvider({ children }: { children?: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('brb_theme') as 'dark' | 'light') || 'dark');
  const [user, setUser] = useState<User | null>(() => { const s = localStorage.getItem('brb_user'); return s ? JSON.parse(s) : null; });
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [config, setConfig] = useState<ShopConfig>({ name: "Barbearia Sr. José", description: "Tradição em São Gonçalo", aboutTitle: "", aboutText: "", address: "", city: "", state: "", whatsapp: "", instagram: "", logo: "", coverImage: "", loginBackground: "", locationUrl: "", openingTime: "08:00", closingTime: "20:00", email: "", cnpj: "", gallery: [], reviews: [] });

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, COLLECTIONS.CLIENTS), (s) => setClients(s.docs.map(d => ({ id: d.id, ...d.data() } as Client)))),
      onSnapshot(collection(db, COLLECTIONS.PROFESSIONALS), (s) => setProfessionals(s.docs.map(d => ({ id: d.id, ...d.data() } as Professional)))),
      onSnapshot(collection(db, COLLECTIONS.SERVICES), (s) => setServices(s.docs.map(d => ({ id: d.id, ...d.data() } as Service)))),
      onSnapshot(collection(db, COLLECTIONS.APPOINTMENTS), (s) => setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)))),
      onSnapshot(collection(db, COLLECTIONS.FINANCIAL), (s) => setFinancialEntries(s.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry)))),
      onSnapshot(collection(db, COLLECTIONS.NOTIFICATIONS), (s) => setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))),
      onSnapshot(collection(db, COLLECTIONS.SUGGESTIONS), (s) => setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion)))),
      onSnapshot(doc(db, COLLECTIONS.CONFIG, 'main'), (d) => d.exists() && setConfig(d.data() as ShopConfig))
    ];
    setLoading(false);
    return () => unsubscribers.forEach(u => u());
  }, []);

  const login = async (id: string, pass: string) => {
    if (id === 'srjoseadm@gmail.com' && pass === '654321') {
      setUser({ id: 'admin', name: 'Sr. José', email: id, role: 'ADMIN' });
      return;
    }
    const c = clients.find(cl => (cl.phone === id || cl.email === id) && cl.password === pass);
    if (c) setUser({ id: c.id, name: c.name, email: c.email, role: 'CLIENTE', phone: c.phone });
    else throw new Error();
  };

  const logout = () => setUser(null);
  const addSuggestion = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.SUGGESTIONS), { ...data, date: new Date().toLocaleDateString('pt-BR') });
  };
  const updateSuggestion = async (id: string, data: any) => {
    await updateDoc(doc(db, COLLECTIONS.SUGGESTIONS, id), data);
  };
  const deleteSuggestion = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SUGGESTIONS, id));
  };
  // ... outras funções (addClient, addAppointment, etc) seguindo o seu padrão original ...

  return (
    <BarberContext.Provider value={{ user, clients, professionals, services, appointments, financialEntries, notifications, suggestions, config, loading, theme, toggleTheme, login, logout, updateUser: (d) => setUser(u => u ? {...u, ...d} : null), addClient: async (d) => { const r = await addDoc(collection(db, COLLECTIONS.CLIENTS), d); return {id: r.id, ...d} as any; }, updateClient: async (id, d) => updateDoc(doc(db, COLLECTIONS.CLIENTS, id), d), deleteClient: async (id) => deleteDoc(doc(db, COLLECTIONS.CLIENTS, id)), addService: async (d) => { await addDoc(collection(db, COLLECTIONS.SERVICES), d); }, updateService: async (id, d) => updateDoc(doc(db, COLLECTIONS.SERVICES, id), d), deleteService: async (id) => deleteDoc(doc(db, COLLECTIONS.SERVICES, id)), addProfessional: async (d) => { await addDoc(collection(db, COLLECTIONS.PROFESSIONALS), d); }, updateProfessional: async (id, d) => updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), d), deleteProfessional: async (id) => deleteDoc(doc(db, COLLECTIONS.PROFESSIONALS, id)), likeProfessional: (id) => {}, addAppointment: async (d) => { await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), d); }, updateAppointmentStatus: async (id, s) => updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), {status: s}), rescheduleAppointment: async (id, d, s, e) => updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), {date: d, startTime: s, endTime: e}), deleteAppointment: async (id) => deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id)), addFinancialEntry: async (d) => { await addDoc(collection(db, COLLECTIONS.FINANCIAL), d); }, deleteFinancialEntry: async (id) => deleteDoc(doc(db, COLLECTIONS.FINANCIAL, id)), addSuggestion, updateSuggestion, deleteSuggestion, markNotificationAsRead: (id) => {}, clearNotifications: () => {}, updateConfig: async (d) => setDoc(doc(db, COLLECTIONS.CONFIG, 'main'), d), addShopReview: (r) => {} }}>
      {children}
    </BarberContext.Provider>
  );
}

export const useBarberStore = () => {
  const context = useContext(BarberContext);
  if (!context) throw new Error();
  return context;
};
