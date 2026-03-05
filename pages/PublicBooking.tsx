import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, serverTimestamp, Timestamp, addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Reserva, ReservaConfig, ReservaStatus, TipoDiaria } from '../types';

// ─── CONFIG ─────────────────────────────────────────────────────────────────

export const getReservaConfig = async (): Promise<ReservaConfig> => {
  try {
    const snap = await getDoc(doc(db, 'reservaConfig', 'default'));
    if (snap.exists()) return snap.data() as ReservaConfig;
  } catch (e) {
    console.warn('Erro ao buscar config de reservas:', e);
  }
  return {
    valorDiaUtil: 1500,
    valorSabado: 2500,
    valorDomingo: 2000,
    valorFimDeSemana: 4000,
    percentualReserva: 30,
    whatsappLink: 'https://wa.me/5521000000000',
    reservaOnlineAtiva: true,
    pagamentoAutomaticoAtivo: false,
    expiracaoHoras: 48,
    salonNome: 'Salão Latitude22',
    salonCnpj: '',
    salonContato: '',
    pixChave: ''
  };
};

export const saveReservaConfig = async (config: Partial<ReservaConfig>) => {
  await setDoc(doc(db, 'reservaConfig', 'default'), config, { merge: true });
};

// ─── CÁLCULO ─────────────────────────────────────────────────────────────────

export const calcularTipoDiaria = (dateStr: string): TipoDiaria => {
  const date = new Date(dateStr + 'T12:00:00');
  const dow = date.getDay();
  if (dow === 6) return 'sabado';
  if (dow === 0) return 'domingo';
  return 'util';
};

export const calcularValor = (tipo: TipoDiaria, config: ReservaConfig): number => {
  switch (tipo) {
    case 'sabado':     return config.valorSabado;
    case 'domingo':    return config.valorDomingo;
    case 'fimdesemana':return config.valorFimDeSemana;
    default:           return config.valorDiaUtil;
  }
};

// ─── TOKEN E PROTOCOLO ───────────────────────────────────────────────────────

export const gerarToken = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

