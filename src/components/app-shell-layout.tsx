import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useBoardsBootstrap } from '@/hooks/useBoardsBootstrap';

export function AppShellLayout() {
  useBoardsBootstrap();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <div className="flex flex-1 flex-col pb-20 md:pb-4">
          <Outlet />
        </div>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
