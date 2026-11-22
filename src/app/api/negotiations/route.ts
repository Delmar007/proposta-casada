import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  const userId = getActiveUserId(req);
  const store = getMarketplaceStore();
  return NextResponse.json({
    negotiations: store.listNegotiationsForUser(userId),
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = getActiveUserId(req);
    const body = await req.json();
    const store = getMarketplaceStore();

    if (body.modality === 'cash_only') {
      const result = store.createCashProposal({
        vehicleId: body.vehicleId,
        buyerId: userId,
        cashAmount: Number(body.cashAmount),
        messageText: body.messageText,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (body.modality === 'trade_in_plus_cash') {
      const result = store.createTradeInProposal({
        vehicleId: body.vehicleId,
        buyerId: userId,
        tradeIn: {
          brand: body.tradeIn.brand,
          model: body.tradeIn.model,
          version: body.tradeIn.version,
          manufactureYear: Number(body.tradeIn.manufactureYear),
          modelYear: Number(body.tradeIn.modelYear),
          mileage: Number(body.tradeIn.mileage),
          fuel: body.tradeIn.fuel,
          transmission: body.tradeIn.transmission,
          color: body.tradeIn.color,
          city: body.tradeIn.city,
          state: body.tradeIn.state,
          declaredValue: Number(body.tradeIn.declaredValue),
        },
        cashComplement: Number(body.cashComplement),
        messageText: body.messageText,
        photos: Array.isArray(body.photos) ? body.photos : [],
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Modalidade de negociação inválida.' },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar proposta.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
