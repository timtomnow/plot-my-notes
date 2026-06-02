import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageHeader } from '@/components/ui/PageHeader';
import { getGuide, getGuidesByCategory } from '@/lib/help';

export function Help() {
  const { slug } = useParams();
  if (slug) return <GuideDetail slug={slug} />;
  return <GuideIndex />;
}

function GuideIndex() {
  const groups = getGuidesByCategory();

  return (
    <div>
      <PageHeader title="Help & Guides" subtitle="Step-by-step walkthroughs for getting things done." />
      {groups.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-400">
          No guides yet. Generate them with the <span className="font-mono">ttn-docs</span> skill.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ category, guides }) => (
            <section key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                {category}
              </h2>
              <ul className="space-y-2">
                {guides.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      to={`/help/${guide.slug}`}
                      className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 transition hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-700 dark:hover:bg-ink-800"
                    >
                      <BookOpen size={18} className="mt-0.5 shrink-0 text-ink-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{guide.title}</span>
                        {guide.summary && (
                          <span className="mt-0.5 block text-sm text-ink-500 dark:text-ink-400">
                            {guide.summary}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={18} className="mt-0.5 shrink-0 text-ink-300 dark:text-ink-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GuideDetail({ slug }: { slug: string }) {
  const guide = getGuide(slug);

  if (!guide) {
    return (
      <div>
        <BackLink />
        <PageHeader title="Guide not found" subtitle="This guide may have moved or not been written yet." />
      </div>
    );
  }

  return (
    <div>
      <BackLink />
      <PageHeader title={guide.title} subtitle={guide.summary || undefined} />
      <article className="prose prose-ink max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-lg prose-a:text-ink-900 dark:prose-a:text-ink-50 prose-img:rounded-xl prose-img:border prose-img:border-ink-200 dark:prose-img:border-ink-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.body}</ReactMarkdown>
      </article>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/help"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
    >
      <ArrowLeft size={16} />
      All guides
    </Link>
  );
}
