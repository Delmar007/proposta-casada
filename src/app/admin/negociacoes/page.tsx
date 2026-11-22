'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  Ban,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { useActiveUser } from '@/components/ActiveUserProvider';
import {
  AdminDashboardMetrics,
  ModerationAction,
  Negotiation,
  NegotiationMessage,
  NegotiationModerationLog,
  PublicVehicle,
  SafeMeetingAppointment,
  TradeInImage,
  TradeInOffer,
  TradeInVehicle,
  UserProfile,
} from '@/lib/domain/types';

type SubmenuKey =
  | 'pending'
  | 'cash'
  | 'trade_in'
  | 'counteroffers'
  | 'accepted'
  | 'completed'
  | 'appointments'
  | 'blocked'
  | 'logs';

interface PendingItem {
  message: NegotiationMessage;
  negotiation: Negotiation;
  vehicle: PublicVehicle | null;
  tradeInVehicle: TradeInVehicle | null;
  offer: TradeInOffer | null;
  images: TradeInImage[];
  senderIdentityForAdmin: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  history: NegotiationMessage[];
}

interface AdminDashboardPayload {
  metrics: AdminDashboardMetrics;
  pendingMessages: PendingItem[];
  cashProposals: Negotiation[];
  tradeInProposals: Negotiation[];
  counteroffers: NegotiationMessage[];
  acceptedNegotiations: Negotiation[];
  completedNegotiations: Negotiation[];
  appointments: SafeMeetingAppointment[];
  blockedUsers: UserProfile[];
  moderationLogs: NegotiationModerationLog[];
}

const SUBMENUS: Array<{ key: SubmenuKey; label: string }> = [
  { key: 'pending', label: 'Mensagens aguardando moderação' },
  { key: 'cash', label: 'Propostas em dinheiro' },
  { key: 'trade_in', label: 'Propostas com permuta' },
  { key: 'counteroffers', label: 'Contrapropostas' },
  { key: 'accepted', label: 'Negociações aceitas' },
  { key: 'completed', label: 'Negociações concluídas' },
  { key: 'appointments', label: 'Agendamentos de encontros' },
  { key: 'blocked', label: 'Usuários bloqueados' },
  { key: 'logs', label: 'Histórico de moderação' },
];

