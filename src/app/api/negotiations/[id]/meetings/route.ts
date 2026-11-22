import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET() {
  const store = getMarketplaceStore();
  return NextResponse.json({ locations: store.getSafeMeetingLocations() });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = getActiveUserId(req);
    const body = await req.json();
    const store = getMarketplaceStore();

    const appointment = store.scheduleSafeMeeting({
      negotiationId: id,
      userId,
      locationId: body.locationId,
      scheduledAt: body.scheduledAt,
      meetingType: body.meetingType ?? 'vistoria_e_conferencia',
      vehicleInspection: body.vehicleInspection !== false,
      documentCheck: body.documentCheck !== false,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao agendar encontro seguro.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
