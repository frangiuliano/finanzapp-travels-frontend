import { createElement } from 'react';
import { Layers, Link2, Sparkles } from 'lucide-react';
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
import { SortableTableHead } from '@/components/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getCategoryIcon } from '@/constants/category-icons';
import { useColumnSort } from '@/hooks/useColumnSort';
import { isValidCategoryColor } from '@/lib/category-colors';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { compareSortValues } from '@/lib/table-sort';
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

type ReviewSortColumn = 'date' | 'description' | 'amount';

function sortLines(
  lines: StatementImportLine[],
  rowState: Record<string, StatementImportRowState>,
  column: ReviewSortColumn | null,
  direction: 'asc' | 'desc',
): StatementImportLine[] {
  if (!column) return lines;
  return [...lines].sort((a, b) =>
    compareSortValues(
      resolvedValue(a, rowState[a.tempId]?.overrides ?? {}, column),
      resolvedValue(b, rowState[b.tempId]?.overrides ?? {}, column),
      direction,
    ),
  );
}

// `date` on the line corresponds to `expenseDate` on the override object —
// they're named differently because the override shape mirrors
// CreateExpenseDto, not StatementImportLine. Mapping them by name (as
// before) silently always missed the override for the date column.
const OVERRIDE_KEY_BY_LINE_KEY: Partial<
  Record<keyof StatementImportLine, keyof StatementImportLineOverride>
> = {
  date: 'expenseDate',
  description: 'description',
  amount: 'amount',
};

function resolvedValue<K extends keyof StatementImportLine>(
  line: StatementImportLine,
  overrides: StatementImportLineOverride,
  key: K,
): StatementImportLine[K] {
  const overrideKey = OVERRIDE_KEY_BY_LINE_KEY[key];
  const overrideValue = overrideKey ? overrides[overrideKey] : undefined;
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
  const categoryIcon = getCategoryIcon(selectedCategory?.icon);
  const categoryColor =
    selectedCategory?.color && isValidCategoryColor(selectedCategory.color)
      ? selectedCategory.color
      : undefined;

  return (
    <TableRow>
      <TableCell className="py-3 align-top">
        <div className="flex h-8 items-center">
          <Checkbox
            checked={state.include}
            onCheckedChange={() => onToggle(line.tempId)}
            aria-label={`Incluir ${description}`}
          />
        </div>
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
        <div className="flex items-center gap-1">
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
          {line.cuotaActual && line.cuotaTotal ? (
            <Tooltip>
              <TooltipTrigger
                className="shrink-0 text-muted-foreground"
                aria-label={`Cuota ${line.cuotaActual} de ${line.cuotaTotal}`}
              >
                <Layers className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                Cuota {line.cuotaActual}/{line.cuotaTotal}
              </TooltipContent>
            </Tooltip>
          ) : null}
          {line.parsedVia === 'llm' ? (
            <Tooltip>
              <TooltipTrigger
                className="shrink-0 text-muted-foreground"
                aria-label="Asistido por IA, revisá este dato"
              >
                <Sparkles className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                Asistido por IA — revisá este dato
              </TooltipContent>
            </Tooltip>
          ) : null}
          {line.isPossibleDuplicate && line.duplicateOfDescription ? (
            <Tooltip>
              <TooltipTrigger
                className="shrink-0 text-amber-600 dark:text-amber-400"
                aria-label={`Coincide con ${line.duplicateOfDescription}`}
              >
                <Link2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Coincide con: {line.duplicateOfDescription}
                {line.duplicateOfAmount != null
                  ? ` · ${formatMoneyInputFromNumber(line.duplicateOfAmount)}`
                  : ''}
                {line.duplicateOfDate
                  ? ` · ${formatDate(line.duplicateOfDate)}`
                  : ''}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
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
          <Tooltip>
            <TooltipTrigger asChild>
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
                  {createElement(categoryIcon, {
                    className: cn(
                      'size-3.5',
                      !categoryColor &&
                        (selectedCategory
                          ? 'text-foreground'
                          : 'text-muted-foreground'),
                    ),
                    style: categoryColor ? { color: categoryColor } : undefined,
                  })}
                </SelectValue>
              </SelectTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {selectedCategory ? selectedCategory.name : 'Elegir categoría'}
            </TooltipContent>
          </Tooltip>
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
  const { sortColumn, sortDirection, toggleSort } =
    useColumnSort<ReviewSortColumn>();
  const newLines = sortLines(
    lines.filter((line) => !line.isPossibleDuplicate),
    rowState,
    sortColumn,
    sortDirection,
  );
  const duplicateLines = sortLines(
    lines.filter((line) => line.isPossibleDuplicate),
    rowState,
    sortColumn,
    sortDirection,
  );
  const tempIds = lines.map((line) => line.tempId);
  const allChecked = tempIds.every((id) => rowState[id]?.include);
  const someChecked = tempIds.some((id) => rowState[id]?.include);

  if (lines.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
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
                <SortableTableHead
                  column="date"
                  label="Fecha"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="w-32"
                />
                <SortableTableHead
                  column="description"
                  label="Descripción"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTableHead
                  column="amount"
                  label="Monto"
                  activeColumn={sortColumn}
                  direction={sortDirection}
                  onSort={toggleSort}
                  className="w-32 text-right"
                  align="right"
                />
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
    </TooltipProvider>
  );
}
