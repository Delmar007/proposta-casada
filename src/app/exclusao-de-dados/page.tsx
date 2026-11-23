import React from 'react';

export const metadata = {
  title: 'Exclusão de Dados do Usuário | Proposta Casada',
};

export default function ExclusaoDeDadosPage() {
  return (
    <div className="mx-auto w-full max-w-[1024px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
      <h1 className="text-xl font-extrabold text-logo-purple">
        Instruções de Exclusão de Dados do Usuário
      </h1>
      <p className="mt-1 text-xs text-slate-500">Última atualização: Novembro de 2026</p>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          Na <strong>Proposta Casada</strong>, você tem total controle sobre os seus dados pessoais
          vinculados ao login via Facebook ou Google.
        </p>

        <section>
          <h2 className="font-bold text-slate-900">Como solicitar a exclusão dos seus dados:</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>
              <strong>Pelo Facebook:</strong> Acesse as <em>Configurações e Privacidade</em> da sua
              conta do Facebook → <em>Configurações</em> → <em>Apps e sites</em> → selecione{' '}
              <strong>Proposta Casada</strong> e clique em <strong>Remover</strong>.
            </li>
            <li>
              <strong>Solicitação direta na plataforma:</strong> Envie um e-mail para o contato
              administrativo informado nas configurações do aplicativo com o assunto{' '}
              <strong>&ldquo;Exclusão de Dados - Proposta Casada&rdquo;</strong> informando o e-mail
              da sua conta. Seus dados cadastrais e histórico serão removidos em até 7 dias úteis.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
