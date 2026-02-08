import { useClinic } from '@/hooks';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Separator } from '../ui/separator';
import {
  CalendarDays,
  ClipboardList,
  Home,
  Settings,
  Users,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
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
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { clinic } = useClinic();
  const clinicName = clinic?.name || 'Clinic OPD Management';

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
            <div className="w-8 h-8 bg-linear-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              {/* TODO: add logo here */}
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
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
