import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ListTodo, LineChart, Settings as SettingsIcon, Plus, type LucideIcon } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/90 backdrop-blur md:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-2 pt-1">
        <NavItem to="/" label="Home" Icon={Home} end />
        <NavItem to="/entries" label="Entries" Icon={ListTodo} />

        <div className="-mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-ink-50 shadow-lg active:scale-95"
            aria-label="New entry"
          >
            <Plus size={26} />
          </button>
        </div>

        <NavItem to="/charts" label="Charts" Icon={LineChart} />
        <NavItem to="/settings" label="Settings" Icon={SettingsIcon} />
      </div>
    </nav>
  );
}

type NavItemProps = {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
};

function NavItem({ to, label, Icon, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition',
          isActive ? 'text-ink-900' : 'text-ink-400',
        ].join(' ')
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  );
}
