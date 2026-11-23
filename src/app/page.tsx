'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Lock, Repeat, Filter, X } from 'lucide-react';
import { PublicVehicle } from '@/lib/domain/types';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { VehicleFeedBox } from '@/components/VehicleFeedBox';

export default function MarketplaceHomePage() {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    searchQuery,
    favorites,
    activeCategory,
    activeSubcategory,
    clearAllFilters,
  } = useActiveUser();

  useEffect(() => {
    fetch('/api/vehicles', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []))
      .finally(() => setLoading(false));
  }, []);

  const normalizeText = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredVehicles = useMemo(() => {
    const sorted = [...vehicles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted.filter((v) => {
      const itemCategory = v.category || (v.listingType === 'property' ? 'Residências' : 'Carros');

      if (activeCategory && normalizeText(itemCategory) !== normalizeText(activeCategory)) {
        return false;
      }

      if (activeSubcategory) {
        const subTokens = normalizeText(activeSubcategory)
          .split(/[\/\s]+/)
          .filter((t) => t.length >= 3);
        const haystack = normalizeText(
          [
            v.propertyType ?? '',
            v.brand,
            v.model,
            v.version,
            v.description,
            itemCategory,
          ].join(' ')
        );
        const matchesSub = subTokens.some((tok) => haystack.includes(tok));
        if (!matchesSub) return false;
      }

      const q = normalizeText(searchQuery.trim());
      if (q) {
        const searchable = normalizeText(
          [
            v.brand,
            v.model,
            v.version,
            itemCategory,
            v.propertyType ?? '',
            v.description,
            v.engine ?? '',
            v.fuel,
            v.color,
            v.city,
            v.state,
          ].join(' ')
        );
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, activeCategory, activeSubcategory]);

  const hasActiveFilter = Boolean(activeCategory || activeSubcategory || searchQuery.trim());

  return (
    <div className="mx-auto w-full max-w-[1024px]">
      {/* =====================================================================
          BANNER PRINCIPAL — 1024 x 250 px no desktop, responsivo para mobile
         ===================================================================== */}
      <section className="relative flex min-h-[220px] w-full max-w-[1024px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-uva-700 via-uva-600 to-uva-700 p-4 text-white shadow-sm md:h-[250px] md:p-5">
        {/* Background decorativo automotivo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1400&q=80')",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-uva-900/90 via-uva-700/75 to-uva-700/40" />

        {/* Topo do Banner */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-uva-300/40 bg-uva-900/50 px-3 py-1 text-xs font-bold text-uva-100 backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4 text-uva-300" />
            Privacidade & Negociação Protegida
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-uva-200" />
            Integrado à Tabela FIPE Oficial
          </span>
        </div>

        {/* Centro do Banner */}
        <div className="relative z-10 my-3 max-w-2xl space-y-1.5 md:my-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-[28px]">
            Compre, venda ou negocie com permuta sem expor seus dados pessoais
          </h1>
          <p className="text-sm leading-snug text-slate-100/90 md:text-xs">
            Escolha modelo e versão direto pela API FIPE, envie propostas à vista ou com seu
            veículo na troca + complemento em dinheiro e converse pelos Favoritos com moderação e
            anonimato.
          </p>
        </div>

        {/* Rodapé do Banner */}
        <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-xs">
            <Lock className="h-4 w-4 shrink-0 text-uva-200" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white sm:text-xs">Identidade Anônima</p>
              <p className="truncate text-xs text-slate-100/80 sm:text-[11px]">
                Sem CPF, telefone ou WhatsApp exposto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-xs">
            <Repeat className="h-4 w-4 shrink-0 text-uva-200" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white sm:text-xs">Permuta + Complemento</p>
              <p className="truncate text-xs text-slate-100/80 sm:text-[11px]">
                Cálculo automático e fotos sem EXIF
              </p>
            </div>
          </div>

          <Link
            href="/negociacoes"
            className="flex items-center justify-between gap-2.5 rounded-xl border border-uva-300/40 bg-uva-500/90 px-3.5 py-2.5 text-white transition hover:bg-uva-500"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Heart className="h-4 w-4 shrink-0 fill-white" />
              <div className="min-w-0">
                <p className="text-sm font-bold sm:text-xs">Favoritos & Comunicação</p>
                <p className="truncate text-xs text-uva-50 sm:text-[11px]">
                  {favorites.length} favorito(s) • Chat protegido
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* =====================================================================
          FEED DE VEÍCULOS — Desktop: 1024 x 400 px (3 partes horizontais)
                             Mobile: 9:16 vertical (padrão smartphone)
                             Distância de 5px abaixo do banner
         ===================================================================== */}
      <section className="mt-[5px]">
        {hasActiveFilter && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-logo-purple/20 bg-white px-4 py-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-logo-purple">
                <Filter className="h-3.5 w-3.5" />
                Filtro ativo:
              </span>
              {activeCategory && (
                <span className="rounded-full bg-logo-purple-50 px-2.5 py-0.5 font-bold text-logo-purple">
                  {activeCategory}
                  {activeSubcategory ? ` → ${activeSubcategory}` : ''}
                </span>
              )}
              {searchQuery.trim() && (
                <span className="rounded-full bg-logo-green-50 px-2.5 py-0.5 font-bold text-logo-purple-950">
                  Busca: &ldquo;{searchQuery.trim()}&rdquo;
                </span>
              )}
              <span className="text-slate-500">
                ({filteredVehicles.length}{' '}
                {filteredVehicles.length === 1 ? 'resultado' : 'resultados'})
              </span>
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtro
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="mx-auto w-full max-w-[400px] aspect-[9/16] animate-pulse rounded-2xl border border-slate-200 bg-white md:max-w-[1024px] md:aspect-auto md:h-[320px]"
              />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-800">
              Nenhum veículo encontrado para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Limpe o filtro na barra de busca superior para visualizar todos os anúncios.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredVehicles.map((v) => (
              <VehicleFeedBox key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
