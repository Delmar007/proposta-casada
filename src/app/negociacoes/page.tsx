'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { AuthGate } from '@/components/AuthGate';

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

export default function NegotiationsCommunicationPage() {
  const { userId, notifications, favorites, isAuthenticated } = useActiveUser();
  const [items, setItems] = useState<NegotiationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/negotiations', { headers: { 'x-user-id': userId } })
      .then((r) => r.json())
      .then((negData) => setItems(negData.negotiations ?? []))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Faça login para acessar o Chat e Negociações"
        description="Visitantes podem navegar livremente pelo site. Para negociar e conversar com segurança, entre com Google ou Facebook."
      >
        <></>
      </AuthGate>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-6">
      {/* Cabeçalho da Central de Comunicação */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uva-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-uva-700 text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              Comunicação & Negociações Protegidas
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Converse com compradores e proprietários em salas protegidas por anonimato e
              moderação obrigatória.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/favoritos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-uva-200 bg-uva-50 px-3 py-1.5 text-xs font-bold text-uva-800 hover:bg-uva-100"
          >
            <Heart className="h-3.5 w-3.5 fill-uva-700 text-uva-700" />
            Favoritos ({favorites.length})
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-uva-50 px-3 py-1 text-xs font-semibold text-uva-800">
            <ShieldCheck className="h-4 w-4 text-uva-700" />
            Sigilo & Chat Moderado
          </span>
        </div>
      </div>

      {/* SALAS DE COMUNICAÇÃO E NEGOCIAÇÃO ATIVAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <MessageSquare className="h-4 w-4 text-uva-700" />
            Comunicação Ativa entre Usuários ({items.length})
          </h2>
          {notifications.length > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {notifications.length} atualização(ões) recente(s)
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando salas de comunicação...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <MessageSquare className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-800">
              Nenhuma conversa iniciada ainda para este perfil
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Envie uma proposta no feed ou acesse seus favoritos para iniciar uma negociação.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-uva-700 px-4 py-2 text-xs font-bold text-white hover:bg-uva-600"
              >
                Ver Veículos
              </Link>
              <Link
                href="/favoritos"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Ver Favoritos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => (
              <Link
                key={n.id}
                href={`/negociacoes/${n.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-uva-300 hover:shadow-xs"
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
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-uva-50 text-uva-800'
                    }`}
                  >
                    {n.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-uva-700 px-3 py-1.5 text-xs font-bold text-white">
                    Abrir Chat
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
