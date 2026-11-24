'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Car, Building2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { DealTypeOption } from '@/lib/domain/types';
import type { FipeBrandOption, FipeModelOption, FipeYearOption } from '@/lib/fipe/fipe-service';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { AuthGate } from '@/components/AuthGate';
import { TradeInPhotoUploader, UploadedPhotoItem } from '@/components/TradeInPhotoUploader';
import { BRAZIL_STATES, getCitiesByUF } from '@/lib/geo/brazil-locations';
import { CATEGORY_SUBCATEGORIES } from '@/lib/domain/categories';

const VEHICLE_CATEGORIES = [
  'Carros',
  'Motos',
  'Caminhões',
  'Ônibus/Vans',
  'Triciclos/Quadriciclos/UTVs',
  'Náutica',
  'Tratores/Rebocáveis',
] as const;

const PROPERTY_CATEGORIES = ['Residências', 'Comerciais', 'Rurais'] as const;

const ALL_CATEGORIES = [...VEHICLE_CATEGORIES, ...PROPERTY_CATEGORIES];

const PROPERTY_SUBTYPES: Record<string, string[]> = {
  Residências: [
    'Casa',
    'Casa Condomínio',
    'Apartamento',
    'Cobertura',
    'Sobrado',
    'Sobrado Condomínio',
    'Kitnet / Studio',
    'Terreno Residencial',
    'Terreno Condomínio',
    'Terreno Comercial',
  ],
  Comerciais: [
    'Sala Comercial',
    'Loja / Ponto Comercial',
    'Galpão / Depósito',
    'Prédio Comercial',
    'Hotel / Pousada',
    'Terreno Comercial',
  ],
  Rurais: ['Fazenda', 'Sítio', 'Chácara', 'Haras', 'Área Rural / Gleba'],
};

const VEHICLE_DEAL_TYPE_OPTIONS: Array<{ value: DealTypeOption; label: string }> = [
  { value: 'no_dinheiro', label: 'No dinheiro' },
  { value: 'menor_valor', label: 'Aceita carro de menor valor' },
  { value: 'maior_valor', label: 'Aceita carro de maior valor' },
  { value: 'troca_na_orelha', label: 'Aceita troca na orelha' },
];

const PROPERTY_DEAL_TYPE_OPTIONS: Array<{ value: DealTypeOption; label: string }> = [
  { value: 'no_dinheiro', label: 'No dinheiro' },
  { value: 'imovel_menor_valor', label: 'Aceita imóvel de menor valor' },
  { value: 'imovel_maior_valor', label: 'Aceita imóvel de maior valor' },
  { value: 'imovel_mesmo_preco', label: 'Aceita imóvel no mesmo preço' },
  { value: 'carro_mais_dinheiro', label: 'Aceita carro + parte em dinheiro' },
];

const VEHICLE_ACCESSORIES: string[] = [
  'Ar-condicionado',
  'Ar-condicionado digital',
  'Ar-condicionado dual zone',
  'Direção hidráulica',
  'Direção elétrica',
  'Vidros elétricos dianteiros',
  'Vidros elétricos nas 4 portas',
  'Travas elétricas',
  'Retrovisores elétricos',
  'Retrovisores rebatíveis',
  'Alarme',
  'Chave presencial (Keyless)',
  'Partida por botão (Start/Stop)',
  'Partida remota',
  'Central multimídia',
  'Apple CarPlay / Android Auto',
  'Bluetooth',
  'Entrada USB',
  'GPS integrado',
  'Carregador por indução',
  'Painel digital',
  'Head-Up Display',
  'Volante multifuncional',
  'Volante com regulagem de altura',
  'Volante em couro',
  'Paddle Shift (borboletas)',
  'Piloto automático',
  'Piloto automático adaptativo (ACC)',
  'Computador de bordo',
  'Bancos em couro',
  'Bancos com ajuste elétrico',
  'Bancos com aquecimento',
  'Bancos com ventilação',
  'Banco com ajuste de altura',
  'Encosto de braço central',
  'Teto solar',
  'Teto panorâmico',
  'Rodas de liga leve',
  'Faróis de LED',
  'Faróis de neblina',
  'DRL (Luz diurna em LED)',
  'Farol automático',
  'Sensor de chuva',
  'Sensor de estacionamento dianteiro',
  'Sensor de estacionamento traseiro',
  'Câmera de ré',
  'Câmera 360°',
  'Park Assist',
  'Freios ABS',
  'Airbags frontais',
  'Airbags laterais e de cortina',
  'Controle de tração e estabilidade',
  'Assistente de partida em rampa',
  'Alerta de ponto cego',
  'Frenagem autônoma de emergência',
  'Assistente de permanência em faixa',
  'ISOFIX',
  'Engate para reboque',
  'Rack de teto / Bagageiro',
  'Capota marítima / Protetor de caçamba',
];

