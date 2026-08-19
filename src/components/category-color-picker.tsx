import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('px-2', isCustomColor && 'bg-accent')}
          onClick={() =>
            document.getElementById('category-custom-color')?.click()
          }
          aria-controls="category-custom-color"
          aria-label="Elegir otro color personalizado"
          disabled={disabled}
        >
          <Plus className="size-4" />
          Otro color
        </Button>
        <div className="flex items-center gap-2">
          <input
            id="category-custom-color"
            type="color"
            value={
              isCustomColor && isValidCategoryColor(value) ? value : '#64748B'
            }
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="size-11 cursor-pointer rounded-lg border bg-transparent p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            aria-label="Selector de color personalizado"
            disabled={disabled}
          />
          {isCustomColor ? (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Personalizado
            </span>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
