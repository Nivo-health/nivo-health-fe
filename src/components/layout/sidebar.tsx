import { cn } from '@/lib/utils';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import ClipboardClock from 'lucide-react/dist/esm/icons/clipboard-clock';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Home from 'lucide-react/dist/esm/icons/home';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Users from 'lucide-react/dist/esm/icons/users';
import { Link, useLocation } from 'react-router-dom';
import { Separator } from '../ui/separator';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const navItems: NavItem[] = [
  {
    name: 'Home',
    path: '/',
    icon: <Home className="size-4" />,
  },
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

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 h-full w-64 bg-primary-foreground overflow-y-auto hidden md:block">
      <>
        <div className="flex items-center gap-4 px-4 md:px-6 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Nivo health"
              className="size-9 rounded-full object-contain border border-primary"
            />
            <h1 className="text-xl font-bold text-primary">Nivo health</h1>
          </Link>
        </div>
        <Separator className="bg-primary/10" />
      </>
      <nav className="px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-medium transition-colors',
              {
                'bg-primary/20 text-primary': isActive(item.path),
                'text-gray-700 hover:bg-primary/10 hover:text-primary':
                  !isActive(item.path),
              },
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
