import { z } from 'zod';

import { env } from '../config/env.js';

const planSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(240),
  studyTip: z.string().trim().min(10).max(240),
  topics: z
    .array(
      z.object({
        topicId: z.string().min(1),
        questionCount: z.number().int().min(1).max(20),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        reason: z.string().trim().min(10).max(160),
      }),
    )
    .min(1)
    .max(3),
});

export type PersonalizedTestPlan = z.infer<typeof planSchema>;

type WeakTopicInput = {
  topicId: string;
  name: string;
  attempted: number;
  correct: number;
  accuracy: number;
};

function getApiKey(): string | undefined {
  return env.GEMINI_API_KEY || process.env.GeminiAPI;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

export async function createPersonalizedTestPlan(
  weakTopics: WeakTopicInput[],
): Promise<PersonalizedTestPlan | null> {
  const apiKey = getApiKey();
  if (!apiKey || weakTopics.length === 0) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    'You are an SSC exam learning coach.',
                    'Create a focused personalized test plan from the weak-topic metrics below.',
                    'Return JSON only. Use only the supplied topicId values.',
                    'The total questionCount must be between 5 and 20.',
                    JSON.stringify({ exam: 'SSC', weakTopics }),
                    'Required JSON shape: {"title":"...","description":"...","studyTip":"...","topics":[{"topicId":"...","questionCount":10,"difficulty":"easy|medium|hard","reason":"..."}]}',
                  ].join('\n'),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return planSchema.parse(extractJson(text));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}