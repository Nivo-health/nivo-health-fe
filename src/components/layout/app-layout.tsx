import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import BottomNav from './bottom-nav';
import Sidebar from './sidebar';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function AppLayout({
  children,
  showSidebar = true,
}: AppLayoutProps) {
  return (
    <div className="md:min-h-screen h-[calc(100vh-20px)] bg-gray-50 overflow-x-hidden overflow-hidden">
      <div className="flex">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        <main
          className={cn('flex-1 transition-all duration-300', 'pb-16 md:pb-0', {
            'md:ml-64 ml-0': showSidebar,
            'ml-0': !showSidebar,
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
