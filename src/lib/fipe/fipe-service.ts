import { FIPE_MARCAS } from './fipe-brands';

export interface FipeBrandOption {
  code: string;
  name: string;
  isTruck?: boolean;
}

export interface FipeYearOption {
  code: string;
  name: string;
  year: number;
}

export interface FipeModelOption {
  code: string;
  name: string;
  baseModel: string;
  version: string;
  engine: string;
  fuel: string;
  traction: string;
  fipePrice: number;
  fipeCode: string;
  years?: number[];
}

/**
 * Catálogo FIPE local de alta disponibilidade com fallback + integração com API FIPE pública
 * (Parallelum FIPE API v2: https://fipe.parallelum.com.br/api/v2/cars/brands)
 */
export const FIPE_CATALOG_FALLBACK: Record<
  string,
  {
    code: string;
    name: string;
    models: FipeModelOption[];
  }
> = {
  toyota: {
    code: '56',
    name: 'Toyota',
    models: [
      {
        code: '56-1',
        name: 'Corolla XEi 2.0 Flex 16V Aut.',
        baseModel: 'Corolla',
        version: 'XEi 2.0 Flex 16V Aut.',
        engine: '2.0 16V Dynamic Force (177 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 100000,
        fipeCode: '002111-3',
      },
      {
        code: '56-2',
        name: 'Corolla Altis Hybrid 1.8 16V Flex Aut.',
        baseModel: 'Corolla',
        version: 'Altis Hybrid 1.8 16V Flex Aut.',
        engine: '1.8 Hybrid Synergy Drive (122 cv)',
        fuel: 'Híbrido / Flex',
        traction: '4x2 Dianteira',
        fipePrice: 146500,
        fipeCode: '002181-4',
      },
      {
        code: '56-3',
        name: 'Corolla Cross XRX 1.8 Hybrid Aut.',
        baseModel: 'Corolla Cross',
        version: 'XRX 1.8 Hybrid Aut.',
        engine: '1.8 Hybrid 16V (122 cv)',
        fuel: 'Híbrido / Flex',
        traction: '4x2 Dianteira',
        fipePrice: 162000,
        fipeCode: '002203-9',
      },
      {
        code: '56-4',
        name: 'Hilux SRX 2.8 TDI 4x4 Diesel Aut.',
        baseModel: 'Hilux',
        version: 'SRX 2.8 TDI 4x4 Diesel Aut.',
        engine: '2.8 Turbo Diesel 16V (204 cv)',
        fuel: 'Diesel',
        traction: '4x4 Integral com Reduzida',
        fipePrice: 278000,
        fipeCode: '002142-3',
      },
    ],
  },
  honda: {
    code: '25',
    name: 'Honda',
    models: [
      {
        code: '25-1',
        name: 'Civic Touring 1.5 Turbo 16V Aut.',
        baseModel: 'Civic',
        version: 'Touring 1.5 Turbo 16V Aut.',
        engine: '1.5 16V VTEC Turbo (173 cv)',
        fuel: 'Gasolina',
        traction: '4x2 Dianteira',
        fipePrice: 125000,
        fipeCode: '014093-7',
      },
      {
        code: '25-2',
        name: 'Civic EXL 2.0 FlexOne 16V Aut.',
        baseModel: 'Civic',
        version: 'EXL 2.0 FlexOne 16V Aut.',
        engine: '2.0 i-VTEC 16V (155 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 114000,
        fipeCode: '014091-0',
      },
      {
        code: '25-3',
        name: 'HR-V Touring 1.5 Turbo 16V Flex Aut.',
        baseModel: 'HR-V',
        version: 'Touring 1.5 Turbo 16V Flex Aut.',
        engine: '1.5 DI VTEC Turbo Flex (177 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 168900,
        fipeCode: '014110-0',
      },
    ],
  },
  volkswagen: {
    code: '59',
    name: 'Volkswagen',
    models: [
      {
        code: '59-1',
        name: 'T-Cross Highline 250 TSI 1.4 Flex 16V Aut.',
        baseModel: 'T-Cross',
        version: 'Highline 250 TSI 1.4 Flex 16V Aut.',
        engine: '1.4 250 TSI Turbo (150 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 132000,
        fipeCode: '005508-5',
      },
      {
        code: '59-2',
        name: 'T-Cross Comfortline 200 TSI 1.0 Flex Aut.',
        baseModel: 'T-Cross',
        version: 'Comfortline 200 TSI 1.0 Flex Aut.',
        engine: '1.0 200 TSI Turbo (128 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 118500,
        fipeCode: '005509-3',
      },
      {
        code: '59-3',
        name: 'Nivus Highline 1.0 200 TSI Flex Aut.',
        baseModel: 'Nivus',
        version: 'Highline 1.0 200 TSI Flex Aut.',
        engine: '1.0 200 TSI Turbo (128 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 121900,
        fipeCode: '005526-3',
      },
      {
        code: '59-4',
        name: 'Amarok Highline V6 3.0 TDI 4Motion Aut.',
        baseModel: 'Amarok',
        version: 'Highline V6 3.0 TDI 4Motion Aut.',
        engine: '3.0 V6 TDI Turbo Diesel (258 cv)',
        fuel: 'Diesel',
        traction: '4x4 Permanente 4Motion',
        fipePrice: 249000,
        fipeCode: '005483-6',
      },
    ],
  },
  hyundai: {
    code: '26',
    name: 'Hyundai',
    models: [
      {
        code: '26-1',
        name: 'HB20 Platinum Plus 1.0 TB Flex 12V Aut.',
        baseModel: 'HB20',
        version: 'Platinum Plus 1.0 TB Flex 12V Aut.',
        engine: '1.0 TGDI Turbo (120 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 75000,
        fipeCode: '015206-4',
      },
      {
        code: '26-2',
        name: 'Creta Ultimate 2.0 16V Flex Aut.',
        baseModel: 'Creta',
        version: 'Ultimate 2.0 16V Flex Aut.',
        engine: '2.0 Smartstream 16V (167 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 144000,
        fipeCode: '015201-3',
      },
    ],
  },
  jeep: {
    code: '29',
    name: 'Jeep',
    models: [
      {
        code: '29-1',
        name: 'Compass Longitude T270 1.3 TB 4x2 Flex Aut.',
        baseModel: 'Compass',
        version: 'Longitude T270 1.3 TB 4x2 Flex Aut.',
        engine: '1.3 Turbo T270 Flex (185 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 149500,
        fipeCode: '017071-2',
      },
      {
        code: '29-2',
        name: 'Compass Trailhawk TD350 2.0 4x4 Diesel Aut.',
        baseModel: 'Compass',
        version: 'Trailhawk TD350 2.0 4x4 Diesel Aut.',
        engine: '2.0 MultiJet II Turbo Diesel (170 cv)',
        fuel: 'Diesel',
        traction: '4x4 Active Drive Low',
        fipePrice: 189000,
        fipeCode: '017048-8',
      },
    ],
  },
  chevrolet: {
    code: '23',
    name: 'Chevrolet',
    models: [
      {
        code: '23-1',
        name: 'Tracker Premier 1.2 Turbo 12V Flex Aut.',
        baseModel: 'Tracker',
        version: 'Premier 1.2 Turbo 12V Flex Aut.',
        engine: '1.2 Ecotec Turbo (133 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 126000,
        fipeCode: '004525-0',
      },
      {
        code: '23-2',
        name: 'Onix Plus Premier 1.0 Turbo 12V Flex Aut.',
        baseModel: 'Onix Plus',
        version: 'Premier 1.0 Turbo 12V Flex Aut.',
        engine: '1.0 Ecotec Turbo (116 cv)',
        fuel: 'Flex',
        traction: '4x2 Dianteira',
        fipePrice: 89500,
        fipeCode: '004504-7',
      },
    ],
  },
};

