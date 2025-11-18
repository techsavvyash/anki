import { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';
import TopBar from './TopBar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export default function Layout({ children, title, showBackButton = false }: LayoutProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <TopBar title={title} showBackButton={showBackButton} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
