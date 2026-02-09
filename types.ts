export type UserRole = 'ADMIN' | 'PROFISSIONAL' | 'CLIENTE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  status: 'ATIVO' | 'INATIVO';
  image?: string;
  category: string;
}

export interface Professional {
  id: string;
  name: string;
  specialties: string[];
  avatar: string;
  commission: number;
  likes: number;
  specialty?: string;
  workingHours: {
    start: string;
    end: string;
  };
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  avatar?: string;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
  likedProfessionals?: string[];
}

export interface Review {
  id: string;
  userName: string;
  clientPhone?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Suggestion {
  id: string;
  clientName: string;
  clientPhone: string;
  text: string;
  date: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AGENDADO' | 'CONCLUIDO_PAGO' | 'PENDENTE_PAGAMENTO' | 'REAGENDADO' | 'CANCELADO';
  price: number;
}

export interface FinancialEntry {
  id: string;
  appointmentId?: string;
  description: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  date: string;
  category: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetId?: string;
}

export interface ShopConfig {
  name: string;
  description: string; // Resumo do Header
  aboutTitle: string;  // Título da seção Sobre
  aboutText: string;   // Texto detalhado da seção Sobre
  address: string;
  city: string;
  state: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  coverImage: string;
  loginBackground: string;
  heroBackground?: string;
  locationUrl: string;
  openingTime: string;
  closingTime: string;
  email: string;
  phone?: string;
  cnpj: string;
  gallery: string[];
  reviews: Review[];
}
