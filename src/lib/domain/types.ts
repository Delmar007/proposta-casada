export type UserRole = 'user' | 'moderator' | 'senior_moderator' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  residentialAddress: string;
  socialMedia: string;
  role: UserRole;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

export type DealTypeOption =
  | 'no_dinheiro'
  | 'menor_valor'
  | 'maior_valor'
  | 'troca_na_orelha';

export interface PublicVehicle {
  id: string;
  listingType?: 'vehicle' | 'property';
  category?: string;
  dealTypes?: DealTypeOption[];
  brand: string;
  brandLogoUrl?: string;
  model: string;
  version: string;
  engine?: string;
  traction?: string;
  manufactureYear: number;
  modelYear: number;
  mileage: number;
  fuel: string;
  transmission: string;
  color: string;
  city: string;
  state: string;
  fipePrice: number;
  fipeCode?: string;
  /** Confidencial: nunca expor ao comprador */
  askingPrice?: number;
  description: string;
  imageUrl: string;
  images?: string[];
  // Campos específicos para imóveis
  propertyType?: string;
  totalAreaM2?: number;
  builtAreaM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  condoFee?: number;
  iptu?: number;
  status: 'active' | 'negotiation_locked' | 'sold' | 'inactive';
  createdAt: string;
}

export interface VehicleRecord extends PublicVehicle {
  sellerId: string;
  /** Confidencial: nunca expor ao comprador */
  minConfidentialPrice: number;
}

export type NegotiationModality = 'cash_only' | 'trade_in_plus_cash';

export type NegotiationStatus =
  | 'open'
  | 'counteroffer'
  | 'accepted_pending_confirmation'
  | 'ACORDO_CONFIRMADO'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type MessageModerationStatus =
  | 'rascunho'
  | 'aguardando_moderacao'
  | 'em_analise'
  | 'aprovada'
  | 'rejeitada'
  | 'encaminhada'
  | 'visualizada'
  | 'respondida';

export const PHOTO_SLOT_LABELS = [
  '1. Frente',
  '2. Traseira',
  '3. Lateral direita',
  '4. Lateral esquerda',
  '5. Interior',
  '6. Painel e quilometragem',
] as const;

export interface TradeInVehicle {
  id: string;
  negotiationId: string;
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
  createdAt: string;
}

export interface TradeInImage {
  id: string;
  tradeInVehicleId: string;
  storagePath: string;
  originalStoragePath: string;
  displayOrder: number;
  slotLabel: string;
  moderationStatus: 'rascunho' | 'aguardando_moderacao' | 'em_analise' | 'aprovada' | 'rejeitada';
  exifStripped: boolean;
  privacyFlags: string[];
  previewDataUrl: string;
  createdAt: string;
}

export interface SellerTradeInEvaluation {
  tradeInValueAssessment?: string;
  conditionAssessment?: string;
  photosAssessment?: string;
  cashAssessment?: string;
  totalAssessment?: string;
  evaluatedAt?: string;
}

export interface TradeInOffer {
  id: string;
  negotiationId: string;
  tradeInVehicleId?: string;
  cashComplement: number;
  totalOfferValue: number;
  status: MessageModerationStatus | 'aceita';
  sellerEvaluation?: SellerTradeInEvaluation;
}

export interface PIIFlag {
  category:
    | 'telefone'
    | 'whatsapp'
    | 'email'
    | 'link_externo'
    | 'endereco_residencial'
    | 'rede_social'
    | 'qr_code'
    | 'documento_pessoal';
  match: string;
  description: string;
}

export interface PIIDetectionResult {
  isSuspicious: boolean;
  flags: PIIFlag[];
  riskLevel: 'baixo' | 'medio' | 'alto';
  summary: string;
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderAlias: string;
  senderRole: 'buyer' | 'seller';
  messageType: 'proposal' | 'counteroffer' | 'message';
  proposedCashComplement?: number;
  proposedTradeInValue?: number;
  proposedTotalValue?: number;
  messageText: string;
  originalMessage: string;
  moderationStatus: MessageModerationStatus;
  moderatedBy?: string;
  moderationReason?: string;
  piiFlags: PIIFlag[];
  escalatedToSenior: boolean;
  correctionRequested?: boolean;
  createdAt: string;
  approvedAt?: string;
  viewedAt?: string;
}

export type ModerationAction =
  | 'approve'
  | 'edit_and_approve'
  | 'reject'
  | 'request_correction'
  | 'block_user'
  | 'escalate_senior'
  | 'view_identity';

export interface NegotiationModerationLog {
  id: string;
  messageId: string;
  negotiationId: string;
  administratorId: string;
  administratorName: string;
  action: ModerationAction;
  reason: string;
  previousText?: string;
  newText?: string;
  createdAt: string;
}

export interface SafeMeetingLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  locationType: string;
  active: boolean;
  approved: boolean;
}

export interface SafeMeetingAppointment {
  id: string;
  negotiationId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  scheduledAt: string;
  meetingType: 'vistoria_veiculo' | 'conferencia_documental' | 'vistoria_e_conferencia';
  vehicleInspection: boolean;
  documentCheck: boolean;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado';
  createdAt: string;
}

export interface NegotiationNotification {
  id: string;
  userId: string;
  negotiationId: string;
  eventType:
    | 'message_approved'
    | 'message_rejected'
    | 'counteroffer_received'
    | 'offer_accepted'
    | 'negotiation_concluded'
    | 'correction_requested';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Negotiation {
  id: string;
  code: string;
  vehicleId: string;
  buyerId: string;
  sellerId: string;
  buyerAlias: string;
  sellerAlias: string;
  modality: NegotiationModality;
  status: NegotiationStatus;
  agreedTotalValue?: number;
  agreedTradeInValue?: number;
  agreedCashComplement?: number;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  contactDisclosureAuthorizedBuyer: boolean;
  contactDisclosureAuthorizedSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardMetrics {
  mensagensRecebidas: number;
  mensagensAprovadas: number;
  mensagensRejeitadas: number;
  tempoMedioModeracaoSegundos: number;
  propostasEmDinheiro: number;
  propostasComPermuta: number;
  acordosConfirmados: number;
  encontrosAgendados: number;
}
