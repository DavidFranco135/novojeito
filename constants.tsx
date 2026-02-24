import { Service, Professional, Client, Appointment, ShopConfig, VipPlan } from './types';

export const CORES = {
  primaria: '#C58A4A',
  secundaria: '#C5A059',
  fundo: '#050505',
  cartao: '#0F0F0F',
  texto: '#FDFDFD',
  acento: '#E5C76B',
};

// Fix: Added missing 'aboutTitle' and 'aboutText' properties to satisfy ShopConfig interface
export const CONFIG_LOJA: ShopConfig = {
  name: "Barbearia Novo Jeito",
  description: "Referência em São Gonçalo desde 1995. Unimos a tradição da barbearia clássica with as técnicas mais modernas de visagismo masculino. Um refúgio de bem-estar para o homem contemporâneo.",
  aboutTitle: "Nossa História Signature",
  aboutText: "O Sr. José começou com um sonho de trazer a verdadeira experiência da barbearia clássica para o Rio. Hoje, somos referência em cuidado masculino, unindo o old-school com as técnicas mais modernas do mercado.",
  address: "Rua Feliciano Sodré, 123",
  city: "São Gonçalo",
  state: "RJ",
  whatsapp: "5521973708141",
  instagram: "@novojeitobarbearia",
  logo: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=200&h=200&auto=format&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1512690196252-741ef294f260?q=80&w=2000",
  loginBackground: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000",
  locationUrl: "https://maps.google.com",
  openingTime: "09:00",
  closingTime: "20:00",
  email: "contato@srjose.com.br",
  cnpj: "00.000.000/0001-00",
  gallery: [],
  reviews: [],
  vipPlans: [
    {
      id: 'vip1',
      name: 'Plano Clássico',
      price: 199,
      period: 'MENSAL' as const,
      benefits: [
        'Corte ilimitado',
        'Barba 2x por mês',
        'Desconto 20% em produtos',
        'Agendamento prioritário'
      ],
      status: 'ATIVO' as const
    },
    {
      id: 'vip2',
      name: 'Plano Premium Anual',
      price: 1990,
      period: 'ANUAL' as const,
      benefits: [
        'Corte ilimitado',
        'Barba ilimitada',
        'Desconto 30% em produtos',
        'Agendamento VIP',
        'Massagem relaxante mensal',
        '2 meses grátis'
      ],
      discount: 17,
      status: 'ATIVO' as const
    }
  ]
};

export const MOCK_SERVICOS: Service[] = [
  { id: '1', name: 'Corte Heritage', price: 65, durationMinutes: 45, description: 'Corte clássico ou moderno com acabamento na navalha e toalha quente.', status: 'ATIVO', category: 'Cabelo', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400' },
  { id: '2', name: 'Barba Sr. José', price: 50, durationMinutes: 40, description: 'Barboterapia completa com esfoliação, óleos essenciais e massagem facial.', status: 'ATIVO', category: 'Barba', image: 'https://images.unsplash.com/photo-1512690196252-741ef294f260?q=80&w=400' },
  { id: '3', name: 'Corte + Barba', price: 100, durationMinutes: 80, description: 'Combo completo para renovação total do visual.', status: 'ATIVO', category: 'Combos', image: 'https://images.unsplash.com/photo-1599351431247-f13b283253c9?q=80&w=400' },
  { id: '4', name: 'Pigmentação de Barba', price: 30, durationMinutes: 20, description: 'Acabamento perfeito para cobrir falhas e definir contornos.', status: 'ATIVO', category: 'Estética', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400' },
  { id: '5', name: 'Sobrancelha', price: 15, durationMinutes: 10, description: 'Design de sobrancelha masculina na pinça ou navalha.', status: 'ATIVO', category: 'Estética', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400' },
];

export const MOCK_PROFISSIONAIS: Professional[] = [
  {
    id: 'p1',
    name: 'José Mestre',
    specialties: ['1', '2', '3'],
    avatar: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?q=80&w=150',
    commission: 60,
    // Fix: Added missing 'likes' property
    likes: 0,
    workingHours: { start: "08:00", end: "20:00" },
  },
  {
    id: 'p2',
    name: 'Beto Navalha',
    specialties: ['1', '2'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
    commission: 50,
    // Fix: Added missing 'likes' property
    likes: 0,
    workingHours: { start: "09:00", end: "19:00" },
  }
];

export const MOCK_CLIENTES: Client[] = [
  { id: 'c1', name: 'Carlos Alberto', phone: '21999991111', email: 'carlos@email.com', totalSpent: 850, lastVisit: '2023-11-15', createdAt: '2023-01-01T10:00:00Z' },
];

export const MOCK_AGENDAMENTOS: Appointment[] = [];
