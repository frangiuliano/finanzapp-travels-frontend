'use client';

import * as React from 'react';
import { ChevronsUpDown, LayoutGrid, Plane, Plus, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { selectBoard } from '@/hooks/useBoardsBootstrap';
import { useBoardsStore } from '@/store/boardsStore';
import { boardSharingLabel, boardTypeLabel, type Board } from '@/types/board';
import { cn } from '@/lib/utils';

function BoardIcon({ type }: { type: Board['type'] }) {
  if (type === 'everyday') {
    return <Home className="size-4" />;
  }
  return <Plane className="size-4" />;
}

interface BoardSwitcherProps {
  variant?: 'sidebar' | 'header';
  className?: string;
}

export function BoardSwitcher({
  variant = 'sidebar',
  className,
}: BoardSwitcherProps) {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const isLoading = useBoardsStore((state) => state.isLoading);

  const activeBoard = currentBoard ?? boards[0] ?? null;

  if (isLoading && boards.length === 0) {
    return (
      <div
        className={cn('h-12 animate-pulse rounded-xl bg-muted/80', className)}
      />
    );
  }

  if (!activeBoard || boards.length === 0) {
    if (variant === 'header') {
      return (
        <Button
          variant="outline"
          className={cn('h-11 justify-start gap-2 rounded-xl', className)}
          onClick={() => navigate('/onboarding')}
        >
          <Plus className="size-4" />
          Crear primer tablero
        </Button>
      );
    }

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => navigate('/onboarding')}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Crear primer tablero</span>
              <span className="truncate text-xs text-muted-foreground">
                Empezá sin forzar un viaje
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const triggerContent = (
    <>
      <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm">
        <BoardIcon type={activeBoard.type} />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
        <span className="truncate font-display font-semibold tracking-tight">
          {activeBoard.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {boardTypeLabel(activeBoard.type)} ·{' '}
          {boardSharingLabel(activeBoard.isShared)} · {activeBoard.baseCurrency}
        </span>
      </div>
      <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60" />
    </>
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'header' ? (
          <Button
            variant="outline"
            className={cn(
              'h-11 w-full justify-start gap-2 rounded-xl border-border/80 bg-card/80 px-2 shadow-sm backdrop-blur-sm',
              className,
            )}
          >
            {triggerContent}
          </Button>
        ) : (
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            {triggerContent}
          </SidebarMenuButton>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl"
        align="start"
        side={variant === 'header' || isMobile ? 'bottom' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Tableros
        </DropdownMenuLabel>
        {boards.map((board) => (
          <DropdownMenuItem
            key={board._id}
            onClick={() => selectBoard(board)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-md border">
              <BoardIcon type={board.type} />
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="truncate font-medium">{board.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {boardTypeLabel(board.type)} ·{' '}
                {boardSharingLabel(board.isShared)}
              </span>
            </div>
            {board._id === activeBoard._id ? (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Activo
              </Badge>
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 p-2"
          onClick={() => navigate('/boards')}
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
            <LayoutGrid className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">
            Ver todos los tableros
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 p-2"
          onClick={() => navigate('/onboarding')}
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">Nuevo tablero</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (variant === 'header') {
    return menu;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  );
}
