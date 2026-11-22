import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = getActiveUserId(req);
    const body = await req.json().catch(() => ({}));
    const store = getMarketplaceStore();

    if (body.action === 'accept_offer') {
      const negotiation = store.acceptOfferAndRequestConfirmation({
        negotiationId: id,
        userId,
        agreedTotalValue: Number(body.agreedTotalValue),
        agreedTradeInValue:
          body.agreedTradeInValue !== undefined ? Number(body.agreedTradeInValue) : undefined,
        agreedCashComplement:
          body.agreedCashComplement !== undefined ? Number(body.agreedCashComplement) : undefined,
      });
      return NextResponse.json({ negotiation });
    }

    const negotiation = store.confirmAgreement({
      negotiationId: id,
      userId,
      authorizeContactDisclosure: Boolean(body.authorizeContactDisclosure),
    });

    return NextResponse.json({ negotiation });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao confirmar acordo.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
