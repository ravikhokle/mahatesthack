'use client';

import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { PublicPlatformSettings } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function AdminSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [settings, setSettings] = useState<PublicPlatformSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken || user?.role !== 'super_admin') return;
    void adminApi
      .getSettings(accessToken)
      .then(setSettings)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load settings');
      });
  }, [accessToken, user?.role]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Settings</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Only super admins can change platform settings.
        </p>
      </div>
    );
  }

  if (!settings) {
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <p className="text-sm text-ink-soft">Loading settings…</p>
    );
  }

  const save = async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminApi.updateSettings(accessToken, {
        siteName: settings.siteName,
        supportEmail: settings.supportEmail,
        maintenanceMode: settings.maintenanceMode,
        allowRegistration: settings.allowRegistration,
        defaultExamDurationMinutes: settings.defaultExamDurationMinutes,
      });
      setSettings(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Settings</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Platform defaults for branding, registration, and exam duration.
        </p>
      </div>

      <div className="panel space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Site name</span>
          <input
            className="input-field"
            value={settings.siteName}
            onChange={(event) =>
              setSettings({ ...settings, siteName: event.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Support email</span>
          <input
            className="input-field"
            type="email"
            value={settings.supportEmail}
            onChange={(event) =>
              setSettings({ ...settings, supportEmail: event.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Default exam duration (minutes)</span>
          <input
            className="input-field max-w-xs"
            type="number"
            min={1}
            max={600}
            value={settings.defaultExamDurationMinutes}
            onChange={(event) =>
              setSettings({
                ...settings,
                defaultExamDurationMinutes: Number(event.target.value),
              })
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={settings.allowRegistration}
            onChange={(event) =>
              setSettings({ ...settings, allowRegistration: event.target.checked })
            }
          />
          Allow new student registration
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(event) =>
              setSettings({ ...settings, maintenanceMode: event.target.checked })
            }
          />
          Maintenance mode
        </label>
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Save settings'}
        </button>
        <p className="text-xs text-ink-soft">
          Last updated {new Date(settings.updatedAt).toLocaleString()}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}
    </div>
  );
}
