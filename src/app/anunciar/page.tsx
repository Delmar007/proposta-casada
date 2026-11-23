'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Car, Building2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { DealTypeOption } from '@/lib/domain/types';
import type { FipeBrandOption, FipeModelOption } from '@/lib/fipe/fipe-service';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { TradeInPhotoUploader, UploadedPhotoItem } from '@/components/TradeInPhotoUploader';
import { BRAZIL_STATES, getCitiesByUF } from '@/lib/geo/brazil-locations';

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

const DEAL_TYPE_OPTIONS: Array<{ value: DealTypeOption; label: string }> = [
  { value: 'no_dinheiro', label: 'No dinheiro' },
  { value: 'menor_valor', label: 'Aceita carro de menor valor' },
  { value: 'maior_valor', label: 'Aceita carro de maior valor' },
  { value: 'troca_na_orelha', label: 'Aceita troca na orelha' },
];

export default function AnunciarPage() {
  const router = useRouter();
  const { userId } = useActiveUser();

  const [category, setCategory] = useState<string>('Carros');
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

  // Campos de Veículos Móveis + API FIPE
  const [fipeBrands, setFipeBrands] = useState<FipeBrandOption[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModelOption[]>([]);
  const [fipeYears, setFipeYears] = useState<number[]>([]);
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModelCode, setSelectedFipeModelCode] = useState('');
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

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

  useEffect(() => {
    fetch('/api/fipe')
      .then((r) => r.json())
      .then((d) => setFipeBrands(d.brands ?? []))
      .catch(() => {});
  }, []);

  const handleFipeBrandChange = async (brandName: string) => {
    setSelectedFipeBrand(brandName);
    setSelectedFipeModelCode('');
    setFipeYears([]);
    setManufactureYear('');
    if (!brandName) {
      setFipeModels([]);
      return;
    }
    setBrand(brandName);
    setLoadingFipe(true);
    try {
      const res = await fetch(`/api/fipe?brand=${encodeURIComponent(brandName)}`);
      const data = await res.json();
      setFipeModels(data.models ?? []);
    } finally {
      setLoadingFipe(false);
    }
  };

  const handleFipeModelChange = async (modelCode: string) => {
    setSelectedFipeModelCode(modelCode);
    const found = fipeModels.find((m) => m.code === modelCode);
    if (!found) {
      setFipeYears([]);
      return;
    }
    setModel(found.baseModel);
    setVersion(found.version);
    setEngine(found.engine);
    setFuel(found.fuel);
    setTraction(found.traction);
    setFipePrice(String(found.fipePrice));

    setLoadingYears(true);
    try {
      const res = await fetch(
        `/api/fipe?brand=${encodeURIComponent(selectedFipeBrand)}&modelCode=${encodeURIComponent(modelCode)}`
      );
      const data = await res.json();
      const years: number[] = Array.isArray(data.years) ? data.years : [];
      setFipeYears(years);
      if (years.length > 0) {
        setManufactureYear(String(years[0]));
        setModelYear(String(years[0]));
      }
    } finally {
      setLoadingYears(false);
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
    setCategory(nextCat);
    if ((PROPERTY_CATEGORIES as readonly string[]).includes(nextCat)) {
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
            fipePrice: Number(fipePrice) || Number(askingPrice),
            askingPrice: Number(askingPrice) || Number(fipePrice),
            minConfidentialPrice: minConfidentialPrice ? Number(minConfidentialPrice) : undefined,
            description,
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
            modelYear: Number(modelYear),
            mileage: Number(mileage),
            fuel,
            transmission,
            color,
            city,
            state: stateUF,
            fipePrice: Number(fipePrice) || Number(askingPrice),
            askingPrice: Number(askingPrice) || Number(fipePrice),
            minConfidentialPrice: minConfidentialPrice ? Number(minConfidentialPrice) : undefined,
            description,
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

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-uva-700"
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
              <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                Cadastrar Anúncio para Venda ou Permuta
              </h1>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-uva-50 px-3 py-1 text-xs font-semibold text-uva-800">
            <ShieldCheck className="h-4 w-4 text-uva-700" />
            Dados Pessoais Protegidos
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 1. Categorias */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              1. Categoria do Anúncio
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {ALL_CATEGORIES.map((cat) => {
                const selected = category === cat;
                const isPropCat = (PROPERTY_CATEGORIES as readonly string[]).includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
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
          </div>

          {/* 2. Tipo de Negócio */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              2. Tipo de Negócio Aceito
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DEAL_TYPE_OPTIONS.map((opt) => {
                const active = dealTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDealType(opt.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition ${
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
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-uva-800">
              3. {isProperty ? `Dados do Imóvel (${category})` : `Dados do Veículo (${category})`}
            </h2>

            {isProperty ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Tipo do Imóvel
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                  >
                    {(PROPERTY_SUBTYPES[category] ?? ['Imóvel']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Título / Referência do Imóvel
                  </label>
                  <input
                    required
                    value={propertyTitle}
                    onChange={(e) => setPropertyTitle(e.target.value)}
                    placeholder="Ex: Casa Condomínio Alphaville 3 suítes"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Área Total (m²)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalAreaM2}
                    onChange={(e) => setTotalAreaM2(e.target.value)}
                    placeholder="Ex: 250"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Área Construída (m²)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={builtAreaM2}
                    onChange={(e) => setBuiltAreaM2(e.target.value)}
                    placeholder="Ex: 180"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Quartos / Salas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="Ex: 3"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Banheiros
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="Ex: 2"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Vagas de Garagem
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    placeholder="Ex: 2"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Condomínio (R$/mês)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={condoFee}
                    onChange={(e) => setCondoFee(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    IPTU (R$/ano)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Avaliação de Referência (R$)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={fipePrice}
                    onChange={(e) => setFipePrice(e.target.value)}
                    placeholder="Ex: 500000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Consulta automática API Tabela FIPE: Marca -> Modelo/Versão/Motor/Combustível -> Anos da versão */}
                <div className="space-y-3 rounded-xl border border-logo-purple/25 bg-logo-purple-50/70 p-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-logo-purple" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-logo-purple">
                      API Tabela FIPE — Marca, Modelo, Versão, Motor, Combustível e Anos
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Marca (Tabela FIPE)
                      </label>
                      <select
                        value={selectedFipeBrand}
                        onChange={(e) => handleFipeBrandChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      >
                        <option value="">Selecione a marca...</option>
                        {fipeBrands.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Modelo, Versão, Motor e Combustível (FIPE)
                      </label>
                      <select
                        value={selectedFipeModelCode}
                        onChange={(e) => handleFipeModelChange(e.target.value)}
                        disabled={!selectedFipeBrand || loadingFipe}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
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

                <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Marca</label>
                  <input
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Toyota"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Modelo</label>
                  <input
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Corolla"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Versão</label>
                  <input
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Ex: XEi 2.0 Flex"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Ano Fabricação {loadingYears ? '(carregando...)' : ''}
                  </label>
                  {fipeYears.length > 0 ? (
                    <select
                      required
                      value={manufactureYear}
                      onChange={(e) => {
                        setManufactureYear(e.target.value);
                        if (!modelYear) setModelYear(e.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="">Selecione o ano da versão...</option>
                      {fipeYears.map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Ano Modelo
                  </label>
                  <input
                    type="number"
                    required
                    value={modelYear}
                    onChange={(e) => setModelYear(e.target.value)}
                    placeholder="Ex: 2023"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Quilometragem / Horas
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Ex: 35000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Combustível
                  </label>
                  <input
                    required
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Câmbio</label>
                  <input
                    required
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Motor / Potência
                  </label>
                  <input
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="Ex: 2.0 177 cv"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tração</label>
                  <input
                    value={traction}
                    onChange={(e) => setTraction(e.target.value)}
                    placeholder="Ex: 4x2"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Cor</label>
                  <input
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Prata"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Preço FIPE (R$)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={fipePrice}
                    onChange={(e) => setFipePrice(e.target.value)}
                    placeholder="Ex: 100000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
              </div>
            )}
          </div>

          {/* 4. Localização (Estado UF primeiro, depois Cidade) e Valores Confidenciais */}
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Estado (UF)</label>
              <select
                required
                value={stateUF}
                onChange={(e) => {
                  setStateUF(e.target.value);
                  setCity('');
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
              >
                <option value="">Selecione o estado...</option>
                {BRAZIL_STATES.map((st) => (
                  <option key={st.uf} value={st.uf}>
                    {st.uf} — {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Cidade</label>
              <select
                required
                value={city}
                disabled={!stateUF}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {stateUF ? 'Selecione a cidade...' : 'Escolha o Estado (UF) primeiro'}
                </option>
                {getCitiesByUF(stateUF).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Valor da pedida (R$)
              </label>
              <input
                type="number"
                required
                min={1}
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="Confidencial (não aparece)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
              />
              <span className="mt-0.5 block text-[10px] text-slate-400">
                Confidencial — não aparece no anúncio
              </span>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Valor mínimo aceito (R$)
              </label>
              <input
                type="number"
                required
                min={1}
                value={minConfidentialPrice}
                onChange={(e) => setMinConfidentialPrice(e.target.value)}
                placeholder="Confidencial (não aparece)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
              />
              <span className="mt-0.5 block text-[10px] text-slate-400">
                Confidencial — não aparece no anúncio
              </span>
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
                : 'Importe até 12 fotos (frente, traseira, laterais, interior, painel, motor, porta-malas, pneus e detalhes).'
            }
          />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                {isProperty ? 'Informações do imóvel' : 'Informações do veículo'} (até 200 caracteres
                no card)
              </label>
              <span className="text-[11px] text-slate-400">{description.length}/200</span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isProperty
                  ? 'Ex: Documentação 100% regularizada, piscina, área gourmet...'
                  : 'Ex: 4 pneus novos, lataria com polimento cristalizado...'
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-uva-700 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-logo-green px-6 py-3 text-sm font-extrabold text-logo-purple-950 shadow-xs transition hover:bg-logo-green-hover disabled:opacity-50"
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
