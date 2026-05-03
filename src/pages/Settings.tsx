import { Link } from 'react-router-dom';
import { Sliders, Layers, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAxes, useTrackingTypes } from '@/db/repo';

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
      <p className="mt-8 text-center text-xs text-ink-400">
        Plot My Notes · v0.1 · local-first
      </p>
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