/**
 * Extrai especificações técnicas (modelo base, versão, motorização, combustível e tração)
 * a partir de uma string de versão retornada pela API FIPE.
 */
export function parseFipeModelName(brandName: string, fullFipeName: string): FipeModelOption {
  const tokens = fullFipeName.trim().split(/\s+/);
  const baseModel = tokens[0] || fullFipeName;
  const version = tokens.slice(1).join(' ') || fullFipeName;

  const engineMatch = fullFipeName.match(/\b(\d\.\d(?:\s*(?:Turbo|TB|TSI|TDI|V6|V8|16V|12V|Hybrid))*)/i);
  const engine = engineMatch ? `${engineMatch[1].trim()}` : 'Motorização Original FIPE';

  let fuel = 'Flex';
  if (/diesel/i.test(fullFipeName)) fuel = 'Diesel';
  else if (/h[ií]brido|hybrid/i.test(fullFipeName)) fuel = 'Híbrido / Flex';
  else if (/el[eé]trico|ev/i.test(fullFipeName)) fuel = 'Elétrico';
  else if (/gasolina/i.test(fullFipeName) && !/flex/i.test(fullFipeName)) fuel = 'Gasolina';

  let traction = '4x2 Dianteira';
  if (/4x4|4motion|awd|quattro|integral/i.test(fullFipeName)) {
    traction = '4x4 Integral';
  } else if (/traseira|rwd/i.test(fullFipeName)) {
    traction = '4x2 Traseira';
  }

  return {
    code: `${brandName.toLowerCase()}-${fullFipeName}`,
    name: fullFipeName,
    baseModel,
    version,
    engine,
    fuel,
    traction,
    fipePrice: 100000,
    fipeCode: 'FIPE-REF',
  };
}