export default function AnunciarPage() {
  const router = useRouter();
  const { userId, isAuthenticated } = useActiveUser();

  const [category, setCategory] = useState<string>('Carros');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [openSubcategoryMenu, setOpenSubcategoryMenu] = useState<boolean>(false);
  const [dealTypes, setDealTypes] = useState<DealTypeOption[]>(['no_dinheiro']);
  const [photos, setPhotos] = useState<UploadedPhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Campos comuns
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [fipePrice, setFipePrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [minConfidentialPrice, setMinConfidentialPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  const toggleAccessory = (item: string) => {
    setSelectedAccessories((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  // Campos de Veículos Móveis + API FIPE
  const [fipeBrands, setFipeBrands] = useState<FipeBrandOption[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModelOption[]>([]);
  const [fipeYearOptions, setFipeYearOptions] = useState<FipeYearOption[]>([]);
  const [selectedFipeBrandCode, setSelectedFipeBrandCode] = useState('');
  const [selectedFipeBrandName, setSelectedFipeBrandName] = useState('');
  const [selectedFipeModelCode, setSelectedFipeModelCode] = useState('');
  const [selectedFipeYearCode, setSelectedFipeYearCode] = useState('');
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingFipePrice, setLoadingFipePrice] = useState(false);
  const [fipeOfficialMeta, setFipeOfficialMeta] = useState<{
    fipeCode?: string;
    referenceMonth?: string;
  } | null>(null);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuel, setFuel] = useState('');
  const [transmission, setTransmission] = useState('Automático');
  const [engine, setEngine] = useState('');
  const [traction, setTraction] = useState('4x2');
  const [color, setColor] = useState('');

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const parseReaisValue = (raw: string): number => {
    const clean = raw.replace(/,00$/, '').replace(/\D/g, '');
    return clean ? Number(clean) : 0;
  };

  const handleReaisChange = (raw: string, setter: (v: string) => void) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setter('');
      return;
    }
    setter(`R$ ${Number(digits).toLocaleString('pt-BR')}`);
  };

  const handleReaisBlur = (raw: string, setter: (v: string) => void) => {
    const val = parseReaisValue(raw);
    if (val > 0) setter(formatBRL(val));
  };

  const handleReaisFocus = (raw: string, setter: (v: string) => void) => {
    const val = parseReaisValue(raw);
    if (val > 0) setter(`R$ ${val.toLocaleString('pt-BR')}`);
  };

  useEffect(() => {
    fetch('/api/fipe')
      .then((r) => r.json())
      .then((d) => setFipeBrands(d.brands ?? []))
      .catch(() => {});
  }, []);

  const handleFipeBrandChange = async (brandCode: string) => {
    setSelectedFipeBrandCode(brandCode);
    setSelectedFipeModelCode('');
    setSelectedFipeYearCode('');
    setFipeYearOptions([]);
    setFipeOfficialMeta(null);
    setManufactureYear('');
    if (!brandCode) {
      setSelectedFipeBrandName('');
      setFipeModels([]);
      return;
    }
    const foundBrand = fipeBrands.find((b) => b.code === brandCode);
    const cleanBrandName = (foundBrand?.name ?? '')
      .replace(/\s*\(Caminhões\/Ônibus\)/i, '')
      .trim();
    setSelectedFipeBrandName(cleanBrandName);
    setBrand(cleanBrandName);
    setLoadingFipe(true);
    try {
      const res = await fetch(
        `/api/fipe?brand=${encodeURIComponent(cleanBrandName)}&brandCode=${encodeURIComponent(brandCode)}`
      );
      const data = await res.json();
      setFipeModels(data.models ?? []);
    } finally {
      setLoadingFipe(false);
    }
  };

  const handleFipeModelChange = async (modelCode: string) => {
    setSelectedFipeModelCode(modelCode);
    setSelectedFipeYearCode('');
    setFipeOfficialMeta(null);
    const found = fipeModels.find((m) => m.code === modelCode);
    if (!found) {
      setFipeYearOptions([]);
      return;
    }
    setModel(found.baseModel);
    setVersion(found.version);
    setEngine(found.engine);
    setFuel(found.fuel);
    setTraction(found.traction);
    if (found.fipePrice > 0) {
      setFipePrice(formatBRL(found.fipePrice));
    }

    setLoadingYears(true);
    try {
      const res = await fetch(
        `/api/fipe?brand=${encodeURIComponent(selectedFipeBrandName)}&brandCode=${encodeURIComponent(selectedFipeBrandCode)}&modelCode=${encodeURIComponent(modelCode)}`
      );
      const data = await res.json();
      const opts: FipeYearOption[] = Array.isArray(data.yearOptions) ? data.yearOptions : [];
      setFipeYearOptions(opts);
      if (opts.length > 0) {
        const first = opts[0];
        setSelectedFipeYearCode(first.code);
        setManufactureYear(String(first.year));
        setModelYear(String(first.year));
        setLoadingFipePrice(true);
        try {
          const priceRes = await fetch(
            `/api/fipe?brand=${encodeURIComponent(selectedFipeBrandName)}&brandCode=${encodeURIComponent(selectedFipeBrandCode)}&modelCode=${encodeURIComponent(modelCode)}&yearCode=${encodeURIComponent(first.code)}`
          );
          const priceJson = await priceRes.json();
          if (priceJson?.priceInfo?.price) {
            setFipePrice(formatBRL(priceJson.priceInfo.price));
            if (priceJson.priceInfo.fuel) {
              setFuel(priceJson.priceInfo.fuel);
            }
            setFipeOfficialMeta({
              fipeCode: priceJson.priceInfo.fipeCode,
              referenceMonth: priceJson.priceInfo.referenceMonth,
            });
          }
        } finally {
          setLoadingFipePrice(false);
        }
      }
    } finally {
      setLoadingYears(false);
    }
  };

  const handleFipeYearChange = async (yearCode: string) => {
    setSelectedFipeYearCode(yearCode);
    const opt = fipeYearOptions.find((y) => y.code === yearCode);
    if (!opt) return;
    setManufactureYear(String(opt.year));
    setModelYear(String(opt.year));
    setLoadingFipePrice(true);
    try {
      const priceRes = await fetch(
        `/api/fipe?brand=${encodeURIComponent(selectedFipeBrandName)}&brandCode=${encodeURIComponent(selectedFipeBrandCode)}&modelCode=${encodeURIComponent(selectedFipeModelCode)}&yearCode=${encodeURIComponent(yearCode)}`
      );
      const priceJson = await priceRes.json();
      if (priceJson?.priceInfo?.price) {
        setFipePrice(formatBRL(priceJson.priceInfo.price));
        if (priceJson.priceInfo.fuel) {
          setFuel(priceJson.priceInfo.fuel);
        }
        setFipeOfficialMeta({
          fipeCode: priceJson.priceInfo.fipeCode,
          referenceMonth: priceJson.priceInfo.referenceMonth,
        });
      }
    } catch {
      // mantém valor atual
    } finally {
      setLoadingFipePrice(false);
    }
  };

  // Campos de Imóveis
  const [propertyType, setPropertyType] = useState('Casa');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [totalAreaM2, setTotalAreaM2] = useState('');
  const [builtAreaM2, setBuiltAreaM2] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [condoFee, setCondoFee] = useState('');
  const [iptu, setIptu] = useState('');

  const isProperty = (PROPERTY_CATEGORIES as readonly string[]).includes(category);

  const handleCategoryChange = (nextCat: string) => {
    const wasProp = (PROPERTY_CATEGORIES as readonly string[]).includes(category);
    const nextIsProp = (PROPERTY_CATEGORIES as readonly string[]).includes(nextCat);
    setCategory(nextCat);
    setSelectedSubcategory('');
    setOpenSubcategoryMenu((prev) => (category === nextCat ? !prev : true));
    if (wasProp !== nextIsProp) {
      setDealTypes(['no_dinheiro']);
    }
    if (nextIsProp) {
      const firstSub = PROPERTY_SUBTYPES[nextCat]?.[0] ?? 'Imóvel';
      setPropertyType(firstSub);
    }
  };

  const toggleDealType = (val: DealTypeOption) => {
    setDealTypes((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (dealTypes.length === 0) {
      setError('Selecione pelo menos um tipo de negócio.');
      return;
    }
    setSubmitting(true);

    try {
      const payload = isProperty
        ? {
            listingType: 'property',
            category,
            dealTypes,
            brand: propertyType,
            model: propertyTitle || propertyType,
            version: `${totalAreaM2 || 0} m² • ${category}`,
            manufactureYear: new Date().getFullYear(),
            modelYear: new Date().getFullYear(),
            mileage: Number(totalAreaM2) || 0,
            fuel: category,
            transmission: `${bedrooms || 0} qts`,
            color: `${parkingSpaces || 0} vagas`,
            city,
            state: stateUF,
            fipePrice: parseReaisValue(fipePrice) || parseReaisValue(askingPrice),
            askingPrice: parseReaisValue(askingPrice) || parseReaisValue(fipePrice),
            minConfidentialPrice: parseReaisValue(minConfidentialPrice) || undefined,
            description:
              selectedAccessories.length > 0
                ? selectedAccessories.join(' • ')
                : 'Veículo sem acessórios marcados',
            images: photos.map((p) => p.dataUrl),
            propertyType,
            totalAreaM2: Number(totalAreaM2) || undefined,
            builtAreaM2: Number(builtAreaM2) || undefined,
            bedrooms: Number(bedrooms) || undefined,
            bathrooms: Number(bathrooms) || undefined,
            parkingSpaces: Number(parkingSpaces) || undefined,
            condoFee: Number(condoFee) || undefined,
            iptu: Number(iptu) || undefined,
          }
        : {
            listingType: 'vehicle',
            category,
            dealTypes,
            brand,
            model,
            version,
            engine,
            traction,
            manufactureYear: Number(manufactureYear),
            modelYear: Number(manufactureYear) || new Date().getFullYear(),
            mileage: Number(mileage),
            fuel,
            transmission,
            color: 'Não informada',
            city,
            state: stateUF,
            fipePrice: parseReaisValue(fipePrice) || parseReaisValue(askingPrice),
            askingPrice: parseReaisValue(askingPrice) || parseReaisValue(fipePrice),
            minConfidentialPrice: parseReaisValue(minConfidentialPrice) || undefined,
            description:
              selectedAccessories.length > 0
                ? selectedAccessories.join(' • ')
                : 'Veículo sem acessórios marcados',
            images: photos.map((p) => p.dataUrl),
          };

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Não foi possível cadastrar o anúncio.');
        setSubmitting(false);
        return;
      }

      router.push(`/vehicles/${json.vehicle.id}`);
    } catch {
      setError('Erro de conexão ao salvar anúncio.');
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Faça login para cadastrar um anúncio"
        description="Visitantes podem navegar livremente pelo site. Para publicar veículos ou imóveis, entre com Google ou Facebook."
      >
        <></>
      </AuthGate>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-uva-700 sm:text-[15px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao feed
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-uva-700 text-white">
              {isProperty ? <Building2 className="h-5 w-5" /> : <Car className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Cadastrar Anúncio para Venda ou Permuta
              </h1>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-uva-50 px-3 py-1 text-sm font-semibold text-uva-800">
            <ShieldCheck className="h-4 w-4 text-uva-700" />
            Dados Pessoais Protegidos
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 1. Categorias + Menu vertical de subcategorias abaixo */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-extrabold uppercase tracking-wider sm:text-[15px] text-slate-700">
                1. Categoria do Anúncio
              </label>
              <button
                type="button"
                onClick={() => setOpenSubcategoryMenu((v) => !v)}
                className="rounded-full bg-logo-purple-50 px-3 py-1 text-xs font-bold text-logo-purple hover:bg-logo-purple-100"
              >
                {selectedSubcategory
                  ? `Subcategoria: ${category} → ${selectedSubcategory}`
                  : `Subcategoria de ${category}: Selecione`}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {ALL_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const isPropCat = (PROPERTY_CATEGORIES as readonly string[]).includes(cat);
                const isLongLabel = cat === 'Triciclos/Quadriciclos/UTVs';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`rounded-xl border py-2.5 font-bold transition ${
                      isLongLabel
                        ? 'px-1.5 text-[11px] sm:text-[12px]'
                        : 'px-3 text-sm sm:text-[15px]'
                    } ${
                      isPropCat
                        ? selected
                          ? 'border-logo-purple-950 bg-logo-purple text-white ring-2 ring-logo-green shadow-sm'
                          : 'border-logo-purple bg-logo-purple/90 text-white hover:bg-logo-purple-light'
                        : selected
                        ? 'border-logo-green-hover bg-logo-green text-logo-purple-950 ring-2 ring-logo-purple shadow-sm'
                        : 'border-logo-green-hover/60 bg-logo-green/85 text-logo-purple-950 hover:bg-logo-green'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Menu Vertical de Subcategorias embaixo de Categorias */}
            {openSubcategoryMenu && CATEGORY_SUBCATEGORIES[category] && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-sm font-extrabold uppercase tracking-wider sm:text-[15px] text-logo-purple">
                    Subcategorias de {category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSubcategoryMenu(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-logo-purple"
                  >
                    Fechar
                  </button>
                </div>
                <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {CATEGORY_SUBCATEGORIES[category].map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <li key={sub}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubcategory(sub);
                            if (isProperty) {
                              setPropertyType(sub);
                            }
                            setOpenSubcategoryMenu(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[15px] font-semibold transition ${
                            isSubSelected
                              ? 'bg-logo-purple-50 text-logo-purple'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-logo-purple'
                          }`}
                        >
                          <span>{sub}</span>
                          {isSubSelected && <Check className="h-4 w-4 text-logo-purple" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* 2. Tipo de Negócio */}
          <div className="space-y-2">
            <label className="block text-sm font-extrabold uppercase tracking-wider sm:text-[15px] text-slate-700">
              2. Tipo de Negócio Aceito
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {(isProperty ? PROPERTY_DEAL_TYPE_OPTIONS : VEHICLE_DEAL_TYPE_OPTIONS).map((opt) => {
                const active = dealTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDealType(opt.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold sm:text-[15px] transition ${
                      active
                        ? 'border-uva-700 bg-uva-50 text-uva-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active
                          ? 'border-uva-700 bg-uva-700 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Dados Específicos (Veículo Móvel vs Imóvel) */}
          <div className="space-y-4 rounded-2xl border border-logo-purple/25 bg-logo-purple/20 p-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider sm:text-[15px] text-uva-800">
              3. {isProperty ? `Dados do Imóvel (${category})` : `Dados do Veículo (${category})`}
            </h2>

            {isProperty ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Tipo do Imóvel
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-semibold"
                  >
                    {(PROPERTY_SUBTYPES[category] ?? ['Imóvel']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Título / Referência do Imóvel
                  </label>
                  <input
                    required
                    value={propertyTitle}
                    onChange={(e) => setPropertyTitle(e.target.value)}
                    placeholder="Ex: Casa Condomínio Alphaville 3 suítes"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Área Total (m²)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalAreaM2}
                    onChange={(e) => setTotalAreaM2(e.target.value)}
                    placeholder="Ex: 250"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Área Construída (m²)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={builtAreaM2}
                    onChange={(e) => setBuiltAreaM2(e.target.value)}
                    placeholder="Ex: 180"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Quartos / Salas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="Ex: 3"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Banheiros
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="Ex: 2"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Vagas de Garagem
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    placeholder="Ex: 2"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Condomínio (R$/mês)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={condoFee}
                    onChange={(e) => setCondoFee(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    IPTU (R$/ano)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Avaliação de Referência (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={fipePrice}
                    onChange={(e) => handleReaisChange(e.target.value, setFipePrice)}
                    onBlur={() => handleReaisBlur(fipePrice, setFipePrice)}
                    onFocus={() => handleReaisFocus(fipePrice, setFipePrice)}
                    placeholder="R$ 500.000,00"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Consulta automática API Tabela FIPE: Marca -> Modelo/Versão/Motor/Combustível -> Anos da versão */}
                <div className="space-y-3 rounded-xl border border-logo-green-hover bg-logo-green p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-logo-purple" />
                      <span className="text-sm font-extrabold uppercase tracking-wider sm:text-[15px] text-logo-purple">
                        API Tabela FIPE
                        <span className="hidden sm:inline"> — Marca, Modelo, Versão, Motor, Combustível e Anos</span>
                      </span>
                    </div>
                    {fipePrice && (
                      <span className="rounded-full bg-uva-700 px-3 py-1 text-xs font-bold text-white">
                        Tabela FIPE: {fipePrice}
                        {fipeOfficialMeta?.fipeCode ? ` (Cód. ${fipeOfficialMeta.fipeCode})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    <div>
                      <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                        Marca<span className="hidden sm:inline"> (Tabela FIPE — {fipeBrands.length} marcas)</span>
                      </label>
                      <select
                        value={selectedFipeBrandCode}
                        onChange={(e) => handleFipeBrandChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-900 sm:text-[15px]"
                      >
                        <option value="">Selecione a marca...</option>
                        {fipeBrands.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                        Modelo, Versão, Motor e Combustível (FIPE)
                      </label>
                      <select
                        value={selectedFipeModelCode}
                        onChange={(e) => handleFipeModelChange(e.target.value)}
                        disabled={!selectedFipeBrandCode || loadingFipe}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-900 sm:text-[15px] disabled:opacity-50"
                      >
                        <option value="">
                          {loadingFipe
                            ? 'Consultando API FIPE...'
                            : 'Selecione modelo, versão, motor e combustível...'}
                        </option>
                        {fipeModels.map((m) => (
                          <option key={m.code} value={m.code}>
                            {m.baseModel} {m.version} • {m.engine} • {m.fuel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Marca</label>
                  <input
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Toyota"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Modelo</label>
                  <input
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Corolla"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Versão</label>
                  <input
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Ex: XEi 2.0 Flex"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Ano Fabricação {loadingYears ? '(carregando...)' : ''}
                  </label>
                  {fipeYearOptions.length > 0 ? (
                    <select
                      required
                      value={selectedFipeYearCode}
                      onChange={(e) => handleFipeYearChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-semibold"
                    >
                      <option value="">Selecione o ano da versão...</option>
                      {fipeYearOptions.map((y) => (
                        <option key={y.code} value={y.code}>
                          {y.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      value={manufactureYear}
                      onChange={(e) => setManufactureYear(e.target.value)}
                      placeholder="Ex: 2022"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Quilometragem / Horas
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Ex: 35000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Combustível
                  </label>
                  <input
                    required
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Câmbio</label>
                  <select
                    required
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-medium text-slate-900"
                  >
                    {[
                      'Automático',
                      'Manual',
                      'CVT',
                      'Automatizado',
                      'Dupla Embreagem (DCT / DSG)',
                      'Semi-automático',
                      'Elétrico (Direto)',
                    ].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Motor / Potência
                  </label>
                  <input
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="Ex: 2.0 177 cv"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Tração</label>
                  <select
                    value={traction}
                    onChange={(e) => setTraction(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-medium text-slate-900"
                  >
                    {[
                      '4x2',
                      '4x4',
                      '6x2',
                      '6x4',
                      '6x6',
                      '8x2',
                      '8x4',
                      'AWD',
                      '4WD',
                      'Dianteira (FWD)',
                      'Traseira (RWD)',
                      ...(traction &&
                      ![
                        '4x2',
                        '4x4',
                        '6x2',
                        '6x4',
                        '6x6',
                        '8x2',
                        '8x4',
                        'AWD',
                        '4WD',
                        'Dianteira (FWD)',
                        'Traseira (RWD)',
                      ].includes(traction)
                        ? [traction]
                        : []),
                    ].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                    Preço FIPE (R$) {loadingFipePrice ? '(consultando...)' : ''}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={fipePrice}
                    onChange={(e) => handleReaisChange(e.target.value, setFipePrice)}
                    onBlur={() => handleReaisBlur(fipePrice, setFipePrice)}
                    onFocus={() => handleReaisFocus(fipePrice, setFipePrice)}
                    placeholder="R$ 278.000,00"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-[15px] font-bold"
                  />
                  {fipeOfficialMeta?.fipeCode && (
                    <p className="mt-1 text-xs font-semibold text-logo-purple">
                      FIPE Oficial • Cód. {fipeOfficialMeta.fipeCode}
                      {fipeOfficialMeta.referenceMonth
                        ? ` • ${fipeOfficialMeta.referenceMonth}`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>

          {/* 4. Localização (Estado UF primeiro, depois Cidade) e Valores Confidenciais */}
          <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-12 md:items-start">
            <div className="md:col-span-1">
              <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">UF</label>
              <select
                required
                value={stateUF}
                onChange={(e) => {
                  setStateUF(e.target.value);
                  setCity('');
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-base sm:text-[15px] font-semibold"
              >
                <option value="">UF</option>
                {BRAZIL_STATES.map((st) => (
                  <option key={st.uf} value={st.uf}>
                    {st.uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">Cidade</label>
              <select
                required
                value={city}
                disabled={!stateUF}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-base sm:text-[15px] font-semibold disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {stateUF ? 'Cidade...' : 'UF primeiro'}
                </option>
                {getCitiesByUF(stateUF).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                Valor Pedido R$
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={askingPrice}
                onChange={(e) => handleReaisChange(e.target.value, setAskingPrice)}
                onBlur={() => handleReaisBlur(askingPrice, setAskingPrice)}
                onFocus={() => handleReaisFocus(askingPrice, setAskingPrice)}
                placeholder="R$ 0,00"
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-base sm:text-[15px] font-bold"
              />
              <span className="mt-0.5 block text-xs text-slate-500">
                Confidencial — não aparece no anúncio
              </span>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-[15px] font-semibold text-slate-800">
                Valor mínimo aceito (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={minConfidentialPrice}
                onChange={(e) => handleReaisChange(e.target.value, setMinConfidentialPrice)}
                onBlur={() => handleReaisBlur(minConfidentialPrice, setMinConfidentialPrice)}
                onFocus={() => handleReaisFocus(minConfidentialPrice, setMinConfidentialPrice)}
                placeholder="R$ 0,00 (confidencial)"
                className="w-full rounded-lg border border-logo-green/60 bg-logo-green/20 px-3 py-2.5 text-base sm:text-[15px] font-bold text-slate-900"
              />
              <span className="mt-0.5 block text-xs text-slate-500">
                Confidencial — não aparece no anúncio
              </span>
            </div>
            <div className="md:col-span-4 md:pt-5">
              <div className="flex min-h-[40px] items-center rounded-xl border border-logo-green/60 bg-logo-green-50 px-3 py-2 text-[15px] font-semibold leading-snug text-logo-purple-950">
                Proposta igual ou maior que esse valor será enviada no seu WhatsApp.
              </div>
            </div>
          </div>

          {/* 5. Fotografias & Informações */}
          <TradeInPhotoUploader
            photos={photos}
            onChange={setPhotos}
            maxPhotos={isProperty ? 18 : 12}
            title={isProperty ? 'Fotografias do Imóvel' : 'Fotografias do Veículo'}
            hint={
              isProperty
                ? 'Importe até 18 fotos (fachada, sala, cozinha, quartos, banheiros, área externa, garagem e detalhes).'
                : ''
            }
          />

          {isProperty ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[15px] font-semibold text-slate-800">
                  Informações do imóvel (até 200 caracteres no card)
                </label>
                <span className="text-xs text-slate-500">{description.length}/200</span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Documentação 100% regularizada, piscina, área gourmet..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-[15px] focus:border-uva-700 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-logo-purple/25 bg-logo-purple/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[15px] font-bold text-slate-800">
                  Acessórios do Veículo ({selectedAccessories.length}/60 selecionados)
                </span>
                {selectedAccessories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAccessories([])}
                    className="text-xs font-semibold text-logo-purple hover:underline"
                  >
                    Limpar marcações
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {VEHICLE_ACCESSORIES.map((acc) => {
                  const checked = selectedAccessories.includes(acc);
                  return (
                    <label
                      key={acc}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-base sm:text-[15px] transition sm:text-[15px] ${
                        checked
                          ? 'border-logo-purple bg-uva-50 font-bold text-logo-purple'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAccessory(acc)}
                        className="h-3.5 w-3.5 shrink-0 accent-logo-purple"
                      />
                      <span className="leading-tight">{acc}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-logo-green px-6 py-3.5 text-[15px] font-extrabold sm:text-base text-logo-purple-950 shadow-xs transition hover:bg-logo-green-hover disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? 'Publicando anúncio...' : 'Publicar Anúncio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
