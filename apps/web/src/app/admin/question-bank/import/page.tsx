'use client';

import { useState } from 'react';

import * as qb from '@/features/question-bank/api';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

const SAMPLE = `{
  "questions": [
    {
      "topicId": "REPLACE_WITH_TOPIC_OBJECT_ID",
      "type": "mcq_single",
      "stem": "<p>What is 2 + 2?</p>",
      "options": [
        { "id": "a", "text": "3" },
        { "id": "b", "text": "4" },
        { "id": "c", "text": "5" },
        { "id": "d", "text": "22" }
      ],
      "correctOptionIds": ["b"],
      "explanation": "<p>Basic arithmetic.</p>",
      "difficulty": "easy",
      "marks": 1,
      "negativeMarks": 0.25,
      "tags": ["arithmetic"],
      "status": "draft"
    }
  ]
}`;

export default function BulkImportPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [jsonText, setJsonText] = useState(SAMPLE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onImport = async () => {
    if (!accessToken) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const parsed: unknown = JSON.parse(jsonText);
      const questions =
        typeof parsed === 'object' &&
        parsed !== null &&
        'questions' in parsed &&
        Array.isArray((parsed as { questions: unknown }).questions)
          ? (parsed as { questions: unknown[] }).questions
          : Array.isArray(parsed)
            ? parsed
            : null;

      if (!questions) {
        throw new Error('JSON must be { "questions": [...] } or an array');
      }

      const result = await qb.bulkImportQuestions(accessToken, questions);
      setMessage(`Imported ${result.created} question(s) successfully.`);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Bulk import</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Paste a JSON payload of questions. Each item needs a valid topic ObjectId from Taxonomy.
        </p>
      </div>

      <div className="panel space-y-4">
        <textarea
          className="input-field min-h-[420px] font-mono text-xs"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void onImport()}
        >
          {busy ? 'Importing…' : 'Import questions'}
        </button>
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
