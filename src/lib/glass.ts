import { type ClassValue } from 'clsx';
import { cn } from '@/lib/utils';

/** Base Liquid Glass material — blur, translucency, specular border */
export const glassBase = 'glass-surface';

/** Floating capsule (tab bar, compact controls) */
export const glassPill = 'glass-surface glass-surface-pill';

/** Rounded bar (header chrome, toolbars) */
export const glassBar = 'glass-surface glass-surface-bar';

/** Cards, prompts, menus */
export const glassCard = 'glass-surface glass-surface-card';

/** Sheet / modal panels */
export const glassPanel = 'glass-surface glass-surface-panel';

export function glass(...classes: ClassValue[]) {
  return cn(glassBase, ...classes);
}
