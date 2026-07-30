import { ComponentProps } from 'react';
import {
  BarChart3,
  Home,
  LayoutGrid,
  PlusCircle,
  SettingsIcon,
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
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { BoardSwitcher } from './board-switcher';

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
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
      title: 'Captura',
      url: '/capture',
      icon: PlusCircle,
    },
    {
      title: 'Reportes',
      url: '/reports',
      icon: BarChart3,
    },
    {
      title: 'Tableros',
      url: '/boards',
      icon: LayoutGrid,
    },
  ];

  const navSecondary = [
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
          <p className="font-display text-sm font-bold tracking-tight text-primary">
            FinanzApp
          </p>
        </div>
        <BoardSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
