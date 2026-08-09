'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { forgotPassword } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(null);
    try {
      const result = await forgotPassword(values);
      setSuccess(result.message);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Request failed');
    }
  });

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to reset your password.">
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
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {success ? <p className="text-sm text-brand-700">{success}</p> : null}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
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
