import type { Metadata } from 'next';
import Link from 'next/link';

import { EXAM_TRACKS } from '@/features/website/content';

export const metadata: Metadata = {
  title: 'Exam Prep',
  description: 'SSC, Banking, Railway, UPSC, and State PSC mock test tracks on MahaTest.',
};

export default function ExamPrepHubPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Exam pages</p>
        <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">Exam prep tracks</h1>
        <p className="mt-4 text-base text-ink-muted sm:text-lg">
          Pick a government exam track, understand the MahaTest flow, then open live mocks from your
          dashboard.
        </p>
      </div>

      <ul className="mt-12 divide-y divide-brand-100 border-y border-brand-100">
        {EXAM_TRACKS.map((track) => (
          <li key={track.slug}>
            <Link
              href={`/exam-prep/${track.slug}`}
              className="group flex flex-col gap-2 py-7 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <h2 className="font-display text-2xl text-brand-950 group-hover:text-brand-700">
                  {track.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-ink-muted">{track.tagline}</p>
              </div>
              <span className="text-sm font-medium text-brand-700">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
