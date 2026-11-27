'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  Repeat,
  ShieldCheck,
  AlertTriangle,
  Send,
  Lock,
  Sparkles,
} from 'lucide-react';
import { PublicVehicle, NegotiationModality } from '@/lib/domain/types';
import type { FipeBrandOption, FipeModelOption, FipeYearOption } from '@/lib/fipe/fipe-service';
import { useActiveUser } from '@/components/ActiveUserProvider';
import {
  TradeInPhotoUploader,
  UploadedPhotoItem,
} from '@/components/TradeInPhotoUploader';
import { BRAZIL_STATES, getCitiesByUF } from '@/lib/geo/brazil-locations';

const TRANSMISSION_OPTIONS = [
  'Automático',
  'Manual',
  'CVT',
  'Automatizado',
  'Dupla Embreagem (DCT / DSG)',
  'Semi-automático',
  'Elétrico (Direto)',
];

const TRACTION_OPTIONS = [
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
];

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isAuthenticated, openAuthModal } = useActiveUser();

  const initialModality =
    searchParams.get('modality') === 'cash_only'
      ? 'cash_only'
      : 'trade_in_plus_cash';

  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [modality, setModality] = useState<NegotiationModality>(initialModality);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modalidade A: Somente em dinheiro
  const [cashOnlyAmount, setCashOnlyAmount] = useState('92000');
  const [cashOnlyMessage, setCashOnlyMessage] = useState('');

  // Consulta API FIPE para precificar o veículo da permuta
  const [fipeBrands, setFipeBrands] = useState<FipeBrandOption[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModelOption[]>([]);
  const [fipeYearOptions, setFipeYearOptions] = useState<FipeYearOption[]>([]);
  const [selectedFipeBrandCode, setSelectedFipeBrandCode] = useState('');
  const [selectedFipeBrandName, setSelectedFipeBrandName] = useState('');
  const [selectedFipeModelCode, setSelectedFipeModelCode] = useState('');
  const [selectedFipeYearCode, setSelectedFipeYearCode] = useState('');
  const [fipeReferencePrice, setFipeReferencePrice] = useState<number | null>(null);
  const [fipeReferenceCode, setFipeReferenceCode] = useState<string>('');
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  // Modalidade B: Permuta + dinheiro
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuel, setFuel] = useState('');
  const [transmission, setTransmission] = useState('Automático');
  const [traction, setTraction] = useState('4x2');
  const [ownerCount, setOwnerCount] = useState('1');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [cashComplement, setCashComplement] = useState('');
  const [ratingLata, setRatingLata] = useState('');
  const [ratingMotor, setRatingMotor] = useState('');
  const [ratingInterna, setRatingInterna] = useState('');
  const [ratingPneus, setRatingPneus] = useState('');
  const [tradeInMessage, setTradeInMessage] = useState('');
  const [photos, setPhotos] = useState<UploadedPhotoItem[]>([]);

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((d) => setVehicle(d.vehicle ?? null))
      .finally(() => setLoading(false));

    fetch('/api/fipe')
      .then((r) => r.json())
      .then((d) => setFipeBrands(d.brands ?? []))
      .catch(() => {});
  }, [params.id]);

  const handleFipeBrandChange = async (brandCode: string) => {
    setSelectedFipeBrandCode(brandCode);
    setSelectedFipeModelCode('');
    setSelectedFipeYearCode('');
    setFipeYearOptions([]);
    setFipeReferencePrice(null);
    setFipeReferenceCode('');
    setManufactureYear('');
    const brandObj = fipeBrands.find((b) => b.code === brandCode);
    if (!brandCode || !brandObj) {
      setSelectedFipeBrandName('');
      setFipeModels([]);
      return;
    }
    const cleanBrandName = brandObj.name.replace(/\s*\(Caminhões\/Ônibus\)$/i, '');
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
    const found = fipeModels.find((m) => m.code === modelCode);
    if (!found) {
      setFipeYearOptions([]);
      return;
    }
    setModel(found.baseModel);
    setVersion(found.version);
    setFuel(found.fuel);
    if (found.fipePrice > 0) {
      setFipeReferencePrice(found.fipePrice);
      setFipeReferenceCode(found.fipeCode);
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
        const priceRes = await fetch(
          `/api/fipe?brand=${encodeURIComponent(selectedFipeBrandName)}&brandCode=${encodeURIComponent(selectedFipeBrandCode)}&modelCode=${encodeURIComponent(modelCode)}&yearCode=${encodeURIComponent(first.code)}`
        );
        const priceJson = await priceRes.json();
        if (priceJson?.priceInfo?.price) {
          setFipeReferencePrice(priceJson.priceInfo.price);
          if (priceJson.priceInfo.fipeCode) {
            setFipeReferenceCode(priceJson.priceInfo.fipeCode);
          }
          if (priceJson.priceInfo.fuel) {
            setFuel(priceJson.priceInfo.fuel);
          }
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
    try {
      const priceRes = await fetch(
        `/api/fipe?brand=${encodeURIComponent(selectedFipeBrandName)}&brandCode=${encodeURIComponent(selectedFipeBrandCode)}&modelCode=${encodeURIComponent(selectedFipeModelCode)}&yearCode=${encodeURIComponent(yearCode)}`
      );
      const priceJson = await priceRes.json();
      if (priceJson?.priceInfo?.price) {
        setFipeReferencePrice(priceJson.priceInfo.price);
        if (priceJson.priceInfo.fipeCode) {
          setFipeReferenceCode(priceJson.priceInfo.fipeCode);
        }
        if (priceJson.priceInfo.fuel) {
          setFuel(priceJson.priceInfo.fuel);
        }
      }
    } catch {
      // mantém valor atual
    }
  };

  const totalTradeInOffer =
    (Number(declaredValue) || 0) + (Number(cashComplement) || 0);

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Cadastre-se ou entre com Google ou Facebook para enviar sua proposta.');
      openAuthModal();
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payload =
        modality === 'cash_only'
          ? {
              modality: 'cash_only',
              vehicleId: params.id,
              cashAmount: Number(cashOnlyAmount),
              messageText: cashOnlyMessage,
            }
          : {
              modality: 'trade_in_plus_cash',
              vehicleId: params.id,
              tradeIn: {
                brand,
                model,
                version,
                manufactureYear: Number(manufactureYear),
                modelYear: Number(manufactureYear) || new Date().getFullYear(),
                mileage: Number(mileage),
                fuel,
                transmission,
                color: `Tração ${traction}`,
                city: city || vehicle?.city || 'Não informada',
                state: stateUF || vehicle?.state || 'MS',
                declaredValue: Number(declaredValue) || fipeReferencePrice || 1,
              },
              cashComplement: Number(cashComplement),
              messageText: [
                `Nº de proprietário: ${ownerCount} • Avaliação do veículo (0 a 10): Lata ${ratingLata}/10 • Motor ${ratingMotor}/10 • Interna ${ratingInterna}/10 • Pneus ${ratingPneus}/10`,
                tradeInMessage.trim(),
              ]
                .filter(Boolean)
                .join('\n\n'),
              photos: photos.map((p) => ({
                dataUrl: p.dataUrl,
                slotLabel: p.slotLabel,
              })),
            };

      const res = await fetch('/api/negotiations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível enviar a proposta.');
        setSubmitting(false);
        return;
      }

      router.push(`/negociacoes/${data.negotiation.id}`);
    } catch {
      setError('Erro de comunicação ao enviar proposta.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando veículo...</div>;
  }

  if (!vehicle) {
    return <div className="p-8 text-center text-sm text-red-600">Veículo não encontrado.</div>;
  }

  const isLocked = vehicle.status === 'negotiation_locked';

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Dados do veículo anunciado */}
        <div className="space-y-4 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-64 w-full object-cover"
            />
            <div className="space-y-4 p-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-sm text-slate-500">{vehicle.version}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Referência FIPE
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatBRL(vehicle.fipePrice)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  O preço mínimo confidencial do proprietário não é exibido.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <span className="text-slate-400">Ano</span>
                  <p className="font-semibold text-slate-800">
                    {vehicle.manufactureYear}/{vehicle.modelYear}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <span className="text-slate-400">Quilometragem</span>
                  <p className="font-semibold text-slate-800">
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <span className="text-slate-400">Combustível / Câmbio</span>
                  <p className="font-semibold text-slate-800">
                    {vehicle.fuel} • {vehicle.transmission}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <span className="text-slate-400">Localização</span>
                  <p className="font-semibold text-slate-800">
                    {vehicle.city}/{vehicle.state}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600">{vehicle.description}</p>
            </div>
          </div>

          {/* Caixa de cálculo FIPE: Anunciado - Troca = Diferença em dinheiro */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-slate-600">
                  Preço FIPE do carro anunciado
                </span>
                <span className="font-extrabold text-slate-900">
                  {formatBRL(vehicle.fipePrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-slate-600">
                  Preço FIPE da troca
                </span>
                <span className="font-extrabold text-logo-purple">
                  {fipeReferencePrice !== null ? formatBRL(fipeReferencePrice) : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                <div>
                  <span className="block text-xs font-extrabold text-emerald-900">
                    Diferença em dinheiro
                  </span>
                  {fipeReferencePrice === null && (
                    <span className="text-[11px] text-emerald-700/80">
                      Selecione marca, modelo e ano da troca na FIPE
                    </span>
                  )}
                  {fipeReferencePrice !== null && vehicle.fipePrice - fipeReferencePrice < 0 && (
                    <span className="text-[11px] text-emerald-700/90">
                      Veículo da troca acima da FIPE do anunciado
                    </span>
                  )}
                </div>
                <span className="text-base font-black text-emerald-800">
                  {fipeReferencePrice !== null
                    ? formatBRL(vehicle.fipePrice - fipeReferencePrice)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Modalidades de Negociação */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Modalidades de Negociação
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Identidade Anônima
              </span>
            </div>

            {isLocked ? (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 text-sm text-purple-900">
                <p className="flex items-center gap-2 font-bold">
                  <Lock className="h-4 w-4" />
                  Negociação Encerrada para Novas Propostas
                </p>
                <p className="mt-1 text-xs">
                  Este veículo já possui um ACORDO CONFIRMADO e novas propostas estão temporariamente
                  suspensas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setModality('cash_only')}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                      modality === 'cash_only'
                        ? 'border-uva-700 bg-uva-700 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="leading-tight">
                      <p className="text-xs font-bold">A) Somente em dinheiro</p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          modality === 'cash_only' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Proposta direta à vista ou financiada sem veículo na troca.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModality('trade_in_plus_cash')}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                      modality === 'trade_in_plus_cash'
                        ? 'border-uva-700 bg-uva-700 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Repeat className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="leading-tight">
                      <p className="text-xs font-bold">B) Veículo na permuta + dinheiro</p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          modality === 'trade_in_plus_cash' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Ofereça seu veículo + complemento em dinheiro com até 6 fotos.
                      </p>
                    </div>
                  </button>
                </div>

                {modality === 'cash_only' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Valor da proposta em dinheiro (R$)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={cashOnlyAmount}
                        onChange={(e) => setCashOnlyAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-uva-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Mensagem explicando a proposta (enviada para moderação)
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={cashOnlyMessage}
                        onChange={(e) => setCashOnlyMessage(e.target.value)}
                        placeholder="Descreva sua proposta sem incluir telefone, WhatsApp, e-mail ou links..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-uva-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Consulta automática na API FIPE para precificar o veículo oferecido */}
                    <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-uva-700" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-uva-700">
                            Precificação Oficial via API FIPE
                          </h3>
                        </div>
                      </div>

                      {fipeReferencePrice !== null && (
                        <div className="w-full rounded-xl bg-uva-700 px-4 py-2.5 text-center text-[19px] font-bold text-white shadow-xs">
                          Tabela FIPE: {formatBRL(fipeReferencePrice)}
                          {fipeReferenceCode ? ` (Cód. ${fipeReferenceCode})` : ''}
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            Selecionar Marca (FIPE)
                          </label>
                          <select
                            value={selectedFipeBrandCode}
                            onChange={(e) => handleFipeBrandChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                          >
                            <option value="">Escolha a marca na Tabela FIPE...</option>
                            {fipeBrands.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            Selecionar Modelo / Versão (FIPE)
                          </label>
                          <select
                            value={selectedFipeModelCode}
                            onChange={(e) => handleFipeModelChange(e.target.value)}
                            disabled={!selectedFipeBrandCode || loadingFipe}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
                          >
                            <option value="">
                              {loadingFipe
                                ? 'Consultando API FIPE...'
                                : 'Escolha modelo e versão para precificar...'}
                            </option>
                            {fipeModels.map((m) => (
                              <option key={m.code} value={m.code}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Marca do veículo oferecido
                        </label>
                        <input
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Modelo
                        </label>
                        <input
                          required
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Versão
                        </label>
                        <input
                          required
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Ano de fabricação {loadingYears ? '(carregando...)' : ''}
                        </label>
                        {fipeYearOptions.length > 0 ? (
                          <select
                            required
                            value={selectedFipeYearCode}
                            onChange={(e) => handleFipeYearChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Kilometragem
                        </label>
                        <input
                          type="number"
                          required
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                            (selectedFipeBrandCode && selectedFipeModelCode) ||
                            (brand.trim() && model.trim())
                              ? 'border-logo-green bg-logo-green/20 font-semibold text-slate-900'
                              : 'border-slate-200 bg-white'
                          }`}
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
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Câmbio
                        </label>
                        <select
                          required
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        >
                          {TRANSMISSION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Tração
                        </label>
                        <select
                          required
                          value={traction}
                          onChange={(e) => setTraction(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        >
                          {TRACTION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Nº de proprietário
                        </label>
                        <select
                          required
                          value={ownerCount}
                          onChange={(e) => setOwnerCount(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                        >
                          {['1', '2', '3', '4', '5', '6', '7', '8', 'Não sabe'].map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Valor ofertado na diferença */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Valor ofertado na diferença
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={cashComplement}
                        onChange={(e) => setCashComplement(e.target.value)}
                        placeholder="Informe o valor em R$"
                        className="h-[42px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold focus:border-uva-700 focus:outline-none"
                      />
                    </div>

                    <TradeInPhotoUploader photos={photos} onChange={setPhotos} title="" hint="" />

                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-800">
                        Nota de 0 a 10 para o veículo oferecido
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: 'Lata', value: ratingLata, setter: setRatingLata },
                          { label: 'Motor', value: ratingMotor, setter: setRatingMotor },
                          { label: 'Interna', value: ratingInterna, setter: setRatingInterna },
                          { label: 'Pneus', value: ratingPneus, setter: setRatingPneus },
                        ].map((item) => (
                          <div key={item.label}>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              {item.label}
                            </label>
                            <select
                              required
                              value={item.value}
                              onChange={(e) => item.setter(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                            >
                              <option value=""></option>
                              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
                                <option key={n} value={String(n)}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        A aceitação inicial da proposta não significa aprovação definitiva do
                        veículo de permuta. A condição do automóvel deverá ser verificada
                        presencialmente.
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="max-w-md text-[11px] text-slate-500">
                    Para sua segurança, todas as mensagens passam por nossa equipe de moderação.
                    Seus dados pessoais não serão compartilhados com a outra parte durante a
                    negociação.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-uva-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-uva-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Enviando...' : 'Enviar para análise'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
