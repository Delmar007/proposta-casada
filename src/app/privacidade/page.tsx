import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | Proposta Casada',
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto w-full max-w-[1024px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
      <h1 className="text-xl font-extrabold text-logo-purple">Política de Privacidade</h1>
      <p className="mt-1 text-xs text-slate-500">Última atualização: Novembro de 2026</p>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-bold text-slate-900">1. Coleta de Informações</h2>
          <p className="mt-1">
            A plataforma <strong>Proposta Casada</strong> coleta apenas os dados necessários para
            autenticação e funcionamento do marketplace (como nome, e-mail e foto de perfil
            fornecidos via login social com Google ou Facebook, além das informações dos anúncios e
            propostas cadastradas por você).
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900">2. Uso dos Dados e Privacidade</h2>
          <p className="mt-1">
            Seus dados de contato pessoais não são exibidos publicamente no feed de anúncios. As
            negociações ocorrem em ambiente protegido e intermediado dentro da plataforma, e as
            imagens enviadas passam por tratamento para remoção de metadados (EXIF).
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900">3. Compartilhamento</h2>
          <p className="mt-1">
            Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais
            não relacionados à operação e segurança das negociações na Proposta Casada.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900">4. Exclusão de Dados</h2>
          <p className="mt-1">
            Você pode solicitar a exclusão completa dos seus dados a qualquer momento seguindo as
            instruções na página{' '}
            <Link href="/exclusao-de-dados" className="font-bold text-logo-purple underline">
              Exclusão de Dados do Usuário
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
