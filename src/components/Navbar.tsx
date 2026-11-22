'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Settings,
  User,
  LogIn,
  Heart,
  LogOut,
  X,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { DEMO_USERS, useActiveUser } from './ActiveUserProvider';
import { AuthModal } from './AuthModal';

const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  Carros: [
    'Sedã',
    'Hatch',
    'SUV',
    'Picape / Camionete',
    'Conversível',
    'Jipe',
    'Perua / Wagon',
    'Cupê / Esportivo',
    'Minivan / Monovolume',
    'Elétrico / Híbrido',
  ],
  Motos: [
    'Street / Urbana',
    'Esportiva',
    'Trail / Big Trail',
    'Custom / Cruiser',
    'Scooter',
    'Naked',
    'Off-Road / Cross',
  ],
  Caminhões: [
    'Leve / VUC',
    '3/4',
    'Toco (4x2)',
    'Truck (6x2 / 6x4)',
    'Cavalo Mecânico',
    'Baú / Sider',
    'Caçamba / Basculante',
  ],
  'Ônibus/Vans': [
    'Van de Passageiros',
    'Furgão',
    'Micro-ônibus',
    'Ônibus Rodoviário',
    'Ônibus Urbano',
    'Escolar / Executivo',
  ],
  'Triciclos/Quadriciclos/UTVs': [
    'Triciclo',
    'Quadriciclo (ATV)',
    'UTV / Side-by-Side',
    'Buggy',
  ],
  Náutica: [
    'Barco',
    'Lancha',
    'Jet Ski',
    'Iate',
    'Veleiro',
    'Bote / Inflável',
    'Catamarã / Escuna',
  ],
  'Tratores/Rebocáveis': [
    'Trator Agrícola',
    'Colheitadeira',
    'Carreta / Semirreboque',
    'Reboque / Carretinha',
    'Trailer / Motorhome',
    'Implemento Agrícola',
  ],
  Residências: [
    'Casa',
    'Apartamento',
    'Cobertura',
    'Sobrado',
    'Condomínio Fechado',
    'Kitnet / Studio',
    'Terreno Residencial',
  ],
  Comerciais: [
    'Sala Comercial',
    'Loja / Ponto Comercial',
    'Galpão / Depósito',
    'Prédio Comercial',
    'Hotel / Pousada',
    'Terreno Comercial',
  ],
  Rurais: [
    'Fazenda',
    'Sítio',
    'Chácara',
    'Haras',
    'Área Rural / Gleba',
  ],
};

const PRODUCT_CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES);

export function Navbar() {
  const router = useRouter();
  const {
    userId,
    setUserId,
    currentUser,
    notifications,
    isAuthenticated,
    authProvider,
    openAuthModal,
    login,
    logout,
    favorites,
    searchQuery,
    setSearchQuery,
  } = useActiveUser();

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Carros');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);
  const categoryNavRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryNavRef.current && !categoryNavRef.current.contains(e.target as Node)) {
        setOpenCategoryMenu(null);
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
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-0">
        {/* LOGO — 280 px de largura no desktop */}
        <Link
          href="/"
          className="flex w-full shrink-0 items-center sm:w-[280px]"
          title="Proposta Casada — Marketplace com Negociação Protegida"
        >
          <img
            src="/logo-proposta-casada.png"
            alt="Proposta Casada — Negociação Protegida"
            className="h-[58px] w-auto max-w-[280px] object-contain"
          />
        </Link>

        {/* BARRA DE BUSCA CENTRAL */}
        <form
          onSubmit={handleSearchSubmit}
          className="order-3 flex w-full flex-1 items-center sm:order-2 sm:w-auto"
        >
          <div className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar marca, modelo, versão, motorização ou cidade..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-uva-700 focus:bg-white focus:outline-none sm:py-2 sm:text-xs"
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

        {/* LADO DIREITO — Apenas palavras e ícones (sem caixas/bordas de botão) */}
        <div className="order-2 flex shrink-0 items-center gap-4 sm:order-3">
          {/* 1. Engrenagem (Configurações / Central Admin) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSettingsMenu((v) => !v);
                setShowProfileMenu(false);
              }}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-700 transition hover:text-uva-700 sm:text-xs"
              title="Configurações e Central de Moderação"
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
                    className="flex items-center justify-between rounded-lg bg-uva-700 px-3 py-2 font-semibold text-white hover:bg-uva-600"
                  >
                    <span>Central de Moderação (Admin)</span>
                    <Settings className="h-3.5 w-3.5" />
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
              className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-uva-700 transition hover:text-uva-600 sm:text-xs"
              title="Cadastrar ou Entrar com Google / Facebook"
            >
              <LogIn className="h-[19px] w-[19px]" />
              <span>Entrar</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu((v) => !v);
                  setShowSettingsMenu(false);
                }}
                className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-slate-800 transition hover:text-uva-700 sm:text-xs"
                title={`Logado como ${currentUser.label}`}
                aria-label="Perfil do Usuário"
              >
                <User className="h-[19px] w-[19px] text-uva-700" />
                <span className="hidden max-w-[110px] truncate md:inline">
                  {currentUser.label.split(' ')[0]}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                  <div className="border-b border-slate-100 pb-2.5">
                    <p className="text-xs font-bold text-slate-900">{currentUser.label}</p>
                    <p className="text-[11px] text-slate-500">
                      Função: {currentUser.roleLabel}
                      {authProvider ? ` • Login ${authProvider === 'google' ? 'Google' : 'Facebook'}` : ''}
                    </p>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase text-slate-400">
                      Trocar usuário logado
                    </label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      {DEMO_USERS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Ícone de Sino ao lado do Perfil — abre diretamente a página de Negociações */}
          <Link
            href="/negociacoes"
            className="relative inline-flex items-center py-1 text-slate-700 transition hover:text-uva-700"
            title="Abrir página de negociações"
            aria-label="Abrir página de negociações"
          >
            <Bell className="h-[19px] w-[19px]" />
            {notifications.length > 0 && (
              <span className="absolute -right-1.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                {notifications.length}
              </span>
            )}
          </Link>

          {/* 4. Ícone de Coração — Favoritos */}
          <Link
            href="/negociacoes"
            className="relative inline-flex items-center py-1 text-slate-700 transition hover:text-uva-700"
            title="Favoritos"
            aria-label="Favoritos"
          >
            <Heart className="h-[19px] w-[19px] fill-uva-700 text-uva-700" />
            {favorites.length > 0 && (
              <span className="absolute -right-1.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* 5. Ícone de Chat — Sala de Comunicação */}
          <Link
            href="/negociacoes"
            className="relative inline-flex items-center py-1 text-slate-700 transition hover:text-uva-700"
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
                  setOpenCategoryMenu((prev) => (prev === category ? null : category));
                }}
                className={`shrink-0 whitespace-nowrap text-[15px] font-semibold transition ${
                  isActive || isOpen
                    ? 'text-uva-700 underline decoration-2 underline-offset-4'
                    : 'text-slate-600 hover:text-uva-700'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Menu Vertical de Subcategorias — 940 px no desktop, vertical no mobile */}
        {openCategoryMenu && CATEGORY_SUBCATEGORIES[openCategoryMenu] && (
          <div className="absolute left-0 right-0 top-full z-50 px-3 sm:px-0">
            <div className="mx-auto mt-1 w-full max-w-[940px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
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
      <AuthModal />
    </>
  );
}
