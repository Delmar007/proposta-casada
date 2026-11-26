'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  ArrowRight,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Move,
  Eye,
  EyeOff,
  RotateCcw,
  ZoomIn,
  MessageCircle,
  PauseCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Banknote,
} from 'lucide-react';
import type {
  Negotiation,
  TradeInOffer,
  TradeInVehicle,
  VehicleRecord,
} from '@/lib/domain/types';
import {
  BANNER_TRANSITION_LABELS,
  BannerItem,
  BannerTransitionType,
  loadStoredBanners,
  readBannerFileAsDataUrl,
  renderPositionedBannerToDataUrl,
  saveStoredBanners,
} from '@/lib/banners/banner-store';

type AdminTab =
  | 'aprovacao'
  | 'propostas'
  | 'banners'
  | 'reservado-1'
  | 'reservado-2'
  | 'reservado-3';

const ADMIN_BUTTONS: { id: AdminTab; label: string }[] = [
  { id: 'aprovacao', label: 'Aprovar Novo\nAnúncio' },
  { id: 'propostas', label: 'Propostas' },
  { id: 'banners', label: 'Banners' },
  { id: 'reservado-1', label: 'Reservado' },
  { id: 'reservado-2', label: 'Reservado' },
  { id: 'reservado-3', label: 'Reservado' },
];

interface AdminVehicleItem extends VehicleRecord {
  sellerName?: string;
  sellerWhatsapp?: string;
  sellerEmail?: string;
}

interface AdminProposalParty {
  id: string;
  fullName: string;
  whatsapp: string;
  phone: string;
  email: string;
}

interface AdminProposalItem {
  negotiation: Negotiation;
  vehicle: VehicleRecord | null;
  seller: AdminProposalParty | null;
  buyer: AdminProposalParty | null;
  offer: TradeInOffer | null;
  tradeInVehicle: TradeInVehicle | null;
  tradeInImages: string[];
}

