'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Settings,
  User,
  LogIn,
  Heart,
  LogOut,
  X,
  Plus,
  MessageSquare,
  Car,
  Home,
  ChevronDown,
} from 'lucide-react';
import { DEMO_USERS, useActiveUser } from './ActiveUserProvider';
import { AuthModal } from './AuthModal';
import { CATEGORY_SUBCATEGORIES, PRODUCT_CATEGORIES } from '@/lib/domain/categories';
import { DealTypeOption } from '@/lib/domain/types';
import { BRAZIL_STATES, getCitiesByUF } from '@/lib/geo/brazil-locations';

const VEHICLE_DEAL_OPTIONS: { value: DealTypeOption; label: string }[] = [
  { value: 'no_dinheiro', label: 'No dinheiro' },
  { value: 'menor_valor', label: 'Aceita menor valor' },
  { value: 'maior_valor', label: 'Aceita maior valor' },
  { value: 'troca_na_orelha', label: 'Troca na orelha' },
];

const PROPERTY_DEAL_OPTIONS: { value: DealTypeOption; label: string }[] = [
  { value: 'no_dinheiro', label: 'No dinheiro' },
  { value: 'imovel_menor_valor', label: 'Aceita imóvel de menor valor' },
  { value: 'imovel_maior_valor', label: 'Aceita imóvel de maior valor' },
  { value: 'imovel_mesmo_preco', label: 'Aceita imóvel no mesmo preço' },
  { value: 'carro_mais_dinheiro', label: 'Aceita carro + parte em dinheiro' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    userId,
    setUserId,
    currentUser,
    notifications,
    isAuthenticated,
    authProvider,
    userAvatarUrl,
    openAuthModal,
    login,
    logout,
    favorites,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeSubcategory,
    setActiveSubcategory,
    activeListingType,
    setActiveListingType,
    activeDealType,
    setActiveDealType,
    activeUf,
    setActiveUf,
    activeCity,
    setActiveCity,
    clearAllFilters,
  } = useActiveUser();

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);
  const [openDealMenu, setOpenDealMenu] = useState<'vehicle' | 'property' | null>(null);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [draftUf, setDraftUf] = useState<string>('');
  const [draftCity, setDraftCity] = useState<string>('');
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [cnhImported, setCnhImported] = useState(false);
  const [faceValidated, setFaceValidated] = useState(false);

  useEffect(() => {
    const syncProfileStatus = () => {
      setProfileCompleted(window.localStorage.getItem('mp_profile_completed') === 'true');
      setCnhImported(window.sessionStorage.getItem('mp_cnh_imported') === 'true');
      setFaceValidated(window.sessionStorage.getItem('mp_face_validated') === 'true');
    };
    syncProfileStatus();
    window.addEventListener('mp-profile-updated', syncProfileStatus);
    window.addEventListener('storage', syncProfileStatus);
    return () => {
      window.removeEventListener('mp-profile-updated', syncProfileStatus);
      window.removeEventListener('storage', syncProfileStatus);
    };
  }, []);
  const categoryNavRef = useRef<HTMLElement | null>(null);
  const dealMenuRef = useRef<HTMLDivElement | null>(null);
  const locationMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryNavRef.current && !categoryNavRef.current.contains(e.target as Node)) {
        setOpenCategoryMenu(null);
      }
      if (dealMenuRef.current && !dealMenuRef.current.contains(e.target as Node)) {
        setOpenDealMenu(null);
      }
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setShowLocationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/');
  };

  return (
    <>
      {/* BARRA SUPERIOR VERDE — Largura total, mesma altura da barra de categorias */}
      <div ref={locationMenuRef} className="relative z-50 w-full bg-logo-green text-logo-purple">
        <div className="mx-auto flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 text-[15px] font-semibold sm:px-0">
          <span className="truncate text-logo-purple">
            {activeUf && activeCity
              ? `${activeUf}, ${activeCity}`
              : activeUf
                ? `${activeUf}, Campo Grande`
                : activeCity
                  ? `MS, ${activeCity}`
                  : 'MS, Campo Grande'}
          </span>

          {/* Tutorial passo a passo centralizado na faixa superior com reflexo de luz */}
          <div className="order-3 flex w-full items-center justify-center text-center text-[13px] font-extrabold text-logo-purple md:order-2 md:w-auto md:flex-1 md:text-[14px]">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex flex-wrap items-center justify-center gap-1 text-logo-purple transition hover:underline"
              >
                <span className="tutorial-text-shine">Para entrar clique em</span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-logo-purple/10 px-1.5 py-0.5 font-extrabold">
                  <LogIn className="h-4 w-4 text-logo-purple" />
                  <span className="tutorial-text-shine">Entrar</span>
                </span>
                <span className="tutorial-text-shine">e faça o login.</span>
              </button>
            ) : pathname?.startsWith('/perfil') ? (
              <span className="tutorial-text-shine">
                {faceValidated
                  ? 'Clique em Salvar Perfil e Documentos.'
                  : cnhImported
                    ? 'Clique em Iniciar Câmera, tire uma foto do seu rosto, Fotografar e validar rosto.'
                    : 'Adicione nº de celular, importe o PDF da sua CNH.'}
              </span>
            ) : !profileCompleted ? (
              <Link
                href="/perfil"
                className="inline-flex flex-wrap items-center justify-center gap-1.5 text-logo-purple transition hover:underline"
              >
                <span className="tutorial-text-shine">Clique no seu</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-logo-purple/10 px-2 py-0.5 font-extrabold">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={currentUser.label.split(' ')[0]}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-logo-purple text-[10px] font-extrabold text-white">
                      {currentUser.label.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="tutorial-text-shine">{currentUser.label.split(' ')[0]}</span>
                </span>
                <span className="tutorial-text-shine">para concluir cadastro.</span>
              </Link>
            ) : pathname?.startsWith('/anunciar') ? (
              <span className="tutorial-text-shine">
                Preencha a categoria, os dados e publique seu anúncio.
              </span>
            ) : pathname?.startsWith('/vehicles/') ? (
              <span className="tutorial-text-shine">
                Escolha dinheiro ou permuta e envie sua proposta protegida.
              </span>
            ) : pathname?.startsWith('/negociacoes') ? (
              <span className="tutorial-text-shine">
                Acompanhe suas propostas e negocie com segurança.
              </span>
            ) : pathname?.startsWith('/favoritos') ? (
              <span className="tutorial-text-shine">
                Seus anúncios favoritos salvos para comparar e negociar.
              </span>
            ) : (
              <Link
                href="/anunciar"
                className="inline-flex flex-wrap items-center justify-center gap-1 transition hover:underline"
              >
                <span className="tutorial-text-shine">
                  Cadastro Aprovado, agora se quiser anunciar clique no
                </span>
                <Plus className="inline h-4 w-4 text-logo-purple" strokeWidth={2.5} />
                <span className="tutorial-text-shine">
                  ou envie proposta nos bens anunciados.
                </span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSettingsMenu(false);
              setShowProfileMenu(false);
              setOpenDealMenu(null);
              setDraftUf(activeUf ?? '');
              setDraftCity(activeCity ?? '');
              setShowLocationMenu((v) => !v);
            }}
            className="order-2 shrink-0 text-logo-purple transition hover:underline md:order-3"
          >
            escolher outra cidade
          </button>
        </div>

        {showLocationMenu && (
          <div className="absolute left-0 right-0 top-full z-50 px-3 sm:px-0">
            <div className="mx-auto mt-1 flex w-full max-w-[1024px] justify-end">
              <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 shadow-xl">
                <p className="text-xs font-bold text-slate-900">Filtrar por localização</p>
                <div className="mt-2.5 space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      UF
                    </label>
                    <select
                      value={draftUf}
                      onChange={(e) => {
                        setDraftUf(e.target.value);
                        setDraftCity('');
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      <option value="">Todas as UFs</option>
                      {BRAZIL_STATES.map((st) => (
                        <option key={st.uf} value={st.uf}>
                          {st.uf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Cidade
                    </label>
                    {draftUf && getCitiesByUF(draftUf).length > 0 ? (
                      <select
                        value={draftCity}
                        onChange={(e) => setDraftCity(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        <option value="">Todas as cidades</option>
                        {getCitiesByUF(draftUf).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={draftCity}
                        onChange={(e) => setDraftCity(e.target.value)}
                        placeholder="Digite a cidade..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUf(null);
                      setActiveCity(null);
                      setDraftUf('');
                      setDraftCity('');
                      setShowLocationMenu(false);
                      router.push('/');
                    }}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUf(draftUf || null);
                      setActiveCity(draftCity.trim() || null);
                      setShowLocationMenu(false);
                      router.push('/');
                    }}
                    className="rounded-lg bg-logo-purple px-3 py-1.5 text-xs font-bold text-white hover:bg-logo-purple-light"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-0 sm:px-0">
        {/* LOGO — 280 px de largura no desktop */}
        <Link
          href="/"
          onClick={() => {
            clearAllFilters();
            setOpenCategoryMenu(null);
            setOpenDealMenu(null);
          }}
          className="flex w-full shrink-0 items-center justify-center sm:w-[280px] sm:justify-start"
          title="Proposta Casada — Ver últimos anúncios publicados"
        >
          <img
            src="/logo-proposta-casada.png"
            alt="Proposta Casada — Negociação Protegida"
            className="h-[58px] w-auto max-w-[280px] object-contain"
          />
        </Link>

        {/* BARRA DE BUSCA CENTRAL — expandida 20 px para o lado esquerdo */}
        <form
          onSubmit={handleSearchSubmit}
          className="order-3 flex w-full flex-1 items-center sm:order-2 sm:ml-0 sm:w-auto"
        >
          <div className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-logo-purple" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar marca, modelo, casa, bar, fazenda, cidade..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none sm:py-2 sm:text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                title="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* BOTÃO DUPLO — TIPO DE NEGÓCIO (CARRO | IMÓVEL) ENTRE A BUSCA E A ENGRENAGEM */}
        <div
          ref={dealMenuRef}
          className="relative order-4 flex w-full justify-center sm:order-3 sm:ml-3 sm:w-auto"
        >
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setShowSettingsMenu(false);
                setShowProfileMenu(false);
                setOpenDealMenu((prev) => (prev === 'vehicle' ? null : 'vehicle'));
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition ${
                openDealMenu === 'vehicle' || activeListingType === 'vehicle'
                  ? 'bg-logo-purple text-white'
                  : 'text-logo-purple hover:bg-uva-50'
              }`}
              title="Tipo de negócio para Carros"
            >
              <Car className="h-3.5 w-3.5" />
              <span>Carro</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  openDealMenu === 'vehicle' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div className="w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => {
                setShowSettingsMenu(false);
                setShowProfileMenu(false);
                setOpenDealMenu((prev) => (prev === 'property' ? null : 'property'));
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition ${
                openDealMenu === 'property' || activeListingType === 'property'
                  ? 'bg-logo-purple text-white'
                  : 'text-logo-purple hover:bg-uva-50'
              }`}
              title="Tipo de negócio para Imóveis"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Imóvel</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  openDealMenu === 'property' ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {openDealMenu && (
            <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:left-0 sm:translate-x-0">
              <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 px-2.5 pb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-uva-700">
                  Tipo de negócio — {openDealMenu === 'vehicle' ? 'Carro' : 'Imóvel'}
                </span>
              </div>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveListingType(openDealMenu);
                      setActiveDealType(null);
                      setOpenDealMenu(null);
                      router.push('/');
                    }}
                    className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                      activeListingType === openDealMenu && activeDealType === null
                        ? 'bg-uva-50 font-bold text-uva-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-uva-700'
                    }`}
                  >
                    {openDealMenu === 'vehicle' ? 'Todos os carros' : 'Todos os imóveis'}
                  </button>
                </li>
                {(openDealMenu === 'vehicle'
                  ? VEHICLE_DEAL_OPTIONS
                  : PROPERTY_DEAL_OPTIONS
                ).map((opt) => {
                  const isSelected =
                    activeListingType === openDealMenu && activeDealType === opt.value;
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveListingType(openDealMenu);
                          setActiveDealType(opt.value);
                          setOpenDealMenu(null);
                          router.push('/');
                        }}
                        className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                          isSelected
                            ? 'bg-uva-50 font-bold text-uva-700'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-uva-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* LADO DIREITO — Apenas palavras e ícones (sem caixas/bordas de botão) */}
        <div className="order-2 flex shrink-0 items-center gap-4 sm:order-4 sm:ml-4">
          {/* 1. Engrenagem (Configurações / Central Admin) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSettingsMenu(false);
                setShowProfileMenu(false);
                setOpenDealMenu(null);
                setShowLocationMenu(false);
                setAdminPasswordInput('');
                setAdminPasswordError('');
                setShowAdminPasswordModal(true);
              }}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-logo-purple transition hover:text-logo-purple-light sm:text-xs"
              title="Acesso Administrativo"
              aria-label="Configurações"
            >
              <Settings className="h-[19px] w-[19px]" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                <p className="text-xs font-bold text-slate-900">
                  Configurações & Moderação
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Alterne o perfil de simulação ou acesse a Central de Negociações.
                </p>

                <div className="mt-3 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Perfil ativo na sessão:
                  </label>
                  <select
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      login(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                  >
                    {DEMO_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.roleLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-2.5 text-xs">
                  <Link
                    href="/admin/negociacoes"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center justify-between rounded-lg bg-logo-green px-3 py-2 font-bold text-logo-purple-950 hover:bg-logo-green-hover"
                  >
                    <span>Central de Moderação (Admin)</span>
                    <Settings className="h-3.5 w-3.5 text-logo-purple" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. Entrar / Perfil (após login, Entrar vira ícone de Perfil) */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-logo-purple transition hover:text-logo-purple-light sm:text-xs"
              title="Cadastrar ou Entrar com Google / Facebook"
            >
              <LogIn className="h-[19px] w-[19px]" />
              <span>Entrar</span>
            </button>
          ) : (
            <Link
              href="/perfil"
              onClick={() => {
                setShowProfileMenu(false);
                setShowSettingsMenu(false);
              }}
              className="inline-flex items-center gap-2 py-1 text-sm font-bold text-logo-purple transition hover:text-logo-purple-light sm:text-xs"
              title={`Meu Perfil — ${currentUser.label}`}
              aria-label="Meu Perfil"
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={currentUser.label.split(' ')[0]}
                  className="h-7 w-7 shrink-0 rounded-full border border-logo-purple/30 object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-logo-purple-50 text-xs font-extrabold text-logo-purple">
                  {currentUser.label.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-[110px] truncate">
                {currentUser.label.split(' ')[0]}
              </span>
            </Link>
          )}

          {/* 3. Ícone + ao lado do Perfil — abre a página de Cadastro de Anúncio */}
          <Link
            href="/anunciar"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                openAuthModal();
              }
            }}
            className="relative inline-flex items-center py-1 text-logo-green transition hover:text-logo-green-hover"
            title="Anunciar veículo ou imóvel"
            aria-label="Anunciar veículo ou imóvel"
          >
            <Plus className="h-[21px] w-[21px]" strokeWidth={2.5} />
          </Link>

          {/* 4. Ícone de Coração — Página dedicada de Favoritos (sem círculo, oco ou vermelho vivo) */}
          <Link
            href="/favoritos"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                openAuthModal();
              }
            }}
            className="relative inline-flex items-center py-1 text-logo-purple transition hover:text-red-600"
            title="Favoritos"
            aria-label="Favoritos"
          >
            <Heart
              className={`h-[19px] w-[19px] transition ${
                isAuthenticated && favorites.length > 0
                  ? 'fill-red-600 text-red-600'
                  : 'text-logo-purple hover:text-red-600'
              }`}
            />
          </Link>

          {/* 5. Ícone de Chat — Sala de Comunicação */}
          <Link
            href="/negociacoes"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                openAuthModal();
              }
            }}
            className="relative inline-flex items-center py-1 text-logo-purple transition hover:text-logo-purple-light"
            title="Chat e Negociações"
            aria-label="Chat e Negociações"
          >
            <MessageSquare className="h-[19px] w-[19px]" />
          </Link>

          {/* 5. Sair diretamente no cabeçalho quando autenticado */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                logout();
                setShowProfileMenu(false);
                setShowSettingsMenu(false);
              }}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-red-600 transition hover:text-red-700 sm:text-xs"
              title="Sair da conta"
              aria-label="Sair"
            >
              <LogOut className="h-[19px] w-[19px]" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
      </header>

      {/* BARRA DE CATEGORIAS — Travada no topo ao rolar o feed */}
      <nav
        ref={categoryNavRef}
        aria-label="Categorias de produtos"
        className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-2xs"
      >
        <div className="mx-auto flex w-full max-w-[1024px] items-center justify-between gap-4 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
          {PRODUCT_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            const isOpen = openCategoryMenu === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setActiveSubcategory(null);
                  setOpenCategoryMenu((prev) => (prev === category ? null : category));
                  router.push('/');
                }}
                className={`shrink-0 whitespace-nowrap text-[15px] font-semibold transition ${
                  isActive || isOpen
                    ? 'text-logo-purple-light underline decoration-2 underline-offset-4'
                    : 'text-logo-purple hover:text-logo-purple-light'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Menu Vertical de Subcategorias — 1024 px no desktop, vertical no mobile */}
        {openCategoryMenu && CATEGORY_SUBCATEGORIES[openCategoryMenu] && (
          <div className="absolute left-0 right-0 top-full z-50 px-3 sm:px-0">
            <div className="mx-auto mt-1 w-full max-w-[1024px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-uva-700">
                  {openCategoryMenu}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(openCategoryMenu);
                    setActiveSubcategory(null);
                    setSearchQuery('');
                    setOpenCategoryMenu(null);
                    router.push('/');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-uva-700"
                >
                  Ver todos
                </button>
              </div>

              <ul className="grid max-h-[65vh] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {CATEGORY_SUBCATEGORIES[openCategoryMenu].map((sub) => {
                  const isSubSelected =
                    activeCategory === openCategoryMenu && activeSubcategory === sub;
                  return (
                    <li key={sub}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory(openCategoryMenu);
                          setActiveSubcategory(sub);
                          setOpenCategoryMenu(null);
                          router.push('/');
                        }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                          isSubSelected
                            ? 'bg-uva-50 font-bold text-uva-700'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-uva-700'
                        }`}
                      >
                        {sub}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </nav>
      {showAdminPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-logo-purple">Acesso Administrativo</h2>
              <button
                type="button"
                onClick={() => setShowAdminPasswordModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Digite a senha para acessar o painel administrativo.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (adminPasswordInput === 'admin123') {
                  window.sessionStorage.setItem('mp_admin_unlocked', 'true');
                  setShowAdminPasswordModal(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                  router.push('/admin');
                } else {
                  setAdminPasswordError('Senha incorreta.');
                }
              }}
              className="mt-3 space-y-3"
            >
              <input
                type="password"
                autoFocus
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  if (adminPasswordError) setAdminPasswordError('');
                }}
                placeholder="Digite a senha"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-logo-purple focus:bg-white focus:outline-none"
              />
              {adminPasswordError && (
                <p className="text-xs font-semibold text-red-600">{adminPasswordError}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordModal(false)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-logo-purple px-4 py-2 text-xs font-bold text-white hover:bg-logo-purple-light"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AuthModal />
    </>
  );
}
