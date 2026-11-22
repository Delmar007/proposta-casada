import fs from 'fs';
import path from 'path';
import {
  AdminDashboardMetrics,
  MessageModerationStatus,
  ModerationAction,
  Negotiation,
  NegotiationMessage,
  NegotiationModerationLog,
  NegotiationNotification,
  PublicVehicle,
  SafeMeetingAppointment,
  SafeMeetingLocation,
  SellerTradeInEvaluation,
  TradeInImage,
  TradeInOffer,
  TradeInVehicle,
  UserProfile,
  VehicleRecord,
  PHOTO_SLOT_LABELS,
} from './types';
import { detectPIIAndContactLeaks } from '@/lib/privacy/pii-detector';
import { processTradeInImageDataUrl } from '@/lib/privacy/image-processor';

export interface MarketplaceState {
  profiles: Record<string, UserProfile>;
  vehicles: Record<string, VehicleRecord>;
  negotiations: Record<string, Negotiation>;
  tradeInVehicles: Record<string, TradeInVehicle>;
  tradeInImages: Record<string, TradeInImage>;
  tradeInOffers: Record<string, TradeInOffer>;
  messages: Record<string, NegotiationMessage>;
  moderationLogs: NegotiationModerationLog[];
  safeMeetingLocations: Record<string, SafeMeetingLocation>;
  safeMeetingAppointments: Record<string, SafeMeetingAppointment>;
  notifications: NegotiationNotification[];
  negotiationCounter: number;
}

const DATA_FILE = path.join(process.cwd(), '.data', 'marketplace-state.json');

