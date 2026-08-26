import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_CATEGORY_NAMES,
  MIN_BOARD_CATEGORIES,
} from '@/constants/default-categories';

interface CategoryPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  disabled,
}: CategoryPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Elegí tus categorías</p>
        <span className="text-xs text-muted-foreground">
          {value.length} seleccionadas · mínimo {MIN_BOARD_CATEGORIES}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DEFAULT_CATEGORY_NAMES.map((name) => {
          const selected = value.includes(name);
          return (
            <button
              key={name}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((item) => item !== name)
                    : [...value, name],
                )
              }
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/80 bg-card/60 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border',
                  selected &&
                    'border-primary bg-primary text-primary-foreground',
                )}
              >
                {selected ? <Check className="size-3" /> : null}
              </span>
              <span className="truncate">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
