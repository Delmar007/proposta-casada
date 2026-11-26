import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getUserProfile } from '@/lib/persistence/profile-store';

export async function GET() {
  const store = getMarketplaceStore();
  const vehicles = store.getAdminVehicles();

  const enriched = await Promise.all(
    vehicles.map(async (v) => {
      const savedProfile = await getUserProfile(v.sellerId).catch(() => null);
      return {
        ...v,
        sellerName: savedProfile?.fullName || v.sellerId,
        sellerWhatsapp: savedProfile?.whatsapp || '',
        sellerEmail: savedProfile?.email || '',
      };
    })
  );

  return NextResponse.json({ vehicles: enriched });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicleId = String(body.vehicleId ?? '').trim();
    const action = body.action as 'approve' | 'pause' | 'delete';

    if (!vehicleId || !['approve', 'pause', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const store = getMarketplaceStore();
    const result = store.moderateVehicleListing(vehicleId, action);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar anúncio.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
