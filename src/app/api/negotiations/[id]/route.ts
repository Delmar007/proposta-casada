import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = getActiveUserId(req);
    const store = getMarketplaceStore();
    const data = store.getNegotiationForUser(id, userId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar negociação.';
    const status = message.includes('Acesso negado') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
