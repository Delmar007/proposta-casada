'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Heart,
  Lock,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PublicVehicle } from '@/lib/domain/types';
import { BrandLogo } from './BrandLogo';
import { useActiveUser } from './ActiveUserProvider';

interface VehicleFeedBoxProps {
  vehicle: PublicVehicle;
}

const DEFAULT_EXTRA_GALLERY = [
  'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1000&q=80',
];

function extractVehicleSpecs(vehicle: PublicVehicle) {
  const model = vehicle.model;
  // Versão curta (ex.: Altis, Touring, Highline)
  const version = vehicle.version.split(' ')[0] || vehicle.version;
  const fuel = vehicle.fuel;

  // Motorização (ex.: 1.6, 1.5, 1.4)
  const engineStr = vehicle.engine ?? '';
  const displacementMatch = engineStr.match(/\b(\d\.\d)\b/);
  const displacement = displacementMatch ? displacementMatch[1] : '1.6';

  // Potência (ex.: 122 cv, 173 cv, 150 cv)
  const powerMatch = engineStr.match(/(\d{2,3}\s*cv)/i);
  const power = powerMatch ? powerMatch[1].toLowerCase() : '122 cv';

  // Tração (ex.: 4x2, 4x4)
  const tractionStr = vehicle.traction ?? '4x2';
  const tractionMatch = tractionStr.match(/\b(4x2|4x4|AWD)\b/i);
  const traction = tractionMatch ? tractionMatch[1] : tractionStr.split(' ')[0] || '4x2';

  return {
    model,
    version,
    fuel,
    displacement,
    power,
    traction,
  };
}