function resolveBrandEntry(brandName: string, brandCode?: string) {
  if (brandCode) {
    const byCode = FIPE_MARCAS.find((b) => b.codigo === brandCode);
    if (byCode) return byCode;
  }
  const normalized = brandName.trim().toLowerCase();
  const exact = FIPE_MARCAS.find((b) => b.nome.toLowerCase() === normalized);
  if (exact) return exact;
  return FIPE_MARCAS.find((b) => b.nome.toLowerCase().includes(normalized));
}

export type FipeVehicleType = 'cars' | 'motorcycles' | 'trucks';

const FIPE_MOTO_BRANDS_FALLBACK: FipeBrandOption[] = [
  { code: '80', name: 'Honda' },
  { code: '101', name: 'Yamaha' },
  { code: '99', name: 'Suzuki' },
  { code: '85', name: 'Kawasaki' },
  { code: '67', name: 'BMW' },
  { code: '100', name: 'Triumph' },
  { code: '77', name: 'Harley-Davidson' },
  { code: '74', name: 'Ducati' },
  { code: '198', name: 'Royal Enfield' },
  { code: '71', name: 'Dafra' },
  { code: '97', name: 'Shineray' },
  { code: '194', name: 'Haojue' },
  { code: '87', name: 'KTM' },
  { code: '246', name: 'Bajaj' },
  { code: '64', name: 'Aprilia' },
  { code: '176', name: 'Benelli' },
  { code: '193', name: 'Zontes' },
  { code: '205', name: 'CFMoto' },
];

export async function fetchFipeBrands(
  vehicleType: FipeVehicleType = 'cars'
): Promise<FipeBrandOption[]> {
  if (vehicleType === 'motorcycles') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://fipe.parallelum.com.br/api/v2/motorcycles/brands', {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const items: Array<{ code: string; name: string }> = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map((b) => ({ code: String(b.code), name: String(b.name) }));
        }
      }
    } catch {
      // fallback abaixo
    }
    return FIPE_MOTO_BRANDS_FALLBACK;
  }

  if (vehicleType === 'trucks') {
    return FIPE_MARCAS.filter((b) => b.isTruck).map((b) => ({
      code: b.codigo,
      name: b.nome,
      isTruck: true,
    }));
  }

  return FIPE_MARCAS.filter((b) => !b.isTruck).map((b) => ({
    code: b.codigo,
    name: b.nome,
    isTruck: false,
  }));
}

/**
 * Busca modelos da marca na API FIPE pública (Parallelum FIPE v2) com fallback instantâneo
 * para o catálogo FIPE integrado.
 */
