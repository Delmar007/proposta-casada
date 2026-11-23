import React from 'react';

export const metadata = {
  title: 'Termos de Serviço | Proposta Casada',
};

export default function TermosPage() {
  return (
    <div className="mx-auto w-full max-w-[1024px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
      <h1 className="text-xl font-extrabold text-logo-purple">Termos de Serviço</h1>
      <p className="mt-1 text-xs text-slate-500">Última atualização: Novembro de 2026</p>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-bold text-slate-900">1. Aceitação dos Termos</h2>
          <p className="mt-1">
            Ao acessar ou utilizar a plataforma <strong>Proposta Casada</strong>, você concorda com
            estes Termos de Serviço e com a nossa Política de Privacidade.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900">2. Cadastro e Responsabilidade</h2>
          <p className="mt-1">
            Visitantes podem navegar pelos anúncios livremente. Para publicar anúncios, favoritar
            itens ou enviar propostas de compra ou permuta, é necessário estar autenticado. O
            anunciante é responsável pela veracidade das informações e imagens publicadas.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900">3. Negociação Protegida</h2>
          <p className="mt-1">
            A Proposta Casada oferece ferramentas de registro de propostas, chat intermediado e
            agendamento de encontros seguros para auxiliar compradores e vendedores na condução de
            seus negócios.
          </p>
        </section>
      </div>
    </div>
  );
}
