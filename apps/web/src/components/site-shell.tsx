'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const examPlayer =
    pathname.startsWith('/exams/attempts/') && !pathname.endsWith('/result');

  if (examPlayer) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