export async function fetchFipeModelsForBrand(
  brandName: string,
  brandCode?: string,
  vehicleType: FipeVehicleType = 'cars'
): Promise<FipeModelOption[]> {
  const key = brandName.trim().toLowerCase();
  const fallbackEntry = vehicleType === 'cars' ? FIPE_CATALOG_FALLBACK[key] : undefined;
  const fallbackModels = fallbackEntry?.models ?? [];
  const brandEntry = vehicleType === 'motorcycles' ? undefined : resolveBrandEntry(brandName, brandCode);
  const resolvedCode = brandCode || brandEntry?.codigo || fallbackEntry?.code;
  const fipeVehicleType: FipeVehicleType =
    vehicleType === 'motorcycles'
      ? 'motorcycles'
      : vehicleType === 'trucks' || brandEntry?.isTruck
        ? 'trucks'
        : 'cars';

  if (!resolvedCode) {
    return fallbackModels;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${fipeVehicleType}/brands/${resolvedCode}/models`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return fallbackModels;
    const apiModels: Array<{ code: string; name: string }> = await res.json();
    if (!Array.isArray(apiModels) || apiModels.length === 0) return fallbackModels;

    const parsedFromApi = apiModels.map((item) => {
      const existing = fallbackModels.find(
        (m) => m.name.toLowerCase() === item.name.toLowerCase()
      );
      if (existing) {
        return { ...existing, code: String(item.code) };
      }
      const parsed = parseFipeModelName(brandName, item.name);
      return {
        ...parsed,
        fipePrice: 0,
        code: String(item.code),
      };
    });

    // Mantém os modelos curados no topo (caso não tenham vindo idênticos) + todos os modelos da API FIPE
    const mergedMap = new Map<string, FipeModelOption>();
    for (const m of [...parsedFromApi, ...fallbackModels]) {
      if (!mergedMap.has(m.name)) mergedMap.set(m.name, m);
    }
    return Array.from(mergedMap.values());
  } catch {
    return fallbackModels;
  }
}

export function getFipeBrands(): FipeBrandOption[] {
  return FIPE_MARCAS.map((b) => ({
    code: b.codigo,
    name: b.isTruck ? `${b.nome} (Caminhões/Ônibus)` : b.nome,
    isTruck: b.isTruck,
  }));
}

const DEFAULT_MANUFACTURE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export async function fetchFipeYearsForModel(
  brandName: string,
  modelCode: string,
  brandCode?: string,
  vehicleType: FipeVehicleType = 'cars'
): Promise<{ years: number[]; yearOptions: FipeYearOption[] }> {
  const key = brandName.trim().toLowerCase();
  const fallbackEntry = vehicleType === 'cars' ? FIPE_CATALOG_FALLBACK[key] : undefined;
  const brandEntry = vehicleType === 'motorcycles' ? undefined : resolveBrandEntry(brandName, brandCode);
  const resolvedCode = brandCode || brandEntry?.codigo || fallbackEntry?.code;
  const fipeVehicleType: FipeVehicleType =
    vehicleType === 'motorcycles'
      ? 'motorcycles'
      : vehicleType === 'trucks' || brandEntry?.isTruck
        ? 'trucks'
        : 'cars';

  if (resolvedCode && !modelCode.includes('-')) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://fipe.parallelum.com.br/api/v2/${fipeVehicleType}/brands/${resolvedCode}/models/${encodeURIComponent(modelCode)}/years`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const items: Array<{ code: string; name: string }> = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const yearOptions: FipeYearOption[] = items
            .map((it) => {
              const rawYear = parseInt(String(it.code).split('-')[0], 10);
              const isZeroKm = rawYear === 32000 || /zero\s*km/i.test(String(it.name));
              const normalizedYear = isZeroKm ? new Date().getFullYear() : rawYear;
              return {
                code: String(it.code),
                name: isZeroKm ? `Zero KM (${normalizedYear})` : String(it.name),
                year: Number.isNaN(normalizedYear) ? new Date().getFullYear() : normalizedYear,
              };
            })
            .sort((a, b) => b.year - a.year);
          const years = Array.from(new Set(yearOptions.map((y) => y.year))).sort((a, b) => b - a);
          return { years, yearOptions };
        }
      }
    } catch {
      // fallback abaixo
    }
  }

  return {
    years: DEFAULT_MANUFACTURE_YEARS,
    yearOptions: DEFAULT_MANUFACTURE_YEARS.map((y) => ({
      code: `${y}-1`,
      name: `${y}`,
      year: y,
    })),
  };
}

export async function fetchFipePriceForYear(
  brandName: string,
  modelCode: string,
  yearCode: string,
  brandCode?: string,
  vehicleType: FipeVehicleType = 'cars'
): Promise<{
  price: number;
  fipeCode?: string;
  referenceMonth?: string;
  fuel?: string;
} | null> {
  const brandEntry = vehicleType === 'motorcycles' ? undefined : resolveBrandEntry(brandName, brandCode);
  const resolvedCode = brandCode || brandEntry?.codigo;
  const fipeVehicleType: FipeVehicleType =
    vehicleType === 'motorcycles'
      ? 'motorcycles'
      : vehicleType === 'trucks' || brandEntry?.isTruck
        ? 'trucks'
        : 'cars';
  if (!resolvedCode || modelCode.includes('-')) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${fipeVehicleType}/brands/${resolvedCode}/models/${encodeURIComponent(modelCode)}/years/${encodeURIComponent(yearCode)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const priceStr = String(data?.price ?? '');
    const numeric = Number(priceStr.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!numeric || Number.isNaN(numeric)) return null;
    return {
      price: Math.round(numeric),
      fipeCode: data?.codeFipe ? String(data.codeFipe) : undefined,
      referenceMonth: data?.referenceMonth ? String(data.referenceMonth) : undefined,
      fuel: data?.fuel ? String(data.fuel) : undefined,
    };
  } catch {
    return null;
  }
}
