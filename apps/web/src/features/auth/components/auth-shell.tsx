import type { ReactNode } from 'react';
import Link from 'next/link';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="panel animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">MahaTest</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-brand-950">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/" className="text-brand-700 hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
