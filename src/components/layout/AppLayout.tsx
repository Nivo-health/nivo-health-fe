import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function AppLayout({
  children,
  showSidebar = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      <div className="flex pt-16">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            'pb-16 md:pb-0', // Add bottom padding on mobile for bottom nav
            showSidebar ? 'md:ml-64 ml-0' : 'ml-0',
          )}
        >
          {children}
        </main>
      </div>
      {/* Bottom Navigation - visible only on mobile */}
      <BottomNav />
    </div>
  );
}
