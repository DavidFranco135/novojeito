import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  Client, Professional, Service, Appointment, ShopConfig, User,
  FinancialEntry, Notification, Review, Suggestion,
  LoyaltyCard, Subscription, Partner, BlockedSlot, InactivityCampaign
} from './types';
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
  loyaltyCards: LoyaltyCard[];
  subscriptions: Subscription[];
  partners: Partner[];
  blockedSlots: BlockedSlot[];
  inactivityCampaigns: InactivityCampaign[];
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
  addLoyaltyCard: (data: Omit<LoyaltyCard, 'id'>) => Promise<void>;
  updateLoyaltyCard: (clientId: string, data: Partial<LoyaltyCard>) => Promise<void>;
  addSubscription: (data: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  addPartner: (data: Omit<Partner, 'id'>) => Promise<void>;
  updatePartner: (id: string, data: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  addBlockedSlot: (data: Omit<BlockedSlot, 'id'>) => Promise<void>;
  deleteBlockedSlot: (id: string) => Promise<void>;
  addCampaign: (data: Omit<InactivityCampaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, data: Partial<InactivityCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  isSlotBlocked: (professionalId: string, date: string, time: string) => boolean;
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
  SUGGESTIONS: 'suggestions',
  LOYALTY_CARDS: 'loyaltyCards',
  SUBSCRIPTIONS: 'subscriptions',
  PARTNERS: 'partners',
  BLOCKED_SLOTS: 'blockedSlots',
  INACTIVITY_CAMPAIGNS: 'inactivityCampaigns',
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
    name: "", description: "", aboutTitle: "", aboutText: "", address: "",
    city: "", state: "", whatsapp: "", instagram: "", logo: "", coverImage: "",
    loginBackground: "", locationUrl: "", openingTime: "08:00", closingTime: "20:00",
    email: "", cnpj: "", gallery: [], reviews: []
  });
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [inactivityCampaigns, setInactivityCampaigns] = useState<InactivityCampaign[]>([]);

  useEffect(() => { localStorage.setItem('brb_theme', theme); }, [theme]);
  useEffect(() => {
    if (user) localStorage.setItem('brb_user', JSON.stringify(user));
    else localStorage.removeItem('brb_user');
  }, [user]);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, COLLECTIONS.CLIENTS), snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)))),
      onSnapshot(collection(db, COLLECTIONS.PROFESSIONALS), snap => setProfessionals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Professional)))),
      onSnapshot(collection(db, COLLECTIONS.SERVICES), snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)))),
      onSnapshot(collection(db, COLLECTIONS.APPOINTMENTS), snap => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)))),
      onSnapshot(collection(db, COLLECTIONS.FINANCIAL), snap => setFinancialEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry)))),
      onSnapshot(collection(db, COLLECTIONS.NOTIFICATIONS), snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))),
      onSnapshot(collection(db, COLLECTIONS.SUGGESTIONS), snap => setSuggestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion)))),
      onSnapshot(collection(db, COLLECTIONS.LOYALTY_CARDS), snap => setLoyaltyCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyCard)))),
      onSnapshot(collection(db, COLLECTIONS.SUBSCRIPTIONS), snap => setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)))),
      onSnapshot(collection(db, COLLECTIONS.PARTNERS), snap => setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner)))),
      onSnapshot(collection(db, COLLECTIONS.BLOCKED_SLOTS), snap => setBlockedSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as BlockedSlot)))),
      onSnapshot(collection(db, COLLECTIONS.INACTIVITY_CAMPAIGNS), snap => setInactivityCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as InactivityCampaign)))),
      onSnapshot(doc(db, COLLECTIONS.CONFIG, 'main'), docSnap => {
        if (docSnap.exists()) {
          const configData = docSnap.data() as ShopConfig;
          setConfig(configData);
          const savedUser = localStorage.getItem('brb_user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser.role === 'ADMIN' && configData.adminName) {
              const updatedUser = { ...parsedUser, name: configData.adminName, avatar: configData.logo };
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
      const adminName = config.adminName || 'Sr. José';
      const adminAvatar = config.logo || 'https://i.pravatar.cc/150';
      setUser({ id: 'admin', name: adminName, email: id, role: 'ADMIN', avatar: adminAvatar });
      return;
    }
    const client = clients.find(c => (c.phone === id || c.email === id) && c.password === pass);
    if (client) {
      setUser({ id: client.id, name: client.name, email: client.email, role: 'CLIENTE', phone: client.phone });
    } else {
      throw new Error('Credenciais inválidas');
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

  // ── CLIENTS ──────────────────────────────────────────────────
  const addClient = async (data: any) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), { ...data, totalSpent: 0, createdAt: new Date().toISOString() });
    return { id: docRef.id, ...data } as Client;
  };
  const updateClient = async (id: string, data: any) => { await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), data); };
  const deleteClient = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id)); };

  // ── SERVICES ─────────────────────────────────────────────────
  const addService = async (data: any) => { await addDoc(collection(db, COLLECTIONS.SERVICES), data); };
  const updateService = async (id: string, data: any) => { await updateDoc(doc(db, COLLECTIONS.SERVICES, id), data); };
  const deleteService = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.SERVICES, id)); };

  // ── PROFESSIONALS ─────────────────────────────────────────────
  const addProfessional = async (data: any) => { await addDoc(collection(db, COLLECTIONS.PROFESSIONALS), { ...data, likes: 0 }); };
  const updateProfessional = async (id: string, data: any) => { await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), data); };
  const deleteProfessional = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.PROFESSIONALS, id)); };
  const likeProfessional = async (id: string) => {
    const p = professionals.find(p => p.id === id);
    if (p) await updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, id), { likes: (p.likes || 0) + 1 });
  };
  const resetAllLikes = async () => {
    await Promise.all(professionals.map(p => updateDoc(doc(db, COLLECTIONS.PROFESSIONALS, p.id), { likes: 0 })));
  };

  // ── APPOINTMENTS ─────────────────────────────────────────────
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

    const appointment = appointments.find(a => a.id === id);

    // ── Voltar para PENDENTE: remove receita + estorna fidelidade ──
    if (status === 'PENDENTE') {
      // Remove entrada financeira vinculada
      const linkedEntry = financialEntries.find(e => e.appointmentId === id);
      if (linkedEntry) await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, linkedEntry.id));

      // Estorna selos e cashback de fidelidade
      if (appointment) {
        const cashbackPct = (config as any).cashbackPercent ?? 5;
        const stampsLimit = (config as any).stampsForFreeCut ?? 10;
        const cashbackValue = parseFloat(((appointment.price * cashbackPct) / 100).toFixed(2));

        const loyaltySnapshot = await getDocs(collection(db, COLLECTIONS.LOYALTY_CARDS));
        const cardDoc = loyaltySnapshot.docs.find(d => d.data().clientId === appointment.clientId);

        if (cardDoc) {
          const card = cardDoc.data();
          // Verifica se este agendamento gerou um corte grátis (totalStamps % stampsLimit === 0 antes deste)
          const prevTotal = (card.totalStamps || 0) - 1;
          const gaveFreeCut = prevTotal > 0 && prevTotal % stampsLimit === 0;

          await updateDoc(doc(db, COLLECTIONS.LOYALTY_CARDS, cardDoc.id), {
            stamps: Math.max(0, (card.stamps || 0) - 1),
            totalStamps: Math.max(0, (card.totalStamps || 0) - 1),
            credits: Math.max(0, parseFloat(((card.credits || 0) - cashbackValue).toFixed(2))),
            freeCutsPending: gaveFreeCut ? Math.max(0, (card.freeCutsPending || 0) - 1) : (card.freeCutsPending || 0),
            freeCutsEarned: gaveFreeCut ? Math.max(0, (card.freeCutsEarned || 0) - 1) : (card.freeCutsEarned || 0),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // ── Marcar como CONCLUIDO_PAGO: cria receita + aplica fidelidade ──
    if (status === 'CONCLUIDO_PAGO' && appointment) {
      const entryDescription = `Agendamento #${id.substring(0, 8)} - ${appointment.serviceName}`;
      const existingEntry = financialEntries.find(e => e.description === entryDescription);

      if (!existingEntry) {
        await addDoc(collection(db, COLLECTIONS.FINANCIAL), {
          description: entryDescription,
          amount: appointment.price,
          type: 'RECEITA',
          category: 'Serviços',
          date: new Date().toISOString().split('T')[0],
          appointmentId: id
        });
      }

      // Cashback + Selos
      const cashbackPct = (config as any).cashbackPercent ?? 5;
      const stampsLimit = (config as any).stampsForFreeCut ?? 10;
      const cashbackValue = parseFloat(((appointment.price * cashbackPct) / 100).toFixed(2));

      const loyaltySnapshot = await getDocs(collection(db, COLLECTIONS.LOYALTY_CARDS));
      const cardDoc = loyaltySnapshot.docs.find(d => d.data().clientId === appointment.clientId);

      if (cardDoc) {
        const card = cardDoc.data();
        const newStamps = (card.stamps || 0) + 1;
        const cycled = newStamps >= stampsLimit;
        await updateDoc(doc(db, COLLECTIONS.LOYALTY_CARDS, cardDoc.id), {
          stamps: cycled ? newStamps - stampsLimit : newStamps,
          totalStamps: (card.totalStamps || 0) + 1,
          credits: parseFloat(((card.credits || 0) + cashbackValue).toFixed(2)),
          freeCutsPending: cycled ? (card.freeCutsPending || 0) + 1 : (card.freeCutsPending || 0),
          freeCutsEarned: cycled ? (card.freeCutsEarned || 0) + 1 : (card.freeCutsEarned || 0),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  const rescheduleAppointment = async (id: string, date: string, startTime: string, endTime: string) => {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), { date, startTime, endTime });
  };

  const deleteAppointment = async (id: string) => {
    const linkedEntry = financialEntries.find(e => e.appointmentId === id);
    if (linkedEntry) await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, linkedEntry.id));
    await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id));
  };

  // ── FINANCIAL ─────────────────────────────────────────────────
  const addFinancialEntry = async (data: any) => { await addDoc(collection(db, COLLECTIONS.FINANCIAL), data); };
  const deleteFinancialEntry = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.FINANCIAL, id)); };

  // ── SUGGESTIONS ───────────────────────────────────────────────
  const addSuggestion = async (data: any) => {
    await addDoc(collection(db, COLLECTIONS.SUGGESTIONS), { ...data, date: new Date().toLocaleDateString('pt-BR') });
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      title: 'Nova Sugestão',
      message: `${data.clientName} enviou uma sugestão`,
      time: new Date().toISOString(),
      read: false,
      type: 'suggestion',
      clientPhone: data.clientPhone
    });
  };
  const updateSuggestion = async (id: string, data: any) => { await updateDoc(doc(db, COLLECTIONS.SUGGESTIONS, id), data); };
  const deleteSuggestion = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.SUGGESTIONS, id)); };

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  const markNotificationAsRead = async (id: string) => { await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true }); };
  const clearNotifications = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
    snapshot.docs.forEach(async d => await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, d.id)));
  };

  // ── CONFIG ────────────────────────────────────────────────────
  const updateConfig = async (data: Partial<ShopConfig>) => {
    const sanitize = (obj: any): any => JSON.parse(JSON.stringify(obj));
    const merged = sanitize({ ...config, ...data });
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'main'), merged, { merge: true });
  };
  const addShopReview = async (review: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = { ...review, id: `rev_${Date.now()}`, date: new Date().toLocaleDateString('pt-BR') };
    await updateConfig({ reviews: [newReview, ...(config.reviews || [])] });
  };

  // ── LOYALTY CARDS ─────────────────────────────────────────────
  const addLoyaltyCard = async (data: Omit<LoyaltyCard, 'id'>) => {
    await addDoc(collection(db, COLLECTIONS.LOYALTY_CARDS), data);
  };
  const updateLoyaltyCard = async (clientId: string, data: Partial<LoyaltyCard>) => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.LOYALTY_CARDS));
    const cardDoc = snapshot.docs.find(d => d.data().clientId === clientId);
    if (cardDoc) await updateDoc(doc(db, COLLECTIONS.LOYALTY_CARDS, cardDoc.id), data);
  };

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────
  const addSubscription = async (data: Omit<Subscription, 'id'>) => { await addDoc(collection(db, COLLECTIONS.SUBSCRIPTIONS), data); };
  const updateSubscription = async (id: string, data: Partial<Subscription>) => { await updateDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, id), data); };
  const deleteSubscription = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, id)); };

  // ── PARTNERS ──────────────────────────────────────────────────
  const addPartner = async (data: Omit<Partner, 'id'>) => { await addDoc(collection(db, COLLECTIONS.PARTNERS), data); };
  const updatePartner = async (id: string, data: Partial<Partner>) => { await updateDoc(doc(db, COLLECTIONS.PARTNERS, id), data); };
  const deletePartner = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.PARTNERS, id)); };

  // ── BLOCKED SLOTS ─────────────────────────────────────────────
  const addBlockedSlot = async (data: Omit<BlockedSlot, 'id'>) => { await addDoc(collection(db, COLLECTIONS.BLOCKED_SLOTS), data); };
  const deleteBlockedSlot = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.BLOCKED_SLOTS, id)); };
  const isSlotBlocked = (professionalId: string, date: string, time: string): boolean => {
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    return blockedSlots.some(slot => {
      if (slot.professionalId !== professionalId) return false;
      const timeInRange = time >= slot.startTime && time < slot.endTime;
      if (!timeInRange) return false;
      if (slot.recurring) return slot.recurringDays?.includes(dayOfWeek) ?? false;
      return slot.date === date;
    });
  };

  // ── INACTIVITY CAMPAIGNS ──────────────────────────────────────
  const addCampaign = async (data: Omit<InactivityCampaign, 'id'>) => { await addDoc(collection(db, COLLECTIONS.INACTIVITY_CAMPAIGNS), data); };
  const updateCampaign = async (id: string, data: Partial<InactivityCampaign>) => { await updateDoc(doc(db, COLLECTIONS.INACTIVITY_CAMPAIGNS, id), data); };
  const deleteCampaign = async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.INACTIVITY_CAMPAIGNS, id)); };

  return React.createElement(BarberContext.Provider, {
    value: {
      user, clients, professionals, services, appointments, financialEntries,
      notifications, suggestions, config, loading, theme,
      loyaltyCards, subscriptions, partners, blockedSlots, inactivityCampaigns,
      toggleTheme, login, logout, updateUser,
      addClient, updateClient, deleteClient,
      addService, updateService, deleteService,
      addProfessional, updateProfessional, deleteProfessional, likeProfessional, resetAllLikes,
      addAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
      addFinancialEntry, deleteFinancialEntry,
      addSuggestion, updateSuggestion, deleteSuggestion,
      markNotificationAsRead, clearNotifications,
      updateConfig, addShopReview,
      addLoyaltyCard, updateLoyaltyCard,
      addSubscription, updateSubscription, deleteSubscription,
      addPartner, updatePartner, deletePartner,
      addBlockedSlot, deleteBlockedSlot, isSlotBlocked,
      addCampaign, updateCampaign, deleteCampaign,
    }
  }, children);
}

export const useBarberStore = () => {
  const context = useContext(BarberContext);
  if (!context) throw new Error('useBarberStore must be used within BarberProvider');
  return context;
};
