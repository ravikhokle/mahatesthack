'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { resetPassword } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!token) {
      setFormError('Reset token is missing.');
      return;
    }

    try {
      await resetPassword(token, values);
      router.push('/login');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Reset failed');
    }
  });

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input-field"
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="input-field"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-soft">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
