import { Check, Plus } from 'lucide-react';
import {
  CATEGORY_COLOR_PALETTE,
  isCategoryPaletteColor,
  isValidCategoryColor,
} from '@/lib/category-colors';
import { cn } from '@/lib/utils';

interface CategoryColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function CategoryColorPicker({
  value,
  onChange,
  disabled = false,
}: CategoryColorPickerProps) {
  const normalizedValue = value.toUpperCase();
  const isCustomColor = Boolean(value) && !isCategoryPaletteColor(value);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium">Color</legend>
      <div className="flex flex-wrap gap-2" aria-label="Color de la categoría">
        {CATEGORY_COLOR_PALETTE.map((color) => {
          const isSelected = normalizedValue === color.value;

          return (
            <label
              key={color.value}
              className={cn(
                'relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition duration-150',
                'hover:scale-105 hover:border-foreground/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
                'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
                isSelected
                  ? 'border-foreground shadow-sm'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: color.value }}
            >
              <input
                type="radio"
                name="category-color"
                value={color.value}
                checked={isSelected}
                onChange={() => onChange(color.value)}
                className="sr-only"
                aria-label={`Color ${color.name}`}
                disabled={disabled}
              />
              {isSelected ? (
                <Check
                  className="size-5 text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.8)]"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              ) : null}
            </label>
          );
        })}
      </div>

      <label
        className={cn(
          'relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50',
          isCustomColor && 'border-foreground/40 bg-accent',
        )}
      >
        <input
          id="category-custom-color"
          type="color"
          value={
            isCustomColor && isValidCategoryColor(value) ? value : '#64748B'
          }
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label="Elegir otro color personalizado"
          disabled={disabled}
        />
        {isCustomColor ? (
          <span
            className="size-5 rounded-full border border-foreground/20"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        Otro color
      </label>
    </fieldset>
  );
}
