import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceStore } from '@/lib/domain/store';
import { getActiveUserId } from '@/lib/api/auth';

export async function GET() {
  const store = getMarketplaceStore();
  return NextResponse.json({ vehicles: store.getPublicVehicles() });
}

export async function POST(req: NextRequest) {
  try {
    const userId = getActiveUserId(req);
    const body = await req.json();
    const store = getMarketplaceStore();

    const listingType: 'vehicle' | 'property' =
      body.listingType === 'property' ? 'property' : 'vehicle';

    const created = store.createVehicleListing({
      sellerId: userId,
      listingType,
      category: String(body.category || (listingType === 'property' ? 'Residências' : 'Carros')),
      dealTypes: Array.isArray(body.dealTypes) ? body.dealTypes : ['no_dinheiro'],
      desiredTradeIn: body.desiredTradeIn ? String(body.desiredTradeIn) : undefined,
      brand: String(body.brand || (listingType === 'property' ? body.propertyType || 'Imóvel' : '')),
      model: String(body.model || ''),
      version: String(body.version || ''),
      engine: body.engine ? String(body.engine) : undefined,
      traction: body.traction ? String(body.traction) : undefined,
      manufactureYear: Number(body.manufactureYear) || new Date().getFullYear(),
      modelYear: Number(body.modelYear) || new Date().getFullYear(),
      mileage: Number(body.mileage) || 0,
      fuel: String(body.fuel || (listingType === 'property' ? 'Imóvel' : 'Flex')),
      transmission: String(body.transmission || (listingType === 'property' ? 'N/A' : 'Automático')),
      color: String(body.color || (listingType === 'property' ? 'Padrão' : 'Prata')),
      city: String(body.city || ''),
      state: String(body.state || ''),
      fipePrice: Number(body.fipePrice) || Number(body.askingPrice) || 0,
      askingPrice: Number(body.askingPrice) || Number(body.fipePrice) || 0,
      minConfidentialPrice: body.minConfidentialPrice
        ? Number(body.minConfidentialPrice)
        : undefined,
      description: String(body.description || ''),
      images: Array.isArray(body.images) ? body.images : undefined,
      propertyType: body.propertyType ? String(body.propertyType) : undefined,
      totalAreaM2: body.totalAreaM2 ? Number(body.totalAreaM2) : undefined,
      builtAreaM2: body.builtAreaM2 ? Number(body.builtAreaM2) : undefined,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
      parkingSpaces: body.parkingSpaces ? Number(body.parkingSpaces) : undefined,
      condoFee: body.condoFee ? Number(body.condoFee) : undefined,
      iptu: body.iptu ? Number(body.iptu) : undefined,
    });

    return NextResponse.json({ vehicle: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao cadastrar anúncio.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
