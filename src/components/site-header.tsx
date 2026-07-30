import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BoardSwitcher } from '@/components/board-switcher';
import { useBoardsStore } from '@/store/boardsStore';

export function SiteHeader() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const activeBoard = currentBoard || boards[0];
  const displayTitle = activeBoard ? activeBoard.name : 'FinanzApp';

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-border/70 bg-background/85 px-3 py-2 backdrop-blur-md md:h-14 md:flex-row md:items-center md:gap-2 md:px-4 lg:px-6">
      <div className="flex w-full items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 hidden shrink-0 md:inline-flex" />
        <Separator
          orientation="vertical"
          className="mx-1 hidden data-[orientation=vertical]:h-4 md:block"
        />
        <h1 className="font-display text-base font-semibold truncate flex-1 min-w-0">
          <span className="md:hidden">FinanzApp</span>
          <span className="hidden md:inline">{displayTitle}</span>
        </h1>
      </div>
      <div className="w-full md:hidden">
        <BoardSwitcher variant="header" />
      </div>
    </header>
  );
}
