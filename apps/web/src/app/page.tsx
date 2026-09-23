import Link from 'next/link';

import { EXAM_TRACKS } from '@/features/website/content';

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 animate-slow-pan bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(8,35,25,0.88) 8%, rgba(8,35,25,0.55) 48%, rgba(8,35,25,0.28) 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23113f2e'/%3E%3Cstop offset='1' stop-color='%231c7a52'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1600' height='900'/%3E%3Ccircle fill='%232a9666' cx='1180' cy='220' r='260' opacity='.35'/%3E%3Ccircle fill='%23082319' cx='320' cy='640' r='320' opacity='.28'/%3E%3Cpath fill='none' stroke='%23b9e5cd' stroke-width='2' opacity='.28' d='M0 620 C260 520 420 740 680 640 S1100 480 1600 560'/%3E%3Cpath fill='none' stroke='%2386d0ab' stroke-width='2' opacity='.2' d='M0 340 C300 280 520 420 820 340 S1280 220 1600 280'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
          <div className="max-w-2xl animate-fade-up text-white">
            <p className="font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl">
              MahaTest
            </p>
            <h1 className="mt-5 max-w-xl text-2xl font-medium leading-snug text-brand-50 sm:text-3xl">
              Premium mock tests for government exams.
            </h1>
            <p className="mt-4 max-w-lg text-base text-brand-100/85 sm:text-lg">
              Train for SSC exams with a timed, offline-safe engine built for serious aspirants.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-2.5 text-sm font-medium text-brand-900 transition hover:bg-brand-50"
              >
                Create free account
              </Link>
              <Link
                href="/exam-prep"
                className="inline-flex items-center justify-center rounded-md border border-white/35 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Explore exams
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Built for the real paper
          </p>
          <h2 className="mt-3 font-display text-3xl text-brand-950 sm:text-4xl">
            One calm attempt flow — timer, palette, autosave, results.
          </h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            MahaTest mirrors CBT pressure without the clutter: mark for review, recover after
            disconnects, and read explanations the moment evaluation finishes.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-100/80 bg-white/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Exam tracks
            </p>
            <h2 className="mt-3 font-display text-3xl text-brand-950 sm:text-4xl">
              Choose the path you are preparing for.
            </h2>
          </div>
          <ul className="mt-10 divide-y divide-brand-100">
            {EXAM_TRACKS.map((track, index) => (
              <li key={track.slug} className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
                <Link
                  href={`/exam-prep/${track.slug}`}
                  className="group flex flex-col gap-2 py-6 transition sm:flex-row sm:items-end sm:justify-between"
                >
                  <div>
                    <p className="font-display text-2xl text-brand-950 group-hover:text-brand-700">
                      {track.name}
                    </p>
                    <p className="mt-1 max-w-xl text-sm text-ink-muted">{track.tagline}</p>
                  </div>
                  <span className="text-sm font-medium text-brand-700 group-hover:underline">
                    View track →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-brand-950 text-brand-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-20 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="max-w-xl">
            <p className="font-display text-3xl text-white sm:text-4xl">Start your next mock today.</p>
            <p className="mt-3 text-brand-100/80">
              Register in a minute, open the dashboard, and attempt a published paper when you are
              ready.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-white px-6 py-2.5 text-sm font-medium text-brand-900 transition hover:bg-brand-50"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
