import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { cn, formatDate } from '@/lib/utils';

function formatNotificationTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'Hace un momento';
  }
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  return formatDate(isoDate);
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useInAppNotifications({ pollIntervalMs: 60_000 });

  const handleOpenNotification = async (
    notificationId: string,
    actionPath?: string,
    isRead?: boolean,
  ) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 rounded-xl"
          aria-label="Notificaciones"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[var(--signal)] text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck className="size-3.5" />
              Marcar todas
            </Button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No tenés notificaciones
            </p>
          ) : (
            notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <DropdownMenuItem
                  key={notification._id}
                  className={cn(
                    'flex cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5',
                    isUnread && 'bg-primary/5',
                  )}
                  onClick={() =>
                    void handleOpenNotification(
                      notification._id,
                      notification.actionPath,
                      !isUnread,
                    )
                  }
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span
                      className={cn(
                        'text-sm leading-snug',
                        isUnread ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {notification.title}
                    </span>
                    {isUnread ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--signal)]" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notification.body}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {formatNotificationTime(notification.createdAt)}
                    {isUnread ? ' · No leída' : ' · Leída'}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {notifications.some((notification) => !notification.readAt) ? (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-3 py-2 text-[11px] text-muted-foreground">
              Tocá una notificación para abrirla y marcarla como leída.
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
