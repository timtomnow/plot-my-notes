import type { JournalEntry } from '@/types';

/** Tags are stored case-preserving but compared lower-case. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 32);
}

export function tagKey(t: string): string {
  return t.trim().toLowerCase();
}

export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTag(t);
    if (!n) continue;
    const k = tagKey(n);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

export type TagSuggestion = { tag: string; count: number };

/**
 * Build a frequency-sorted list of tags across all entries. The display form
 * is whichever casing was most recently used.
 */
export function rankTags(entries: JournalEntry[] | undefined): TagSuggestion[] {
  if (!entries) return [];
  const counts = new Map<string, { tag: string; count: number; lastSeen: number }>();
  for (const e of entries) {
    if (!e.tags) continue;
    for (const t of e.tags) {
      const k = tagKey(t);
      if (!k) continue;
      const cur = counts.get(k);
      if (cur) {
        cur.count += 1;
        if (e.updatedAt > cur.lastSeen) {
          cur.tag = t;
          cur.lastSeen = e.updatedAt;
        }
      } else {
        counts.set(k, { tag: t, count: 1, lastSeen: e.updatedAt });
      }
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
    .map(({ tag, count }) => ({ tag, count }));
}
