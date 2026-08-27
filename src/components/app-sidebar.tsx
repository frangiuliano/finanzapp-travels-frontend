import { ComponentProps } from 'react';
import {
  BarChart3,
  Home,
  Plane,
  Receipt,
  Settings2,
  SettingsIcon,
  PiggyBank,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { BoardSwitcher } from './board-switcher';
import { Button } from '@/components/ui/button';
import { openMovementCreator } from '@/lib/movement-events';
import { Plus } from 'lucide-react';

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navMain = [
    {
      title: 'Home',
      url: '/home',
      icon: Home,
    },
    {
      title: 'Movimientos',
      url: '/expenses',
      icon: Receipt,
    },
    {
      title: 'Reportes',
      url: '/reports',
      icon: BarChart3,
    },
  ];

  const navSecondary = [
    { title: 'Patrimonio', url: '/wealth', icon: PiggyBank },
    { title: 'Viajes', url: '/travel', icon: Plane },
    {
      title: 'Configuración del tablero',
      url: '/boards/settings',
      icon: Settings2,
    },
    {
      title: 'Cuenta',
      url: '/account',
      icon: SettingsIcon,
    },
  ];

  const userData = user
    ? {
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        avatar: '',
      }
    : {
        name: 'Usuario',
        email: '',
        avatar: '',
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 pt-2 pb-1">
          <p
            className="font-display flex h-5 items-center text-sm font-bold tracking-tight text-primary group-data-[collapsible=icon]:justify-center"
            aria-label="FinanzApp"
          >
            <span className="group-data-[collapsible=icon]:hidden">
              FinanzApp
            </span>
            <span
              aria-hidden="true"
              className="hidden text-xs group-data-[collapsible=icon]:inline"
            >
              FA
            </span>
          </p>
        </div>
        <BoardSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 pt-2 group-data-[collapsible=icon]:px-2">
          <Button
            className="w-full justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            onClick={openMovementCreator}
            aria-label="Nuevo movimiento"
            title="Nuevo movimiento"
          >
            <Plus />
            <span className="group-data-[collapsible=icon]:hidden">
              Nuevo movimiento
            </span>
          </Button>
        </div>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
