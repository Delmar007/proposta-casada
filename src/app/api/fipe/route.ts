import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFipeModelsForBrand,
  fetchFipeYearsForModel,
  getFipeBrands,
} from '@/lib/fipe/fipe-service';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand');
  const modelCode = req.nextUrl.searchParams.get('modelCode');
  const brands = getFipeBrands();

  if (!brand) {
    return NextResponse.json({ brands });
  }

  if (modelCode) {
    const years = await fetchFipeYearsForModel(brand, modelCode);
    return NextResponse.json({ brand, modelCode, years });
  }

  const models = await fetchFipeModelsForBrand(brand);
  return NextResponse.json({
    brand,
    brands,
    models,
  });
}
