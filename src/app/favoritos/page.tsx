'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Send, Trash2, ArrowRight } from 'lucide-react';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { PublicVehicle } from '@/lib/domain/types';
import { BrandLogo } from '@/components/BrandLogo';

export default function FavoritosPage() {
  const { favorites, toggleFavorite } = useActiveUser();
  const [allVehicles, setAllVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((d) => setAllVehicles(d.vehicles ?? []))
      .finally(() => setLoading(false));
  }, []);

  const favoriteVehicles = allVehicles.filter((v) => favorites.includes(v.id));

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uva-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-uva-700 text-white">
            <Heart className="h-5 w-5 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              Meus Veículos Favoritos ({favoriteVehicles.length})
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Veículos salvos para comparar valores FIPE e iniciar propostas ou permutas.
            </p>
          </div>
        </div>
        <Link
          href="/negociacoes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-uva-200 bg-uva-50 px-3.5 py-2 text-xs font-bold text-uva-800 transition hover:bg-uva-100"
        >
          Ir para Comunicação
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Carregando favoritos...
        </div>
      ) : favoriteVehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-800">
            Você ainda não marcou nenhum veículo com o coração.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Clique no coração nos anúncios do feed para salvar seus favoritos aqui.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-uva-700 px-4 py-2 text-xs font-bold text-white hover:bg-uva-600"
          >
            Explorar Veículos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favoriteVehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={v.imageUrl}
                  alt={`${v.brand} ${v.model}`}
                  className="h-16 w-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <BrandLogo brand={v.brand} size={22} />
                    <p className="truncate text-sm font-bold text-slate-900">
                      {v.brand} {v.model}
                    </p>
                  </div>
                  <p className="truncate text-xs text-slate-500">{v.version}</p>
                  <p className="mt-1 text-xs font-extrabold text-uva-700">
                    FIPE {formatBRL(v.fipePrice)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Link
                  href={`/vehicles/${v.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-uva-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-uva-600"
                >
                  <Send className="h-3 w-3" />
                  Negociar
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavorite(v.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
