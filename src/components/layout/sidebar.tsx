import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Separator } from '../ui/separator';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import ClipboardClock from 'lucide-react/dist/esm/icons/clipboard-clock';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Home from 'lucide-react/dist/esm/icons/home';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Users from 'lucide-react/dist/esm/icons/users';

type SidebarProps = ReturnType<typeof useSidebarState>;

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: <Home className="size-4" /> },
  {
    name: 'Appointments',
    path: '/appointments',
    icon: <CalendarDays className="size-4" />,
  },
  {
    name: 'Queue',
    path: '/visits',
    icon: <ClipboardList className="size-4" />,
  },
  {
    name: 'All Patients',
    path: '/patients',
    icon: <Users className="size-4" />,
  },
  {
    name: 'Doctor Schedule',
    path: '/doctor-schedule',
    icon: <ClipboardClock className="size-4" />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="size-4" />,
  },
];

export default function Sidebar({ collapsed, toggle }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-full bg-primary-foreground overflow-y-auto md:block transition-all duration-200 ease-in-out',
        {
          'w-12': collapsed,
          'w-64': !collapsed,
        },
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between gap-2 px-2">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <img
              src="/logo.png"
              alt="Nivo health"
              className="size-9 rounded-full border border-primary shrink-0"
            />
            {!collapsed && (
              <h1 className="whitespace-nowrap text-xl font-bold text-primary">
                Nivo health
              </h1>
            )}
          </Link>
        )}

        <button
          onClick={toggle}
          className="rounded-md p-1 text-primary hover:bg-primary/10 cursor-col-resize group"
          title="Toggle sidebar"
        >
          {/* <img
            src="/logo.png"
            alt="Nivo health"
            className={cn(
              'size-6 rounded-full border border-primary shrink-0',
              {
                'group-hover:hidden block': collapsed,
                hidden: !collapsed,
              },
            )}
          /> */}
          <PanelLeft
            className={cn('size-5', {
              // 'group-hover:block hidden': collapsed,
            })}
          />
        </button>
      </div>

      <Separator className="bg-primary/10" />

      {/* Navigation */}
      <nav className="px-2 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={collapsed ? item.name : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
              isActive(item.path)
                ? 'bg-primary/20 text-primary'
                : 'text-gray-700 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <span className="shrink-0">{item.icon}</span>

            <span
              className={cn('transition-all whitespace-nowrap', {
                'opacity-0 w-0 overflow-hidden': collapsed,
                'opacity-100': !collapsed,
              })}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
