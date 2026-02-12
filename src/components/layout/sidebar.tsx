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
    icon: <Home className="w-5 h-5" />,
  },
  {
    name: 'Appointments',
    path: '/appointments',
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    name: 'Queue',
    path: '/visits',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    name: 'All Patients',
    path: '/patients',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Doctor Schedule',
    path: '/doctor-schedule',
    icon: <ClipboardClock className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
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
    <aside className="fixed left-0 h-full w-64 bg-white border-r border-teal-100 overflow-y-auto hidden md:block">
      <>
        <div className="flex items-center gap-4 px-4 md:px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Nivo Health"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <h1 className="text-xl font-bold text-gray-900">{'Nivo Health'}</h1>
          </Link>
        </div>
        <Separator className="bg-primary/10" />
      </>
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700',
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
