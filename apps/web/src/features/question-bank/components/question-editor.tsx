'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import * as qb from '@/features/question-bank/api';
import { RichTextEditor } from '@/features/question-bank/components/rich-text-editor';
import { questionFormSchema, type QuestionFormInput } from '@/features/question-bank/schemas';
import type { Question, Topic } from '@/features/question-bank/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

function newOptionId() {
  return `opt_${Math.random().toString(36).slice(2, 10)}`;
}

type QuestionEditorProps = {
  mode: 'create' | 'edit';
  initial?: Question;
};

export function QuestionEditor({ mode, initial }: QuestionEditorProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const defaultValues = useMemo<QuestionFormInput>(
    () => ({
      topicId: initial?.topicId ?? '',
      type: initial?.type ?? 'mcq_single',
      stem: initial?.stem ?? '',
      options: initial?.options?.length
        ? initial.options.map((option) => ({
            id: option.id,
            text: option.text,
            imageUrl: option.imageUrl,
          }))
        : [
            { id: newOptionId(), text: '' },
            { id: newOptionId(), text: '' },
            { id: newOptionId(), text: '' },
            { id: newOptionId(), text: '' },
          ],
      correctOptionIds: initial?.correctOptionIds ?? [],
      explanation: initial?.explanation ?? '',
      difficulty: initial?.difficulty ?? 'medium',
      marks: initial?.marks ?? 1,
      negativeMarks: initial?.negativeMarks ?? 0,
      tags: initial?.tags?.join(', ') ?? '',
      status: initial?.status ?? 'draft',
    }),
    [initial],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema) as Resolver<QuestionFormInput>,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
    keyName: 'fieldKey',
  });

  const correctOptionIds = watch('correctOptionIds');
  const questionType = watch('type');

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void qb.listTopics(accessToken).then((result) => setTopics(result.items));
  }, [accessToken]);

  const toggleCorrect = (optionId: string) => {
    if (questionType === 'mcq_single') {
      setValue('correctOptionIds', [optionId], { shouldValidate: true });
      return;
    }
    const next = correctOptionIds.includes(optionId)
      ? correctOptionIds.filter((id) => id !== optionId)
      : [...correctOptionIds, optionId];
    setValue('correctOptionIds', next, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!accessToken) {
      return;
    }
    setError(null);
    const payload = {
      topicId: values.topicId,
      type: values.type,
      stem: values.stem,
      options: values.options.map((option) => ({
        id: option.id,
        text: option.text,
        ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
      })),
      correctOptionIds: values.correctOptionIds,
      explanation: values.explanation ?? '',
      difficulty: values.difficulty,
      marks: values.marks,
      negativeMarks: values.negativeMarks,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      status: values.status,
    };

    try {
      if (mode === 'create') {
        const result = await qb.createQuestion(accessToken, payload);
        router.push(`/admin/question-bank/questions/${result.item.id}`);
      } else if (initial) {
        await qb.updateQuestion(accessToken, initial.id, payload);
        router.push('/admin/question-bank/questions');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  });

  const uploadImage = async (file: File) => {
    if (!accessToken) {
      throw new Error('Not signed in');
    }
    const uploaded = await qb.uploadImage(accessToken, file);
    return qb.mediaUrl(uploaded.url);
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="panel space-y-4">
        <h1 className="font-display text-3xl text-brand-950">
          {mode === 'create' ? 'New question' : 'Edit question'}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Topic</span>
            <select className="input-field" {...register('topicId')}>
              <option value="">Select topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            {errors.topicId ? (
              <p className="mt-1 text-xs text-red-600">{errors.topicId.message}</p>
            ) : null}
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Type</span>
            <select className="input-field" {...register('type')}>
              <option value="mcq_single">Single choice</option>
              <option value="mcq_multiple">Multiple correct</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Difficulty</span>
            <select className="input-field" {...register('difficulty')}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Status</span>
            <select className="input-field" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Marks</span>
            <input type="number" step="0.25" className="input-field" {...register('marks')} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Negative marks</span>
            <input
              type="number"
              step="0.25"
              className="input-field"
              {...register('negativeMarks')}
            />
          </label>
        </div>

        <div>
          <p className="mb-1 text-sm text-ink-muted">Question stem</p>
          <Controller
            control={control}
            name="stem"
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter the question…"
                onUploadImage={uploadImage}
              />
            )}
          />
          {errors.stem ? <p className="mt-1 text-xs text-red-600">{errors.stem.message}</p> : null}
        </div>

        <div>
          <p className="mb-1 text-sm text-ink-muted">Explanation</p>
          <Controller
            control={control}
            name="explanation"
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Explain the correct answer…"
                onUploadImage={uploadImage}
              />
            )}
          />
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Tags (comma separated)</span>
          <input className="input-field" {...register('tags')} placeholder="algebra, percentages" />
        </label>
      </div>

      <div className="panel space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-900">Options</h2>
          <button
            type="button"
            className="btn-secondary !py-1.5"
            onClick={() => append({ id: newOptionId(), text: '' })}
            disabled={fields.length >= 8}
          >
            Add option
          </button>
        </div>
        {errors.correctOptionIds ? (
          <p className="text-xs text-red-600">{errors.correctOptionIds.message}</p>
        ) : null}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.fieldKey} className="rounded-md border border-brand-100 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type={questionType === 'mcq_single' ? 'radio' : 'checkbox'}
                    name="correct"
                    checked={correctOptionIds.includes(field.id)}
                    onChange={() => toggleCorrect(field.id)}
                  />
                  Correct answer
                </label>
                {fields.length > 2 ? (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      remove(index);
                      setValue(
                        'correctOptionIds',
                        correctOptionIds.filter((id) => id !== field.id),
                      );
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <input type="hidden" {...register(`options.${index}.id`)} />
              <input
                className="input-field"
                placeholder={`Option ${index + 1}`}
                {...register(`options.${index}.text`)}
              />
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save question'}
        </button>
        <Link href="/admin/question-bank/questions" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
