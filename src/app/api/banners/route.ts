import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import type { BannerItem } from '@/lib/banners/banner-store';

export async function GET() {
  try {
    const store = getMarketplaceStore();
    return NextResponse.json({ banners: store.getBanners() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar banners.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = Array.isArray(body?.banners) ? body.banners : [];
    const valid: BannerItem[] = raw.filter(
      (b: unknown): b is BannerItem =>
        Boolean(
          b &&
            typeof b === 'object' &&
            typeof (b as BannerItem).id === 'string' &&
            typeof (b as BannerItem).imageUrl === 'string'
        )
    );
    const store = getMarketplaceStore();
    const saved = store.saveBanners(valid);
    return NextResponse.json({ banners: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar banners.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
