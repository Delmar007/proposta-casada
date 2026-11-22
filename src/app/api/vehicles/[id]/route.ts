import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = getMarketplaceStore();
  const vehicle = store.getPublicVehicleById(id);
  if (!vehicle) {
    return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ vehicle });
}
