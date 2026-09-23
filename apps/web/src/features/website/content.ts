export type ExamTrack = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  highlights: string[];
  audience: string;
};

export const EXAM_TRACKS: ExamTrack[] = [
  {
    slug: 'ssc',
    name: 'SSC Exams',
    shortName: 'SSC',
    tagline: 'CGL, CHSL, CPO, and GD — timed like the real CBT.',
    description:
      'Practice full-length and sectional mocks for Staff Selection Commission exams with negative marking, question palette, and instant evaluation.',
    highlights: [
      'Quant, Reasoning, English, and GA coverage',
      'Exam-like timer and review flow',
    ],
    audience: 'Aspirants targeting central government clerical and officer roles.',
  },
];

export function getExamTrack(slug: string): ExamTrack | undefined {
  return EXAM_TRACKS.find((track) => track.slug === slug);
}

export const FAQ_ITEMS = [
  {
    question: 'Is MahaTest free to start?',
    answer:
      'Yes. Create an account, explore published mocks, and track your progress. Premium plans may arrive later without disrupting your progress.',
  },
  {
    question: 'Do mocks work if my internet drops?',
    answer:
      'Attempts autosave locally in IndexedDB and sync through WebSocket when you are online. You can keep answering during short disconnects.',
  },
  {
    question: 'Which exams do you cover?',
    answer:
      'SSC tracks, with a growing question bank curated by content managers.',
  },
  {
    question: 'How are scores calculated?',
    answer:
      'After submit, evaluation awards marks per question, applies negative marking when enabled, and shows accuracy with explanations.',
  },
  {
    question: 'Can teachers manage content?',
    answer:
      'Yes. Content managers use the Admin Dashboard for taxonomy, questions, and exams. Super admins manage users and settings.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Use the Contact page. Messages are stored securely and emailed to the platform support address.',
  },
] as const;
