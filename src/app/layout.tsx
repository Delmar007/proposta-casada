import type { Metadata } from 'next';
import './globals.css';
import { ActiveUserProvider } from '@/components/ActiveUserProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AutoSeguro | Marketplace Automotivo com Negociação Protegida e Permuta',
  description:
    'Marketplace automotivo com propostas em dinheiro, permuta de veículos, chat intermediado por moderação e encontro seguro.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ActiveUserProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-[1024px] pt-[5px] pb-6 px-3 sm:px-0">{children}</main>
        </ActiveUserProvider>
      </body>
    </html>
  );
}
