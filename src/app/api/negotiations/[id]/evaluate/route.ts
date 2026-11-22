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

    const offer = store.evaluateTradeInOffer({
      negotiationId: id,
      sellerId: userId,
      evaluation: {
        tradeInValueAssessment: body.tradeInValueAssessment,
        conditionAssessment: body.conditionAssessment,
        photosAssessment: body.photosAssessment,
        cashAssessment: body.cashAssessment,
        totalAssessment: body.totalAssessment,
      },
    });

    return NextResponse.json({ offer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
