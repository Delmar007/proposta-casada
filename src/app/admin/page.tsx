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
} from 'lucide-react';
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
  | 'banners'
  | 'reservado-1'
  | 'reservado-2'
  | 'reservado-3'
  | 'reservado-4';

const ADMIN_BUTTONS: { id: AdminTab; label: string }[] = [
  { id: 'aprovacao', label: 'Aprovação' },
  { id: 'banners', label: 'Banners' },
  { id: 'reservado-1', label: 'Reservado' },
  { id: 'reservado-2', label: 'Reservado' },
  { id: 'reservado-3', label: 'Reservado' },
  { id: 'reservado-4', label: 'Reservado' },
];

export default function AdminDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('aprovacao');

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
                className={`rounded-xl px-3 py-2.5 text-center text-sm font-extrabold transition ${
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-logo-purple" />
                Aprovação & Moderação
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Gerencie aprovações de negociações, propostas e anúncios na Central de Moderação.
              </p>
            </div>
            <Link
              href="/admin/negociacoes"
              className="inline-flex items-center gap-2 rounded-xl bg-logo-purple px-4 py-2.5 text-xs font-bold text-white transition hover:bg-logo-purple-light"
            >
              <span>Abrir Central de Negociações</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
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
    </div>
  );
}
