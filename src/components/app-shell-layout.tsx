import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { BoardsBootstrapError } from '@/components/boards-bootstrap-error';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useBoardsBootstrap } from '@/hooks/useBoardsBootstrap';
import { useOnboardingRedirect } from '@/hooks/useOnboardingRedirect';
import { useOfflineExpenseSync } from '@/hooks/useOfflineExpenseSync';
import { OfflineSyncBanner } from '@/components/offline-sync-banner';
import { useBoardsStore } from '@/store/boardsStore';

export function AppShellLayout() {
  useBoardsBootstrap();
  useOnboardingRedirect();
  const bootstrapStatus = useBoardsStore((state) => state.bootstrapStatus);
  const pendingOfflineCount = useOfflineExpenseSync();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <OfflineSyncBanner pendingCount={pendingOfflineCount} />
        <div className="flex flex-1 flex-col pb-20 md:pb-4">
          {bootstrapStatus === 'error' ? <BoardsBootstrapError /> : <Outlet />}
        </div>
        <PWAInstallPrompt />
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
