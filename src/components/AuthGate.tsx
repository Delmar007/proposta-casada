'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';
import { useActiveUser } from './ActiveUserProvider';

interface AuthGateProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthGate({
  title = 'Entre na sua conta para continuar',
  description = 'Visitantes podem navegar livremente pelo site. Para anunciar, favoritar ou enviar propostas e mensagens, faça login com Google ou Facebook.',
  children,
}: AuthGateProps) {
  const { isAuthenticated, openAuthModal } = useActiveUser();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-uva-50 text-logo-purple">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-3 text-base font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={openAuthModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-logo-purple px-5 py-2.5 text-xs font-bold text-white transition hover:bg-logo-purple-light"
        >
          <LogIn className="h-4 w-4" />
          Entrar ou Cadastrar
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Voltar para o feed
        </Link>
      </div>
    </div>
  );
}
