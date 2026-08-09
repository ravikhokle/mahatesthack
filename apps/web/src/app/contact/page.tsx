'use client';

import { useState, type FormEvent } from 'react';

import * as websiteApi from '@/features/website/api';
import { ApiError } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await websiteApi.submitContact({ name, email, subject, message });
      setSuccess(result.message);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Contact</p>
      <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">Talk to the team</h1>
      <p className="mt-4 text-base text-ink-muted">
        Questions about mocks, content, or your account? Send a message and we will get back to you.
      </p>

      <form onSubmit={(event) => void submit(event)} className="mt-10 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Name</span>
          <input
            className="input-field"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Email</span>
          <input
            className="input-field"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Subject</span>
          <input
            className="input-field"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Message</span>
          <textarea
            className="input-field min-h-36"
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-brand-700">{success}</p> : null}
    </main>
  );
}
