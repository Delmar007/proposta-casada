import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = getActiveUserId(req);
    const store = getMarketplaceStore();
    const dashboard = store.getAdminDashboard(userId);
    return NextResponse.json(dashboard);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Acesso negado.';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getActiveUserId(req);
    const body = await req.json();
    const store = getMarketplaceStore();

    const message = store.moderateMessage({
      messageId: body.messageId,
      adminId: userId,
      action: body.action,
      reason: body.reason ?? '',
      editedText: body.editedText,
    });

    return NextResponse.json({ message });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro na moderação.';
    const status = message.includes('Acesso negado') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
