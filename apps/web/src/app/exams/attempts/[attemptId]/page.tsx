'use client';

import { useParams } from 'next/navigation';

import { useExamPlayer } from '@/features/exams/hooks/use-exam-player';

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ExamPlayerPage() {
  const params = useParams<{ attemptId: string }>();
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

  if (!pkg || !currentQuestion) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-soft">
        Loading exam engine…
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-brand-950 text-brand-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-brand-200">MahaTest Exam</p>
            <h1 className="font-display text-xl text-white">{pkg.exam.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm">
              Sync: {syncState}
            </span>
            <span
              className={`rounded-md px-3 py-1.5 font-mono text-lg ${
                remainingSeconds < 60 ? 'bg-red-500 text-white' : 'bg-brand-600 text-white'
              }`}
            >
              {formatTime(remainingSeconds)}
            </span>
            <button
              type="button"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-900 disabled:opacity-60"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[1fr_280px] sm:px-6">
        <section className="rounded-2xl border border-white/10 bg-white p-5 text-ink shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
            <p>
              Question {currentIndex + 1} / {pkg.questions.length}
            </p>
            <p>
              {currentQuestion.marks} mark{currentQuestion.marks === 1 ? '' : 's'}
              {pkg.exam.negativeMarking ? ` · -${currentQuestion.negativeMarks} wrong` : ''}
            </p>
          </div>

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: currentQuestion.stem }}
          />

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer?.selectedOptionIds.includes(option.id) ?? false;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => void selectOption(option.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-brand-100 hover:border-brand-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-300'
                    }`}
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={currentIndex <= 0}
              onClick={() => void goTo(currentIndex - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void toggleReview()}
            >
              {currentAnswer?.markedForReview ? 'Unmark review' : 'Mark for review'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={currentIndex >= pkg.questions.length - 1}
              onClick={() => void goTo(currentIndex + 1)}
            >
              Next
            </button>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </section>

        <aside className="rounded-2xl border border-white/10 bg-brand-900 p-4">
          <h2 className="text-sm font-semibold text-white">Question palette</h2>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {palette.map((item) => {
              let tone = 'bg-white/10 text-white';
              if (item.current) tone = 'bg-white text-brand-900';
              else if (item.markedForReview) tone = 'bg-amber-400 text-brand-950';
              else if (item.answered) tone = 'bg-brand-500 text-white';
              else if (item.visited) tone = 'bg-white/25 text-white';

              return (
                <button
                  key={item.questionId}
                  type="button"
                  onClick={() => void goTo(item.index)}
                  className={`h-10 rounded-md text-sm font-medium ${tone}`}
                >
                  {item.index + 1}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1 text-xs text-brand-100">
            <li>Green — answered</li>
            <li>Amber — marked for review</li>
            <li>White — current</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
