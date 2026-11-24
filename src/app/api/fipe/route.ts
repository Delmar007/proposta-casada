import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFipeBrands,
  fetchFipeModelsForBrand,
  fetchFipePriceForYear,
  fetchFipeYearsForModel,
  FipeVehicleType,
} from '@/lib/fipe/fipe-service';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') ?? '';
  const brandCode = req.nextUrl.searchParams.get('brandCode') ?? undefined;
  const modelCode = req.nextUrl.searchParams.get('modelCode');
  const yearCode = req.nextUrl.searchParams.get('yearCode');
  const rawType = req.nextUrl.searchParams.get('vehicleType');
  const vehicleType: FipeVehicleType =
    rawType === 'motorcycles' ? 'motorcycles' : rawType === 'trucks' ? 'trucks' : 'cars';

  if (!brand && !brandCode) {
    const brands = await fetchFipeBrands(vehicleType);
    return NextResponse.json({ brands, vehicleType });
  }

  if (modelCode && yearCode) {
    const priceInfo = await fetchFipePriceForYear(
      brand,
      modelCode,
      yearCode,
      brandCode,
      vehicleType
    );
    return NextResponse.json({ brand, brandCode, modelCode, yearCode, vehicleType, priceInfo });
  }

  if (modelCode) {
    const { years, yearOptions } = await fetchFipeYearsForModel(
      brand,
      modelCode,
      brandCode,
      vehicleType
    );
    return NextResponse.json({ brand, brandCode, modelCode, vehicleType, years, yearOptions });
  }

  const [brands, models] = await Promise.all([
    fetchFipeBrands(vehicleType),
    fetchFipeModelsForBrand(brand, brandCode, vehicleType),
  ]);
  return NextResponse.json({
    brand,
    brandCode,
    vehicleType,
    brands,
    models,
  });
}
