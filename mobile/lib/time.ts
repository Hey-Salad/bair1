import { formatDistanceToNow } from 'date-fns';

export function isoFrom(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return 'never';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return 'unknown';
  }
}

/** Downsample an array to at most `max` evenly-spaced points (keeps last). */
export function downsample<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    out.push(items[Math.floor(i * step)]);
  }
  if (out[out.length - 1] !== items[items.length - 1]) out.push(items[items.length - 1]);
  return out;
}
