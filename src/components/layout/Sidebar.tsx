import { NavLink } from 'react-router-dom';
import { Home, Plus, LineChart, ListTodo, Settings as SettingsIcon } from 'lucide-react';
import { Logo } from './Logo';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/new', label: 'New Entry', icon: Plus },
  { to: '/entries', label: 'Entries', icon: ListTodo },
  { to: '/charts', label: 'Charts', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 md:flex md:flex-col">
      <div className="px-6 py-6">
        <Logo />
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900'
                      : 'text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-6 py-4 text-xs text-ink-400 dark:text-ink-500">
        Press <kbd className="rounded bg-ink-100 px-1.5 py-0.5 font-mono dark:bg-ink-800 dark:text-ink-200">n</kbd> for new entry
      </div>
    </aside>
  );
}
