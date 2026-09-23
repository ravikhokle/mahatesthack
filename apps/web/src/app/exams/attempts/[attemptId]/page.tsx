'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { useExamPlayer } from '@/features/exams/hooks/use-exam-player';

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function enterFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) void el.requestFullscreen();
  else if ((el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen)
    (el as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
}

function exitFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ExamPlayerPage() {
  const params = useParams<{ attemptId: string }>();
  const [started, setStarted] = useState(false);
  const [fsWarning, setFsWarning] = useState(false);

  const {
    pkg,
    answers,
    currentQuestion,
    currentIndex,
    remainingSeconds,
    palette,
    error,
    submitting,
    syncState,
    selectOption,
    toggleReview,
    goTo,
    submit,
  } = useExamPlayer(params.attemptId);

  // Warn when student exits fullscreen
  useEffect(() => {
    if (!started) return;
    const handler = () => setFsWarning(!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [started]);

  // Exit fullscreen on page leave
  useEffect(() => () => exitFullscreen(), []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!pkg || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950">
        <div className="flex flex-col items-center gap-4 text-brand-100">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm">Loading exam engine…</p>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];
  const isReviewed = currentAnswer?.markedForReview ?? false;

  // ── Pre-exam screen (fullscreen triggered on button click) ────────────────
  if (!started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-6">
        <div className="w-full max-w-xl">
          {/* Logo / header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl shadow-lg">
              🖥️
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
              MahaTest Exam
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">{pkg.exam.title}</h1>
          </div>

          {/* Stats row */}
          <div className="mb-5 grid grid-cols-3 divide-x divide-brand-800 overflow-hidden rounded-xl border border-brand-800 bg-brand-900">
            {[
              { icon: '📝', label: 'Questions', value: pkg.questions.length },
              { icon: '⏱', label: 'Duration', value: `${pkg.exam.durationMinutes} min` },
              { icon: '⭐', label: 'Total Marks', value: pkg.exam.totalMarks },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center py-5">
                <span className="mb-1 text-lg">{icon}</span>
                <span className="text-xl font-bold text-white">{value}</span>
                <span className="mt-0.5 text-xs text-brand-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mb-6 rounded-xl border border-brand-800 bg-brand-900/70 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-400">
              Instructions
            </p>
            <ul className="space-y-2.5 text-sm text-brand-100">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base leading-none text-amber-400">⚠</span>
                <span>The exam will open in <strong className="text-white">full screen mode</strong>. Do not press ESC during the exam.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-brand-500">●</span>
                <span>The timer starts immediately when you click <strong className="text-white">Start Exam</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-brand-500">●</span>
                <span>Answers are saved automatically. You can change your answer any time before submitting.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-brand-500">●</span>
                <span>Use <strong className="text-white">Mark for Review</strong> to flag questions you want to revisit.</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-brand-500 active:scale-[0.98]"
            onClick={() => {
              enterFullscreen();
              setStarted(true);
            }}
          >
            Start Exam →
          </button>
        </div>
      </div>
    );
  }

  // ── Exam Player ───────────────────────────────────────────────────────────
  const isLowTime = remainingSeconds < 300; // last 5 min

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f2f5] font-sans text-gray-800">

      {/* ── Fullscreen warning ─────────────────────────────────────────────── */}
      {fsWarning && (
        <div className="flex shrink-0 items-center justify-between gap-4 bg-red-600 px-6 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠</span>
            <span className="font-medium">You exited fullscreen! Return to fullscreen to avoid issues.</span>
          </div>
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
            onClick={() => { enterFullscreen(); setFsWarning(false); }}
          >
            Go Fullscreen
          </button>
        </div>
      )}

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between bg-brand-950 px-6 py-0 shadow-md" style={{ minHeight: 52 }}>
        {/* Left: Exam title */}
        <div className="flex flex-col justify-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-400">MahaTest</p>
          <h1 className="text-sm font-semibold leading-tight text-white">{pkg.exam.title}</h1>
        </div>

        {/* Center: Section label (placeholder for multi-section exams) */}
        <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-brand-200 md:flex">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-400" />
          General Awareness
        </div>

        {/* Right: Timer + Sync + Submit */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-brand-400">Time Left</span>
            <span
              className={`font-mono text-lg font-black tracking-widest leading-none ${
                isLowTime ? 'text-red-400' : 'text-white'
              }`}
            >
              {formatTime(remainingSeconds)}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <span className={`rounded px-2 py-1 text-[10px] font-semibold ${syncState === 'ok' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
            {syncState === 'ok' ? '● Synced' : '⟳ Syncing'}
          </span>
          <button
            type="button"
            className="rounded-lg bg-white px-5 py-1.5 text-sm font-bold text-brand-950 transition hover:bg-brand-100 disabled:opacity-60"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? 'Submitting…' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* ── Sub-header: question progress bar ──────────────────────────────── */}
      <div className="shrink-0 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <span className="rounded bg-brand-950 px-2.5 py-0.5 text-xs font-bold text-white">
              Q {currentIndex + 1}
            </span>
            <span className="text-gray-400">/</span>
            <span>{pkg.questions.length} Questions</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
              {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
            </span>
            {pkg.exam.negativeMarking && (
              <span className="flex items-center gap-1 text-red-500">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                −{currentQuestion.negativeMarks} wrong
              </span>
            )}
            {isReviewed && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="text-sm">🚩</span> Marked for Review
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / pkg.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Main content area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Question + Options + Nav ──────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Question text */}
          <div className="flex-1 px-10 pt-8 pb-4">
            <div
              className="prose prose-base max-w-none leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: currentQuestion.stem }}
            />

            {/* Options */}
            <div className="mt-8 space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const selected = currentAnswer?.selectedOptionIds.includes(option.id) ?? false;
                const label = OPTION_LABELS[idx] ?? String(idx + 1);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => void selectOption(option.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-3.5 text-left text-sm font-medium transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Option label circle */}
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-brand-600 text-white'
                          : 'border-2 border-gray-300 bg-white text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="flex-1 leading-snug">{option.text}</span>
                    {/* Checkmark on selected */}
                    {selected && (
                      <span className="text-brand-600 text-lg leading-none">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {error ? <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          </div>

          {/* ── Navigation bar ─────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-10 py-3">
            <div className="flex items-center gap-3">
              {/* Previous */}
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => void goTo(currentIndex - 1)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              {/* Mark for Review */}
              <button
                type="button"
                onClick={() => void toggleReview()}
                className={`flex items-center gap-2 rounded-lg border px-5 py-2 text-sm font-semibold transition ${
                  isReviewed
                    ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isReviewed ? '🚩 Unmark Review' : '🏳 Mark for Review'}
              </button>

              {/* Clear response */}
              {currentAnswer?.selectedOptionIds.length ? (
                <button
                  type="button"
                  onClick={() => void selectOption(currentAnswer.selectedOptionIds[0]!)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
                >
                  ✕ Clear
                </button>
              ) : null}

              {/* Next — right aligned */}
              <button
                type="button"
                disabled={currentIndex >= pkg.questions.length - 1}
                onClick={() => void goTo(currentIndex + 1)}
                className="ml-auto flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save &amp; Next →
              </button>
            </div>
          </div>
        </main>

        {/* ── Right: Question Palette ──────────────────────────────────────── */}
        <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white">

          {/* Student info strip */}
          <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-brand-950 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              S
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">Student</p>
              <p className="truncate text-[10px] text-brand-300">Candidate</p>
            </div>
          </div>

          {/* Legend */}
          <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Legend</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                { color: 'bg-brand-500', label: 'Answered' },
                { color: 'bg-red-100 border border-red-300', label: 'Not Attempted' },
                { color: 'bg-amber-400', label: 'For Review' },
                { color: 'bg-gray-200', label: 'Not Visited' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`inline-block h-4 w-4 shrink-0 rounded-sm ${color}`} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 text-center">
            {(() => {
              const ans = palette.filter(p => p.answered).length;
              const rev = palette.filter(p => p.markedForReview).length;
              const notAns = palette.filter(p => p.visited && !p.answered && !p.markedForReview).length;
              return [
                { label: 'Answered', value: ans, cls: 'text-brand-600' },
                { label: 'Marked', value: rev, cls: 'text-amber-500' },
                { label: 'Not Attempted', value: notAns, cls: 'text-red-500' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="py-2.5">
                  <p className={`text-base font-bold ${cls}`}>{value}</p>
                  <p className="text-[9px] text-gray-400">{label}</p>
                </div>
              ));
            })()}
          </div>

          {/* Number grid — scrollable */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Questions</p>
            <div className="grid grid-cols-5 gap-1.5">
              {palette.map((item) => {
                let cls = 'bg-gray-200 text-gray-600 hover:bg-gray-300';
                if (item.current)
                  cls = 'bg-brand-950 text-white font-bold ring-2 ring-brand-400 ring-offset-1';
                else if (item.markedForReview)
                  cls = 'bg-amber-400 text-amber-950 hover:bg-amber-300';
                else if (item.answered)
                  cls = 'bg-brand-500 text-white hover:bg-brand-400';
                else if (item.visited)
                  cls = 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200';

                return (
                  <button
                    key={item.questionId}
                    type="button"
                    title={`Question ${item.index + 1}`}
                    onClick={() => void goTo(item.index)}
                    className={`h-9 rounded-md text-xs font-semibold transition ${cls}`}
                  >
                    {item.index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button inside palette */}
          <div className="shrink-0 border-t border-gray-100 p-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-500 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : '✓ Submit Test'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
