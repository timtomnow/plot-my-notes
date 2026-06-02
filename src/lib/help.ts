// Loads in-app help guides from `src/content/help/*.md` at build time.
//
// Each guide is a Markdown file with a small YAML-ish frontmatter block:
//
//   ---
//   title: Create a custom axis
//   category: Tracking setup
//   order: 10
//   summary: Define a new measurable dimension to log against.
//   ---
//   <markdown body…>
//
// The `ttn-docs` Claude Skill writes these files; this module is the contract
// it targets. Keep the frontmatter keys below in sync with the skill template.

export type HelpGuide = {
  slug: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  body: string;
};

// Vite inlines every matching file as a raw string at build time.
const rawGuides = import.meta.glob('../content/help/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { meta: {}, body: raw.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    // Strip optional surrounding quotes.
    meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { meta, body: match[2].trim() };
}

function buildGuides(): HelpGuide[] {
  const guides = Object.entries(rawGuides).map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw);
    const slug = meta.slug || slugFromPath(path);
    return {
      slug,
      title: meta.title || slug,
      category: meta.category || 'General',
      order: Number.isFinite(Number(meta.order)) ? Number(meta.order) : 999,
      summary: meta.summary || '',
      body,
    } satisfies HelpGuide;
  });

  guides.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return guides;
}

const guides = buildGuides();

export function getGuides(): HelpGuide[] {
  return guides;
}

export function getGuide(slug: string): HelpGuide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function getGuidesByCategory(): { category: string; guides: HelpGuide[] }[] {
  const groups = new Map<string, HelpGuide[]>();
  for (const guide of guides) {
    const list = groups.get(guide.category) ?? [];
    list.push(guide);
    groups.set(guide.category, list);
  }
  return [...groups.entries()].map(([category, guides]) => ({ category, guides }));
}
