'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store';

function NavLink({
  href,
  label,
  soon,
  onNavigate,
}: {
  href: string;
  label: string;
  soon?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  if (soon) {
    return (
      <span className="cursor-default text-sm text-ink-soft" title="Coming soon">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`text-sm transition ${
        active ? 'font-semibold text-brand-700' : 'text-ink-muted hover:text-brand-700'
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/exam-prep', label: 'Exams' },
    { href: '/blog', label: 'Blog' },
    { href: '/current-affairs', label: 'Affairs' },
    ...(user
      ? [
          { href: '/exams', label: 'Mocks' },
          { href: '/dashboard', label: 'Dashboard' },
        ]
      : []),
    ...(user?.role === 'content_manager' || user?.role === 'super_admin'
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ];

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 animate-fade-in border-b border-brand-100/70 bg-[#f7fcf9]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-semibold text-white shadow-soft transition group-hover:bg-brand-800">
            M
          </span>
          <span className="font-display text-xl tracking-tight text-brand-950">MahaTest</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink key={link.label} {...link} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/profile" className="text-sm text-ink-muted hover:text-brand-700">
                {user.name.split(' ')[0]}
              </Link>
              <button
                type="button"
                onClick={() => void onLogout()}
                disabled={loggingOut}
                className="btn-secondary !px-3 !py-2"
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-brand-800 hover:text-brand-950">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !px-3 !py-2">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-800 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-t border-brand-100 bg-white/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink key={link.label} {...link} onNavigate={() => setOpen(false)} />
            ))}
            <div className="h-px bg-brand-100" />
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className="text-sm text-ink-muted">
                  Profile ({user.name})
                </Link>
                <button type="button" onClick={() => void onLogout()} className="btn-secondary w-full">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
