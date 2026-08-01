import { TabAnimatedOutlet } from '@/components/tab-animated-outlet';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { BoardsBootstrapError } from '@/components/boards-bootstrap-error';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useBoardsBootstrap } from '@/hooks/useBoardsBootstrap';
import { useOnboardingRedirect } from '@/hooks/useOnboardingRedirect';
import { useOfflineExpenseSync } from '@/hooks/useOfflineExpenseSync';
import { useScrollMinimize } from '@/hooks/useScrollMinimize';
import { OfflineSyncBanner } from '@/components/offline-sync-banner';
import { useBoardsStore } from '@/store/boardsStore';

export function AppShellLayout() {
  useBoardsBootstrap();
  useOnboardingRedirect();
  const bootstrapStatus = useBoardsStore((state) => state.bootstrapStatus);
  const pendingOfflineCount = useOfflineExpenseSync();
  const navMinimized = useScrollMinimize();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200 ease-linear">
        <SiteHeader />
        <OfflineSyncBanner pendingCount={pendingOfflineCount} />
        <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden md:overflow-visible md:pb-4">
          {bootstrapStatus === 'error' ? (
            <BoardsBootstrapError />
          ) : (
            <TabAnimatedOutlet />
          )}
        </div>
        <PWAInstallPrompt />
        <BottomNav minimized={navMinimized} />
      </SidebarInset>
    </SidebarProvider>
  );
}
