import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  const userId = getActiveUserId(req);
  const store = getMarketplaceStore();
  return NextResponse.json({
    notifications: store.getNotificationsForUser(userId),
  });
}
