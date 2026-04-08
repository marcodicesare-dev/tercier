import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumina Intelligence',
  description: 'Internal hotel intelligence read layer for Lumina and Tercier.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-stone-300/80 bg-white/88 px-6 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/" className="text-xs uppercase tracking-[0.28em] text-stone-600">
                Lumina Intelligence
              </Link>
              <h1 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)] sm:text-4xl">Portfolio intelligence for every hotel</h1>
            </div>
            <nav className="flex gap-3 text-sm text-stone-700">
              <Link className="rounded-full border border-stone-300 bg-white px-4 py-2 hover:border-stone-400" href="/">
                Portfolio
              </Link>
              <Link
                className="rounded-full border border-stone-300 bg-white px-4 py-2 hover:border-stone-400"
                href="/compare"
              >
                Compare
              </Link>
              <Link
                className="rounded-full border border-stone-300 bg-white px-4 py-2 hover:border-stone-400"
                href="/financial"
              >
                Financial
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
