'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { verifyEmail } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    void (async () => {
      try {
        const result = await verifyEmail(token);
        if (accessToken) {
          setSession(result.user, accessToken);
        }
        setStatus('success');
        setMessage('Email verified successfully.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Verification failed');
      }
    })();
  }, [accessToken, setSession, token]);

  return (
    <AuthShell title="Email verification" subtitle="Confirming your MahaTest account.">
      <p className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-slate-700'}>
        {message}
      </p>
      <p className="mt-6 text-sm text-slate-600">
        <Link href="/profile" className="font-medium text-brand-600 hover:underline">
          Go to profile
        </Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
