import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from './sidebar';

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary-foreground shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full transition-colors',
              {
                'text-primary': isActive(item.path),
                'text-gray-500 hover:text-primary': !isActive(item.path),
              },
            )}
          >
            <div
              className={cn('flex items-center justify-center mb-1', {
                'text-primary': isActive(item.path),
              })}
            >
              {item.icon}
            </div>
            {/* <span className="text-xs font-medium text-center">{item.name}</span> */}
          </Link>
        ))}
      </div>
    </nav>
  );
}