function MiniCarouselPhoto({
  photos,
  alt,
  onZoom,
}: {
  photos: string[];
  alt: string;
  onZoom: (url: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const safePhotos = photos.filter(Boolean);
  const total = safePhotos.length;
  const currentUrl = total > 0 ? safePhotos[idx % total] : '';

  if (total === 0) {
    return (
      <div className="flex h-[126px] w-[126px] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400">
        <ImageIcon className="mb-1 h-4 w-4 text-slate-300" />
        Sem foto
      </div>
    );
  }

  return (
    <div className="group relative h-[126px] w-[126px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <button
        type="button"
        onClick={() => onZoom(currentUrl)}
        className="h-full w-full"
        title="Clique para ampliar"
      >
        <img src={currentUrl} alt={alt} className="h-full w-full object-cover" />
      </button>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((prev) => (prev - 1 + total) % total);
            }}
            aria-label="Foto anterior"
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-1 text-white transition hover:bg-logo-purple"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((prev) => (prev + 1) % total);
            }}
            aria-label="Próxima foto"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-1 text-white transition hover:bg-logo-purple"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white">
            {(idx % total) + 1}/{total}
          </span>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('aprovacao');

  // Aprovação de anúncios state
  const [adminVehicles, setAdminVehicles] = useState<AdminVehicleItem[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paused'>('all');
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);

  // Propostas state
  const [adminProposals, setAdminProposals] = useState<AdminProposalItem[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalFilter, setProposalFilter] = useState<'all' | 'trade_in_plus_cash' | 'cash_only'>(
    'all'
  );

  const loadAdminProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await fetch('/api/admin/proposals', { cache: 'no-store' });
      const data = await res.json();
      setAdminProposals(Array.isArray(data.proposals) ? data.proposals : []);
    } finally {
      setLoadingProposals(false);
    }
  };

  const loadAdminVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await fetch('/api/admin/vehicles', { cache: 'no-store' });
      const data = await res.json();
      setAdminVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleModerateVehicle = async (
    vehicleId: string,
    action: 'approve' | 'pause' | 'delete'
  ) => {
    if (action === 'delete') {
      const ok = window.confirm('Tem certeza que deseja deletar este anúncio permanentemente?');
      if (!ok) return;
    }
    setBusyVehicleId(vehicleId);
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, action }),
      });
      if (res.ok) {
        await loadAdminVehicles();
      }
    } finally {
      setBusyVehicleId(null);
    }
  };

  const formatBRL = (v?: number) =>
    typeof v === 'number' && !Number.isNaN(v)
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  // Banners state
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newTransition, setNewTransition] = useState<BannerTransitionType>('side-to-side');
  const [newDuration, setNewDuration] = useState<number>(5);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  useEffect(() => {
    if (window.sessionStorage.getItem('mp_admin_unlocked') === 'true') {
      setUnlocked(true);
    }
    setBanners(loadStoredBanners());
  }, []);

  useEffect(() => {
    if (unlocked && activeTab === 'aprovacao') {
      loadAdminVehicles();
    }
    if (unlocked && activeTab === 'propostas') {
      loadAdminProposals();
    }
  }, [unlocked, activeTab]);

  const persistBanners = (next: BannerItem[]) => {
    setBanners(next);
    saveStoredBanners(next);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readBannerFileAsDataUrl(file);
      setNewImageUrl(dataUrl);
      setImgNaturalSize(null);
      setPanX(0);
      setPanY(0);
      setZoom(1);
      if (!newTitle.trim()) {
        setNewTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      setBannerMsg(null);
    } catch (err) {
      setBannerMsg(err instanceof Error ? err.message : 'Erro ao importar imagem.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      setBannerMsg('Importe uma imagem ou informe a URL do banner.');
      return;
    }
    setSavingBanner(true);
    try {
      const finalImageUrl = await renderPositionedBannerToDataUrl(
        newImageUrl.trim(),
        panX,
        panY,
        zoom
      );
      const item: BannerItem = {
        id: `banner-${Date.now()}`,
        title: newTitle.trim() || `Banner ${banners.length + 1}`,
        imageUrl: finalImageUrl,
        linkUrl: newLinkUrl.trim() || undefined,
        transition: newTransition,
        durationSeconds: Math.max(1, Math.min(120, Number(newDuration) || 5)),
        active: true,
        createdAt: new Date().toISOString(),
      };
      persistBanners([...banners, item]);
      setNewTitle('');
      setNewLinkUrl('');
      setNewImageUrl('');
      setImgNaturalSize(null);
      setPanX(0);
      setPanY(0);
      setZoom(1);
      setNewDuration(5);
      setNewTransition('side-to-side');
      setBannerMsg('Banner posicionado (1024 × 250) e salvo com sucesso!');
    } catch {
      setBannerMsg('Não foi possível salvar o banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!newImageUrl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
  };

  const handleFramePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    const frame = previewFrameRef.current;
    if (!drag || !frame || !imgNaturalSize) return;

    const rect = frame.getBoundingClientRect();
    const baseScale = Math.max(rect.width / imgNaturalSize.w, rect.height / imgNaturalSize.h);
    const scale = baseScale * zoom;
    const drawW = imgNaturalSize.w * scale;
    const drawH = imgNaturalSize.h * scale;
    const maxOffsetX = Math.max(0, (drawW - rect.width) / 2);
    const maxOffsetY = Math.max(0, (drawH - rect.height) / 2);

    const dx = e.clientX - drag.clientX;
    const dy = e.clientY - drag.clientY;

    const nextPanX =
      maxOffsetX > 1 ? Math.max(-1, Math.min(1, drag.startPanX + dx / maxOffsetX)) : 0;
    const nextPanY =
      maxOffsetY > 1 ? Math.max(-1, Math.min(1, drag.startPanY + dy / maxOffsetY)) : 0;

    setPanX(nextPanX);
    setPanY(nextPanY);
  };

  const handleFramePointerUp = () => {
    dragStartRef.current = null;
  };

  const updateBannerField = <K extends keyof BannerItem>(
    id: string,
    field: K,
    value: BannerItem[K]
  ) => {
    persistBanners(banners.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const copy = [...banners];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    persistBanners(copy);
  };

  const removeBanner = (id: string) => {
    persistBanners(banners.filter((b) => b.id !== id));
  };

  if (!unlocked) {
    return (
      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-logo-purple">
          <Lock className="h-5 w-5" />
          <h1 className="text-base font-extrabold">Acesso Administrativo</h1>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Informe a senha de administrador para continuar.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin123') {
              window.sessionStorage.setItem('mp_admin_unlocked', 'true');
              setUnlocked(true);
              setError('');
            } else {
              setError('Senha incorreta.');
            }
          }}
          className="mt-4 space-y-3"
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Digite a senha"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none"
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-logo-purple px-4 py-2.5 text-xs font-bold text-white transition hover:bg-logo-purple-light"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-5">
      {/* Barra Verde com 6 Botões no lugar do Banner e Feed */}
      <section className="w-full rounded-2xl bg-logo-green p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {ADMIN_BUTTONS.map((btn) => {
            const isActive = activeTab === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveTab(btn.id)}
                className={`flex items-center justify-center whitespace-pre-line rounded-xl px-3 py-2 text-center text-sm font-extrabold leading-tight transition ${
                  isActive
                    ? 'bg-logo-purple text-white shadow-xs'
                    : 'bg-white/85 text-logo-purple hover:bg-white'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'aprovacao' && (
        <div className="space-y-4">
          {/* Cabeçalho da fila de aprovação */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-logo-purple" />
                  Monitoramento e Aprovação de Anúncios
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Confira as 12 fotos e todos os dados cadastrais antes de liberar o anúncio na página inicial.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadAdminVehicles}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingVehicles ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <Link
                  href="/admin/negociacoes"
                  className="inline-flex items-center gap-2 rounded-xl bg-logo-purple px-3.5 py-2 text-xs font-bold text-white transition hover:bg-logo-purple-light"
                >
                  <span>Central de Negociações</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Filtros de status */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                {
                  id: 'all' as const,
                  label: `Todos (${adminVehicles.length})`,
                },
                {
                  id: 'pending' as const,
                  label: `Pendentes (${adminVehicles.filter((v) => v.moderationStatus === 'pending').length})`,
                },
                {
                  id: 'approved' as const,
                  label: `Aprovados (${adminVehicles.filter((v) => (v.moderationStatus ?? 'approved') === 'approved').length})`,
                },
                {
                  id: 'paused' as const,
                  label: `Pausados (${adminVehicles.filter((v) => v.moderationStatus === 'paused').length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === f.id
                      ? 'bg-logo-purple text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* Caixas de 1024 x 250 px: Esquerda (12 fotos 4x3) | Direita (Dados + WhatsApp + Aprovar/Pausar/Deletar) */}
          {loadingVehicles && adminVehicles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Carregando anúncios para monitoramento...
            </div>
          ) : (
            (() => {
              const visible = adminVehicles.filter((v) =>
                statusFilter === 'all'
                  ? true
                  : (v.moderationStatus ?? 'approved') === statusFilter
              );
              if (visible.length === 0) {
                return (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-500">
                    Nenhum anúncio nesta fila no momento.
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {visible.map((v) => {
                    const photos =
                      v.images && v.images.length > 0
                        ? v.images
                        : v.imageUrl
                          ? [v.imageUrl]
                          : [];
                    const modStatus = v.moderationStatus ?? 'approved';
                    const phoneDigits = (v.sellerWhatsapp ?? '').replace(/\D/g, '');
                    const waUrl = phoneDigits
                      ? `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                          `Olá ${v.sellerName || ''}, aqui é a moderação da Proposta Casada sobre o seu anúncio ${v.brand} ${v.model} (${v.manufactureYear}).`
                        )}`
                      : null;

                    return (
                      <article
                        key={v.id}
                        className="flex w-full max-w-[1024px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:h-[250px] md:flex-row"
                      >
                        {/* METADE ESQUERDA (512 x 250): 12 fotos aparentes em 4 colunas x 3 linhas */}
                        <div className="grid h-[220px] w-full shrink-0 grid-cols-4 grid-rows-3 gap-1 bg-slate-900 p-1.5 md:h-full md:w-1/2">
                          {Array.from({ length: 12 }, (_, idx) => {
                            const url = photos[idx];
                            return url ? (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setZoomedPhotoUrl(url)}
                                className="group relative h-full w-full overflow-hidden rounded border border-white/15 bg-black"
                                title={`Ampliar foto ${idx + 1}`}
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${idx + 1} - ${v.brand} ${v.model}`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                                  {idx + 1}
                                </span>
                              </button>
                            ) : (
                              <div
                                key={idx}
                                className="flex h-full w-full items-center justify-center rounded border border-dashed border-white/15 bg-slate-800/60 text-[9px] font-semibold text-slate-500"
                              >
                                {idx + 1}
                              </div>
                            );
                          })}
                        </div>

                        {/* METADE DIREITA (512 x 250): Todas as informações do cadastro + Botões de ação */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between p-3 md:h-full md:w-1/2">
                          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <h3 className="truncate text-sm font-extrabold text-slate-900">
                                {v.brand} {v.model} {v.version}
                              </h3>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  modStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : modStatus === 'paused'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-logo-green text-logo-purple-950'
                                }`}
                              >
                                {modStatus === 'pending'
                                  ? 'Aguardando Aprovação'
                                  : modStatus === 'paused'
                                    ? 'Pausado'
                                    : 'Aprovado no Feed'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-700 sm:grid-cols-3">
                              <span>
                                <strong>Cat:</strong> {v.category || 'Carros'}
                              </span>
                              <span>
                                <strong>Ano:</strong> {v.manufactureYear}
                              </span>
                              <span>
                                <strong>KM:</strong> {v.mileage.toLocaleString('pt-BR')} km
                              </span>
                              <span>
                                <strong>Motor:</strong> {v.engine || '—'}
                              </span>
                              <span>
                                <strong>Câmbio:</strong> {v.transmission}
                              </span>
                              <span>
                                <strong>Tração:</strong> {v.traction || '—'}
                              </span>
                              <span>
                                <strong>Comb.:</strong> {v.fuel}
                              </span>
                              <span className="col-span-2 truncate">
                                <strong>Local:</strong> {v.city}/{v.state}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-50 p-1.5 text-[11px]">
                              <div>
                                <span className="block text-[9px] font-bold uppercase text-slate-500">
                                  FIPE
                                </span>
                                <strong className="text-slate-900">{formatBRL(v.fipePrice)}</strong>
                              </div>
                              <div>
                                <span className="block text-[9px] font-bold uppercase text-slate-500">
                                  Pedido
                                </span>
                                <strong className="text-logo-purple">
                                  {formatBRL(v.askingPrice)}
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[9px] font-bold uppercase text-slate-500">
                                  Mín. Aceito
                                </span>
                                <strong className="text-emerald-700">
                                  {formatBRL(v.minConfidentialPrice)}
                                </strong>
                              </div>
                            </div>

                            <div className="space-y-0.5 text-[11px] text-slate-600">
                              <p className="truncate">
                                <strong>Anunciante:</strong> {v.sellerName || v.sellerId}{' '}
                                {v.sellerWhatsapp ? `• ${v.sellerWhatsapp}` : '• Sem WhatsApp no perfil'}
                              </p>
                              {v.desiredTradeIn && (
                                <p className="truncate text-logo-purple">
                                  <strong>Aceito na troca:</strong> {v.desiredTradeIn}
                                </p>
                              )}
                              {v.description && (
                                <p className="line-clamp-2 text-[10px] text-slate-500">
                                  <strong>Acessórios/Info:</strong> {v.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Botões: WhatsApp, Aprovar, Pausar, Deletar */}
                          <div className="mt-2 grid shrink-0 grid-cols-4 gap-1.5 border-t border-slate-100 pt-2">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-emerald-700"
                                title="Conversar no WhatsApp com o anunciante"
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-500"
                                title="Anunciante ainda não cadastrou WhatsApp no perfil"
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>Sem Zap</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={busyVehicleId === v.id || modStatus === 'approved'}
                              onClick={() => handleModerateVehicle(v.id, 'approve')}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-logo-green px-2 py-1.5 text-[11px] font-extrabold text-logo-purple-950 transition hover:bg-logo-green-hover disabled:opacity-45"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Aprovar</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyVehicleId === v.id || modStatus === 'paused'}
                              onClick={() => handleModerateVehicle(v.id, 'pause')}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-100 px-2 py-1.5 text-[11px] font-extrabold text-amber-900 transition hover:bg-amber-200 disabled:opacity-45"
                            >
                              <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>Pausar</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyVehicleId === v.id}
                              onClick={() => handleModerateVehicle(v.id, 'delete')}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-red-700 disabled:opacity-45"
                            >
                              <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Deletar</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'propostas' && (
        <div className="space-y-4">
          {/* Cabeçalho de Propostas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <ArrowLeftRight className="h-5 w-5 text-logo-purple" />
                  Propostas Enviadas aos Anunciantes
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Acompanhe todas as propostas de troca e à vista, com contato direto no WhatsApp do anunciante e de quem propôs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadAdminProposals}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingProposals ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <Link
                  href="/admin/negociacoes"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-logo-purple px-3 py-2 text-xs font-bold text-white transition hover:bg-logo-purple-light"
                >
                  Moderação de Mensagens
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: `Todas (${adminProposals.length})` },
                  {
                    id: 'trade_in_plus_cash',
                    label: `Permuta (${
                      adminProposals.filter((p) => p.negotiation.modality === 'trade_in_plus_cash')
                        .length
                    })`,
                  },
                  {
                    id: 'cash_only',
                    label: `No Dinheiro (${
                      adminProposals.filter((p) => p.negotiation.modality === 'cash_only').length
                    })`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setProposalFilter(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    proposalFilter === f.id
                      ? 'bg-logo-purple text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* Lista de Caixas 1024 x 150 divididas em 3 partes iguais */}
          {loadingProposals && adminProposals.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Carregando propostas...
            </section>
          ) : (
            (() => {
              const filtered = adminProposals.filter((p) =>
                proposalFilter === 'all' ? true : p.negotiation.modality === proposalFilter
              );
              if (filtered.length === 0) {
                return (
                  <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Nenhuma proposta encontrada nesta categoria.
                  </section>
                );
              }

              const statusLabels: Record<string, { label: string; cls: string }> = {
                open: { label: 'Aberta', cls: 'bg-sky-100 text-sky-800' },
                counteroffer: { label: 'Contraproposta', cls: 'bg-amber-100 text-amber-800' },
                accepted_pending_confirmation: {
                  label: 'Aguard. Confirmação',
                  cls: 'bg-purple-100 text-purple-800',
                },
                ACORDO_CONFIRMADO: {
                  label: 'Acordo Confirmado',
                  cls: 'bg-emerald-100 text-emerald-800',
                },
                completed: { label: 'Concluída', cls: 'bg-emerald-100 text-emerald-800' },
                cancelled: { label: 'Cancelada', cls: 'bg-slate-200 text-slate-700' },
                rejected: { label: 'Recusada', cls: 'bg-red-100 text-red-700' },
              };

              const buildWhatsAppLink = (rawPhone?: string, text?: string) => {
                const digits = (rawPhone ?? '').replace(/\D/g, '');
                if (!digits) return '';
                const intl = digits.startsWith('55') ? digits : `55${digits}`;
                return `https://wa.me/${intl}?text=${encodeURIComponent(text ?? '')}`;
              };

              return (
                <div className="space-y-3">
                  {filtered.map((item) => {
                    const { negotiation, vehicle, seller, buyer, offer, tradeInVehicle, tradeInImages } =
                      item;
                    const advertisedPhotos = vehicle
                      ? (vehicle.images && vehicle.images.length > 0
                          ? vehicle.images
                          : vehicle.imageUrl
                            ? [vehicle.imageUrl]
                            : []
                        )
                      : [];
                    const isTradeIn = negotiation.modality === 'trade_in_plus_cash';
                    const statusBadge = statusLabels[negotiation.status] ?? {
                      label: negotiation.status,
                      cls: 'bg-slate-100 text-slate-700',
                    };

                    const sellerWa = buildWhatsAppLink(
                      seller?.whatsapp || seller?.phone,
                      `Olá${seller?.fullName ? ` ${seller.fullName}` : ''}, falo da moderação Proposta Casada sobre a proposta ${negotiation.code} no seu anúncio ${vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}.`
                    );
                    const buyerWa = buildWhatsAppLink(
                      buyer?.whatsapp || buyer?.phone,
                      `Olá${buyer?.fullName ? ` ${buyer.fullName}` : ''}, falo da moderação Proposta Casada sobre a sua proposta ${negotiation.code}${vehicle ? ` para o anúncio ${vehicle.brand} ${vehicle.model}` : ''}.`
                    );

                    const totalValue =
                      negotiation.agreedTotalValue ?? offer?.totalOfferValue ?? 0;
                    const cashComplement =
                      negotiation.agreedCashComplement ?? offer?.cashComplement ?? 0;
                    const tradeInValue =
                      negotiation.agreedTradeInValue ?? tradeInVehicle?.declaredValue ?? 0;

                    return (
                      <article
                        key={negotiation.id}
                        className="grid w-full max-w-[1024px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:h-[150px] md:grid-cols-3"
                      >
                        {/* PARTE 1 — ESQUERDA: Anunciante + Carro Anunciado */}
                        <div className="flex h-full items-center gap-2.5 border-b border-slate-200 p-2.5 md:border-b-0 md:border-r">
                          <MiniCarouselPhoto
                            photos={advertisedPhotos}
                            alt={
                              vehicle
                                ? `${vehicle.brand} ${vehicle.model}`
                                : 'Veículo anunciado'
                            }
                            onZoom={setZoomedPhotoUrl}
                          />
                          <div className="flex h-full min-w-0 flex-1 flex-col justify-between py-0.5">
                            <div className="min-w-0">
                              <span className="inline-block rounded bg-logo-purple/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-logo-purple">
                                Anunciante
                              </span>
                              <h3 className="mt-0.5 truncate text-xs font-extrabold text-slate-900">
                                {vehicle
                                  ? `${vehicle.brand} ${vehicle.model}`
                                  : 'Anúncio removido'}
                              </h3>
                              {vehicle && (
                                <>
                                  <p className="truncate text-[10px] text-slate-600">
                                    {vehicle.version}
                                  </p>
                                  <p className="truncate text-[10px] font-semibold text-slate-700">
                                    {vehicle.manufactureYear}/{vehicle.modelYear} •{' '}
                                    {vehicle.mileage.toLocaleString('pt-BR')} km
                                  </p>
                                  <p className="truncate text-[10px] font-bold text-logo-purple">
                                    FIPE: {formatBRL(vehicle.fipePrice)}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="pt-1">
                              {sellerWa ? (
                                <a
                                  href={sellerWa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white transition hover:bg-emerald-700"
                                  title={`WhatsApp do Anunciante (${seller?.fullName ?? ''})`}
                                >
                                  <MessageCircle className="h-3 w-3 shrink-0" />
                                  <span className="truncate">WhatsApp Anunciante</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400"
                                >
                                  <MessageCircle className="h-3 w-3 shrink-0" />
                                  <span>Sem WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* PARTE 2 — MEIO: Resumo da Proposta */}
                        <div className="flex h-full flex-col justify-between border-b border-slate-200 bg-slate-50/70 p-2.5 text-center md:border-b-0 md:border-r">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700">
                              {negotiation.code}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${statusBadge.cls}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>

                          <div className="my-auto space-y-1">
                            <div className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-logo-purple shadow-2xs ring-1 ring-slate-200">
                              {isTradeIn ? (
                                <>
                                  <ArrowLeftRight className="h-3 w-3" />
                                  Permuta + Volta
                                </>
                              ) : (
                                <>
                                  <Banknote className="h-3 w-3 text-emerald-600" />
                                  Proposta no Dinheiro
                                </>
                              )}
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              Total: {formatBRL(totalValue)}
                            </p>
                            {isTradeIn ? (
                              <p className="text-[10px] font-semibold text-slate-600">
                                Troca: <strong>{formatBRL(tradeInValue)}</strong> • Volta:{' '}
                                <strong className="text-emerald-700">
                                  {formatBRL(cashComplement)}
                                </strong>
                              </p>
                            ) : (
                              <p className="text-[10px] font-semibold text-emerald-700">
                                Pagamento à vista: {formatBRL(cashComplement || totalValue)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-1.5 text-[10px]">
                            <span className="text-slate-500">
                              {new Date(negotiation.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            <Link
                              href={`/negotiations/${negotiation.id}`}
                              className="inline-flex items-center gap-1 font-extrabold text-logo-purple hover:underline"
                            >
                              Abrir negociação
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* PARTE 3 — DIREITA: Proponente + Carro de Troca */}
                        <div className="flex h-full items-center gap-2.5 p-2.5">
                          {tradeInVehicle ? (
                            <MiniCarouselPhoto
                              photos={tradeInImages}
                              alt={`${tradeInVehicle.brand} ${tradeInVehicle.model}`}
                              onZoom={setZoomedPhotoUrl}
                            />
                          ) : (
                            <div className="flex h-[126px] w-[126px] shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center">
                              <Banknote className="h-6 w-6 text-emerald-600" />
                              <span className="mt-1 text-[10px] font-extrabold text-emerald-800">
                                Oferta no Dinheiro
                              </span>
                            </div>
                          )}

                          <div className="flex h-full min-w-0 flex-1 flex-col justify-between py-0.5">
                            <div className="min-w-0">
                              <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">
                                Proponente
                              </span>
                              {tradeInVehicle ? (
                                <>
                                  <h3 className="mt-0.5 truncate text-xs font-extrabold text-slate-900">
                                    {tradeInVehicle.brand} {tradeInVehicle.model}
                                  </h3>
                                  <p className="truncate text-[10px] text-slate-600">
                                    {tradeInVehicle.version}
                                  </p>
                                  <p className="truncate text-[10px] font-semibold text-slate-700">
                                    {tradeInVehicle.manufactureYear}/{tradeInVehicle.modelYear} •{' '}
                                    {tradeInVehicle.mileage.toLocaleString('pt-BR')} km
                                  </p>
                                  <p className="truncate text-[10px] font-bold text-emerald-700">
                                    Declarado: {formatBRL(tradeInVehicle.declaredValue)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h3 className="mt-0.5 truncate text-xs font-extrabold text-slate-900">
                                    {buyer?.fullName ?? 'Comprador'}
                                  </h3>
                                  <p className="truncate text-[10px] text-slate-600">
                                    Sem veículo na troca
                                  </p>
                                  <p className="truncate text-[10px] font-bold text-emerald-700">
                                    Oferta: {formatBRL(totalValue)}
                                  </p>
                                </>
                              )}
                            </div>

                            <div className="pt-1">
                              {buyerWa ? (
                                <a
                                  href={buyerWa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white transition hover:bg-emerald-700"
                                  title={`WhatsApp do Proponente (${buyer?.fullName ?? ''})`}
                                >
                                  <MessageCircle className="h-3 w-3 shrink-0" />
                                  <span className="truncate">WhatsApp Proponente</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400"
                                >
                                  <MessageCircle className="h-3 w-3 shrink-0" />
                                  <span>Sem WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'banners' && (
        <div className="space-y-5">
          {/* Dispositivo para Importar Banner */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <ImageIcon className="h-5 w-5 text-logo-purple" />
              Importar Banner (1024 × 250 px)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Importe a imagem do banner, escolha o tipo de movimento e defina o temporizador em segundos.
            </p>

            <form onSubmit={handleAddBanner} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Título do Banner
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Campanha Troca Segura"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Link ao clicar (opcional)
                  </label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="Ex: /anunciar ou https://..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Move className="h-3.5 w-3.5 text-logo-purple" />
                    Tipo de Movimento
                  </label>
                  <select
                    value={newTransition}
                    onChange={(e) => setNewTransition(e.target.value as BannerTransitionType)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-logo-purple focus:bg-white focus:outline-none"
                  >
                    <option value="top-to-bottom">De cima para baixo</option>
                    <option value="side-to-side">De um lado para o outro</option>
                    <option value="fade">Suave (Fade)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-logo-purple" />
                    Temporizador (segundos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-logo-purple focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImportFile}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-logo-purple bg-uva-50 px-4 py-2 text-xs font-bold text-logo-purple transition hover:bg-uva-100"
                >
                  <Upload className="h-4 w-4" />
                  Importar imagem do computador
                </button>

                <span className="text-[11px] text-slate-400">ou</span>

                <input
                  type="text"
                  value={newImageUrl.startsWith('data:') ? '' : newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Cole a URL da imagem..."
                  className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none"
                />
              </div>

              {newImageUrl && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-logo-purple">
                      Grade 1024 × 250 — Arraste a imagem para posicionar
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <ZoomIn className="h-3.5 w-3.5 text-logo-purple" />
                        <span>Zoom ({Math.round(zoom * 100)}%)</span>
                        <input
                          type="range"
                          min={1}
                          max={2.5}
                          step={0.05}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="w-24 accent-logo-purple"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPanX(0);
                          setPanY(0);
                          setZoom(1);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Centralizar
                      </button>
                    </div>
                  </div>

                  {/* Grade interativa proporcional 1024 x 250 */}
                  <div
                    ref={previewFrameRef}
                    onPointerDown={handleFramePointerDown}
                    onPointerMove={handleFramePointerMove}
                    onPointerUp={handleFramePointerUp}
                    onPointerCancel={handleFramePointerUp}
                    className="relative aspect-[1024/250] w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border-2 border-dashed border-logo-purple/60 bg-slate-900 active:cursor-grabbing"
                  >
                    {(() => {
                      const frameW = previewFrameRef.current?.clientWidth || 1024;
                      const frameH = previewFrameRef.current?.clientHeight || 250;
                      const natW = imgNaturalSize?.w || 1024;
                      const natH = imgNaturalSize?.h || 250;
                      const baseScale = Math.max(frameW / natW, frameH / natH);
                      const scale = baseScale * zoom;
                      const drawW = natW * scale;
                      const drawH = natH * scale;
                      const maxOffsetX = Math.max(0, (drawW - frameW) / 2);
                      const maxOffsetY = Math.max(0, (drawH - frameH) / 2);
                      const tx = panX * maxOffsetX;
                      const ty = panY * maxOffsetY;

                      return (
                        <img
                          src={newImageUrl}
                          alt="Pré-visualização do banner na grade 1024 x 250"
                          draggable={false}
                          onLoad={(e) => {
                            setImgNaturalSize({
                              w: e.currentTarget.naturalWidth || 1024,
                              h: e.currentTarget.naturalHeight || 250,
                            });
                          }}
                          style={{
                            width: `${drawW}px`,
                            height: `${drawH}px`,
                            maxWidth: 'none',
                            transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                          }}
                          className="pointer-events-none absolute left-1/2 top-1/2 object-cover"
                        />
                      );
                    })()}

                    {/* Linhas de grade 1024 x 250 */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-white/25" />
                      <div className="border-r border-white/25" />
                      <div />
                    </div>

                    <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                      1024 × 250 px
                    </span>
                  </div>
                </div>
              )}

              {bannerMsg && (
                <p className="text-xs font-semibold text-logo-purple">{bannerMsg}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingBanner}
                  className="inline-flex items-center gap-2 rounded-xl bg-logo-purple px-5 py-2.5 text-xs font-bold text-white transition hover:bg-logo-purple-light disabled:opacity-50"
                >
                  {savingBanner ? 'Salvando...' : 'Salvar Banner'}
                </button>
              </div>
            </form>
          </section>

          {/* Lista de Banners Cadastrados com Edição de Movimento e Temporizador */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Banners Cadastrados ({banners.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Quando houver banners ativos, eles giram automaticamente no topo da página inicial.
              </span>
            </div>

            {banners.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                Nenhum banner importado ainda. O site está exibindo o banner padrão.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {banners.map((b, idx) => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center"
                  >
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-20 w-full shrink-0 rounded-lg border border-slate-200 object-cover sm:w-48"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-xs font-extrabold text-slate-900">
                          {idx + 1}. {b.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            b.active
                              ? 'bg-logo-green-100 text-logo-purple-950'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {b.active ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <span>Movimento:</span>
                          <select
                            value={b.transition}
                            onChange={(e) =>
                              updateBannerField(
                                b.id,
                                'transition',
                                e.target.value as BannerTransitionType
                              )
                            }
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                          >
                            {Object.entries(BANNER_TRANSITION_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <span>Tempo (s):</span>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={b.durationSeconds}
                            onChange={(e) =>
                              updateBannerField(
                                b.id,
                                'durationSeconds',
                                Math.max(1, Math.min(120, Number(e.target.value) || 5))
                              )
                            }
                            className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBanner(idx, -1)}
                        disabled={idx === 0}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBanner(idx, 1)}
                        disabled={idx === banners.length - 1}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBannerField(b.id, 'active', !b.active)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                        title={b.active ? 'Pausar banner' : 'Ativar banner'}
                      >
                        {b.active ? (
                          <Eye className="h-3.5 w-3.5 text-logo-purple" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBanner(b.id)}
                        className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50"
                        title="Excluir banner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab.startsWith('reservado') && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-800">Reservado</h2>
          <p className="mt-1 text-xs text-slate-500">
            Espaço reservado para futuras ferramentas administrativas.
          </p>
        </section>
      )}

      {/* Modal compartilhado de inspeção ampliada de foto */}
      {zoomedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedPhotoUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedPhotoUrl(null)}
              className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-logo-purple"
              aria-label="Fechar foto"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomedPhotoUrl}
              alt="Inspeção ampliada da foto"
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