export function VehicleFeedBox({ vehicle }: VehicleFeedBoxProps) {
  const router = useRouter();
  const { userId, isAuthenticated, openAuthModal, isFavorite, toggleFavorite } = useActiveUser();

  // Galeria de imagens para a foto principal + carrossel horizontal de miniaturas
  const galleryImages =
    vehicle.images && vehicle.images.length > 1
      ? vehicle.images
      : [vehicle.imageUrl, ...DEFAULT_EXTRA_GALLERY];

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const thumbsContainerRef = useRef<HTMLDivElement | null>(null);

  // Estado da área de propostas (Parte 3): grade 4x3 inicia vazia, maior proposta sempre na 1ª linha, 1ª coluna
  const [proposals, setProposals] = useState<Array<{ id: string; amount: number }>>([]);
  const [proposalAmount, setProposalAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  const specs = extractVehicleSpecs(vehicle);

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatCompactBRL = (v: number) =>
    v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    });

  const fav = isFavorite(vehicle.id);
  const isLocked = vehicle.status === 'negotiation_locked';

  // Movimenta o carrossel de miniaturas de um lado para o outro e alterna a imagem ativa
  const handleCarouselStep = (direction: -1 | 1) => {
    const nextIdx = (activeImageIdx + direction + galleryImages.length) % galleryImages.length;
    setActiveImageIdx(nextIdx);
    if (thumbsContainerRef.current) {
      thumbsContainerRef.current.scrollBy({
        left: direction * 88,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectThumb = (idx: number) => {
    setActiveImageIdx(idx);
    if (thumbsContainerRef.current) {
      const thumbEl = thumbsContainerRef.current.children[idx] as HTMLElement | undefined;
      thumbEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setFeedback('Faça login com Google ou Facebook para salvar sua proposta.');
      openAuthModal();
      return;
    }
    const numericAmount = Number(proposalAmount);
    if (!numericAmount || numericAmount <= 0) {
      setFeedback('Informe um valor válido.');
      return;
    }

    setFeedback('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/negotiations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          modality: 'cash_only',
          vehicleId: vehicle.id,
          cashAmount: numericAmount,
          messageText: `Proposta de ${formatBRL(numericAmount)} enviada pelo feed para ${vehicle.brand} ${specs.model}.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? 'Erro ao salvar proposta.');
        setSubmitting(false);
        return;
      }

      setProposals((prev) =>
        [...prev, { id: data.negotiation?.id ?? String(Date.now()), amount: numericAmount }]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 12)
      );
      setProposalAmount('');
      setSubmitting(false);
    } catch {
      setFeedback('Erro de conexão ao registrar proposta.');
      setSubmitting(false);
    }
  };

  return (
    <article
      className="mx-auto flex w-full max-w-[400px] aspect-[9/16] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md md:max-w-[1024px] md:aspect-auto md:h-[320px] md:flex-row"
    >
      {/* =====================================================================
          PARTE 1 (ESQUERDA): Foto Horizontal encostada no topo + Logo no canto esquerdo superior + Carrossel de Miniaturas embaixo
         ===================================================================== */}
      <div className="flex h-[36%] w-full shrink-0 flex-col bg-uva-900 md:h-full md:w-[360px]">
        {/* Imagem Principal Horizontal encostada na borda superior da caixa */}
        <div className="relative flex-1 w-full overflow-hidden">
          <img
            src={galleryImages[activeImageIdx] ?? vehicle.imageUrl}
            alt={`${vehicle.brand} ${specs.model} - Foto ${activeImageIdx + 1}`}
            className="h-full w-full object-cover object-center transition-all duration-300"
          />

          {/* LOGO DA MARCA (30x30) DENTRO DA IMAGEM NO CANTO ESQUERDO SUPERIOR */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
            <BrandLogo brand={vehicle.brand} size={30} className="shadow-md" />
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                <Lock className="h-3 w-3" />
                Acordo Confirmado
              </span>
            )}
          </div>

          {/* Botão Favoritar (Coração) no canto direito superior */}
          <button
            type="button"
            onClick={() => toggleFavorite(vehicle.id)}
            className={`absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-xs transition ${
              fav
                ? 'border-purple-300 bg-purple-600 text-white'
                : 'border-white/60 bg-uva-700/55 text-white hover:bg-uva-700/80'
            }`}
            title={
              fav
                ? 'Nos seus Favoritos (Central de Comunicação)'
                : 'Salvar nos Favoritos para negociar'
            }
          >
            <Heart className={`h-4 w-4 ${fav ? 'fill-white' : ''}`} />
          </button>

          {/* Ano e Localização sobre a foto horizontal */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="rounded-md bg-uva-700/85 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
              {vehicle.manufactureYear}/{vehicle.modelYear}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-800 backdrop-blur-xs">
              <MapPin className="h-3 w-3 text-slate-600" />
              {vehicle.city}/{vehicle.state}
            </span>
          </div>
        </div>

        {/* Faixa Inferior: Carrossel Horizontal de Miniaturas que movimenta de um lado para o outro */}
        <div className="relative flex h-[64px] w-full shrink-0 items-center gap-1 border-t border-uva-600 bg-uva-700 px-1.5">
          <button
            type="button"
            onClick={() => handleCarouselStep(-1)}
            className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md bg-uva-600 text-slate-200 transition hover:bg-slate-700 hover:text-white"
            title="Imagem anterior"
            aria-label="Mover carrossel para a esquerda"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={thumbsContainerRef}
            className="flex flex-1 items-center gap-1.5 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {galleryImages.map((imgUrl, idx) => {
              const isSelected = idx === activeImageIdx;
              return (
                <button
                  key={`${vehicle.id}-thumb-${idx}`}
                  type="button"
                  onClick={() => handleSelectThumb(idx)}
                  className={`relative h-[46px] w-[72px] shrink-0 overflow-hidden rounded-md border-2 transition ${
                    isSelected
                      ? 'border-purple-400 ring-1 ring-purple-400/50'
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                  title={`Ver foto ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Miniatura ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleCarouselStep(1)}
            className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md bg-uva-600 text-slate-200 transition hover:bg-slate-700 hover:text-white"
            title="Próxima imagem"
            aria-label="Mover carrossel para a direita"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          PARTE 2 (MEIO): 2 colunas x 4 linhas compactas (Modelo, Versão,
          Combustível, Motor, Potência, Tração, KM e Ano) + 1 linha inferior
          (col-span-2) para Informações do veículo (até 200 caracteres)
         ===================================================================== */}
      <div className="flex h-[32%] w-full flex-col border-y border-slate-100 p-2.5 md:h-full md:w-[332px] md:border-y-0 md:border-x">
        <div className="grid h-full grid-cols-2 grid-rows-[1fr_1fr_1fr_1fr_1.85fr] gap-1.5">
          {[
            { label: 'Modelo', value: specs.model },
            { label: 'Versão', value: specs.version },
            { label: 'Combustível', value: specs.fuel },
            { label: 'Motor', value: specs.displacement },
            { label: 'Potência', value: specs.power },
            { label: 'Tração', value: specs.traction },
            { label: 'KM', value: `${vehicle.mileage.toLocaleString('pt-BR')} km` },
            { label: 'Ano', value: `${vehicle.manufactureYear}/${vehicle.modelYear}` },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5"
            >
              <span className="text-[9px] font-bold uppercase leading-none tracking-wider text-slate-400">
                {item.label}
              </span>
              <strong className="mt-0.5 truncate text-xs font-extrabold leading-tight text-slate-900">
                {item.value}
              </strong>
            </div>
          ))}

          <div className="col-span-2 flex min-w-0 flex-col justify-start rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <span className="text-[9px] font-bold uppercase leading-none tracking-wider text-slate-400">
              Informações do veículo
            </span>
            <p className="mt-1 line-clamp-4 break-words text-[11px] font-medium leading-snug text-slate-700">
              {(vehicle.description || '4 pneus novos, lataria com polimento cristalizado.').slice(0, 200)}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PARTE 3 (DIREITA): Botão FIPE no topo, Grade 4x3 de Propostas no meio,
          Input à esquerda + Botão duplo (Salvar proposta | Propor permuta) embaixo
         ===================================================================== */}
      <div className="flex h-[32%] w-full flex-col justify-between gap-2 bg-slate-50/70 p-2.5 md:h-full md:w-[332px]">
        {/* Caixa superior: apenas valor FIPE dentro de um botão */}
        <button
          type="button"
          onClick={() => router.push(`/vehicles/${vehicle.id}`)}
          className="flex h-9 w-full shrink-0 items-center justify-center rounded-xl bg-uva-700 px-3 text-sm font-extrabold tracking-tight text-white shadow-xs transition hover:bg-uva-600"
        >
          {formatBRL(vehicle.fipePrice)} FIPE
        </button>

        {isLocked ? (
          <div className="my-auto rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
            <p className="font-bold">Veículo com Acordo Confirmado</p>
            <p className="mt-1 text-[11px]">
              Novas propostas estão bloqueadas enquanto o encontro seguro está em andamento.
            </p>
          </div>
        ) : (
          <>
            {/* Caixa quadrada central: 4 linhas x 3 colunas (inicia vazia; maior proposta sempre em 1ª linha, 1ª coluna) */}
            <div className="grid flex-1 grid-cols-3 grid-rows-4 gap-1 rounded-xl border border-slate-200 bg-white p-1.5">
              {Array.from({ length: 12 }, (_, idx) => {
                const item = proposals[idx];
                const isWinner = idx === 0 && Boolean(item);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center rounded-lg border px-1 text-center text-[11px] font-bold transition ${
                      isWinner
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : item
                        ? 'border-slate-200 bg-slate-50 text-slate-800'
                        : 'border-dashed border-slate-200 bg-slate-50/40 text-slate-300'
                    }`}
                    title={
                      isWinner
                        ? 'Maior proposta (vencedora atual)'
                        : item
                        ? `Proposta #${idx + 1}`
                        : 'Aguardando proposta'
                    }
                  >
                    {item ? formatCompactBRL(item.amount) : ''}
                  </div>
                );
              })}
            </div>

            {feedback && (
              <p className="truncate text-[10px] font-semibold text-red-600">{feedback}</p>
            )}

            {/* Rodapé: Lado esquerdo valor da proposta | Lado direito botão duplo */}
            <form onSubmit={handleSaveProposal} className="flex shrink-0 items-center gap-1.5">
              <input
                type="number"
                required
                min={1000}
                value={proposalAmount}
                onChange={(e) => setProposalAmount(e.target.value)}
                placeholder="Valor R$"
                aria-label="Valor da proposta"
                className="h-9 w-[112px] shrink-0 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-uva-700 focus:outline-none"
              />

              <div className="grid h-9 flex-1 grid-cols-2 overflow-hidden rounded-xl border border-uva-700 shadow-xs">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center bg-uva-700 px-1.5 text-[11px] font-bold leading-tight text-white transition hover:bg-uva-600 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar proposta'}
                </button>
                <Link
                  href={`/vehicles/${vehicle.id}?modality=trade_in_plus_cash`}
                  className="flex items-center justify-center gap-1 border-l border-uva-600 bg-white px-1.5 text-[11px] font-bold leading-tight text-uva-700 transition hover:bg-purple-50"
                >
                  <Repeat className="h-3 w-3 shrink-0" />
                  Propor permuta
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </article>
  );
}
