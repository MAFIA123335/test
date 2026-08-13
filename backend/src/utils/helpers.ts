import crypto from 'crypto';

/** Convert an arbitrary string to a URL-safe slug (supports Arabic passthrough). */
export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Guarantee slug uniqueness by appending a short random suffix on collision. */
export function uniqueSlug(base: string): string {
  return `${slugify(base)}-${crypto.randomBytes(3).toString('hex')}`;
}

/** Generate a human-friendly order number, e.g. BC-20260723-4F2A9C. */
export function generateOrderNumber(prefix = 'BC'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

export function generateTicketNumber(): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${rand}`;
}

/** Round money values to 2 decimals safely. */
export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
