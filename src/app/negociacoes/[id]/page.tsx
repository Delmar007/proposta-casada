'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  Repeat,
  Lock,
} from 'lucide-react';
import { useActiveUser } from '@/components/ActiveUserProvider';
import { AuthGate } from '@/components/AuthGate';
import {
  NegotiationMessage,
  PublicVehicle,
  SafeMeetingAppointment,
  SafeMeetingLocation,
  TradeInImage,
  TradeInOffer,
  TradeInVehicle,
} from '@/lib/domain/types';

interface NegotiationDetailPayload {
  negotiation: {
    id: string;
    code: string;
    vehicleId: string;
    buyerAlias: string;
    sellerAlias: string;
    modality: 'cash_only' | 'trade_in_plus_cash';
    status: string;
    agreedTotalValue?: number;
    agreedTradeInValue?: number;
    agreedCashComplement?: number;
    buyerConfirmed: boolean;
    sellerConfirmed: boolean;
    viewerRole: 'buyer' | 'seller' | 'admin';
  };
  vehicle: PublicVehicle;
  tradeInVehicle: TradeInVehicle | null;
  offer: TradeInOffer | null;
  images: TradeInImage[];
  messages: NegotiationMessage[];
  appointments: SafeMeetingAppointment[];
}

export default function NegotiationDetailPage() {
  const params = useParams<{ id: string }>();
  const { userId, refreshNotifications, isAuthenticated } = useActiveUser();

  const [data, setData] = useState<NegotiationDetailPayload | null>(null);
  const [locations, setLocations] = useState<SafeMeetingLocation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat bottom composer
  const [messageText, setMessageText] = useState('');
  const [isCounteroffer, setIsCounteroffer] = useState(false);
  const [counterTradeIn, setCounterTradeIn] = useState('');
  const [counterCash, setCounterCash] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Seller separate evaluation
  const [evalTradeInValue, setEvalTradeInValue] = useState('');
  const [evalCondition, setEvalCondition] = useState('');
  const [evalPhotos, setEvalPhotos] = useState('');
  const [evalCash, setEvalCash] = useState('');
  const [evalTotal, setEvalTotal] = useState('');

  // Safe meeting scheduler
  const [selectedLocationId, setSelectedLocationId] = useState('loc-1');
  const [meetingDate, setMeetingDate] = useState('2026-11-25T14:00');
  const [meetingType, setMeetingType] = useState<
    'vistoria_veiculo' | 'conferencia_documental' | 'vistoria_e_conferencia'
  >('vistoria_e_conferencia');
  const [vehicleInspection, setVehicleInspection] = useState(true);
  const [documentCheck, setDocumentCheck] = useState(true);
  const [authorizeContact, setAuthorizeContact] = useState(false);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [negRes, locRes] = await Promise.all([
        fetch(`/api/negotiations/${params.id}`, {
          headers: { 'x-user-id': userId },
        }),
        fetch(`/api/negotiations/${params.id}/meetings`),
      ]);
      const negJson = await negRes.json();
      if (!negRes.ok) {
        setError(negJson.error ?? 'Acesso negado.');
        setData(null);
      } else {
        setData(negJson);
        if (negJson.offer?.sellerEvaluation) {
          const ev = negJson.offer.sellerEvaluation;
          setEvalTradeInValue(ev.tradeInValueAssessment ?? '');
          setEvalCondition(ev.conditionAssessment ?? '');
          setEvalPhotos(ev.photosAssessment ?? '');
          setEvalCash(ev.cashAssessment ?? '');
          setEvalTotal(ev.totalAssessment ?? '');
        }
      }
      if (locRes.ok) {
        const locJson = await locRes.json();
        setLocations(locJson.locations ?? []);
      }
    } catch {
      setError('Erro ao carregar negociação.');
    } finally {
      setLoading(false);
    }
  }, [params.id, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatBRL = (v?: number) =>
    v !== undefined
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '-';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    setFeedback('');

    try {
      const res = await fetch(`/api/negotiations/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          messageText,
          messageType: isCounteroffer ? 'counteroffer' : 'message',
          proposedTradeInValue:
            isCounteroffer && counterTradeIn ? Number(counterTradeIn) : undefined,
          proposedCashComplement:
            isCounteroffer && counterCash ? Number(counterCash) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback(json.error ?? 'Erro ao enviar.');
      } else {
        setMessageText('');
        setIsCounteroffer(false);
        setFeedback('Mensagem enviada com status AGUARDANDO MODERAÇÃO.');
        await loadData();
        await refreshNotifications();
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/negotiations/${params.id}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        tradeInValueAssessment: evalTradeInValue,
        conditionAssessment: evalCondition,
        photosAssessment: evalPhotos,
        cashAssessment: evalCash,
        totalAssessment: evalTotal,
      }),
    });
    if (res.ok) {
      setFeedback('Avaliação da permuta registrada com sucesso.');
      await loadData();
    }
  };

  const handleConfirmAgreement = async () => {
    const res = await fetch(`/api/negotiations/${params.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        authorizeContactDisclosure: authorizeContact,
      }),
    });
    if (res.ok) {
      setFeedback('Confirmação registrada!');
      await loadData();
      await refreshNotifications();
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/negotiations/${params.id}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        locationId: selectedLocationId,
        scheduledAt: meetingDate,
        meetingType,
        vehicleInspection,
        documentCheck,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback('Encontro seguro agendado com sucesso!');
      await loadData();
    } else {
      setFeedback(json.error ?? 'Erro ao agendar encontro.');
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Faça login para acessar esta Negociação"
        description="Visitantes podem navegar livremente pelo site. Para enviar mensagens, avaliar trocas ou agendar encontros, entre com Google ou Facebook."
      >
        <></>
      </AuthGate>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando sala protegida...</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm font-bold text-red-700">{error || 'Negociação indisponível.'}</p>
      </div>
    );
  }

  const { negotiation, vehicle, tradeInVehicle, offer, images, messages, appointments } = data;
  const isConfirmed = negotiation.status === 'ACORDO_CONFIRMADO';

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Negociação */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {vehicle.imageUrl && (
              <img
                src={vehicle.imageUrl}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-[20px] w-[20px] shrink-0 rounded-full border border-slate-200 object-cover"
              />
            )}
            <span className="rounded-lg bg-uva-700 px-2.5 py-1 text-xs font-bold text-white">
              {negotiation.code}
            </span>
            <h1 className="text-lg font-bold text-slate-900">
              {vehicle.brand} {vehicle.model} {vehicle.modelYear} — FIPE {formatBRL(vehicle.fipePrice)}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Identificadores exclusivos desta negociação:{' '}
            <strong className="text-slate-800">{negotiation.buyerAlias}</strong> ↔{' '}
            <strong className="text-slate-800">{negotiation.sellerAlias}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isConfirmed
                ? 'bg-purple-100 text-purple-800'
                : 'bg-purple-50 text-purple-700'
            }`}
          >
            Status: {negotiation.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LADO PRINCIPAL (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Resumo da Proposta & Permuta */}
          {offer && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Repeat className="h-4 w-4 text-slate-700" />
                  Resumo Financeiro da Proposta
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  {negotiation.modality === 'trade_in_plus_cash'
                    ? 'Permuta + Complemento'
                    : 'Somente Dinheiro'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {tradeInVehicle && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Preço para negócio (Permuta)</p>
                    <p className="text-base font-bold text-slate-900">
                      {formatBRL(tradeInVehicle.declaredValue)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {tradeInVehicle.brand} {tradeInVehicle.model} {tradeInVehicle.modelYear}
                    </p>
                  </div>
                )}
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Complemento em dinheiro</p>
                  <p className="text-base font-bold text-slate-900">
                    {formatBRL(offer.cashComplement)}
                  </p>
                </div>
                <div className="rounded-xl bg-uva-700 p-3 text-white">
                  <p className="text-[11px] text-slate-300">Preço para negócio (Total)</p>
                  <p className="text-base font-bold">{formatBRL(offer.totalOfferValue)}</p>
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Fotografias do veículo oferecido (EXIF removido • {images.length} fotos)
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={img.previewDataUrl}
                          alt={img.slotLabel}
                          className="h-24 w-full object-cover"
                        />
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-600">
                          <span>{img.slotLabel}</span>
                          <span className="font-semibold">{img.moderationStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Histórico de Mensagens Moderadas */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-bold text-slate-900">
                Histórico de Mensagens e Contrapropostas
              </h2>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Nenhuma mensagem liberada ainda. Mensagens enviadas aguardam aprovação da
                  moderação antes de chegarem ao destinatário.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {m.senderAlias}
                        </span>
                        {m.messageType === 'counteroffer' && (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                            Contraproposta
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        <Clock className="h-3 w-3" />
                        {m.moderationStatus}
                      </span>
                    </div>

                    {m.proposedTotalValue !== undefined && (
                      <p className="mt-1.5 text-xs font-semibold text-slate-800">
                        Valor proposto: {formatBRL(m.proposedTotalValue)}
                        {m.proposedTradeInValue !== undefined &&
                          ` (Permuta ${formatBRL(m.proposedTradeInValue)} + Dinheiro ${formatBRL(
                            m.proposedCashComplement ?? 0
                          )})`}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-800">{m.messageText}</p>
                    {m.moderationReason && m.moderationStatus === 'rejeitada' && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        Motivo da rejeição: {m.moderationReason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ÁREA INFERIOR: Caixa de texto e botão Enviar para Moderação */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-slate-200 bg-white p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isCounteroffer}
                    onChange={(e) => setIsCounteroffer(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Enviar como Contraproposta com novos valores
                </label>
                <span className="text-[11px] text-slate-400">
                  {messageText.length}/1000 caracteres
                </span>
              </div>

              {isCounteroffer && (
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    placeholder="Novo valor veículo permuta (R$)"
                    value={counterTradeIn}
                    onChange={(e) => setCounterTradeIn(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Novo valor em dinheiro (R$)"
                    value={counterCash}
                    onChange={(e) => setCounterCash(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              )}

              <textarea
                rows={3}
                maxLength={1000}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escreva sua mensagem ou contraproposta..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-uva-700 focus:outline-none"
              />

              {feedback && (
                <p className="mt-2 text-xs font-semibold text-purple-700">{feedback}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-lg text-[11px] leading-relaxed text-slate-500">
                  Para sua segurança, todas as mensagens passam por nossa equipe de moderação.
                  Seus dados pessoais não serão compartilhados com a outra parte durante a
                  negociação.
                </p>
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-uva-700 px-4 py-2 text-xs font-semibold text-white hover:bg-uva-600 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar para moderação
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PAINEL LATERAL (4 cols): Avaliação Separada, Fechamento e Encontro Seguro */}
        <div className="space-y-6 lg:col-span-4">
          {/* Avaliação separada pelo vendedor */}
          {negotiation.viewerRole === 'seller' && tradeInVehicle && (
            <form
              onSubmit={handleSaveEvaluation}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Avaliação Separada da Permuta
              </h3>
              <input
                placeholder="Avaliação do valor atribuído ao veículo"
                value={evalTradeInValue}
                onChange={(e) => setEvalTradeInValue(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                placeholder="Avaliação do estado de conservação"
                value={evalCondition}
                onChange={(e) => setEvalCondition(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                placeholder="Avaliação das fotografias"
                value={evalPhotos}
                onChange={(e) => setEvalPhotos(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                placeholder="Avaliação da quantia em dinheiro"
                value={evalCash}
                onChange={(e) => setEvalCash(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                placeholder="Avaliação do valor total"
                value={evalTotal}
                onChange={(e) => setEvalTotal(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-uva-700 py-2 text-xs font-semibold text-white"
              >
                Salvar avaliação
              </button>
            </form>
          )}

          {/* Fechamento da Negociação */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              Fechamento da Negociação
            </h3>
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Confirmação do comprador:{' '}
                <strong>{negotiation.buyerConfirmed ? 'Confirmado' : 'Pendente'}</strong>
              </p>
              <p>
                Confirmação do vendedor:{' '}
                <strong>{negotiation.sellerConfirmed ? 'Confirmado' : 'Pendente'}</strong>
              </p>
            </div>

            {!isConfirmed && (
              <>
                <label className="flex items-start gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={authorizeContact}
                    onChange={(e) => setAuthorizeContact(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  Autorizo expressamente o compartilhamento dos meus dados de contato na etapa de
                  fechamento, conforme necessidade da transação.
                </label>
                <button
                  type="button"
                  onClick={handleConfirmAgreement}
                  className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Confirmar Acordo Final
                </button>
              </>
            )}

            <p className="text-[11px] text-slate-500">
              A aceitação comercial não representa aprovação mecânica, documental ou transferência
              de propriedade.
            </p>
          </div>

          {/* Módulo de Encontro Seguro */}
          {isConfirmed && (
            <div className="space-y-4 rounded-2xl border border-purple-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapPin className="h-4 w-4 text-purple-600" />
                Agendar Encontro Seguro
              </h3>

              <form onSubmit={handleScheduleMeeting} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Local credenciado (sem endereços residenciais)
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} — {loc.city}/{loc.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Data e horário
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Tipo de encontro
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) =>
                      setMeetingType(
                        e.target.value as
                          | 'vistoria_veiculo'
                          | 'conferencia_documental'
                          | 'vistoria_e_conferencia'
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="vistoria_e_conferencia">
                      Vistoria do veículo + Conferência documental
                    </option>
                    <option value="vistoria_veiculo">Somente vistoria do veículo</option>
                    <option value="conferencia_documental">
                      Somente conferência documental
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vehicleInspection}
                      onChange={(e) => setVehicleInspection(e.target.checked)}
                    />
                    Incluir vistoria presencial do veículo
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={documentCheck}
                      onChange={(e) => setDocumentCheck(e.target.checked)}
                    />
                    Incluir conferência documental
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-uva-700 py-2.5 text-xs font-semibold text-white"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Agendar Encontro Seguro
                </button>
              </form>

              {appointments.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-800">Encontros Agendados</p>
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
                    >
                      <p className="font-semibold text-slate-900">{apt.locationName}</p>
                      <p className="text-slate-600">{apt.locationAddress}</p>
                      <p className="mt-1 text-slate-500">
                        Data: {new Date(apt.scheduledAt).toLocaleString('pt-BR')} • Status:{' '}
                        <strong>{apt.status}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-purple-200 bg-purple-50 p-3 text-[11px] text-purple-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Recomendações: realize vistoria independente, confira documentação completa e
                  formalize a compra e venda. O local parceiro oferece suporte operacional, mas não
                  garante segurança absoluta.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
