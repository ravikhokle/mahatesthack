import { env } from '../config/env.js';
import { hashPassword } from './password.js';
import { UserModel } from '../modules/users/user.model.js';
import { CategoryModel } from '../modules/question-bank/category.model.js';
import { ChapterModel } from '../modules/question-bank/chapter.model.js';
import { QuestionModel } from '../modules/question-bank/question.model.js';
import { SubjectModel } from '../modules/question-bank/subject.model.js';
import { TopicModel } from '../modules/question-bank/topic.model.js';
import { ExamModel } from '../modules/exams/exam.model.js';
import type { FastifyBaseLogger } from 'fastify';

type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'content_manager';
};

async function upsertSeedAccount(account: SeedAccount, log: FastifyBaseLogger): Promise<void> {
  const existing = await UserModel.findOne({ email: account.email }).select('+passwordHash');

  if (!existing) {
    // Create brand-new account
    const passwordHash = await hashPassword(account.password);
    await UserModel.create({
      name: account.name,
      email: account.email,
      passwordHash,
      role: account.role,
      emailVerified: true, // Seed accounts are pre-verified
    });
    log.info({ email: account.email, role: account.role }, '[seed] created account');
    return;
  }

  // Account exists — ensure it has the correct role and mark email as verified
  let changed = false;
  if (existing.role !== account.role) {
    existing.role = account.role;
    changed = true;
  }
  if (!existing.emailVerified) {
    existing.emailVerified = true;
    changed = true;
  }
  if (changed) {
    await existing.save();
    log.info({ email: account.email, role: account.role }, '[seed] updated account');
  } else {
    log.info({ email: account.email }, '[seed] account already up-to-date');
  }
}

/**
 * Seeds admin accounts defined in environment variables.
 * Runs on every startup — safe to call multiple times (idempotent).
 *
 * Env vars:
 *   SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD / SUPER_ADMIN_NAME
 *   CONTENT_MANAGER_EMAIL / CONTENT_MANAGER_PASSWORD / CONTENT_MANAGER_NAME
 */
export async function seedAdminAccounts(log: FastifyBaseLogger): Promise<void> {
  const accounts: SeedAccount[] = [];

  if (env.SUPER_ADMIN_EMAIL && env.SUPER_ADMIN_PASSWORD) {
    accounts.push({
      email: env.SUPER_ADMIN_EMAIL,
      password: env.SUPER_ADMIN_PASSWORD,
      name: env.SUPER_ADMIN_NAME,
      role: 'super_admin',
    });
  }

  if (env.CONTENT_MANAGER_EMAIL && env.CONTENT_MANAGER_PASSWORD) {
    accounts.push({
      email: env.CONTENT_MANAGER_EMAIL,
      password: env.CONTENT_MANAGER_PASSWORD,
      name: env.CONTENT_MANAGER_NAME,
      role: 'content_manager',
    });
  }

  if (accounts.length === 0) {
    return; // No seed accounts configured — skip silently
  }

  log.info(`[seed] seeding ${accounts.length} admin account(s)…`);

  for (const account of accounts) {
    await upsertSeedAccount(account, log);
  }
}