function createSeedState(): MarketplaceState {
  const now = new Date().toISOString();

  const profiles: Record<string, UserProfile> = {
    'buyer-1': {
      id: 'buyer-1',
      fullName: 'João Pedro Almeida',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      whatsapp: '(11) 98765-4321',
      email: 'joao.almeida@email.com',
      residentialAddress: 'Rua das Flores, 240, São Paulo - SP',
      socialMedia: '@joaoalmeida_sp',
      role: 'user',
      isBlocked: false,
    },
    'buyer-2': {
      id: 'buyer-2',
      fullName: 'Mariana Costa Ferreira',
      cpf: '234.567.890-11',
      phone: '(11) 97654-3210',
      whatsapp: '(11) 97654-3210',
      email: 'mariana.ferreira@email.com',
      residentialAddress: 'Av. Brasil, 1500, São Paulo - SP',
      socialMedia: '@maricosta',
      role: 'user',
      isBlocked: false,
    },
    'seller-1': {
      id: 'seller-1',
      fullName: 'Carlos Eduardo Mendes',
      cpf: '345.678.901-22',
      phone: '(11) 99123-4567',
      whatsapp: '(11) 99123-4567',
      email: 'carlos.mendes@email.com',
      residentialAddress: 'Rua Augusta, 900, São Paulo - SP',
      socialMedia: '@carlosmendes_auto',
      role: 'user',
      isBlocked: false,
    },
    'admin-1': {
      id: 'admin-1',
      fullName: 'Ana Paula Moderadora',
      cpf: '456.789.012-33',
      phone: '(11) 3000-1000',
      whatsapp: '(11) 3000-1000',
      email: 'ana.moderacao@melhorproposta.com.br',
      residentialAddress: 'Sede Corporativa',
      socialMedia: '',
      role: 'moderator',
      isBlocked: false,
    },
    'admin-2': {
      id: 'admin-2',
      fullName: 'Roberto Supervisor Sênior',
      cpf: '567.890.123-44',
      phone: '(11) 3000-2000',
      whatsapp: '(11) 3000-2000',
      email: 'roberto.supervisor@melhorproposta.com.br',
      residentialAddress: 'Sede Corporativa',
      socialMedia: '',
      role: 'senior_moderator',
      isBlocked: false,
    },
  };

  const vehicles: Record<string, VehicleRecord> = {
    'veh-1': {
      id: 'veh-1',
      sellerId: 'seller-1',
      brand: 'Toyota',
      model: 'Corolla',
      version: 'XEi',
      engine: '2.0 (177 cv)',
      traction: '4x2',
      manufactureYear: 2022,
      modelYear: 2022,
      mileage: 38500,
      fuel: 'Flex',
      transmission: 'Automático CVT',
      color: 'Prata',
      city: 'São Paulo',
      state: 'SP',
      fipePrice: 100000,
      fipeCode: '002111-3',
      askingPrice: 100000,
      minConfidentialPrice: 88000,
      description:
        'Único dono, revisões em concessionária, manual e chave reserva. Aceita negociação somente em dinheiro ou veículo na permuta + complemento.',
      imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1000&q=80',
      ],
      status: 'active',
      createdAt: now,
    },
    'veh-2': {
      id: 'veh-2',
      sellerId: 'seller-1',
      brand: 'Honda',
      model: 'Civic',
      version: 'Touring',
      engine: '1.5 (173 cv)',
      traction: '4x2',
      manufactureYear: 2021,
      modelYear: 2021,
      mileage: 44000,
      fuel: 'Gasolina',
      transmission: 'Automático CVT',
      color: 'Branco Pérola',
      city: 'Campinas',
      state: 'SP',
      fipePrice: 125000,
      fipeCode: '014093-7',
      askingPrice: 124000,
      minConfidentialPrice: 112000,
      description:
        'Versão topo de linha com teto solar, Honda Sensing e histórico completo de manutenção.',
      imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80',
      ],
      status: 'active',
      createdAt: now,
    },
    'veh-3': {
      id: 'veh-3',
      sellerId: 'seller-1',
      brand: 'Volkswagen',
      model: 'T-Cross',
      version: 'Highline',
      engine: '1.4 (150 cv)',
      traction: '4x2',
      manufactureYear: 2023,
      modelYear: 2023,
      mileage: 21000,
      fuel: 'Flex',
      transmission: 'Automático 6 marchas',
      color: 'Cinza Platinum',
      city: 'São Paulo',
      state: 'SP',
      fipePrice: 132000,
      fipeCode: '005508-5',
      askingPrice: 130000,
      minConfidentialPrice: 118000,
      description:
        'SUV completo com painel digital Active Info Display e garantia de fábrica vigente.',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80',
      ],
      status: 'active',
      createdAt: now,
    },
  };

  const safeMeetingLocations: Record<string, SafeMeetingLocation> = {
    'loc-1': {
      id: 'loc-1',
      name: 'Auto Shopping Cristal — Unidade Zona Sul',
      address: 'Av. das Nações Unidas, 12901 — Brooklin',
      city: 'São Paulo',
      state: 'SP',
      locationType: 'Estabelecimento parceiro',
      active: true,
      approved: true,
    },
    'loc-2': {
      id: 'loc-2',
      name: 'Centro Automotivo Credenciado Paulista',
      address: 'Alameda Santos, 2100 — Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      locationType: 'Centro automotivo credenciado',
      active: true,
      approved: true,
    },
    'loc-3': {
      id: 'loc-3',
      name: 'Ponto Seguro Vila Olímpia (Monitorado 24h)',
      address: 'Rua das Olimpíadas, 360 — Vila Olímpia',
      city: 'São Paulo',
      state: 'SP',
      locationType: 'Local comercial monitorado',
      active: true,
      approved: true,
    },
  };

  return {
    profiles,
    vehicles,
    negotiations: {},
    tradeInVehicles: {},
    tradeInImages: {},
    tradeInOffers: {},
    messages: {},
    moderationLogs: [],
    safeMeetingLocations,
    safeMeetingAppointments: {},
    notifications: [],
    negotiationCounter: 0,
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class MarketplaceStore {
  private state: MarketplaceState;
  private persistToDisk: boolean;

  constructor(options?: { persistToDisk?: boolean }) {
    this.persistToDisk = options?.persistToDisk ?? process.env.NODE_ENV !== 'test';
    this.state = this.loadState();
  }

  private loadState(): MarketplaceState {
    if (this.persistToDisk && fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw) as MarketplaceState;
      } catch {
        return createSeedState();
      }
    }
    return createSeedState();
  }

  private saveState(): void {
    if (!this.persistToDisk) return;
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch {
      // Ignora erro de escrita em ambientes read-only
    }
  }

  public resetForTests(): void {
    this.state = createSeedState();
  }

  public getUsersSummary(): Array<{ id: string; fullName: string; role: UserProfile['role']; isBlocked: boolean }> {
    return Object.values(this.state.profiles).map((p) => ({
      id: p.id,
      fullName: p.fullName,
      role: p.role,
      isBlocked: p.isBlocked,
    }));
  }

  public getProfileForSelfOrAdmin(targetUserId: string, requesterId: string): UserProfile {
    const requester = this.state.profiles[requesterId];
    if (!requester) throw new Error('Usuário não autenticado.');
    const isAdmin = ['moderator', 'senior_moderator', 'admin'].includes(requester.role);
    if (targetUserId !== requesterId && !isAdmin) {
      throw new Error('Acesso negado: dados pessoais protegidos.');
    }
    const target = this.state.profiles[targetUserId];
    if (!target) throw new Error('Perfil não encontrado.');
    return target;
  }

  public isAdmin(userId: string): boolean {
    const u = this.state.profiles[userId];
    return Boolean(u && ['moderator', 'senior_moderator', 'admin'].includes(u.role));
  }

  /**
   * Retorna veículos públicos SEM nunca expor minConfidentialPrice nem PII do vendedor.
   */
  public getPublicVehicles(): PublicVehicle[] {
    return Object.values(this.state.vehicles).map((v) => ({
      id: v.id,
      brand: v.brand,
      brandLogoUrl: v.brandLogoUrl,
      model: v.model,
      version: v.version,
      engine: v.engine,
      traction: v.traction,
      manufactureYear: v.manufactureYear,
      modelYear: v.modelYear,
      mileage: v.mileage,
      fuel: v.fuel,
      transmission: v.transmission,
      color: v.color,
      city: v.city,
      state: v.state,
      fipePrice: v.fipePrice,
      fipeCode: v.fipeCode,
      askingPrice: v.askingPrice,
      description: v.description,
      imageUrl: v.imageUrl,
      images: v.images,
      status: v.status,
      createdAt: v.createdAt,
    }));
  }

  public getPublicVehicleById(vehicleId: string): PublicVehicle | null {
    const v = this.state.vehicles[vehicleId];
    if (!v) return null;
    return {
      id: v.id,
      brand: v.brand,
      brandLogoUrl: v.brandLogoUrl,
      model: v.model,
      version: v.version,
      engine: v.engine,
      traction: v.traction,
      manufactureYear: v.manufactureYear,
      modelYear: v.modelYear,
      mileage: v.mileage,
      fuel: v.fuel,
      transmission: v.transmission,
      color: v.color,
      city: v.city,
      state: v.state,
      fipePrice: v.fipePrice,
      fipeCode: v.fipeCode,
      askingPrice: v.askingPrice,
      description: v.description,
      imageUrl: v.imageUrl,
      images: v.images,
      status: v.status,
      createdAt: v.createdAt,
    };
  }

  private assertCanPropose(vehicleId: string, buyerId: string): VehicleRecord {
    const buyer = this.state.profiles[buyerId];
    if (!buyer) throw new Error('Comprador não encontrado.');
    if (buyer.isBlocked) {
      throw new Error('Sua conta está bloqueada para novas negociações.');
    }

    const vehicle = this.state.vehicles[vehicleId];
    if (!vehicle) throw new Error('Veículo não encontrado.');
    if (vehicle.sellerId === buyerId) {
      throw new Error('O proprietário não pode enviar proposta para o próprio veículo.');
    }

    const hasConfirmedAgreement = Object.values(this.state.negotiations).some(
      (n) => n.vehicleId === vehicleId && n.status === 'ACORDO_CONFIRMADO'
    );
    if (hasConfirmedAgreement || vehicle.status === 'negotiation_locked') {
      throw new Error('Este veículo já possui um ACORDO CONFIRMADO e novas propostas estão suspensas.');
    }
    return vehicle;
  }

  private nextAliases(): { code: string; buyerAlias: string; sellerAlias: string } {
    this.state.negotiationCounter += 1;
    const seq = String(this.state.negotiationCounter).padStart(3, '0');
    return {
      code: `NEG-${seq}`,
      buyerAlias: `Negociador ${seq}`,
      sellerAlias: `Proprietário ${seq}`,
    };
  }

  public createCashProposal(input: {
    vehicleId: string;
    buyerId: string;
    cashAmount: number;
    messageText: string;
  }): { negotiation: Negotiation; offer: TradeInOffer; message: NegotiationMessage } {
    const vehicle = this.assertCanPropose(input.vehicleId, input.buyerId);
    if (input.cashAmount <= 0) {
      throw new Error('O valor da proposta em dinheiro deve ser maior que zero.');
    }
    if (!input.messageText.trim()) {
      throw new Error('Escreva uma mensagem explicando sua proposta.');
    }

    const { code, buyerAlias, sellerAlias } = this.nextAliases();
    const now = new Date().toISOString();
    const negotiationId = uid('neg');

    const negotiation: Negotiation = {
      id: negotiationId,
      code,
      vehicleId: vehicle.id,
      buyerId: input.buyerId,
      sellerId: vehicle.sellerId,
      buyerAlias,
      sellerAlias,
      modality: 'cash_only',
      status: 'open',
      buyerConfirmed: false,
      sellerConfirmed: false,
      contactDisclosureAuthorizedBuyer: false,
      contactDisclosureAuthorizedSeller: false,
      createdAt: now,
      updatedAt: now,
    };

    const offer: TradeInOffer = {
      id: uid('off'),
      negotiationId,
      cashComplement: input.cashAmount,
      totalOfferValue: input.cashAmount,
      status: 'aguardando_moderacao',
    };

    const pii = detectPIIAndContactLeaks(input.messageText);
    const message: NegotiationMessage = {
      id: uid('msg'),
      negotiationId,
      senderId: input.buyerId,
      senderAlias: buyerAlias,
      senderRole: 'buyer',
      messageType: 'proposal',
      proposedCashComplement: input.cashAmount,
      proposedTotalValue: input.cashAmount,
      messageText: input.messageText.trim(),
      originalMessage: input.messageText.trim(),
      moderationStatus: 'aguardando_moderacao',
      piiFlags: pii.flags,
      escalatedToSenior: false,
      createdAt: now,
    };

    this.state.negotiations[negotiationId] = negotiation;
    this.state.tradeInOffers[offer.id] = offer;
    this.state.messages[message.id] = message;
    this.saveState();

    return { negotiation, offer, message };
  }

  public createTradeInProposal(input: {
    vehicleId: string;
    buyerId: string;
    tradeIn: {
      brand: string;
      model: string;
      version: string;
      manufactureYear: number;
      modelYear: number;
      mileage: number;
      fuel: string;
      transmission: string;
      color: string;
      city: string;
      state: string;
      declaredValue: number;
    };
    cashComplement: number;
    messageText: string;
    photos: Array<{ dataUrl: string; slotLabel?: string }>;
  }): {
    negotiation: Negotiation;
    tradeInVehicle: TradeInVehicle;
    images: TradeInImage[];
    offer: TradeInOffer;
    message: NegotiationMessage;
  } {
    const vehicle = this.assertCanPropose(input.vehicleId, input.buyerId);

    if (input.tradeIn.declaredValue <= 0) {
      throw new Error('O valor atribuído ao veículo de permuta deve ser maior que zero.');
    }
    if (input.cashComplement < 0) {
      throw new Error('O complemento em dinheiro não pode ser negativo.');
    }
    if (input.photos.length > 6) {
      throw new Error('É permitido importar no máximo 6 fotografias.');
    }
    if (!input.messageText.trim()) {
      throw new Error('Descreva sua proposta antes de enviar para análise.');
    }

    const { code, buyerAlias, sellerAlias } = this.nextAliases();
    const now = new Date().toISOString();
    const negotiationId = uid('neg');
    const tradeInVehicleId = uid('tiv');

    const negotiation: Negotiation = {
      id: negotiationId,
      code,
      vehicleId: vehicle.id,
      buyerId: input.buyerId,
      sellerId: vehicle.sellerId,
      buyerAlias,
      sellerAlias,
      modality: 'trade_in_plus_cash',
      status: 'open',
      buyerConfirmed: false,
      sellerConfirmed: false,
      contactDisclosureAuthorizedBuyer: false,
      contactDisclosureAuthorizedSeller: false,
      createdAt: now,
      updatedAt: now,
    };

    const tradeInVehicle: TradeInVehicle = {
      id: tradeInVehicleId,
      negotiationId,
      ...input.tradeIn,
      createdAt: now,
    };

    const images: TradeInImage[] = input.photos.map((photo, index) => {
      const order = index + 1;
      const slotLabel = photo.slotLabel || PHOTO_SLOT_LABELS[index] || `Foto ${order}`;
      const processed = processTradeInImageDataUrl(photo.dataUrl, slotLabel);
      const imgId = uid('img');
      const img: TradeInImage = {
        id: imgId,
        tradeInVehicleId,
        storagePath: `sanitized/${negotiationId}/${order}.jpg`,
        originalStoragePath: `${input.buyerId}/originals/${negotiationId}/${order}.jpg`,
        displayOrder: order,
        slotLabel,
        moderationStatus: 'aguardando_moderacao',
        exifStripped: processed.exifStripped,
        privacyFlags: processed.privacyFlags,
        previewDataUrl: processed.sanitizedDataUrl,
        createdAt: now,
      };
      this.state.tradeInImages[imgId] = img;
      return img;
    });

    const totalOfferValue = input.tradeIn.declaredValue + input.cashComplement;

    const offer: TradeInOffer = {
      id: uid('off'),
      negotiationId,
      tradeInVehicleId,
      cashComplement: input.cashComplement,
      totalOfferValue,
      status: 'aguardando_moderacao',
    };

    const pii = detectPIIAndContactLeaks(input.messageText);
    const message: NegotiationMessage = {
      id: uid('msg'),
      negotiationId,
      senderId: input.buyerId,
      senderAlias: buyerAlias,
      senderRole: 'buyer',
      messageType: 'proposal',
      proposedTradeInValue: input.tradeIn.declaredValue,
      proposedCashComplement: input.cashComplement,
      proposedTotalValue: totalOfferValue,
      messageText: input.messageText.trim(),
      originalMessage: input.messageText.trim(),
      moderationStatus: 'aguardando_moderacao',
      piiFlags: pii.flags,
      escalatedToSenior: false,
      createdAt: now,
    };

    this.state.negotiations[negotiationId] = negotiation;
    this.state.tradeInVehicles[tradeInVehicleId] = tradeInVehicle;
    this.state.tradeInOffers[offer.id] = offer;
    this.state.messages[message.id] = message;
    this.saveState();

    return { negotiation, tradeInVehicle, images, offer, message };
  }

  public sendNegotiationMessage(input: {
    negotiationId: string;
    senderId: string;
    messageText: string;
    messageType?: 'message' | 'counteroffer';
    proposedTradeInValue?: number;
    proposedCashComplement?: number;
  }): NegotiationMessage {
    const sender = this.state.profiles[input.senderId];
    if (!sender) throw new Error('Remetente não encontrado.');
    if (sender.isBlocked) {
      throw new Error('Usuário bloqueado não pode enviar mensagens.');
    }

    const neg = this.state.negotiations[input.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');
    if (input.senderId !== neg.buyerId && input.senderId !== neg.sellerId) {
      throw new Error('Acesso negado: você não participa desta negociação.');
    }
    if (!input.messageText.trim()) {
      throw new Error('A mensagem não pode estar vazia.');
    }

    const senderRole = input.senderId === neg.buyerId ? 'buyer' : 'seller';
    const senderAlias = senderRole === 'buyer' ? neg.buyerAlias : neg.sellerAlias;
    const pii = detectPIIAndContactLeaks(input.messageText);

    const proposedTotalValue =
      input.proposedCashComplement !== undefined || input.proposedTradeInValue !== undefined
        ? (input.proposedTradeInValue ?? 0) + (input.proposedCashComplement ?? 0)
        : undefined;

    const message: NegotiationMessage = {
      id: uid('msg'),
      negotiationId: neg.id,
      senderId: input.senderId,
      senderAlias,
      senderRole,
      messageType: input.messageType ?? 'message',
      proposedTradeInValue: input.proposedTradeInValue,
      proposedCashComplement: input.proposedCashComplement,
      proposedTotalValue,
      messageText: input.messageText.trim(),
      originalMessage: input.messageText.trim(),
      moderationStatus: 'aguardando_moderacao',
      piiFlags: pii.flags,
      escalatedToSenior: false,
      createdAt: new Date().toISOString(),
    };

    if (message.messageType === 'counteroffer') {
      neg.status = 'counteroffer';
      neg.updatedAt = new Date().toISOString();
    }

    this.state.messages[message.id] = message;
    this.saveState();
    return message;
  }

  public moderateMessage(input: {
    messageId: string;
    adminId: string;
    action: ModerationAction;
    reason: string;
    editedText?: string;
  }): NegotiationMessage {
    if (!this.isAdmin(input.adminId)) {
      throw new Error('Acesso negado: apenas administradores autorizados podem moderar mensagens.');
    }
    const admin = this.state.profiles[input.adminId];
    const msg = this.state.messages[input.messageId];
    if (!msg) throw new Error('Mensagem não encontrada.');
    const neg = this.state.negotiations[msg.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');

    const now = new Date().toISOString();
    const reason = input.reason.trim() || 'Revisão administrativa';
    const recipientId = msg.senderId === neg.buyerId ? neg.sellerId : neg.buyerId;
    const previousText = msg.messageText;

    if (input.action === 'approve' || input.action === 'edit_and_approve') {
      if (input.action === 'edit_and_approve' && input.editedText?.trim()) {
        msg.messageText = input.editedText.trim();
      }
      msg.moderationStatus = 'encaminhada';
      msg.moderatedBy = input.adminId;
      msg.moderationReason = reason;
      msg.approvedAt = now;

      // Aprova imagens associadas à permuta se pendentes
      Object.values(this.state.tradeInVehicles)
        .filter((tiv) => tiv.negotiationId === neg.id)
        .forEach((tiv) => {
          Object.values(this.state.tradeInImages)
            .filter((img) => img.tradeInVehicleId === tiv.id && img.moderationStatus === 'aguardando_moderacao')
            .forEach((img) => {
              img.moderationStatus = 'aprovada';
            });
        });

      Object.values(this.state.tradeInOffers)
        .filter((off) => off.negotiationId === neg.id && off.status === 'aguardando_moderacao')
        .forEach((off) => {
          off.status = 'encaminhada';
        });

      this.state.notifications.push(
        {
          id: uid('notif'),
          userId: msg.senderId,
          negotiationId: neg.id,
          eventType: 'message_approved',
          title: 'Mensagem aprovada pela moderação',
          body: `Sua mensagem na negociação ${neg.code} foi aprovada e encaminhada.`,
          read: false,
          createdAt: now,
        },
        {
          id: uid('notif'),
          userId: recipientId,
          negotiationId: neg.id,
          eventType: 'counteroffer_received',
          title: msg.messageType === 'counteroffer' ? 'Nova contraproposta recebida' : 'Nova mensagem recebida',
          body: `Você recebeu uma nova comunicação moderada na negociação ${neg.code}.`,
          read: false,
          createdAt: now,
        }
      );
    } else if (input.action === 'reject') {
      msg.moderationStatus = 'rejeitada';
      msg.moderatedBy = input.adminId;
      msg.moderationReason = reason;

      this.state.notifications.push({
        id: uid('notif'),
        userId: msg.senderId,
        negotiationId: neg.id,
        eventType: 'message_rejected',
        title: 'Mensagem rejeitada pela moderação',
        body: `Sua mensagem na negociação ${neg.code} foi rejeitada. Motivo: ${reason}`,
        read: false,
        createdAt: now,
      });
    } else if (input.action === 'request_correction') {
      msg.moderationStatus = 'rascunho';
      msg.correctionRequested = true;
      msg.moderatedBy = input.adminId;
      msg.moderationReason = reason;

      this.state.notifications.push({
        id: uid('notif'),
        userId: msg.senderId,
        negotiationId: neg.id,
        eventType: 'correction_requested',
        title: 'Correção solicitada pela moderação',
        body: `Ajuste sua mensagem na negociação ${neg.code}: ${reason}`,
        read: false,
        createdAt: now,
      });
    } else if (input.action === 'escalate_senior') {
      msg.moderationStatus = 'em_analise';
      msg.escalatedToSenior = true;
      msg.moderatedBy = input.adminId;
      msg.moderationReason = reason;
    } else if (input.action === 'block_user') {
      msg.moderationStatus = 'rejeitada';
      msg.moderatedBy = input.adminId;
      msg.moderationReason = reason;
      const targetUser = this.state.profiles[msg.senderId];
      if (targetUser) {
        targetUser.isBlocked = true;
        targetUser.blockedReason = reason;
        targetUser.blockedAt = now;
      }
    }

    this.state.moderationLogs.unshift({
      id: uid('log'),
      messageId: msg.id,
      negotiationId: neg.id,
      administratorId: input.adminId,
      administratorName: admin.fullName,
      action: input.action,
      reason,
      previousText,
      newText: msg.messageText,
      createdAt: now,
    });

    this.saveState();
    return msg;
  }

  public evaluateTradeInOffer(input: {
    negotiationId: string;
    sellerId: string;
    evaluation: SellerTradeInEvaluation;
  }): TradeInOffer {
    const neg = this.state.negotiations[input.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');
    if (neg.sellerId !== input.sellerId) {
      throw new Error('Apenas o proprietário do veículo anunciado pode avaliar a permuta.');
    }

    const offer = Object.values(this.state.tradeInOffers).find(
      (o) => o.negotiationId === input.negotiationId
    );
    if (!offer) throw new Error('Proposta não encontrada.');

    offer.sellerEvaluation = {
      ...input.evaluation,
      evaluatedAt: new Date().toISOString(),
    };
    this.saveState();
    return offer;
  }

  public acceptOfferAndRequestConfirmation(input: {
    negotiationId: string;
    userId: string;
    agreedTotalValue: number;
    agreedTradeInValue?: number;
    agreedCashComplement?: number;
  }): Negotiation {
    const neg = this.state.negotiations[input.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');
    if (input.userId !== neg.buyerId && input.userId !== neg.sellerId) {
      throw new Error('Usuário não autorizado nesta negociação.');
    }

    neg.agreedTotalValue = input.agreedTotalValue;
    neg.agreedTradeInValue = input.agreedTradeInValue;
    neg.agreedCashComplement = input.agreedCashComplement;
    neg.status = 'accepted_pending_confirmation';
    neg.updatedAt = new Date().toISOString();

    const otherUserId = input.userId === neg.buyerId ? neg.sellerId : neg.buyerId;
    this.state.notifications.push({
      id: uid('notif'),
      userId: otherUserId,
      negotiationId: neg.id,
      eventType: 'offer_accepted',
      title: 'Proposta aceita — confirmação necessária',
      body: `A negociação ${neg.code} aguarda a confirmação final de ambas as partes.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.saveState();
    return neg;
  }

  public confirmAgreement(input: {
    negotiationId: string;
    userId: string;
    authorizeContactDisclosure?: boolean;
  }): Negotiation {
    const neg = this.state.negotiations[input.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');
    if (input.userId !== neg.buyerId && input.userId !== neg.sellerId) {
      throw new Error('Acesso negado: usuário não participa desta negociação.');
    }

    const now = new Date().toISOString();
    if (input.userId === neg.buyerId) {
      neg.buyerConfirmed = true;
      neg.buyerConfirmedAt = now;
      if (input.authorizeContactDisclosure) {
        neg.contactDisclosureAuthorizedBuyer = true;
      }
    } else {
      neg.sellerConfirmed = true;
      neg.sellerConfirmedAt = now;
      if (input.authorizeContactDisclosure) {
        neg.contactDisclosureAuthorizedSeller = true;
      }
    }

    if (neg.buyerConfirmed && neg.sellerConfirmed) {
      neg.status = 'ACORDO_CONFIRMADO';
      const vehicle = this.state.vehicles[neg.vehicleId];
      if (vehicle) {
        vehicle.status = 'negotiation_locked';
      }

      const offer = Object.values(this.state.tradeInOffers).find(
        (o) => o.negotiationId === neg.id
      );
      if (offer) {
        offer.status = 'aceita';
        if (neg.agreedTotalValue === undefined) {
          neg.agreedTotalValue = offer.totalOfferValue;
          neg.agreedCashComplement = offer.cashComplement;
          const tiv = offer.tradeInVehicleId
            ? this.state.tradeInVehicles[offer.tradeInVehicleId]
            : undefined;
          neg.agreedTradeInValue = tiv?.declaredValue;
        }
      }

      this.state.notifications.push(
        {
          id: uid('notif'),
          userId: neg.buyerId,
          negotiationId: neg.id,
          eventType: 'negotiation_concluded',
          title: 'ACORDO CONFIRMADO',
          body: `Negociação ${neg.code} confirmada por ambas as partes! O agendamento em local seguro foi liberado.`,
          read: false,
          createdAt: now,
        },
        {
          id: uid('notif'),
          userId: neg.sellerId,
          negotiationId: neg.id,
          eventType: 'negotiation_concluded',
          title: 'ACORDO CONFIRMADO',
          body: `Negociação ${neg.code} confirmada por ambas as partes! O agendamento em local seguro foi liberado.`,
          read: false,
          createdAt: now,
        }
      );
    }

    neg.updatedAt = now;
    this.saveState();
    return neg;
  }

  public getSafeMeetingLocations(): SafeMeetingLocation[] {
    return Object.values(this.state.safeMeetingLocations).filter(
      (loc) => loc.active && loc.approved
    );
  }

  public scheduleSafeMeeting(input: {
    negotiationId: string;
    userId: string;
    locationId: string;
    scheduledAt: string;
    meetingType: SafeMeetingAppointment['meetingType'];
    vehicleInspection: boolean;
    documentCheck: boolean;
  }): SafeMeetingAppointment {
    const neg = this.state.negotiations[input.negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');
    if (input.userId !== neg.buyerId && input.userId !== neg.sellerId && !this.isAdmin(input.userId)) {
      throw new Error('Acesso negado para agendar encontro nesta negociação.');
    }
    if (neg.status !== 'ACORDO_CONFIRMADO') {
      throw new Error('O encontro seguro só pode ser agendado após o status ACORDO CONFIRMADO.');
    }

    const location = this.state.safeMeetingLocations[input.locationId];
    if (!location || !location.active || !location.approved) {
      throw new Error('Selecione um local seguro previamente cadastrado e aprovado.');
    }

    const appointment: SafeMeetingAppointment = {
      id: uid('apt'),
      negotiationId: neg.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: `${location.address} — ${location.city}/${location.state}`,
      scheduledAt: input.scheduledAt,
      meetingType: input.meetingType,
      vehicleInspection: input.vehicleInspection,
      documentCheck: input.documentCheck,
      status: 'agendado',
      createdAt: new Date().toISOString(),
    };

    this.state.safeMeetingAppointments[appointment.id] = appointment;
    this.saveState();
    return appointment;
  }

  /**
   * Retorna os dados de uma negociação com estrito controle de acesso, anonimização e filtro de RLS.
   */
  public getNegotiationForUser(negotiationId: string, viewerId: string) {
    const neg = this.state.negotiations[negotiationId];
    if (!neg) throw new Error('Negociação não encontrada.');

    const isAdmin = this.isAdmin(viewerId);
    const isBuyer = neg.buyerId === viewerId;
    const isSeller = neg.sellerId === viewerId;

    if (!isAdmin && !isBuyer && !isSeller) {
      throw new Error('Acesso negado: você não tem permissão para visualizar esta negociação.');
    }

    const vehicle = this.getPublicVehicleById(neg.vehicleId)!;
    const tradeInVehicle = Object.values(this.state.tradeInVehicles).find(
      (t) => t.negotiationId === neg.id
    );
    const offer = Object.values(this.state.tradeInOffers).find(
      (o) => o.negotiationId === neg.id
    );

    const APPROVED_STATUSES: MessageModerationStatus[] = [
      'aprovada',
      'encaminhada',
      'visualizada',
      'respondida',
    ];

    // RLS: destinatário NUNCA pode consultar mensagens pendentes ou rejeitadas
    const visibleMessages = Object.values(this.state.messages)
      .filter((m) => m.negotiationId === neg.id)
      .filter((m) => isAdmin || m.senderId === viewerId || APPROVED_STATUSES.includes(m.moderationStatus))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({
        ...m,
        // Nunca expor senderId real para a outra parte
        senderId: isAdmin || m.senderId === viewerId ? m.senderId : 'anonimo',
      }));

    // RLS: imagens de permuta só ficam visíveis ao destinatário após aprovação
    const visibleImages = tradeInVehicle
      ? Object.values(this.state.tradeInImages)
          .filter((img) => img.tradeInVehicleId === tradeInVehicle.id)
          .filter((img) => isAdmin || isBuyer || img.moderationStatus === 'aprovada')
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((img) => ({
            ...img,
            // Arquivos originais ficam protegidos e acessíveis apenas ao dono e admin
            originalStoragePath: isAdmin || isBuyer ? img.originalStoragePath : '[PROTEGIDO]',
          }))
      : [];

    const appointments = Object.values(this.state.safeMeetingAppointments).filter(
      (a) => a.negotiationId === neg.id
    );

    // Anonimização estrita: nomes e contatos reais nunca são expostos entre comprador e vendedor
    const sanitizedNegotiation = {
      id: neg.id,
      code: neg.code,
      vehicleId: neg.vehicleId,
      buyerAlias: neg.buyerAlias,
      sellerAlias: neg.sellerAlias,
      modality: neg.modality,
      status: neg.status,
      agreedTotalValue: neg.agreedTotalValue,
      agreedTradeInValue: neg.agreedTradeInValue,
      agreedCashComplement: neg.agreedCashComplement,
      buyerConfirmed: neg.buyerConfirmed,
      sellerConfirmed: neg.sellerConfirmed,
      contactDisclosureAuthorizedBuyer: neg.contactDisclosureAuthorizedBuyer,
      contactDisclosureAuthorizedSeller: neg.contactDisclosureAuthorizedSeller,
      createdAt: neg.createdAt,
      updatedAt: neg.updatedAt,
      viewerRole: isAdmin ? 'admin' : isBuyer ? 'buyer' : 'seller',
    };

    return {
      negotiation: sanitizedNegotiation,
      vehicle,
      tradeInVehicle: tradeInVehicle ?? null,
      offer: offer ?? null,
      images: visibleImages,
      messages: visibleMessages,
      appointments,
    };
  }

  public listNegotiationsForUser(viewerId: string) {
    const isAdmin = this.isAdmin(viewerId);
    return Object.values(this.state.negotiations)
      .filter((n) => isAdmin || n.buyerId === viewerId || n.sellerId === viewerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((n) => ({
        id: n.id,
        code: n.code,
        vehicleId: n.vehicleId,
        vehicleTitle: this.state.vehicles[n.vehicleId]
          ? `${this.state.vehicles[n.vehicleId].brand} ${this.state.vehicles[n.vehicleId].model} ${this.state.vehicles[n.vehicleId].modelYear}`
          : 'Veículo',
        vehicleImageUrl: this.state.vehicles[n.vehicleId]?.imageUrl ?? '',
        buyerAlias: n.buyerAlias,
        sellerAlias: n.sellerAlias,
        modality: n.modality,
        status: n.status,
        agreedTotalValue: n.agreedTotalValue,
        viewerRole: isAdmin ? 'admin' : n.buyerId === viewerId ? 'buyer' : 'seller',
        updatedAt: n.updatedAt,
      }));
  }

  public getNotificationsForUser(userId: string): NegotiationNotification[] {
    return this.state.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getAdminDashboard(adminId: string) {
    if (!this.isAdmin(adminId)) {
      throw new Error('Acesso negado: painel exclusivo da equipe administrativa.');
    }

    const allMessages = Object.values(this.state.messages);
    const approvedMessages = allMessages.filter((m) =>
      ['aprovada', 'encaminhada', 'visualizada', 'respondida'].includes(m.moderationStatus)
    );
    const rejectedMessages = allMessages.filter((m) => m.moderationStatus === 'rejeitada');

    const moderationDurations = approvedMessages
      .filter((m) => m.approvedAt)
      .map((m) => (new Date(m.approvedAt!).getTime() - new Date(m.createdAt).getTime()) / 1000);

    const avgModerationSeconds =
      moderationDurations.length > 0
        ? Math.round(moderationDurations.reduce((a, b) => a + b, 0) / moderationDurations.length)
        : 0;

    const allNegotiations = Object.values(this.state.negotiations);
    const metrics: AdminDashboardMetrics = {
      mensagensRecebidas: allMessages.length,
      mensagensAprovadas: approvedMessages.length,
      mensagensRejeitadas: rejectedMessages.length,
      tempoMedioModeracaoSegundos: avgModerationSeconds,
      propostasEmDinheiro: allNegotiations.filter((n) => n.modality === 'cash_only').length,
      propostasComPermuta: allNegotiations.filter((n) => n.modality === 'trade_in_plus_cash').length,
      acordosConfirmados: allNegotiations.filter((n) => n.status === 'ACORDO_CONFIRMADO').length,
      encontrosAgendados: Object.keys(this.state.safeMeetingAppointments).length,
    };

    const pendingMessages = allMessages
      .filter((m) => ['aguardando_moderacao', 'em_analise'].includes(m.moderationStatus))
      .map((m) => {
        const neg = this.state.negotiations[m.negotiationId];
        const veh = neg ? this.state.vehicles[neg.vehicleId] : undefined;
        const tiv = neg
          ? Object.values(this.state.tradeInVehicles).find((t) => t.negotiationId === neg.id)
          : undefined;
        const off = neg
          ? Object.values(this.state.tradeInOffers).find((o) => o.negotiationId === neg.id)
          : undefined;
        const imgs = tiv
          ? Object.values(this.state.tradeInImages)
              .filter((i) => i.tradeInVehicleId === tiv.id)
              .sort((a, b) => a.displayOrder - b.displayOrder)
          : [];
        const senderProfile = this.state.profiles[m.senderId];
        const history = allMessages
          .filter((hm) => hm.negotiationId === m.negotiationId && hm.id !== m.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        return {
          message: m,
          negotiation: neg,
          vehicle: veh ? this.getPublicVehicleById(veh.id) : null,
          tradeInVehicle: tiv ?? null,
          offer: off ?? null,
          images: imgs,
          senderIdentityForAdmin: senderProfile
            ? {
                id: senderProfile.id,
                fullName: senderProfile.fullName,
                email: senderProfile.email,
                phone: senderProfile.phone,
              }
            : null,
          history,
        };
      });

    return {
      metrics,
      pendingMessages,
      cashProposals: allNegotiations.filter((n) => n.modality === 'cash_only'),
      tradeInProposals: allNegotiations.filter((n) => n.modality === 'trade_in_plus_cash'),
      counteroffers: allMessages.filter((m) => m.messageType === 'counteroffer'),
      acceptedNegotiations: allNegotiations.filter((n) =>
        ['accepted_pending_confirmation', 'ACORDO_CONFIRMADO'].includes(n.status)
      ),
      completedNegotiations: allNegotiations.filter((n) =>
        ['ACORDO_CONFIRMADO', 'completed'].includes(n.status)
      ),
      appointments: Object.values(this.state.safeMeetingAppointments),
      blockedUsers: Object.values(this.state.profiles).filter((p) => p.isBlocked),
      moderationLogs: this.state.moderationLogs,
    };
  }
}

// Singleton compartilhado no servidor Next.js
const globalForStore = globalThis as unknown as { __marketplaceStore?: MarketplaceStore };
export function getMarketplaceStore(): MarketplaceStore {
  if (!globalForStore.__marketplaceStore) {
    globalForStore.__marketplaceStore = new MarketplaceStore();
  }
  return globalForStore.__marketplaceStore;
}
