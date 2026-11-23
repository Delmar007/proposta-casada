import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFipeModelsForBrand,
  fetchFipePriceForYear,
  fetchFipeYearsForModel,
  getFipeBrands,
} from '@/lib/fipe/fipe-service';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') ?? '';
  const brandCode = req.nextUrl.searchParams.get('brandCode') ?? undefined;
  const modelCode = req.nextUrl.searchParams.get('modelCode');
  const yearCode = req.nextUrl.searchParams.get('yearCode');
  const brands = getFipeBrands();

  if (!brand && !brandCode) {
    return NextResponse.json({ brands });
  }

  if (modelCode && yearCode) {
    const priceInfo = await fetchFipePriceForYear(brand, modelCode, yearCode, brandCode);
    return NextResponse.json({ brand, brandCode, modelCode, yearCode, priceInfo });
  }

  if (modelCode) {
    const { years, yearOptions } = await fetchFipeYearsForModel(brand, modelCode, brandCode);
    return NextResponse.json({ brand, brandCode, modelCode, years, yearOptions });
  }

  const models = await fetchFipeModelsForBrand(brand, brandCode);
  return NextResponse.json({
    brand,
    brandCode,
    brands,
    models,
  });
}
