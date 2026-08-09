import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EXAM_TRACKS, getExamTrack } from '@/features/website/content';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return EXAM_TRACKS.map((track) => ({ slug: track.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const track = getExamTrack(slug);
  if (!track) return { title: 'Exam Prep' };
  return {
    title: track.name,
    description: track.tagline,
  };
}

export default async function ExamPrepTrackPage({ params }: PageProps) {
  const { slug } = await params;
  const track = getExamTrack(slug);
  if (!track) notFound();

  return (
    <main>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(700px 320px at 85% 10%, rgba(42,150,102,0.55), transparent 60%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Link href="/exam-prep" className="text-sm text-brand-200 hover:text-white">
            ← All exam tracks
          </Link>
          <p className="mt-8 font-display text-5xl tracking-tight sm:text-6xl">{track.shortName}</p>
          <h1 className="mt-4 max-w-2xl text-2xl font-medium text-brand-50 sm:text-3xl">
            {track.name}
          </h1>
          <p className="mt-4 max-w-xl text-base text-brand-100/85">{track.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-2.5 text-sm font-medium text-brand-900 transition hover:bg-brand-50"
            >
              Start free
            </Link>
            <Link
              href="/exams"
              className="inline-flex items-center justify-center rounded-md border border-white/35 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Open mock tests
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl text-brand-950">How this track helps</h2>
        <p className="mt-4 max-w-2xl text-base text-ink-muted">{track.description}</p>
        <ul className="mt-8 max-w-xl space-y-3 text-ink">
          {track.highlights.map((item) => (
            <li key={item} className="border-l-2 border-brand-500 pl-4 text-sm sm:text-base">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-2xl text-sm text-ink-soft">{track.audience}</p>
      </section>
    </main>
  );
}
