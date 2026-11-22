'use client';

import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useActiveUser } from './ActiveUserProvider';

export function AuthModal() {
  const { showAuthModal, closeAuthModal, loginWithProvider } = useActiveUser();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

  if (!showAuthModal) return null;

  const handleSocial = async (provider: 'google' | 'facebook') => {
    setLoadingProvider(provider);
    try {
      await loginWithProvider(provider);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-uva-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 id="auth-modal-title" className="text-lg font-extrabold text-slate-900">
            Cadastre-se ou Entre para Negociar
          </h2>
          <p className="text-xs leading-relaxed text-slate-500">
            Para enviar propostas ou propor permuta com segurança, faça seu cadastro rápido com
            Google ou Facebook.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleSocial('google')}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            {loadingProvider === 'google' ? 'Conectando...' : 'Continuar com Google'}
          </button>

          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleSocial('facebook')}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#166FE5] disabled:opacity-50"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
            </svg>
            {loadingProvider === 'facebook' ? 'Conectando...' : 'Continuar com Facebook'}
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-[11px] leading-relaxed text-slate-500">
          Privacidade garantida: seu nome, e-mail e dados pessoais ficam visíveis apenas para você e
          para nossa moderação. Na negociação você aparece como identificador anônimo.
        </p>
      </div>
    </div>
  );
}
