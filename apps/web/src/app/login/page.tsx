'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { login as loginUser } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await loginUser(values);
      setSession(result.user, result.accessToken);
      router.push('/profile');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Login failed');
    }
  });

  return (
    <AuthShell title="Sign in" subtitle="Continue your exam preparation.">
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input-field"
            {...register('email')}
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input-field"
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        New here?{' '}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
