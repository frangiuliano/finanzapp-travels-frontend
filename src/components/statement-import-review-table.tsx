import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { cn, formatDate } from '@/lib/utils';
import type { Category } from '@/types/category';
import type {
  StatementImportLine,
  StatementImportLineOverride,
} from '@/types/statement-import';

export interface StatementImportRowState {
  include: boolean;
  overrides: StatementImportLineOverride;
}

// Ghost styling: fields read as plain text until the user actually wants
// to edit one — a review list of a dozen-plus rows gets noisy fast if
// every cell looks like a form control all the time.
const GHOST_FIELD_CLASS =
  'border-transparent bg-transparent px-1.5 shadow-none hover:border-border/60 focus-visible:border-input focus-visible:bg-background focus-visible:ring-0';

interface StatementImportReviewTableProps {
  lines: StatementImportLine[];
  rowState: Record<string, StatementImportRowState>;
  categories: Category[];
  onToggle: (tempId: string) => void;
  onToggleAll: (tempIds: string[], include: boolean) => void;
  onOverrideChange: (
    tempId: string,
    patch: Partial<StatementImportLineOverride>,
  ) => void;
}

function resolvedValue<K extends keyof StatementImportLine>(
  line: StatementImportLine,
  overrides: StatementImportLineOverride,
  key: K,
): StatementImportLine[K] {
  const overrideKey = key as keyof StatementImportLineOverride;
  const overrideValue = overrides[overrideKey];
  return overrideValue !== undefined
    ? (overrideValue as StatementImportLine[K])
    : line[key];
}

function StatementImportLineRow({
  line,
  state,
  categories,
  onToggle,
  onOverrideChange,
}: {
  line: StatementImportLine;
  state: StatementImportRowState;
  categories: Category[];
  onToggle: (tempId: string) => void;
  onOverrideChange: (
    tempId: string,
    patch: Partial<StatementImportLineOverride>,
  ) => void;
}) {
  const date = resolvedValue(line, state.overrides, 'date');
  const description = resolvedValue(line, state.overrides, 'description');
  const amount = resolvedValue(line, state.overrides, 'amount');
  const selectedCategory = categories.find(
    (category) => category._id === state.overrides.categoryId,
  );
  const hasBadges =
    (line.cuotaActual && line.cuotaTotal) || line.parsedVia === 'llm';

  return (
    <TableRow>
      <TableCell className="py-3 align-top">
        <Checkbox
          checked={state.include}
          onCheckedChange={() => onToggle(line.tempId)}
          aria-label={`Incluir ${description}`}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap py-3 align-top">
        <Input
          type="date"
          className={cn('h-8 w-full', GHOST_FIELD_CLASS)}
          value={date}
          onChange={(event) =>
            onOverrideChange(line.tempId, {
              expenseDate: event.target.value,
            })
          }
        />
      </TableCell>
      <TableCell className="min-w-56 py-3 align-top">
        <Input
          className={cn('h-8 w-full truncate font-medium', GHOST_FIELD_CLASS)}
          title={description}
          value={description}
          onChange={(event) =>
            onOverrideChange(line.tempId, {
              description: event.target.value,
            })
          }
        />
        {hasBadges ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1 px-1.5">
            {line.cuotaActual && line.cuotaTotal ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                Cuota {line.cuotaActual}/{line.cuotaTotal}
              </Badge>
            ) : null}
            {line.parsedVia === 'llm' ? (
              <Badge variant="secondary" className="text-[10px] font-normal">
                Asistido por IA
              </Badge>
            ) : null}
          </div>
        ) : null}
        {line.isPossibleDuplicate && line.duplicateOfDescription ? (
          <p className="mt-1.5 px-1.5 text-xs text-amber-700 dark:text-amber-300">
            Coincide con: {line.duplicateOfDescription}
            {line.duplicateOfAmount != null
              ? ` · ${formatMoneyInputFromNumber(line.duplicateOfAmount)}`
              : ''}
            {line.duplicateOfDate
              ? ` · ${formatDate(line.duplicateOfDate)}`
              : ''}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="py-3 align-top">
        <div className="flex items-baseline justify-end gap-1">
          <MoneyInput
            className={cn(
              'h-8 w-full text-right font-medium tabular-nums',
              GHOST_FIELD_CLASS,
            )}
            value={formatMoneyInputFromNumber(amount)}
            onChange={(value) => {
              const parsed = parseMoneyInput(value);
              if (parsed !== null) {
                onOverrideChange(line.tempId, { amount: parsed });
              }
            }}
          />
          <span className="shrink-0 text-xs text-muted-foreground">
            {line.currency}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-10 py-3 text-center align-top">
        <Select
          value={state.overrides.categoryId ?? '__none__'}
          onValueChange={(value) =>
            onOverrideChange(line.tempId, {
              categoryId: value === '__none__' ? undefined : value,
            })
          }
        >
          <SelectTrigger
            className={cn(
              '[&>svg]:hidden h-8 w-8 justify-center gap-0 p-0',
              GHOST_FIELD_CLASS,
            )}
            aria-label={
              selectedCategory
                ? `Categoría: ${selectedCategory.name}`
                : 'Elegir categoría'
            }
          >
            <SelectValue>
              {selectedCategory ? (
                <span className="text-xs">{selectedCategory.name}</span>
              ) : (
                <Tag className="size-3.5 text-muted-foreground" />
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin categoría</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export function StatementImportReviewTable({
  lines,
  rowState,
  categories,
  onToggle,
  onToggleAll,
  onOverrideChange,
}: StatementImportReviewTableProps) {
  const newLines = lines.filter((line) => !line.isPossibleDuplicate);
  const duplicateLines = lines.filter((line) => line.isPossibleDuplicate);
  const tempIds = lines.map((line) => line.tempId);
  const allChecked = tempIds.every((id) => rowState[id]?.include);
  const someChecked = tempIds.some((id) => rowState[id]?.include);

  if (lines.length === 0) return null;

  return (
    <div className="space-y-1">
      <div>
        <h4 className="text-sm font-semibold">
          Consumos detectados ({lines.length})
        </h4>
        <p className="text-xs text-muted-foreground">
          Revisá y editá lo que haga falta antes de cargar.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allChecked ? true : someChecked ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) =>
                    onToggleAll(tempIds, checked === true)
                  }
                  aria-label="Seleccionar todo"
                />
              </TableHead>
              <TableHead className="w-32">Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-32 text-right">Monto</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {newLines.map((line) => (
              <StatementImportLineRow
                key={line.tempId}
                line={line}
                state={
                  rowState[line.tempId] ?? { include: false, overrides: {} }
                }
                categories={categories}
                onToggle={onToggle}
                onOverrideChange={onOverrideChange}
              />
            ))}
            {duplicateLines.length > 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="bg-muted/40 py-2">
                  <p className="text-xs font-medium">
                    Posibles duplicados ({duplicateLines.length})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ya hay un gasto parecido cargado en este período — quedan
                    destildados, tildalos si en realidad son distintos.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
            {duplicateLines.map((line) => (
              <StatementImportLineRow
                key={line.tempId}
                line={line}
                state={
                  rowState[line.tempId] ?? { include: false, overrides: {} }
                }
                categories={categories}
                onToggle={onToggle}
                onOverrideChange={onOverrideChange}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
