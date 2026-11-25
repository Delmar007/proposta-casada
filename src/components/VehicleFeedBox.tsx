'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Heart,
  Lock,
  Repeat,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ArrowLeft,
  RotateCw,
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

const DEAL_TYPE_LABELS: Record<string, string> = {
  no_dinheiro: 'No dinheiro',
  menor_valor: 'Aceita menor valor',
  maior_valor: 'Aceita maior valor',
  troca_na_orelha: 'Troca na orelha',
  imovel_menor_valor: 'Imóvel menor valor',
  imovel_maior_valor: 'Imóvel maior valor',
  imovel_mesmo_preco: 'Imóvel mesmo preço',
  carro_mais_dinheiro: 'Carro + dinheiro',
};

function formatDealTypesLabel(dealTypes?: PublicVehicle['dealTypes']): string {
  if (!dealTypes || dealTypes.length === 0) {
    return 'Dinheiro ou Permuta';
  }
  return dealTypes.map((d) => DEAL_TYPE_LABELS[d] ?? d).join(' • ');
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
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);
  const [showModalInfoTab, setShowModalInfoTab] = useState<boolean>(false);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const thumbsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showGalleryModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGalleryModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGalleryModal]);

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

  // Movimenta o carrossel de miniaturas (vertical no desktop, horizontal no mobile) e alterna a imagem ativa
  const handleCarouselStep = (direction: -1 | 1) => {
    const nextIdx = (activeImageIdx + direction + galleryImages.length) % galleryImages.length;
    setActiveImageIdx(nextIdx);
    if (thumbsContainerRef.current) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      thumbsContainerRef.current.scrollBy({
        top: isDesktop ? direction * 52 : 0,
        left: isDesktop ? 0 : direction * 88,
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

  const parseProposalReais = (raw: string): number => {
    const clean = raw.replace(/,00$/, '').replace(/\D/g, '');
    return clean ? Number(clean) : 0;
  };

  const handleProposalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setProposalAmount('');
      return;
    }
    setProposalAmount(`R$ ${Number(digits).toLocaleString('pt-BR')}`);
  };

  const handleProposalInputBlur = () => {
    const val = parseProposalReais(proposalAmount);
    if (val > 0) {
      setProposalAmount(formatBRL(val));
    }
  };

  const handleProposalInputFocus = () => {
    const val = parseProposalReais(proposalAmount);
    if (val > 0) {
      setProposalAmount(`R$ ${val.toLocaleString('pt-BR')}`);
    }
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setFeedback('Faça login com Google ou Facebook para salvar sua proposta.');
      openAuthModal();
      return;
    }
    const numericAmount = parseProposalReais(proposalAmount);
    if (!numericAmount || numericAmount < 1000) {
      setFeedback('Informe um valor válido (mínimo R$ 1.000).');
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
    <>
    <article
      className="mx-auto flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md md:h-[250px] md:max-w-[1024px] md:flex-row"
    >
      {/* =====================================================================
          PARTE 1 (ESQUERDA): Imagem ocupando 100% da lateral esquerda +
          Carrossel de miniaturas na vertical do lado direito da imagem
         ===================================================================== */}
      <div className="flex w-full shrink-0 flex-col bg-uva-900 md:h-full md:w-[376px] md:flex-row">
        {/* Imagem Principal Horizontal ocupando 100% da altura na lateral esquerda */}
        <div className="relative h-56 w-full overflow-hidden md:h-full md:flex-1">
          <img
            src={galleryImages[activeImageIdx] ?? vehicle.imageUrl}
            alt={`${vehicle.brand} ${specs.model} - Foto ${activeImageIdx + 1}`}
            onClick={() => setShowGalleryModal(true)}
            className="h-full w-full cursor-zoom-in object-cover object-center transition-all duration-300"
          />

          {/* LOGO DA MARCA (30x30) DENTRO DA IMAGEM NO CANTO ESQUERDO SUPERIOR */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
            <BrandLogo brand={vehicle.brand} size={30} className="shadow-md" />
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-uva-700 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs md:text-[10px]">
                <Lock className="h-3 w-3" />
                Acordo Confirmado
              </span>
            )}
          </div>

          {/* Botão Favoritar (apenas coração oco; ao clicar preenche em vermelho vivo) */}
          <button
            type="button"
            onClick={() => toggleFavorite(vehicle.id)}
            className="absolute top-2.5 right-2.5 flex items-center justify-center p-1 drop-shadow-md transition hover:scale-110"
            title={
              fav
                ? 'Nos seus Favoritos'
                : 'Salvar nos Favoritos'
            }
          >
            <Heart
              className={`h-6 w-6 transition ${
                fav ? 'fill-red-600 text-red-600' : 'text-white hover:text-red-500'
              }`}
            />
          </button>

          {/* Tipo de negociação, Lupa (+) e Localização sobre a foto */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
            <span className="max-w-[52%] truncate rounded-md bg-uva-900/90 px-2.5 py-0.5 text-[14px] font-bold text-white backdrop-blur-xs md:px-2 md:text-[12px]">
              {formatDealTypesLabel(vehicle.dealTypes)}
            </span>

            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="flex shrink-0 items-center justify-center p-0.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] transition hover:scale-110"
              title="Ampliar imagens"
              aria-label="Ampliar imagens"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] md:text-[11px]">
              <MapPin className="h-3.5 w-3.5 text-white md:h-3 md:w-3" />
              {vehicle.city}/{vehicle.state}
            </span>
          </div>
        </div>

        {/* Carrossel de Miniaturas: Vertical do lado direito da imagem no desktop */}
        <div className="relative flex h-[60px] w-full shrink-0 flex-row items-center gap-1 border-t border-uva-700 bg-uva-800 px-1.5 md:h-full md:w-[68px] md:flex-col md:border-t-0 md:border-l md:px-1 md:py-1">
          <button
            type="button"
            onClick={() => handleCarouselStep(-1)}
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md bg-uva-700 text-uva-100 transition hover:bg-uva-600 hover:text-white md:h-5 md:w-full"
            title="Imagem anterior"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="h-4 w-4 md:hidden" />
            <ChevronUp className="hidden h-3.5 w-3.5 md:block" />
          </button>

          <div
            ref={thumbsContainerRef}
            className="flex flex-1 flex-row items-center gap-1.5 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] md:w-full md:flex-col md:overflow-x-hidden md:overflow-y-auto md:py-0 [&::-webkit-scrollbar]:hidden"
          >
            {galleryImages.map((imgUrl, idx) => {
              const isSelected = idx === activeImageIdx;
              return (
                <button
                  key={`${vehicle.id}-thumb-${idx}`}
                  type="button"
                  onClick={() => handleSelectThumb(idx)}
                  className={`relative h-[44px] w-[68px] shrink-0 overflow-hidden rounded-md border-2 transition md:h-[40px] md:w-full ${
                    isSelected
                      ? 'border-uva-300 ring-1 ring-uva-300/60'
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
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md bg-uva-700 text-uva-100 transition hover:bg-uva-600 hover:text-white md:h-5 md:w-full"
            title="Próxima imagem"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="h-4 w-4 md:hidden" />
            <ChevronDown className="hidden h-3.5 w-3.5 md:block" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          PARTE 2 (MEIO): Botões compactos (altura e largura reduzidas) +
          Informações do veículo (até 200 caracteres)
         ===================================================================== */}
      <div className="flex w-full flex-col border-y border-slate-100 p-3 md:h-full md:w-[316px] md:border-y-0 md:border-x md:p-2">
        <div className="grid grid-cols-2 gap-2 md:h-full md:grid-rows-[repeat(4,minmax(0,1fr))_1.8fr] md:gap-1">
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
              className="flex min-w-0 flex-col justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 md:px-2 md:py-0.5"
            >
              <span className="text-[14px] font-bold uppercase leading-none tracking-wider text-slate-500 md:text-[11px]">
                {item.label}
              </span>
              <strong className="mt-0.5 truncate text-[17px] font-extrabold leading-none text-slate-900 md:text-[14px]">
                {item.value}
              </strong>
            </div>
          ))}

          <div className="col-span-2 flex min-h-0 min-w-0 flex-col justify-start overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:px-2 md:py-1">
            <span className="shrink-0 text-[14px] font-bold uppercase leading-none tracking-wider text-logo-purple md:text-[11px]">
              Aceito:
            </span>
            <p className="mt-0.5 min-h-0 flex-1 overflow-y-auto pr-1 break-words text-[15px] font-semibold leading-tight text-slate-800 md:text-[13px]">
              {vehicle.desiredTradeIn || formatDealTypesLabel(vehicle.dealTypes)}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PARTE 3 (DIREITA): Botão FIPE no topo, Grade 4x3 de Propostas no meio,
          Input à esquerda + Botão duplo (Salvar proposta | Propor permuta) embaixo
         ===================================================================== */}
      <div className="flex w-full flex-col justify-between gap-2.5 bg-slate-50/70 p-3 md:h-full md:w-[332px] md:gap-1.5 md:p-2">
        {/* Caixa superior: botão dividido em 2 colunas (PREÇO FIPE | valor) */}
        <button
          type="button"
          onClick={() => router.push(`/vehicles/${vehicle.id}`)}
          className="grid h-11 w-full shrink-0 grid-cols-2 items-center overflow-hidden rounded-xl bg-logo-green text-logo-purple shadow-xs transition hover:bg-logo-green-hover md:h-8"
        >
          <span className="flex h-full items-center justify-center border-r border-logo-purple/25 px-2 text-[13px] font-extrabold uppercase tracking-wider text-logo-purple md:text-[12px]">
            PREÇO FIPE
          </span>
          <span className="flex h-full items-center justify-center px-2 text-[18px] font-black tracking-tight text-logo-purple md:text-[13.5px]">
            {formatBRL(vehicle.fipePrice)}
          </span>
        </button>

        {isLocked ? (
          <div className="my-auto rounded-xl border border-uva-200 bg-uva-50 p-3 text-sm text-uva-900 md:text-xs">
            <p className="font-bold">Veículo com Acordo Confirmado</p>
            <p className="mt-1 text-xs md:text-[11px]">
              Novas propostas estão bloqueadas enquanto o encontro seguro está em andamento.
            </p>
          </div>
        ) : (
          <>
            {/* Caixa quadrada central: 4 linhas x 3 colunas (inicia vazia; maior proposta sempre em 1ª linha, 1ª coluna) */}
            <div className="grid grid-cols-3 grid-rows-4 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 md:flex-1 md:gap-1 md:p-1">
              {Array.from({ length: 12 }, (_, idx) => {
                const item = proposals[idx];
                const isWinner = idx === 0 && Boolean(item);
                return (
                  <div
                    key={idx}
                    className={`flex min-h-[38px] items-center justify-center rounded-md border px-1 text-center text-xs font-bold transition md:min-h-0 md:text-[10px] ${
                      isWinner
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : item
                        ? 'border-logo-green/60 bg-logo-green/20 text-slate-900'
                        : 'border-dashed border-logo-green/50 bg-logo-green/20 text-logo-purple/40'
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
              <p className="truncate text-xs font-semibold text-red-600 md:text-[10px]">{feedback}</p>
            )}

            {/* Rodapé dividido em 2 colunas: esquerda Valor da proposta R$ | direita botão duplo em 2 linhas */}
            <form onSubmit={handleSaveProposal} className="grid shrink-0 grid-cols-2 items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                required
                value={proposalAmount}
                onChange={handleProposalInputChange}
                onBlur={handleProposalInputBlur}
                onFocus={handleProposalInputFocus}
                placeholder="Valor da proposta R$"
                aria-label="Valor da proposta R$"
                className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2.5 text-[16px] font-bold text-slate-900 placeholder:text-[13px] placeholder:font-medium placeholder:text-slate-400 focus:border-uva-700 focus:outline-none md:h-9 md:px-2 md:text-[14px]"
              />

              <div className="grid h-11 w-full grid-cols-2 overflow-hidden rounded-xl border border-logo-green-hover shadow-xs md:h-9">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-col items-center justify-center bg-logo-green px-1 text-center text-[13px] font-extrabold leading-[1.1] text-logo-purple-950 transition hover:bg-logo-green-hover disabled:opacity-50 md:text-[12px]"
                >
                  {submitting ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <span>Salvar</span>
                      <span>proposta</span>
                    </>
                  )}
                </button>
                <Link
                  href={`/vehicles/${vehicle.id}?modality=trade_in_plus_cash`}
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      openAuthModal();
                    }
                  }}
                  className="flex flex-col items-center justify-center border-l border-logo-green-hover/40 bg-white px-1 text-center text-[13px] font-bold leading-[1.1] text-logo-purple transition hover:bg-logo-purple-50 md:text-[12px]"
                >
                  <span>Propor</span>
                  <span>permuta</span>
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </article>

    {/* MODAL AMPLIADO DE IMAGENS — 1024 px, carrossel grande à direita, sem texto sobre as fotos, com botão Voltar */}
    {showGalleryModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs"
        onClick={() => setShowGalleryModal(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Visualizador de imagens do veículo"
      >
        <div
          className="flex h-auto max-h-[92vh] w-full max-w-[1024px] flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra superior apenas com botão Voltar */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setShowGalleryModal(false);
                setImageRotation(0);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-logo-green px-4 py-1.5 text-xs font-extrabold text-logo-purple-950 transition hover:bg-logo-green-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>

          {/* Conteúdo: Altura natural da foto horizontal (sem espaços em cima/embaixo) + Carrossel à direita */}
          <div className="flex min-h-0 flex-col landscape:flex-row md:flex-row">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
              <img
                src={galleryImages[activeImageIdx] ?? vehicle.imageUrl}
                alt={`Foto ${activeImageIdx + 1}`}
                style={{ transform: `rotate(${imageRotation}deg)` }}
                className={`block transition-transform duration-300 ${
                  imageRotation % 180 !== 0
                    ? 'max-h-[65vw] max-w-[65vh] object-contain md:max-h-[540px] md:max-w-[540px]'
                    : 'h-auto max-h-[78vh] w-full object-cover'
                }`}
              />

              {/* Pequeno ícone no canto esquerdo inferior para girar a imagem */}
              <button
                type="button"
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="absolute bottom-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md backdrop-blur-xs transition hover:bg-logo-green hover:text-logo-purple-950"
                title="Girar imagem"
                aria-label="Girar imagem"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[96px] w-full shrink-0 flex-row items-center gap-2 border-t border-white/10 bg-slate-900 p-2 landscape:h-auto landscape:max-h-[78vh] landscape:w-[120px] landscape:flex-col landscape:border-t-0 landscape:border-l md:h-auto md:max-h-[78vh] md:w-[152px] md:flex-col md:border-t-0 md:border-l">
              <button
                type="button"
                onClick={() => {
                  setImageRotation(0);
                  setActiveImageIdx(
                    (activeImageIdx - 1 + galleryImages.length) % galleryImages.length
                  );
                }}
                className="flex h-full w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 landscape:h-8 landscape:w-full md:h-8 md:w-full"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5 landscape:hidden md:hidden" />
                <ChevronUp className="hidden h-5 w-5 landscape:block md:block" />
              </button>

              <div className="flex flex-1 flex-row gap-2 overflow-x-auto [scrollbar-width:none] landscape:w-full landscape:flex-col landscape:overflow-x-hidden landscape:overflow-y-auto md:w-full md:flex-col md:overflow-x-hidden md:overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {galleryImages.map((imgUrl, idx) => {
                  const isSelected = idx === activeImageIdx;
                  return (
                    <button
                      key={`modal-thumb-${vehicle.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setImageRotation(0);
                        setActiveImageIdx(idx);
                      }}
                      className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition landscape:h-20 landscape:w-full md:h-24 md:w-full ${
                        isSelected
                          ? 'border-logo-green ring-2 ring-logo-green/50'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Miniatura ampliada ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setImageRotation(0);
                  setActiveImageIdx((activeImageIdx + 1) % galleryImages.length);
                }}
                className="flex h-full w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 landscape:h-8 landscape:w-full md:h-8 md:w-full"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5 landscape:hidden md:hidden" />
                <ChevronDown className="hidden h-5 w-5 landscape:block md:block" />
              </button>
            </div>
          </div>

          {/* Aba inferior abaixo da caixa grande — Informações e Acessórios do veículo */}
          <div className="shrink-0 border-t border-white/10 bg-slate-900">
            <button
              type="button"
              onClick={() => setShowModalInfoTab((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-white transition hover:bg-slate-800/80"
            >
              <span>
                {vehicle.listingType === 'property'
                  ? 'Informações do Imóvel'
                  : 'Acessórios & Informações do Veículo'}
              </span>
              {showModalInfoTab ? (
                <ChevronUp className="h-4 w-4 text-logo-green" />
              ) : (
                <ChevronDown className="h-4 w-4 text-logo-green" />
              )}
            </button>

            {showModalInfoTab && (
              <div className="max-h-36 overflow-y-auto border-t border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-slate-200">
                {vehicle.description && vehicle.description.includes('•') ? (
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.description.split('•').map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-logo-green/35 bg-logo-green/15 px-2 py-1 text-[11px] font-semibold text-logo-green-100"
                      >
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="leading-relaxed text-slate-200">
                    {vehicle.description || 'Sem informações adicionais cadastradas.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
