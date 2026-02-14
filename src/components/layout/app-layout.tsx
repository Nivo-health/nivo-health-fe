import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import BottomNav from './bottom-nav';
import Sidebar from './sidebar';
import { useSidebarState } from '@/hooks/use-sidebar-state';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const sidebarState = useSidebarState();

  return (
    <div className="md:min-h-screen h-[calc(100vh-20px)] bg-gray-50 overflow-x-hidden overflow-hidden">
      <div className="flex">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        <div className="hidden md:block">
          <Sidebar {...sidebarState} />
        </div>
        <main
          className={cn('flex-1 transition-all duration-300', 'pb-16 md:pb-0', {
            'ml-0': sidebarState.collapsed,
            'md:ml-64': !sidebarState.collapsed,
          })}
        >
          {children}
        </main>
      </div>
      {/* Bottom Navigation - visible only on mobile */}
      <BottomNav />
    </div>
  );
}
