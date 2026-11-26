import { NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';

export async function GET() {
  try {
    const store = getMarketplaceStore();
    const proposals = store.getAdminProposals();
    return NextResponse.json({ proposals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar propostas.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
