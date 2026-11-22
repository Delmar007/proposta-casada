'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Lock, Repeat } from 'lucide-react';
import { PublicVehicle } from '@/lib/domain/types';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { VehicleFeedBox } from '@/components/VehicleFeedBox';

export default function MarketplaceHomePage() {
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, favorites } = useActiveUser();

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.version.toLowerCase().includes(q) ||
        (v.engine ?? '').toLowerCase().includes(q) ||
        v.fuel.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-[1024px]">
      {/* =====================================================================
          BANNER PRINCIPAL — 1024 x 320 px no desktop, responsivo para mobile
         ===================================================================== */}
      <section className="relative flex min-h-[220px] w-full max-w-[1024px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-uva-700 via-uva-600 to-uva-700 p-5 text-white shadow-sm md:h-[320px] md:p-6">
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300 backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4" />
            Privacidade & Negociação Protegida • 1024 px
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Integrado à Tabela FIPE Oficial
          </span>
        </div>

        {/* Centro do Banner */}
        <div className="relative z-10 my-4 max-w-2xl space-y-3 md:my-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            Compre, venda ou negocie com permuta sem expor seus dados pessoais
          </h1>
          <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
            Escolha modelo e versão direto pela API FIPE, envie propostas à vista ou com seu
            veículo na troca + complemento em dinheiro e converse pelos Favoritos com moderação e
            anonimato.
          </p>
        </div>

        {/* Rodapé do Banner */}
        <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-xs">
            <Lock className="h-4 w-4 shrink-0 text-purple-400" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Identidade Anônima</p>
              <p className="truncate text-[11px] text-slate-300">
                Sem CPF, telefone ou WhatsApp exposto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-xs">
            <Repeat className="h-4 w-4 shrink-0 text-purple-400" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Permuta + Complemento</p>
              <p className="truncate text-[11px] text-slate-300">
                Cálculo automático e fotos sem EXIF
              </p>
            </div>
          </div>

          <Link
            href="/negociacoes"
            className="flex items-center justify-between gap-2.5 rounded-xl border border-purple-400/40 bg-purple-600/90 px-3.5 py-2.5 text-white transition hover:bg-purple-600"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Heart className="h-4 w-4 shrink-0 fill-white" />
              <div className="min-w-0">
                <p className="text-xs font-bold">Favoritos & Comunicação</p>
                <p className="truncate text-[11px] text-purple-100">
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
