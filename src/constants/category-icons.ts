import {
  Car,
  Ellipsis,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PawPrint,
  Plane,
  Repeat,
  Shirt,
  ShoppingCart,
  Tag,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryIconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { value: 'utensils', label: 'Comida', icon: Utensils },
  { value: 'car', label: 'Transporte', icon: Car },
  { value: 'home', label: 'Hogar', icon: Home },
  { value: 'shopping-cart', label: 'Compras', icon: ShoppingCart },
  { value: 'gamepad-2', label: 'Ocio', icon: Gamepad2 },
  { value: 'heart-pulse', label: 'Salud', icon: HeartPulse },
  { value: 'repeat', label: 'Suscripción', icon: Repeat },
  { value: 'graduation-cap', label: 'Educación', icon: GraduationCap },
  { value: 'shirt', label: 'Ropa', icon: Shirt },
  { value: 'plane', label: 'Viaje', icon: Plane },
  { value: 'gift', label: 'Regalo', icon: Gift },
  { value: 'paw-print', label: 'Mascotas', icon: PawPrint },
  { value: 'ellipsis', label: 'Otros', icon: Ellipsis },
];

/** Falls back to a generic tag icon for categories without a custom one. */
export function getCategoryIcon(iconValue?: string): LucideIcon {
  return (
    CATEGORY_ICON_OPTIONS.find((option) => option.value === iconValue)?.icon ??
    Tag
  );
}
