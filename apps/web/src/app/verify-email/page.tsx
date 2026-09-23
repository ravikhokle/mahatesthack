'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { resendVerification, verifyEmail } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

const otpSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  otp: z
    .string()
    .length(6, 'Enter the 6-digit code from your email')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const prefillEmail = emailFromQuery || user?.email || '';

  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: prefillEmail, otp: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setResendMessage(null);
    try {
      const result = await verifyEmail(values.email, values.otp);
      // Update the session with the freshly verified user object
      if (accessToken) {
        setSession(result.user, accessToken);
      }
      router.push('/profile');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Verification failed. Try again.',
      );
    }
  });

  const onResend = async () => {
    setFormError(null);
    setResendMessage(null);
    setResending(true);
    try {
      const targetEmail = prefillEmail || user?.email;
      const result = await resendVerification(accessToken ?? undefined, targetEmail || undefined);
      setResendMessage(result.message);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to${prefillEmail ? ` ${prefillEmail}` : ' your email'}.`}
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {/* Only show email field if it wasn't pre-filled from query or session */}
        {!prefillEmail && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field"
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="otp">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="— — — — — —"
            className="input-field text-center text-2xl font-bold tracking-[0.5em]"
            {...register('otp')}
          />
          {errors.otp ? (
            <p className="mt-1 text-xs text-red-600">{errors.otp.message}</p>
          ) : null}
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {resendMessage ? <p className="text-sm text-brand-700">{resendMessage}</p> : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={resending}
          className="text-brand-700 hover:underline disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
        <Link href="/profile" className="text-ink-muted hover:text-brand-700">
          Skip for now →
        </Link>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-ink-soft">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
