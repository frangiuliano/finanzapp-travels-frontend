import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BoardSwitcher } from '@/components/board-switcher';
import { useBoardsStore } from '@/store/boardsStore';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const activeBoard = currentBoard || boards[0];
  const displayTitle = activeBoard ? activeBoard.name : 'FinanzApp';

  return (
    <div
      className={cn(
        'sticky top-0 z-30',
        'pointer-events-none px-3 pt-[var(--mobile-header-top)] md:pointer-events-auto md:px-0 md:pt-0',
      )}
    >
      <header
        className={cn(
          'pointer-events-auto flex flex-col gap-2 px-3 py-2',
          'max-md:glass-surface max-md:glass-surface-bar',
          'md:h-14 md:flex-row md:items-center md:gap-2 md:rounded-none md:border-b md:border-border/70 md:bg-background/85 md:px-4 md:shadow-none md:backdrop-blur-md lg:px-6',
        )}
      >
        <div className="flex w-full min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1 hidden shrink-0 md:inline-flex" />
          <Separator
            orientation="vertical"
            className="mx-1 hidden data-[orientation=vertical]:h-4 md:block"
          />
          <h1 className="font-display min-w-0 flex-1 truncate text-base font-semibold">
            <span className="md:hidden">FinanzApp</span>
            <span className="hidden md:inline">{displayTitle}</span>
          </h1>
        </div>
        <div className="w-full md:hidden">
          <BoardSwitcher variant="header" />
        </div>
      </header>
    </div>
  );
}
