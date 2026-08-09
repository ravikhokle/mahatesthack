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
      'Topic practice for weak chapters',
    ],
    audience: 'Aspirants targeting central government clerical and officer roles.',
  },
  {
    slug: 'banking',
    name: 'Banking Exams',
    shortName: 'Banking',
    tagline: 'IBPS, SBI, and RBI — speed plus accuracy under pressure.',
    description:
      'Build banking aptitude with mocks tuned for Prelims and Mains patterns, including DI-heavy sets and English comprehension.',
    highlights: [
      'Prelims-style speed drills',
      'Mains-oriented full mocks',
      'Score analytics after every attempt',
    ],
    audience: 'Candidates preparing for public sector bank and insurance exams.',
  },
  {
    slug: 'railway',
    name: 'Railway Exams',
    shortName: 'Railway',
    tagline: 'RRB NTPC, Group D, and ALP — consistent daily practice.',
    description:
      'Stay exam-ready for Railway Recruitment Board patterns with previous-year style papers and daily quizzes.',
    highlights: [
      'Previous-year style papers',
      'Daily quiz habit builder',
      'Offline-safe attempt autosave',
    ],
    audience: 'Candidates aiming for Indian Railways technical and non-technical posts.',
  },
  {
    slug: 'upsc',
    name: 'UPSC Prelims',
    shortName: 'UPSC',
    tagline: 'CSAT and GS Prelims practice with calm, focused mocks.',
    description:
      'Sharpen Prelims judgment with carefully timed papers, explanations, and current-affairs pairing for GS readiness.',
    highlights: [
      'GS + CSAT mock formats',
      'Explanation-first review',
      'Current affairs alongside mocks',
    ],
    audience: 'Serious UPSC CSE Prelims aspirants who want disciplined mock cycles.',
  },
  {
    slug: 'state-psc',
    name: 'State PSC',
    shortName: 'State PSC',
    tagline: 'MPSC, KPSC, TNPSC, and more — state-focused prep.',
    description:
      'Prepare for state public service commissions with category-wise question banks and full mocks that mirror regional patterns.',
    highlights: [
      'State-aware subject trees',
      'Full-length timed mocks',
      'Bookmark tough questions',
    ],
    audience: 'Aspirants targeting state civil services and allied exams.',
  },
];

export function getExamTrack(slug: string): ExamTrack | undefined {
  return EXAM_TRACKS.find((track) => track.slug === slug);
}

export const FAQ_ITEMS = [
  {
    question: 'Is MahaTest free to start?',
    answer:
      'Yes. Create an account, explore published mocks, and take practice sessions. Premium plans may arrive later without disrupting your progress.',
  },
  {
    question: 'Do mocks work if my internet drops?',
    answer:
      'Attempts autosave locally in IndexedDB and sync through WebSocket when you are online. You can keep answering during short disconnects.',
  },
  {
    question: 'Which exams do you cover?',
    answer:
      'SSC, Banking, Railway, UPSC Prelims, and State PSC tracks, with a growing question bank curated by content managers.',
  },
  {
    question: 'How are scores calculated?',
    answer:
      'After submit, evaluation awards marks per question, applies negative marking when enabled, and shows accuracy with explanations.',
  },
  {
    question: 'Can teachers manage content?',
    answer:
      'Yes. Content managers use the Admin Dashboard for taxonomy, questions, exams, blogs, and current affairs. Super admins manage users and settings.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Use the Contact page. Messages are stored securely and emailed to the platform support address.',
  },
] as const;