export const gerarProtocolo = (): string => {
  const now = new Date();
  return `L22-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
};

// ─── DISPONIBILIDADE ─────────────────────────────────────────────────────────

/**
 * Verifica se uma data específica está disponível.
 * Considera tanto o campo `data` (reservas de 1 dia) quanto o campo `datas[]`
 * (reservas de múltiplos dias).
 */
export const verificarDisponibilidade = async (data: string): Promise<boolean> => {
  const statusAtivos = [
    ReservaStatus.PENDENTE_PAGAMENTO,
    ReservaStatus.RESERVADO,
    ReservaStatus.CONFIRMADO
  ];

  // Verifica campo `data` (compatibilidade retroativa)
  const q1 = query(
    collection(db, 'reservas'),
    where('data', '==', data),
    where('status', 'in', statusAtivos)
  );
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return false;

  // Verifica campo `datas` (array de datas para reservas multi-dia)
  const q2 = query(
    collection(db, 'reservas'),
    where('datas', 'array-contains', data),
    where('status', 'in', statusAtivos)
  );
  const snap2 = await getDocs(q2);
  return snap2.empty;
};

/**
 * Retorna todas as datas ocupadas (campo `data` + campo `datas[]`).
 */
export const getDatasOcupadas = async (): Promise<string[]> => {
  try {
    const statusAtivos = [
      ReservaStatus.PENDENTE_PAGAMENTO,
      ReservaStatus.RESERVADO,
      ReservaStatus.CONFIRMADO
    ];

    const q = query(
      collection(db, 'reservas'),
      where('status', 'in', statusAtivos)
    );
    const snap = await getDocs(q);

    const datas = new Set<string>();
    snap.docs.forEach(d => {
      const r = d.data();
      // Campo único (retrocompatibilidade)
      if (r.data) datas.add(r.data as string);
      // Campo array (multi-dia)
      if (Array.isArray(r.datas)) {
        (r.datas as string[]).forEach(dt => datas.add(dt));
      }
    });

    return Array.from(datas);
  } catch (e) {
    console.warn('Erro ao buscar datas ocupadas:', e);
    return [];
  }
};

// ─── CRIAR RESERVA ───────────────────────────────────────────────────────────

/**
 * Cria uma reserva para uma única data.
 * Mantida para compatibilidade e usada pelo ReservaPage para cada dia selecionado.
 */
export const criarReserva = async (
  data: string,
  tipoDiaria: TipoDiaria,
  config: ReservaConfig,
  cliente: {
    nome: string; cpfCnpj: string; telefone: string;
    email: string; tipoEvento: string; numConvidados: number;
  },
  criadoPorAdmin = false
): Promise<Reserva> => {
  const disponivel = await verificarDisponibilidade(data);
  if (!disponivel) {
    throw new Error(`A data ${data.split('-').reverse().join('/')} não está disponível. Por favor, escolha outra.`);
  }

  const valorTotal   = calcularValor(tipoDiaria, config);
  const valorReserva = Math.ceil(valorTotal * config.percentualReserva / 100);
  const token        = gerarToken();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.expiracaoHoras);

  const reservaData: Omit<Reserva, 'id'> = {
    token,
    data,
    datas: [data],            // campo array para compatibilidade com getDatasOcupadas
    tipoDiaria,
    valorTotal,
    valorReserva,
    percentualReserva: config.percentualReserva,
    status: ReservaStatus.PENDENTE_PAGAMENTO,
    clienteNome: cliente.nome,
    clienteCpfCnpj: cliente.cpfCnpj,
    clienteTelefone: cliente.telefone,
    clienteEmail: cliente.email,
    tipoEvento: cliente.tipoEvento,
    numConvidados: cliente.numConvidados,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    criadoPorAdmin
  } as any;

  const ref = await addDoc(collection(db, 'reservas'), reservaData);
  return { id: ref.id, ...reservaData } as Reserva;
};

/**
 * Cria uma reserva para múltiplas datas em um único documento.
 * As datas ficam bloqueadas no calendário via campo `datas[]`.
 */
export const criarReservaMultipla = async (
  dias: Array<{ dateStr: string; tipoDiaria: TipoDiaria; valor: number }>,
  config: ReservaConfig,
  cliente: {
    nome: string; cpfCnpj: string; telefone: string;
    email: string; tipoEvento: string; numConvidados: number;
  },
  criadoPorAdmin = false
): Promise<Reserva> => {
  // Verifica disponibilidade de todos os dias primeiro
  for (const dia of dias) {
    const disponivel = await verificarDisponibilidade(dia.dateStr);
    if (!disponivel) {
      throw new Error(
        `A data ${dia.dateStr.split('-').reverse().join('/')} não está disponível. Por favor, escolha outra.`
      );
    }
  }

  const valorTotal   = dias.reduce((s, d) => s + d.valor, 0);
  const valorReserva = Math.ceil(valorTotal * config.percentualReserva / 100);
  const token        = gerarToken();
  const primeiroDia  = dias[0];

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.expiracaoHoras);

  const reservaData = {
    token,
    data: primeiroDia.dateStr,           // campo legado — mantido para compatibilidade
    datas: dias.map(d => d.dateStr),     // campo novo — array de todas as datas
    diasDetalhes: dias,                  // detalhes por dia (tipo + valor)
    tipoDiaria: primeiroDia.tipoDiaria,  // campo legado
    valorTotal,
    valorReserva,
    percentualReserva: config.percentualReserva,
    status: ReservaStatus.PENDENTE_PAGAMENTO,
    clienteNome: cliente.nome,
    clienteCpfCnpj: cliente.cpfCnpj,
    clienteTelefone: cliente.telefone,
    clienteEmail: cliente.email,
    tipoEvento: cliente.tipoEvento,
    numConvidados: cliente.numConvidados,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    criadoPorAdmin
  };

  const ref = await addDoc(collection(db, 'reservas'), reservaData);
  return { id: ref.id, ...reservaData } as any as Reserva;
};

// ─── CONFIRMAR PAGAMENTO ─────────────────────────────────────────────────────

export const confirmarPagamento = async (
  reservaId: string,
  valorPago: number,
  formaPagamento: string,
  transacaoId?: string
): Promise<string> => {
  const ref  = doc(db, 'reservas', reservaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Reserva não encontrada.');

  const reserva  = snap.data() as Reserva;
  const isPago100 = valorPago >= reserva.valorTotal;
  const protocolo = (reserva as any).protocolo || gerarProtocolo();

  await updateDoc(ref, {
    status: isPago100 ? ReservaStatus.CONFIRMADO : ReservaStatus.RESERVADO,
    valorPago,
    formaPagamento,
    transacaoId: transacaoId || '',
    protocolo,
    dataPagamento: serverTimestamp()
  });

  await addDoc(collection(db, 'financial'), {
    type: 'income',
    amount: valorPago,
    description: `Reserva ${protocolo} — ${reserva.clienteNome}`,
    date: new Date().toISOString(),
    reservaId,
    createdAt: serverTimestamp()
  });

  return protocolo;
};

export const cancelarReserva = async (reservaId: string): Promise<void> => {
  await updateDoc(doc(db, 'reservas', reservaId), {
    status: ReservaStatus.CANCELADO
  });
};

// ─── BUSCAR ──────────────────────────────────────────────────────────────────

export const getReservaPorToken = async (token: string): Promise<Reserva | null> => {
  try {
    const q    = query(collection(db, 'reservas'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Reserva;
  } catch (e) {
    return null;
  }
};

export const getReservaById = async (id: string): Promise<Reserva | null> => {
  try {
    const snap = await getDoc(doc(db, 'reservas', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Reserva;
  } catch (e) {
    return null;
  }
};

export const getAllReservas = async (): Promise<Reserva[]> => {
  try {
    const snap = await getDocs(collection(db, 'reservas'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reserva));
  } catch (e) {
    return [];
  }
};