export default function AdminNegotiationsCenterPage() {
  const { userId, refreshNotifications } = useActiveUser();
  const [submenu, setSubmenu] = useState<SubmenuKey>('pending');
  const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [actionFeedback, setActionFeedback] = useState('');

  const loadDashboard = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/negotiations', {
        headers: { 'x-user-id': userId },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Acesso negado.');
        setDashboard(null);
      } else {
        setDashboard(json);
      }
    } catch {
      setError('Erro ao carregar Central de Negociações.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAction = async (messageId: string, action: ModerationAction) => {
    setActionFeedback('');
    const reason =
      reasons[messageId]?.trim() ||
      (action === 'approve'
        ? 'Mensagem dentro das normas de privacidade.'
        : 'Ação registrada pela moderação.');

    const res = await fetch('/api/admin/negotiations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        messageId,
        action,
        reason,
        editedText: editedTexts[messageId],
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setActionFeedback(json.error ?? 'Falha ao executar ação.');
    } else {
      setActionFeedback(`Ação "${action}" registrada com sucesso.`);
      await loadDashboard();
      await refreshNotifications();
    }
  };

  const formatBRL = (v?: number) =>
    v !== undefined
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '-';

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Carregando Central de Negociações...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-2xl border border-purple-200 bg-white p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-purple-600" />
        <h1 className="mt-3 text-base font-bold text-slate-900">
          Central de Moderação Administrativa
        </h1>
        <p className="mt-1 text-xs text-red-600">{error}</p>
        <p className="mt-2 text-xs text-slate-500">
          Selecione &ldquo;Ana Paula (Moderadora)&rdquo; ou &ldquo;Roberto (Supervisor)&rdquo; no
          seletor de perfil no topo para acessar este painel.
        </p>
      </div>
    );
  }

  const { metrics } = dashboard;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">CENTRAL DE NEGOCIAÇÕES</h1>
        <p className="mt-1 text-xs text-slate-500">
          Painel exclusivo para moderação de mensagens, validação de permutas, proteção contra
          vazamento de dados e auditoria administrativa.
        </p>

        {/* 8 Indicadores Obrigatórios */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Mensagens recebidas</p>
            <p className="text-xl font-bold text-slate-900">{metrics.mensagensRecebidas}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Mensagens aprovadas</p>
            <p className="text-xl font-bold text-purple-700">{metrics.mensagensAprovadas}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Mensagens rejeitadas</p>
            <p className="text-xl font-bold text-red-600">{metrics.mensagensRejeitadas}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Tempo médio de moderação</p>
            <p className="text-xl font-bold text-slate-900">
              {metrics.tempoMedioModeracaoSegundos}s
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Propostas em dinheiro</p>
            <p className="text-xl font-bold text-slate-900">{metrics.propostasEmDinheiro}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Propostas com permuta</p>
            <p className="text-xl font-bold text-slate-900">{metrics.propostasComPermuta}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Acordos confirmados</p>
            <p className="text-xl font-bold text-purple-700">{metrics.acordosConfirmados}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Encontros agendados</p>
            <p className="text-xl font-bold text-slate-900">{metrics.encontrosAgendados}</p>
          </div>
        </div>
      </div>

      {/* Navegação dos 9 submenus */}
      <div className="flex flex-wrap gap-2">
        {SUBMENUS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSubmenu(item.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              submenu === item.key
                ? 'bg-uva-700 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionFeedback && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs font-semibold text-purple-800">
          {actionFeedback}
        </div>
      )}

      {/* Conteúdo do submenu ativo */}
      {submenu === 'pending' && (
        <div className="space-y-4">
          {dashboard.pendingMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Nenhuma mensagem aguardando moderação no momento.
            </div>
          ) : (
            dashboard.pendingMessages.map((item) => (
              <div
                key={item.message.id}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-uva-700 px-2 py-0.5 text-xs font-bold text-white">
                        {item.negotiation.code}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {item.vehicle
                          ? `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.modelYear}`
                          : 'Veículo'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {item.negotiation.modality === 'trade_in_plus_cash'
                          ? 'Permuta + Dinheiro'
                          : 'Somente Dinheiro'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Remetente interno: <strong>{item.message.senderAlias}</strong>
                      {item.senderIdentityForAdmin && (
                        <span className="ml-2 text-slate-400">
                          (Uso interno admin: {item.senderIdentityForAdmin.fullName} •{' '}
                          {item.senderIdentityForAdmin.email})
                        </span>
                      )}
                    </p>
                  </div>

                  {item.offer && (
                    <div className="text-right text-xs">
                      <p className="text-slate-500">
                        Dinheiro: <strong>{formatBRL(item.offer.cashComplement)}</strong>
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        Total: {formatBRL(item.offer.totalOfferValue)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Alerta automático de PII / Contato */}
                {item.message.piiFlags.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                    <p className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="h-4 w-4" />
                      Alerta Automático de Vazamento de Identidade / Contato
                    </p>
                    <ul className="mt-1 list-disc pl-5">
                      {item.message.piiFlags.map((f, idx) => (
                        <li key={idx}>
                          <strong>{f.category}</strong>: &ldquo;{f.match}&rdquo; ({f.description})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dados da Permuta + 6 Fotos */}
                {item.tradeInVehicle && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                    <p className="font-bold text-slate-900">
                      Veículo na Permuta: {item.tradeInVehicle.brand} {item.tradeInVehicle.model}{' '}
                      {item.tradeInVehicle.version} ({item.tradeInVehicle.manufactureYear}/
                      {item.tradeInVehicle.modelYear})
                    </p>
                    <p className="mt-1 text-slate-600">
                      {item.tradeInVehicle.mileage.toLocaleString('pt-BR')} km •{' '}
                      {item.tradeInVehicle.fuel} • {item.tradeInVehicle.transmission} •{' '}
                      {item.tradeInVehicle.color} • {item.tradeInVehicle.city}/
                      {item.tradeInVehicle.state} • Valor atribuído:{' '}
                      <strong>{formatBRL(item.tradeInVehicle.declaredValue)}</strong>
                    </p>

                    {item.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {item.images.map((img) => (
                          <div
                            key={img.id}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                          >
                            <img
                              src={img.previewDataUrl}
                              alt={img.slotLabel}
                              className="h-16 w-full object-cover"
                            />
                            <p className="truncate px-1.5 py-1 text-[10px] text-slate-600">
                              {img.slotLabel}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Texto integral + edição preservando original */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Texto integral enviado (edite abaixo apenas se optar por &ldquo;Editar e
                    aprovar&rdquo; — o texto original será preservado no histórico):
                  </label>
                  <textarea
                    rows={3}
                    value={editedTexts[item.message.id] ?? item.message.messageText}
                    onChange={(e) =>
                      setEditedTexts((prev) => ({
                        ...prev,
                        [item.message.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                  />
                </div>

                {/* Justificativa interna */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Justificativa interna da decisão administrativa:
                  </label>
                  <input
                    placeholder="Ex: Mensagem aprovada sem dados pessoais / Rejeitada por tentativa de envio de WhatsApp..."
                    value={reasons[item.message.id] ?? ''}
                    onChange={(e) =>
                      setReasons((prev) => ({
                        ...prev,
                        [item.message.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                {/* 6 Ações Administrativas */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'approve')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprovar mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'edit_and_approve')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar e aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'reject')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rejeitar mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'request_correction')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Solicitar correção
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'escalate_senior')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Encaminhar para análise superior
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.message.id, 'block_user')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Bloquear usuário
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(submenu === 'cash' ||
        submenu === 'trade_in' ||
        submenu === 'accepted' ||
        submenu === 'completed') && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            {(submenu === 'cash'
              ? dashboard.cashProposals
              : submenu === 'trade_in'
              ? dashboard.tradeInProposals
              : submenu === 'accepted'
              ? dashboard.acceptedNegotiations
              : dashboard.completedNegotiations
            ).map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div>
                  <strong className="text-slate-900">{n.code}</strong> — {n.buyerAlias} ↔{' '}
                  {n.sellerAlias} ({n.status})
                </div>
                <Link
                  href={`/negociacoes/${n.id}`}
                  className="font-semibold text-purple-600 hover:underline"
                >
                  Abrir sala
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {submenu === 'counteroffers' && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          {dashboard.counteroffers.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <strong>{c.senderAlias}</strong> ({c.moderationStatus}): {c.messageText}
            </div>
          ))}
        </div>
      )}

      {submenu === 'appointments' && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          {dashboard.appointments.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <strong>{a.locationName}</strong> — {a.locationAddress} •{' '}
              {new Date(a.scheduledAt).toLocaleString('pt-BR')} ({a.status})
            </div>
          ))}
        </div>
      )}

      {submenu === 'blocked' && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          {dashboard.blockedUsers.map((u) => (
            <div key={u.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
              <strong>{u.fullName}</strong> ({u.email}) — Motivo: {u.blockedReason}
            </div>
          ))}
        </div>
      )}

      {submenu === 'logs' && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-xs">
          {dashboard.moderationLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <strong>
                  {log.administratorName} • Ação: {log.action}
                </strong>
                <span className="text-slate-400">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="mt-1 text-slate-600">Justificativa: {log.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
