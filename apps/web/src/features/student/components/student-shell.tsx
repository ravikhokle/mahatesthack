'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store';

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/tests', label: 'My Tests' },
  { href: '/dashboard/results', label: 'Results' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/leaderboards', label: 'Leaderboards' },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-soft">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] sm:px-6">
      <aside className="panel h-fit animate-fade-in !p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Student space
        </p>
        <h2 className="mt-2 font-display text-xl text-brand-950">Dashboard</h2>
        <p className="mt-1 truncate text-xs text-ink-soft">{user.name}</p>
        <nav className="mt-5 flex flex-col gap-1">
          {links.map((link) => {
            const active =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-brand-700 font-medium text-white'
                    : 'text-ink-muted hover:bg-brand-50 hover:text-brand-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-brand-100 pt-4">
          <Link href="/exams" className="text-sm font-medium text-brand-700 hover:underline">
            Browse all exams →
          </Link>
        </div>
      </aside>
      <section className="min-w-0 animate-fade-up">{children}</section>
    </div>
  );
}
