export interface CategoryColorOption {
  name: string;
  value: string;
}

/** Shared palette for category creation and editing. */
export const CATEGORY_COLOR_PALETTE = [
  { name: 'Rojo', value: '#DC2626' },
  { name: 'Naranja', value: '#EA580C' },
  { name: 'Ámbar', value: '#D97706' },
  { name: 'Amarillo', value: '#CA8A04' },
  { name: 'Verde', value: '#16A34A' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Turquesa', value: '#0D9488' },
  { name: 'Celeste', value: '#0284C7' },
  { name: 'Azul', value: '#2563EB' },
  { name: 'Índigo', value: '#4F46E5' },
  { name: 'Violeta', value: '#7C3AED' },
  { name: 'Rosa', value: '#DB2777' },
] as const satisfies readonly CategoryColorOption[];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[8].value;

export function isValidCategoryColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isCategoryPaletteColor(color: string): boolean {
  return CATEGORY_COLOR_PALETTE.some(
    ({ value }) => value === color.toUpperCase(),
  );
}
