import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceStore } from '@/lib/domain/store';
import { detectPIIAndContactLeaks } from '@/lib/privacy/pii-detector';
import { stripJpegExif } from '@/lib/privacy/image-processor';

function createFakeJpegWithExif(): string {
  // JPEG SOI + APP1 (EXIF) + SOS + EOI
  const soi = Buffer.from([0xff, 0xd8]);
  const exifPayload = Buffer.from('Exif\0\0GPS_LAT_23_LON_46', 'ascii');
  const app1Header = Buffer.alloc(4);
  app1Header.writeUInt8(0xff, 0);
  app1Header.writeUInt8(0xe1, 1);
  app1Header.writeUInt16BE(exifPayload.length + 2, 2);
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x02, 0x03, 0x04, 0xff, 0xd9]);
  const full = Buffer.concat([soi, app1Header, exifPayload, sos]);
  return `data:image/jpeg;base64,${full.toString('base64')}`;
}

describe('Módulo de Permuta, Propostas Compostas e Negociação Protegida', () => {
  let store: MarketplaceStore;

  beforeEach(() => {
    store = new MarketplaceStore({ persistToDisk: false });
  });

  it('simula negociação completa: FIPE R$ 100.000, permuta R$ 75.000 + R$ 15.000, 6 fotos sem EXIF, moderação, contraproposta, acordo confirmado e encontro seguro', () => {
    // 1. Verificar que o preço mínimo confidencial do vendedor NUNCA é exposto ao público
    const publicVeh = store.getPublicVehicleById('veh-1')!;
    expect(publicVeh.fipePrice).toBe(100000);
    expect((publicVeh as unknown as Record<string, unknown>).minConfidentialPrice).toBeUndefined();

    // 2. Comprador envia proposta com permuta R$ 75.000 + R$ 15.000 em dinheiro + 6 fotos com EXIF
    const fakePhoto = createFakeJpegWithExif();
    const { negotiation, offer, images, message } = store.createTradeInProposal({
      vehicleId: 'veh-1',
      buyerId: 'buyer-1',
      tradeIn: {
        brand: 'Hyundai',
        model: 'HB20',
        version: 'Platinum 1.0 Turbo',
        manufactureYear: 2021,
        modelYear: 2022,
        mileage: 32000,
        fuel: 'Flex',
        transmission: 'Automático',
        color: 'Branco',
        city: 'São Paulo',
        state: 'SP',
        declaredValue: 75000,
      },
      cashComplement: 15000,
      messageText: 'Tenho interesse no Corolla. Ofereço meu HB20 bem conservado mais R$ 15.000.',
      photos: Array.from({ length: 6 }, (_, i) => ({
        dataUrl: fakePhoto,
        slotLabel: `Foto ${i + 1}`,
      })),
    });

    // Cálculo automático: 75.000 + 15.000 = 90.000
    expect(offer.totalOfferValue).toBe(90000);
    expect(images).toHaveLength(6);
    expect(images.every((img) => img.exifStripped)).toBe(true);
    expect(message.moderationStatus).toBe('aguardando_moderacao');

    // Verificar remoção binária de EXIF
    const rawBuf = Buffer.from(fakePhoto.split(',')[1], 'base64');
    const stripped = stripJpegExif(rawBuf);
    expect(stripped.hadMetadata).toBe(true);
    expect(stripped.cleaned.toString('ascii')).not.toContain('GPS_LAT_23_LON_46');

    // 3. Antes da aprovação, vendedor NÃO pode ver a mensagem pendente nem as fotos não aprovadas
    const sellerViewBefore = store.getNegotiationForUser(negotiation.id, 'seller-1');
    expect(sellerViewBefore.messages).toHaveLength(0);
    expect(sellerViewBefore.images).toHaveLength(0);

    // 4. Administrador aprova e encaminha a proposta
    store.moderateMessage({
      messageId: message.id,
      adminId: 'admin-1',
      action: 'approve',
      reason: 'Proposta sem dados pessoais e fotos verificadas.',
    });

    // 5. Vendedor recebe proposta anonimizada (Negociador 001), sem identidade real do comprador
    const sellerViewAfter = store.getNegotiationForUser(negotiation.id, 'seller-1');
    expect(sellerViewAfter.negotiation.buyerAlias).toBe('Negociador 001');
    expect(sellerViewAfter.messages).toHaveLength(1);
    expect(sellerViewAfter.messages[0].moderationStatus).toBe('encaminhada');
    expect(sellerViewAfter.images).toHaveLength(6);
    expect(sellerViewAfter.images[0].originalStoragePath).toBe('[PROTEGIDO]');
    expect(JSON.stringify(sellerViewAfter)).not.toContain('João Pedro Almeida');
    expect(JSON.stringify(sellerViewAfter)).not.toContain('123.456.789-00');

    // Vendedor avalia separadamente os itens da permuta
    const evaluated = store.evaluateTradeInOffer({
      negotiationId: negotiation.id,
      sellerId: 'seller-1',
      evaluation: {
        tradeInValueAssessment: 'Aceito R$ 75.000 sujeito à vistoria',
        conditionAssessment: 'Bom estado aparente',
        photosAssessment: '6 fotos nítidas',
        cashAssessment: 'Peço R$ 20.000 de complemento',
        totalAssessment: 'Total pretendido R$ 95.000',
      },
    });
    expect(evaluated.sellerEvaluation?.cashAssessment).toContain('20.000');

    // 6. Vendedor envia contraproposta (passa pela moderação)
    const counterMsg = store.sendNegotiationMessage({
      negotiationId: negotiation.id,
      senderId: 'seller-1',
      messageType: 'counteroffer',
      proposedTradeInValue: 75000,
      proposedCashComplement: 20000,
      messageText: 'Aceito seu carro por R$ 75.000 com complemento de R$ 20.000.',
    });
    expect(counterMsg.moderationStatus).toBe('aguardando_moderacao');

    // Comprador ainda não vê a contraproposta antes da moderação
    expect(store.getNegotiationForUser(negotiation.id, 'buyer-1').messages).toHaveLength(1);

    // Administrador aprova a contraproposta
    store.moderateMessage({
      messageId: counterMsg.id,
      adminId: 'admin-1',
      action: 'approve',
      reason: 'Contraproposta válida.',
    });

    // Comprador recebe contraproposta
    const buyerView = store.getNegotiationForUser(negotiation.id, 'buyer-1');
    expect(buyerView.messages).toHaveLength(2);
    expect(buyerView.messages[1].proposedTotalValue).toBe(95000);

    // 7. Comprador aceita e ambas as partes confirmam o acordo
    store.acceptOfferAndRequestConfirmation({
      negotiationId: negotiation.id,
      userId: 'buyer-1',
      agreedTotalValue: 95000,
      agreedTradeInValue: 75000,
      agreedCashComplement: 20000,
    });
    store.confirmAgreement({ negotiationId: negotiation.id, userId: 'buyer-1' });
    const confirmed = store.confirmAgreement({
      negotiationId: negotiation.id,
      userId: 'seller-1',
    });
    expect(confirmed.status).toBe('ACORDO_CONFIRMADO');

    // 8. Sistema bloqueia novas propostas para o veículo com acordo confirmado
    expect(() =>
      store.createCashProposal({
        vehicleId: 'veh-1',
        buyerId: 'buyer-2',
        cashAmount: 98000,
        messageText: 'Quero comprar à vista agora.',
      })
    ).toThrow(/ACORDO CONFIRMADO/);

    // 9. Agendamento de encontro seguro em local credenciado
    const locations = store.getSafeMeetingLocations();
    expect(locations.length).toBeGreaterThan(0);
    const appointment = store.scheduleSafeMeeting({
      negotiationId: negotiation.id,
      userId: 'buyer-1',
      locationId: locations[0].id,
      scheduledAt: '2026-11-25T14:00:00Z',
      meetingType: 'vistoria_e_conferencia',
      vehicleInspection: true,
      documentCheck: true,
    });
    expect(appointment.status).toBe('agendado');
  });

  it('rejeita mensagens indevidas mantendo sigilo e registra motivo no histórico de auditoria', () => {
    const { negotiation, message } = store.createCashProposal({
      vehicleId: 'veh-2',
      buyerId: 'buyer-1',
      cashAmount: 118000,
      messageText: 'Me chama no WhatsApp (11) 98888-7777 para fecharmos.',
    });

    // Detecção automática sinalizou tentativa de contato
    expect(message.piiFlags.length).toBeGreaterThan(0);

    store.moderateMessage({
      messageId: message.id,
      adminId: 'admin-1',
      action: 'reject',
      reason: 'Tentativa de compartilhamento de WhatsApp/telefone.',
    });

    // Destinatário não vê mensagem rejeitada
    const sellerView = store.getNegotiationForUser(negotiation.id, 'seller-1');
    expect(sellerView.messages).toHaveLength(0);

    // Remetente recebe notificação de rejeição
    const buyerNotifs = store.getNotificationsForUser('buyer-1');
    expect(buyerNotifs.some((n) => n.eventType === 'message_rejected')).toBe(true);
  });

  it('detecta tentativas de compartilhamento de telefone, WhatsApp, e-mail, link, endereço, rede social e QR code', () => {
    const pii = detectPIIAndContactLeaks(
      'Meu zap é (11) 99999-8888, email teste@exemplo.com, veja https://meusite.com, Rua Augusta 900, insta @meu_perfil, envio QR code do Pix.'
    );
    expect(pii.isSuspicious).toBe(true);
    expect(pii.riskLevel).toBe('alto');
    const categories = new Set(pii.flags.map((f) => f.category));
    expect(categories.has('telefone')).toBe(true);
    expect(categories.has('whatsapp')).toBe(true);
    expect(categories.has('email')).toBe(true);
    expect(categories.has('link_externo')).toBe(true);
    expect(categories.has('endereco_residencial')).toBe(true);
    expect(categories.has('rede_social')).toBe(true);
    expect(categories.has('qr_code')).toBe(true);
  });

  it('suporta propostas simultâneas com identificadores exclusivos por negociação', () => {
    const p1 = store.createCashProposal({
      vehicleId: 'veh-1',
      buyerId: 'buyer-1',
      cashAmount: 91000,
      messageText: 'Proposta 1 à vista.',
    });
    const p2 = store.createCashProposal({
      vehicleId: 'veh-1',
      buyerId: 'buyer-2',
      cashAmount: 94000,
      messageText: 'Proposta 2 à vista.',
    });

    expect(p1.negotiation.buyerAlias).toBe('Negociador 001');
    expect(p2.negotiation.buyerAlias).toBe('Negociador 002');
    expect(p1.negotiation.code).not.toBe(p2.negotiation.code);
  });

  it('bloqueia acesso de usuários não autorizados à negociação, moderação e dados pessoais', () => {
    const { negotiation, message } = store.createCashProposal({
      vehicleId: 'veh-1',
      buyerId: 'buyer-1',
      cashAmount: 92000,
      messageText: 'Proposta segura.',
    });

    // Outro comprador não pode acessar a negociação
    expect(() => store.getNegotiationForUser(negotiation.id, 'buyer-2')).toThrow(/Acesso negado/);

    // Usuário comum não pode moderar mensagens nem acessar painel admin
    expect(() =>
      store.moderateMessage({
        messageId: message.id,
        adminId: 'buyer-1',
        action: 'approve',
        reason: 'Tentativa indevida',
      })
    ).toThrow(/Acesso negado/);

    expect(() => store.getAdminDashboard('seller-1')).toThrow(/Acesso negado/);
  });
});
