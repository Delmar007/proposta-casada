'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Image as ImageIcon, Lock, ArrowRight } from 'lucide-react';

type AdminTab = 'aprovacao' | 'banners' | 'reservado-1' | 'reservado-2' | 'reservado-3' | 'reservado-4';

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

  useEffect(() => {
    if (window.sessionStorage.getItem('mp_admin_unlocked') === 'true') {
      setUnlocked(true);
    }
  }, []);

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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <ImageIcon className="h-5 w-5 text-logo-purple" />
            Banners (1024 × 250 px)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Área de gerenciamento do banner principal exibido no topo da página inicial.
          </p>
        </section>
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
