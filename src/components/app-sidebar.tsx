import { ComponentProps } from 'react';
import {
  PlaneIcon,
  BarChartIcon,
  WalletIcon,
  UsersIcon,
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
import { TripSwitcher } from './trip-switcher';

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
      title: 'Dashboard',
      url: '/dashboard',
      icon: BarChartIcon,
    },
    {
      title: 'Viajes',
      url: '/trips',
      icon: PlaneIcon,
    },
    {
      title: 'Gastos',
      url: '/expenses',
      icon: WalletIcon,
    },
    {
      title: 'Participantes',
      url: '/participants',
      icon: UsersIcon,
    },
  ];

  const navSecondary = [
    {
      title: 'Configuración',
      url: '/settings',
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
        <TripSwitcher />
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
