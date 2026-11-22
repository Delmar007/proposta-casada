'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Heart,
  Trash2,
  Send,
} from 'lucide-react';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { PublicVehicle } from '@/lib/domain/types';
import { BrandLogo } from '@/components/BrandLogo';

interface NegotiationSummary {
  id: string;
  code: string;
  vehicleId: string;
  vehicleTitle: string;
  vehicleImageUrl?: string;
  buyerAlias: string;
  sellerAlias: string;
  modality: 'cash_only' | 'trade_in_plus_cash';
  status: string;
  agreedTotalValue?: number;
  viewerRole: string;
  updatedAt: string;
}

export default function NegotiationsAndFavoritesHubPage() {
  const { userId, favorites, toggleFavorite, notifications } = useActiveUser();
  const [items, setItems] = useState<NegotiationSummary[]>([]);
  const [allVehicles, setAllVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/negotiations', { headers: { 'x-user-id': userId } }).then((r) => r.json()),
      fetch('/api/vehicles').then((r) => r.json()),
    ])
      .then(([negData, vehData]) => {
        setItems(negData.negotiations ?? []);
        setAllVehicles(vehData.vehicles ?? []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const favoriteVehicles = allVehicles.filter((v) => favorites.includes(v.id));

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6">
      {/* Cabeçalho da Central de Favoritos & Comunicação entre Usuários */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
            <Heart className="h-5 w-5 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              Favoritos & Comunicação entre Usuários
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Gerencie seus veículos favoritados e converse com compradores e proprietários em
              salas protegidas por anonimato e moderação.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          <ShieldCheck className="h-4 w-4" />
          Sigilo & Chat Moderado
        </span>
      </div>

      {/* SEÇÃO 1: SALAS DE COMUNICAÇÃO E NEGOCIAÇÃO ATIVAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <MessageSquare className="h-4 w-4 text-purple-600" />
            Comunicação Ativa entre Usuários ({items.length})
          </h2>
          {notifications.length > 0 && (
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              {notifications.length} atualização(ões) recente(s)
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando salas de comunicação...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <MessageSquare className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-800">
              Nenhuma conversa iniciada ainda para este perfil
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Envie uma proposta em um dos seus veículos favoritos abaixo ou direto pelo feed para
              abrir a sala de comunicação com o proprietário.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => (
              <Link
                key={n.id}
                href={`/negociacoes/${n.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-purple-300 hover:shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.vehicleImageUrl && (
                      <img
                        src={n.vehicleImageUrl}
                        alt={n.vehicleTitle}
                        className="h-[20px] w-[20px] shrink-0 rounded-full border border-slate-200 object-cover"
                      />
                    )}
                    <span className="rounded bg-uva-700 px-2 py-0.5 text-xs font-bold text-white">
                      {n.code}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{n.vehicleTitle}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      {n.modality === 'trade_in_plus_cash'
                        ? 'Permuta + Dinheiro'
                        : 'Somente Dinheiro'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Chat protegido entre:{' '}
                    <strong className="text-slate-700">{n.buyerAlias}</strong> ↔{' '}
                    <strong className="text-slate-700">{n.sellerAlias}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      n.status === 'ACORDO_CONFIRMADO'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {n.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white">
                    Abrir Chat
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: VEÍCULOS FAVORITADOS (ATALHO PARA INICIAR COMUNICAÇÃO) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Heart className="h-4 w-4 fill-purple-600 text-purple-600" />
          Meus Veículos Favoritos ({favoriteVehicles.length})
        </h2>

        {favoriteVehicles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Você ainda não marcou nenhum veículo com o coração.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-uva-700 px-4 py-2 text-xs font-bold text-white"
            >
              Explorar Feed 1024 px
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favoriteVehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                    <p className="mt-1 text-xs font-extrabold text-slate-900">
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
      </section>
    </div>
  );
}
