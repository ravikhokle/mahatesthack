import { createHash } from 'node:crypto';

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return base.length > 0 ? base : `item-${createHash('sha1').update(input).digest('hex').slice(0, 8)}`;
}

export function isObjectIdString(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
