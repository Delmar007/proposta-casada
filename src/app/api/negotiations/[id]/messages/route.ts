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
    const body = await req.json();
    const store = getMarketplaceStore();

    const message = store.sendNegotiationMessage({
      negotiationId: id,
      senderId: userId,
      messageText: body.messageText,
      messageType: body.messageType ?? 'message',
      proposedTradeInValue:
        body.proposedTradeInValue !== undefined ? Number(body.proposedTradeInValue) : undefined,
      proposedCashComplement:
        body.proposedCashComplement !== undefined ? Number(body.proposedCashComplement) : undefined,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
