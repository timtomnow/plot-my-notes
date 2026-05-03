import { Link } from 'react-router-dom';
import { Sliders, Layers, ChevronRight, Github } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAxes, useTrackingTypes } from '@/db/repo';

const REPO_URL = 'https://github.com/timtomnow/plot-my-notes';

export function Settings() {
  const axes = useAxes();
  const types = useTrackingTypes();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your tracking system." />
      <ul className="space-y-3">
        <SettingLink
          to="/settings/axes"
          icon={<Sliders size={20} />}
          title="Axes"
          subtitle={`${axes?.length ?? 0} defined`}
          description="Measurable dimensions of feeling, like Happiness or Energy."
        />
        <SettingLink
          to="/settings/tracking-types"
          icon={<Layers size={20} />}
          title="Tracking Types"
          subtitle={`${types?.length ?? 0} defined`}
          description="What you log — combine one or two axes (1D or 2D)."
        />
      </ul>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
          About
        </h2>
        <div className="card p-5">
          <div className="text-base font-semibold">Plot My Notes</div>
          <p className="mt-1 text-sm text-ink-500">
            A calm, local-first journaling and emotional-tracking app. Define
            your axes, log your day, see the patterns.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900"
          >
            <Github size={16} />
            github.com/timtomnow/plot-my-notes
          </a>
          <div className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
            © {new Date().getFullYear()} timtomnow · v0.1 · local-first
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingLink({
  to,
  icon,
  title,
  subtitle,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 transition hover:border-ink-300"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            <span className="text-xs text-ink-400">{subtitle}</span>
          </div>
          <p className="truncate text-xs text-ink-500">{description}</p>
        </div>
        <ChevronRight size={18} className="text-ink-400" />
      </Link>
    </li>
  );
}
