import { NextRequest, NextResponse } from 'next/server';
import { fetchFipeModelsForBrand, getFipeBrands } from '@/lib/fipe/fipe-service';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const brands = getFipeBrands();

  if (!brand) {
    return NextResponse.json({ brands });
  }

  const models = await fetchFipeModelsForBrand(brand);
  return NextResponse.json({
    brand,
    brands,
    models,
  });
}
