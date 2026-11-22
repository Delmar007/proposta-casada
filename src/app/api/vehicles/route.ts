import { NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';

export async function GET() {
  const store = getMarketplaceStore();
  return NextResponse.json({ vehicles: store.getPublicVehicles() });
}
