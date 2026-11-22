import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
      <h1 className="text-xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-slate-500">
        O recurso solicitado não foi localizado no marketplace.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-xl bg-uva-700 px-4 py-2 text-xs font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