type SeedQuestion = {
  key: string;
  topic: string;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

const SSC_QUESTIONS: SeedQuestion[] = [
  {
    key: 'analogy-01',
    topic: 'analogy',
    stem: 'Book is related to Reading in the same way as Fork is related to:',
    options: ['Writing', 'Eating', 'Cooking', 'Cutting'],
    correct: 1,
    explanation: 'A book is used for reading; a fork is used for eating.',
    difficulty: 'easy',
  },
  {
    key: 'analogy-02',
    topic: 'analogy',
    stem: 'Find the missing number: 7 : 49 :: 9 : ?',
    options: ['18', '63', '72', '81'],
    correct: 3,
    explanation: 'The second number is the square of the first number.',
    difficulty: 'easy',
  },
  {
    key: 'analogy-03',
    topic: 'analogy',
    stem: 'Island is related to Ocean in the same way as Oasis is related to:',
    options: ['Forest', 'Desert', 'Mountain', 'Valley'],
    correct: 1,
    explanation: 'An island is found in an ocean; an oasis is found in a desert.',
    difficulty: 'easy',
  },
  {
    key: 'analogy-04',
    topic: 'analogy',
    stem: 'Choose the pair with the same relationship: 16 : 4',
    options: ['25 : 6', '36 : 6', '49 : 8', '64 : 7'],
    correct: 1,
    explanation: 'Four is the square root of sixteen, and six is the square root of thirty-six.',
    difficulty: 'medium',
  },
  {
    key: 'analogy-05',
    topic: 'analogy',
    stem: 'Eye is related to Sight in the same way as Ear is related to:',
    options: ['Sound', 'Voice', 'Hearing', 'Music'],
    correct: 2,
    explanation: 'The eye enables sight; the ear enables hearing.',
    difficulty: 'easy',
  },
  {
    key: 'series-01',
    topic: 'number-series',
    stem: 'Find the next number: 3, 6, 12, 24, ?',
    options: ['36', '42', '48', '54'],
    correct: 2,
    explanation: 'Each term is multiplied by two.',
    difficulty: 'easy',
  },
  {
    key: 'series-02',
    topic: 'number-series',
    stem: 'Find the next number: 2, 5, 10, 17, 26, ?',
    options: ['35', '37', '39', '41'],
    correct: 1,
    explanation: 'The differences are 3, 5, 7, 9, so the next difference is 11.',
    difficulty: 'medium',
  },
  {
    key: 'series-03',
    topic: 'number-series',
    stem: 'Find the missing term: 81, 27, 9, 3, ?',
    options: ['0', '1', '2', '6'],
    correct: 1,
    explanation: 'Each term is divided by three.',
    difficulty: 'easy',
  },
  {
    key: 'series-04',
    topic: 'number-series',
    stem: 'Find the next number: 4, 9, 19, 39, ?',
    options: ['69', '79', '89', '99'],
    correct: 1,
    explanation: 'Each term is multiplied by two and one is added.',
    difficulty: 'medium',
  },
  {
    key: 'series-05',
    topic: 'number-series',
    stem: 'Find the next number: 1, 4, 9, 16, ?',
    options: ['20', '24', '25', '36'],
    correct: 2,
    explanation: 'These are consecutive square numbers: 1 squared through 5 squared.',
    difficulty: 'easy',
  },
  {
    key: 'percentage-01',
    topic: 'percentage',
    stem: 'What is 15% of 240?',
    options: ['24', '36', '42', '48'],
    correct: 1,
    explanation: '240 multiplied by 15 divided by 100 equals 36.',
    difficulty: 'easy',
  },
  {
    key: 'percentage-02',
    topic: 'percentage',
    stem: 'A number is increased from 80 to 100. What is the percentage increase?',
    options: ['20%', '25%', '30%', ' forty percent'],
    correct: 1,
    explanation: 'The increase is 20; 20 divided by 80 multiplied by 100 is 25%.',
    difficulty: 'easy',
  },
  {
    key: 'percentage-03',
    topic: 'percentage',
    stem: 'A shirt marked at 800 is sold at a discount of 10%. What is its selling price?',
    options: ['720', '730', '780', '790'],
    correct: 0,
    explanation: 'The discount is 80, so the selling price is 800 minus 80.',
    difficulty: 'easy',
  },
  {
    key: 'percentage-04',
    topic: 'percentage',
    stem: 'If 40% of a number is 72, what is the number?',
    options: ['180', '160', '144', '120'],
    correct: 0,
    explanation: 'The number is 72 divided by 0.4, which equals 180.',
    difficulty: 'medium',
  },
  {
    key: 'percentage-05',
    topic: 'percentage',
    stem: 'A value decreases from 500 to 425. What is the percentage decrease?',
    options: ['10%', '12%', '15%', '20%'],
    correct: 2,
    explanation: 'The decrease is 75; 75 divided by 500 is 15%.',
    difficulty: 'medium',
  },
  {
    key: 'grammar-01',
    topic: 'grammar',
    stem: 'Choose the correctly spelt word.',
    options: ['Accomodation', 'Accommodation', 'Acommodation', 'Accommadation'],
    correct: 1,
    explanation: 'The correct spelling is accommodation, with double c and double m.',
    difficulty: 'easy',
  },
  {
    key: 'grammar-02',
    topic: 'grammar',
    stem: 'Choose the correct sentence.',
    options: [
      'She do not like tea.',
      'She does not likes tea.',
      'She does not like tea.',
      'She did not likes tea.',
    ],
    correct: 2,
    explanation: 'After does not, the main verb remains in its base form.',
    difficulty: 'easy',
  },
  {
    key: 'grammar-03',
    topic: 'grammar',
    stem: 'Choose the word closest in meaning to “brief”.',
    options: ['Lengthy', 'Concise', 'Unclear', 'Distant'],
    correct: 1,
    explanation: 'Brief means short or concise.',
    difficulty: 'easy',
  },
  {
    key: 'grammar-04',
    topic: 'grammar',
    stem: 'Fill in the blank: The committee _____ its decision yesterday.',
    options: ['announce', 'announces', 'announced', 'announcing'],
    correct: 2,
    explanation: 'Yesterday signals the simple past tense: announced.',
    difficulty: 'easy',
  },
  {
    key: 'grammar-05',
    topic: 'grammar',
    stem: 'Choose the antonym of “expand”.',
    options: ['Contract', 'Extend', 'Increase', 'Develop'],
    correct: 0,
    explanation: 'Contract means to become smaller, the opposite of expand.',
    difficulty: 'easy',
  },
  {
    key: 'coding-01',
    topic: 'coding-decoding',
    stem: 'If CAT is coded as DBU, how is DOG coded using the same rule?',
    options: ['EPH', 'EOG', 'DPH', 'FQH'],
    correct: 0,
    explanation: 'Each letter is replaced by the next letter in the alphabet.',
    difficulty: 'easy',
  },
  {
    key: 'coding-02',
    topic: 'coding-decoding',
    stem: 'If ROAD is written as URDG, how is MILK written?',
    options: ['PLOM', 'PLON', 'NKMN', 'QJMP'],
    correct: 1,
    explanation: 'Each letter is shifted three positions forward.',
    difficulty: 'medium',
  },
  {
    key: 'coding-03',
    topic: 'coding-decoding',
    stem: 'If SUN is coded as 54 using letter positions, what is the code for SKY?',
    options: ['55', '56', '57', '58'],
    correct: 0,
    explanation: 'S + K + Y equals 19 + 11 + 25 = 55.',
    difficulty: 'medium',
  },
  {
    key: 'coding-04',
    topic: 'coding-decoding',
    stem: 'In a code, PEN is written as QFO. How is MAP written?',
    options: ['NBQ', 'NBO', 'LBQ', 'MBP'],
    correct: 0,
    explanation: 'Each letter is shifted one position forward.',
    difficulty: 'easy',
  },
  {
    key: 'coding-05',
    topic: 'coding-decoding',
    stem: 'If A is coded as 1, B as 2 and so on, what is the value of BAD?',
    options: ['6', '7', '8', '9'],
    correct: 1,
    explanation: 'B + A + D equals 2 + 1 + 4 = 7.',
    difficulty: 'easy',
  },
  {
    key: 'syllogism-01',
    topic: 'syllogism',
    stem: 'Statements: All books are papers. Some papers are files. Which conclusion follows?',
    options: ['All books are files.', 'Some files are books.', 'Some papers are books.', 'No file is a book.'],
    correct: 2,
    explanation: 'If all books are papers, then books are included in the group of papers.',
    difficulty: 'medium',
  },
  {
    key: 'syllogism-02',
    topic: 'syllogism',
    stem: 'Statements: Some pens are blue. All blue things are bright. Which conclusion follows?',
    options: ['Some pens are bright.', 'All pens are bright.', 'No pen is bright.', 'Some bright things are not blue.'],
    correct: 0,
    explanation: 'The pens that are blue must also be bright.',
    difficulty: 'medium',
  },
  {
    key: 'syllogism-03',
    topic: 'syllogism',
    stem: 'Statements: All roses are flowers. No flower is a stone. Which conclusion follows?',
    options: ['No rose is a stone.', 'Some stones are roses.', 'All stones are flowers.', 'Some roses are stones.'],
    correct: 0,
    explanation: 'Roses are flowers, and flowers cannot be stones.',
    difficulty: 'easy',
  },
  {
    key: 'syllogism-04',
    topic: 'syllogism',
    stem: 'Statements: Some doctors are writers. All writers are readers. Which conclusion follows?',
    options: ['Some doctors are readers.', 'All doctors are readers.', 'No writer is a reader.', 'Some readers are not writers.'],
    correct: 0,
    explanation: 'The doctors who are writers are also readers.',
    difficulty: 'medium',
  },
  {
    key: 'syllogism-05',
    topic: 'syllogism',
    stem: 'Statements: No bird is a mammal. All sparrows are birds. Which conclusion follows?',
    options: ['No sparrow is a mammal.', 'All mammals are sparrows.', 'Some sparrows are mammals.', 'No bird is a sparrow.'],
    correct: 0,
    explanation: 'Sparrows are birds, and birds are not mammals in the statements.',
    difficulty: 'easy',
  },
  {
    key: 'ratio-01',
    topic: 'ratio-proportion',
    stem: 'The ratio of two numbers is 3:5 and their sum is 64. What is the smaller number?',
    options: ['18', '24', '32', '40'],
    correct: 1,
    explanation: 'Eight parts equal 64, so three parts equal 24.',
    difficulty: 'easy',
  },
  {
    key: 'ratio-02',
    topic: 'ratio-proportion',
    stem: 'If 4 pens cost 60, what is the cost of 7 pens at the same rate?',
    options: ['90', '100', '105', '120'],
    correct: 2,
    explanation: 'One pen costs 15, so seven pens cost 105.',
    difficulty: 'easy',
  },
  {
    key: 'ratio-03',
    topic: 'ratio-proportion',
    stem: 'Divide 180 in the ratio 2:3. What is the larger share?',
    options: ['72', ' ninety', '108', '120'],
    correct: 2,
    explanation: 'Five parts equal 180, so three parts equal 108.',
    difficulty: 'easy',
  },
  {
    key: 'ratio-04',
    topic: 'ratio-proportion',
    stem: 'If a:b = 2:3 and b:c = 4:5, what is a:c?',
    options: ['2:5', '8:15', '3:5', '4:15'],
    correct: 1,
    explanation: 'Make b equal: 2:3 becomes 8:12 and 4:5 becomes 12:15, so a:c is 8:15.',
    difficulty: 'hard',
  },
  {
    key: 'ratio-05',
    topic: 'ratio-proportion',
    stem: 'The ratio of boys to girls in a class is 5:4. If there are 36 students, how many are girls?',
    options: ['16', '20', '24', '28'],
    correct: 0,
    explanation: 'Nine parts equal 36, so four parts equal 16.',
    difficulty: 'easy',
  },
  {
    key: 'comprehension-01',
    topic: 'reading-comprehension',
    stem: 'Choose the best meaning of “reliable” in: A reliable source can be trusted.',
    options: ['Expensive', 'Trustworthy', 'Popular', 'Recent'],
    correct: 1,
    explanation: 'Reliable means dependable or trustworthy.',
    difficulty: 'easy',
  },
  {
    key: 'comprehension-02',
    topic: 'reading-comprehension',
    stem: 'Choose the correct completion: Although it was raining, the players _____ the match.',
    options: ['continued', 'continuing', 'continues', 'continue'],
    correct: 0,
    explanation: 'The past-tense subject context requires continued.',
    difficulty: 'easy',
  },
  {
    key: 'comprehension-03',
    topic: 'reading-comprehension',
    stem: 'Choose the word opposite in meaning to “ancient”.',
    options: ['Historic', 'Old', 'Modern', 'Former'],
    correct: 2,
    explanation: 'Modern is the opposite of ancient.',
    difficulty: 'easy',
  },
  {
    key: 'comprehension-04',
    topic: 'reading-comprehension',
    stem: 'Choose the correct passive form: The clerk prepared the report.',
    options: ['The report prepared the clerk.', 'The report was prepared by the clerk.', 'The clerk was prepared by the report.', 'The report is preparing the clerk.'],
    correct: 1,
    explanation: 'The object becomes the subject in the passive voice.',
    difficulty: 'medium',
  },
  {
    key: 'comprehension-05',
    topic: 'reading-comprehension',
    stem: 'Choose the correctly punctuated sentence.',
    options: ['Ravi said I am ready.', 'Ravi said, "I am ready."', 'Ravi, said I am ready.', 'Ravi said "I am ready"'],
    correct: 1,
    explanation: 'A comma and quotation marks correctly introduce direct speech.',
    difficulty: 'easy',
  },
  {
    key: 'ga-01',
    topic: 'indian-polity',
    stem: 'Which part of the Indian Constitution contains Fundamental Rights?',
    options: ['Part I', 'Part II', 'Part III', 'Part IV'],
    correct: 2,
    explanation: 'Fundamental Rights are provided in Part III of the Constitution.',
    difficulty: 'easy',
  },
  {
    key: 'ga-02',
    topic: 'indian-polity',
    stem: 'The President of India is elected by:',
    options: ['The people directly', 'An electoral college', 'The Supreme Court', 'The Union Cabinet'],
    correct: 1,
    explanation: 'The President is elected by an electoral college of elected representatives.',
    difficulty: 'medium',
  },
  {
    key: 'ga-03',
    topic: 'indian-polity',
    stem: 'Which house of Parliament is also called the House of the People?',
    options: ['Rajya Sabha', 'Lok Sabha', 'Vidhan Sabha', 'Legislative Council'],
    correct: 1,
    explanation: 'Lok Sabha is the House of the People.',
    difficulty: 'easy',
  },
  {
    key: 'ga-04',
    topic: 'indian-polity',
    stem: 'The minimum age for membership of the Lok Sabha is:',
    options: ['18 years', '21 years', '25 years', '30 years'],
    correct: 2,
    explanation: 'A Lok Sabha candidate must be at least 25 years old.',
    difficulty: 'easy',
  },
  {
    key: 'ga-05',
    topic: 'indian-polity',
    stem: 'Which institution is the final interpreter of the Constitution of India?',
    options: ['Parliament', 'The Supreme Court', 'The Election Commission', 'The Finance Commission'],
    correct: 1,
    explanation: 'The Supreme Court has the power of constitutional interpretation.',
    difficulty: 'medium',
  },
  {
    key: 'ga-06',
    topic: 'indian-history',
    stem: 'The Sanchi Stupa is mainly associated with:',
    options: ['Buddhism', 'Jainism', 'Sikhism', 'Zoroastrianism'],
    correct: 0,
    explanation: 'Sanchi is a major Buddhist monument complex.',
    difficulty: 'easy',
  },
  {
    key: 'ga-07',
    topic: 'indian-history',
    stem: 'The Battle of Plassey was fought in:',
    options: ['1757', '1761', '1857', '1942'],
    correct: 0,
    explanation: 'The Battle of Plassey took place in 1757.',
    difficulty: 'easy',
  },
  {
    key: 'ga-08',
    topic: 'indian-history',
    stem: 'Who founded the Maurya Empire?',
    options: ['Ashoka', 'Chandragupta Maurya', 'Harshavardhana', 'Samudragupta'],
    correct: 1,
    explanation: 'Chandragupta Maurya established the Maurya Empire.',
    difficulty: 'easy',
  },
  {
    key: 'ga-09',
    topic: 'indian-history',
    stem: 'The Quit India Movement was launched in:',
    options: ['1919', '1930', '1942', '1947'],
    correct: 2,
    explanation: 'The Quit India Movement began in August 1942.',
    difficulty: 'easy',
  },
  {
    key: 'ga-10',
    topic: 'indian-history',
    stem: 'The permanent settlement in Bengal was introduced by:',
    options: ['Lord Curzon', 'Lord Cornwallis', 'Lord Dalhousie', 'Lord Ripon'],
    correct: 1,
    explanation: 'Lord Cornwallis introduced the Permanent Settlement in 1793.',
    difficulty: 'medium',
  },
  {
    key: 'ga-11',
    topic: 'general-science',
    stem: 'Which gas is essential for human respiration?',
    options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Hydrogen'],
    correct: 1,
    explanation: 'Human cells use oxygen during respiration.',
    difficulty: 'easy',
  },
  {
    key: 'ga-12',
    topic: 'general-science',
    stem: 'The SI unit of electric current is:',
    options: ['Volt', 'Watt', 'Ampere', 'Ohm'],
    correct: 2,
    explanation: 'Electric current is measured in amperes.',
    difficulty: 'easy',
  },
  {
    key: 'ga-13',
    topic: 'general-science',
    stem: 'Which vitamin is mainly produced in the skin by sunlight?',
    options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'],
    correct: 3,
    explanation: 'Sunlight helps the skin synthesize vitamin D.',
    difficulty: 'easy',
  },
  {
    key: 'ga-14',
    topic: 'general-science',
    stem: 'The boiling point of pure water at sea level is:',
    options: ['0°C', '50°C', '100°C', '212°C below zero'],
    correct: 2,
    explanation: 'Pure water boils at 100°C at standard atmospheric pressure.',
    difficulty: 'easy',
  },
  {
    key: 'ga-15',
    topic: 'general-science',
    stem: 'Which organ filters waste from the blood?',
    options: ['Heart', 'Lungs', 'Kidneys', 'Stomach'],
    correct: 2,
    explanation: 'The kidneys filter waste and excess water from the blood.',
    difficulty: 'easy',
  },
];

type SeedTopic = { slug: string; name: string; description: string };

const SSC_STRUCTURE: Array<{
  subject: string;
  chapter: string;
  topics: SeedTopic[];
}> = [
  {
    subject: 'Reasoning',
    chapter: 'Verbal Reasoning',
    topics: [
      { slug: 'analogy', name: 'Analogy', description: 'Word and number relationship problems.' },
      { slug: 'coding-decoding', name: 'Coding-Decoding', description: 'Letter and symbol coding patterns.' },
      { slug: 'syllogism', name: 'Syllogism', description: 'Statement and conclusion reasoning.' },
    ],
  },
  {
    subject: 'Quantitative Aptitude',
    chapter: 'Arithmetic',
    topics: [
      { slug: 'number-series', name: 'Number Series', description: 'Sequence and pattern completion.' },
      { slug: 'percentage', name: 'Percentage', description: 'Percentage, discount, and change calculations.' },
      { slug: 'ratio-proportion', name: 'Ratio and Proportion', description: 'Ratios, shares, and proportional quantities.' },
    ],
  },
  {
    subject: 'English',
    chapter: 'Language Usage',
    topics: [{ slug: 'grammar', name: 'Grammar and Vocabulary', description: 'Core SSC grammar and vocabulary practice.' }],
  },
  {
    subject: 'General Awareness',
    chapter: 'Static GK',
    topics: [
      { slug: 'indian-polity', name: 'Indian Polity', description: 'Constitution, Parliament, and governance.' },
      { slug: 'indian-history', name: 'Indian History', description: 'Important events, periods, and movements.' },
      { slug: 'general-science', name: 'General Science', description: 'Foundational physics, chemistry, and biology.' },
    ],
  },
];

async function getSeedOwner(): Promise<string | null> {
  const owner = await UserModel.findOne({ role: { $in: ['super_admin', 'content_manager'] } }).sort({ createdAt: 1 });
  return owner?._id.toString() ?? null;
}

export async function seedSscContent(log: FastifyBaseLogger): Promise<void> {
  const ownerId = await getSeedOwner();
  if (!ownerId) {
    log.warn('[seed] no admin/content manager found; skipping SSC content seed');
    return;
  }

  const category = await CategoryModel.findOneAndUpdate(
    { slug: 'ssc' },
    { $setOnInsert: { name: 'SSC', slug: 'ssc', description: 'Staff Selection Commission exam preparation.', isActive: true, sortOrder: 1 } },
    { upsert: true, new: true },
  );
  const topicMap = new Map<string, { topicId: string; subjectId: string; chapterId: string }>();

  for (const [subjectIndex, subjectSeed] of SSC_STRUCTURE.entries()) {
    const subject = await SubjectModel.findOneAndUpdate(
      { categoryId: category._id, slug: subjectSeed.subject.toLowerCase().replaceAll(' ', '-') },
      { $setOnInsert: { categoryId: category._id, name: subjectSeed.subject, slug: subjectSeed.subject.toLowerCase().replaceAll(' ', '-'), description: `SSC ${subjectSeed.subject} preparation.`, isActive: true, sortOrder: subjectIndex + 1 } },
      { upsert: true, new: true },
    );
    const chapter = await ChapterModel.findOneAndUpdate(
      { subjectId: subject._id, slug: subjectSeed.chapter.toLowerCase().replaceAll(' ', '-') },
      { $setOnInsert: { subjectId: subject._id, name: subjectSeed.chapter, slug: subjectSeed.chapter.toLowerCase().replaceAll(' ', '-'), description: `Core ${subjectSeed.chapter} topics.`, isActive: true, sortOrder: 1 } },
      { upsert: true, new: true },
    );
    for (const [topicIndex, topicSeed] of subjectSeed.topics.entries()) {
      const topic = await TopicModel.findOneAndUpdate(
        { chapterId: chapter._id, slug: topicSeed.slug },
        { $setOnInsert: { chapterId: chapter._id, name: topicSeed.name, slug: topicSeed.slug, description: topicSeed.description, isActive: true, sortOrder: topicIndex + 1 } },
        { upsert: true, new: true },
      );
      topicMap.set(topicSeed.slug, {
        topicId: topic._id.toString(),
        subjectId: subject._id.toString(),
        chapterId: chapter._id.toString(),
      });
    }
  }

  const questionIds: string[] = [];
  for (const questionSeed of SSC_QUESTIONS) {
    const hierarchy = topicMap.get(questionSeed.topic);
    if (!hierarchy) continue;
    const optionIds = questionSeed.options.map((_, index) => String.fromCharCode(65 + index));
    const question = await QuestionModel.findOneAndUpdate(
      { tags: `seed-ssc-${questionSeed.key}` },
      {
        $set: {
          categoryId: category._id,
          subjectId: hierarchy.subjectId,
          chapterId: hierarchy.chapterId,
          topicId: hierarchy.topicId,
          type: 'mcq_single',
          stem: questionSeed.stem,
          options: questionSeed.options.map((text, index) => ({ id: optionIds[index], text })),
          correctOptionIds: [optionIds[questionSeed.correct]],
          explanation: questionSeed.explanation,
          difficulty: questionSeed.difficulty,
          marks: 1,
          negativeMarks: 0.25,
          tags: [`seed-ssc-${questionSeed.key}`, 'ssc', 'original-content'],
          imageUrls: [],
          status: 'published',
          createdBy: ownerId,
        },
      },
      { upsert: true, new: true },
    );
    if (question) questionIds.push(question._id.toString());
  }

  if (questionIds.length < 10) {
    log.warn({ count: questionIds.length }, '[seed] not enough SSC questions to create exams');
    return;
  }

  const examSets = [
    { slug: 'ssc-foundation-mock-1', title: 'SSC Foundation Mock 1', ids: questionIds.slice(0, 20) },
    { slug: 'ssc-foundation-mock-2', title: 'SSC Foundation Mock 2', ids: questionIds.slice(10, 30) },
    { slug: 'ssc-general-awareness-mock-1', title: 'SSC General Awareness Mock 1', ids: questionIds.slice(25, 45) },
  ];
  for (const [index, examSeed] of examSets.entries()) {
    await ExamModel.findOneAndUpdate(
      { slug: examSeed.slug },
      {
        $set: {
          title: examSeed.title,
          slug: examSeed.slug,
          description: 'Original SSC practice questions across Reasoning, Quantitative Aptitude, English, and General Awareness.',
          type: 'mock',
          testSeriesId: null,
          durationMinutes: 20,
          totalMarks: examSeed.ids.length,
          questionIds: examSeed.ids,
          negativeMarking: true,
          status: 'published',
          year: 2026,
          quizDate: null,
          createdBy: ownerId,
        },
      },
      { upsert: true, new: true },
    );
    log.info({ slug: examSeed.slug, questions: examSeed.ids.length, order: index + 1 }, '[seed] SSC exam ready');
  }
}
