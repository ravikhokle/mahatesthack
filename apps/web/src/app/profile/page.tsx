'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { resendVerification, updateProfile } from '@/features/auth/api';
import { updateProfileSchema, type UpdateProfileInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const verificationLink = useAuthStore((state) => state.verificationLink);
  const setVerificationLink = useAuthStore((state) => state.setVerificationLink);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, router, user]);

  useEffect(() => {
    if (user) {
      reset({ name: user.name });
    }
  }, [reset, user]);

  if (!user || !accessToken) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-soft">
        Loading profile…
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    try {
      const result = await updateProfile(accessToken, values);
      setSession(result.user, accessToken);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  });

  const onResend = async () => {
    setError(null);
    setMessage(null);
    try {
      const result = await resendVerification(accessToken);
      setMessage(result.message);
      setVerificationLink(result.verificationLink ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend verification');
    }
  };

  const onLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="panel animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Account</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-brand-950">Your profile</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Manage account details and verification status.
        </p>

        <div className="mt-8 grid gap-3 rounded-xl bg-surface-tint p-4 text-sm text-ink">
          <p>
            <span className="text-ink-soft">Email</span>
            <span className="mt-0.5 block font-medium">{user.email}</span>
          </p>
          <p>
            <span className="text-ink-soft">Role</span>
            <span className="mt-0.5 block font-medium capitalize">{user.role.replace('_', ' ')}</span>
          </p>
          <p>
            <span className="text-ink-soft">Verified</span>
            <span className="mt-0.5 block font-medium">
              {user.emailVerified ? 'Yes' : 'Pending verification'}
            </span>
          </p>
        </div>

        {!user.emailVerified ? (
          <button
            type="button"
            onClick={() => void onResend()}
            className="mt-4 text-sm font-medium text-brand-700 hover:underline"
          >
            Resend verification email
          </button>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="name">
              Display name
            </label>
            <input id="name" className="input-field" {...register('name')} />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-brand-700">{message}</p> : null}
          {verificationLink ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Verification email delivery is not configured locally. Open this link to verify:{' '}
              <a href={verificationLink} className="font-medium underline break-all">
                {verificationLink}
              </a>
            </p>
          ) : null}
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-8 text-sm font-medium text-ink-muted hover:text-brand-800"
        >
          Sign out
        </button>

        <p className="mt-6 text-sm text-ink-soft">
          <Link href="/" className="text-brand-700 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
