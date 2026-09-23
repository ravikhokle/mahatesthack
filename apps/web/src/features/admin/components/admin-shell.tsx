'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store';

type NavLink = {
  href: string;
  label: string;
  roles?: Array<'content_manager' | 'super_admin'>;
};

const links: NavLink[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users', roles: ['super_admin'] },
  { href: '/admin/question-bank', label: 'Question Bank' },
  { href: '/admin/exams', label: 'Exams' },
  { href: '/admin/test-series', label: 'Test Series' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/settings', label: 'Settings', roles: ['super_admin'] },
];

function canManageContent(role: string | undefined): boolean {
  return role === 'content_manager' || role === 'super_admin';
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin';
  }
  if (href === '/admin/question-bank') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!canManageContent(user.role)) {
      router.replace('/dashboard');
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user || !canManageContent(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-soft">
        Checking access…
      </div>
    );
  }

  const visibleLinks = links.filter(
    (link) => !link.roles || link.roles.includes(user.role as 'content_manager' | 'super_admin'),
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] sm:px-6">
      <aside className="panel h-fit animate-fade-in !p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Control center
        </p>
        <h2 className="mt-2 font-display text-xl text-brand-950">Admin</h2>
        <p className="mt-1 truncate text-xs text-ink-soft">{user.name}</p>
        <nav className="mt-5 flex flex-col gap-1">
          {visibleLinks.map((link) => {
            const active = isActive(pathname, link.href);
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
        <div className="mt-6 space-y-2 border-t border-brand-100 pt-4 text-sm">
          <Link href="/admin/question-bank/questions/new" className="block text-brand-700 hover:underline">
            New question →
          </Link>
          <Link href="/dashboard" className="block text-ink-muted hover:text-brand-700">
            Student dashboard
          </Link>
        </div>
      </aside>
      <section className="min-w-0 animate-fade-up">{children}</section>
    </div>
  );
}
