import { NextRequest } from 'next/server';

export function getActiveUserId(req: NextRequest): string {
  return (
    req.headers.get('x-user-id') ||
    req.nextUrl.searchParams.get('userId') ||
    'buyer-1'
  );
}
