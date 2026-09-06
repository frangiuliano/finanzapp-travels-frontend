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
import { formatDate } from '@/lib/utils';
import type { Category } from '@/types/category';
import type {
  StatementImportLine,
  StatementImportLineOverride,
} from '@/types/statement-import';

export interface StatementImportRowState {
  include: boolean;
  overrides: StatementImportLineOverride;
}

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

function LineGroup({
  title,
  description,
  lines,
  rowState,
  categories,
  onToggle,
  onToggleAll,
  onOverrideChange,
}: {
  title: string;
  description: string;
  lines: StatementImportLine[];
  rowState: Record<string, StatementImportRowState>;
  categories: Category[];
  onToggle: (tempId: string) => void;
  onToggleAll: (tempIds: string[], include: boolean) => void;
  onOverrideChange: (
    tempId: string,
    patch: Partial<StatementImportLineOverride>,
  ) => void;
}) {
  if (lines.length === 0) return null;

  const tempIds = lines.map((line) => line.tempId);
  const allChecked = tempIds.every((id) => rowState[id]?.include);
  const someChecked = tempIds.some((id) => rowState[id]?.include);

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
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
                  aria-label={`Seleccionar todo: ${title}`}
                />
              </TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Origen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const state = rowState[line.tempId] ?? {
                include: false,
                overrides: {},
              };
              const date = resolvedValue(line, state.overrides, 'date');
              const description = resolvedValue(
                line,
                state.overrides,
                'description',
              );
              const amount = resolvedValue(line, state.overrides, 'amount');

              return (
                <TableRow key={line.tempId}>
                  <TableCell>
                    <Checkbox
                      checked={state.include}
                      onCheckedChange={() => onToggle(line.tempId)}
                      aria-label={`Incluir ${description}`}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Input
                      type="date"
                      className="h-8 w-36"
                      value={date}
                      onChange={(event) =>
                        onOverrideChange(line.tempId, {
                          expenseDate: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="min-w-48">
                    <Input
                      className="h-8"
                      value={description}
                      onChange={(event) =>
                        onOverrideChange(line.tempId, {
                          description: event.target.value,
                        })
                      }
                    />
                    {line.cuotaActual && line.cuotaTotal ? (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Cuota {line.cuotaActual}/{line.cuotaTotal}
                      </Badge>
                    ) : null}
                    {line.isPossibleDuplicate && line.duplicateOfDescription ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
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
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MoneyInput
                        className="h-8 w-28"
                        value={formatMoneyInputFromNumber(amount)}
                        onChange={(value) => {
                          const parsed = parseMoneyInput(value);
                          if (parsed !== null) {
                            onOverrideChange(line.tempId, { amount: parsed });
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {line.currency}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-40">
                    <Select
                      value={state.overrides.categoryId ?? '__none__'}
                      onValueChange={(value) =>
                        onOverrideChange(line.tempId, {
                          categoryId: value === '__none__' ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Sin categoría" />
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
                  <TableCell>
                    {line.parsedVia === 'llm' ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Asistido por IA
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
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

  return (
    <div className="space-y-6">
      <LineGroup
        title={`Consumos detectados (${newLines.length})`}
        description="Revisá y editá lo que haga falta antes de cargar."
        lines={newLines}
        rowState={rowState}
        categories={categories}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        onOverrideChange={onOverrideChange}
      />
      <LineGroup
        title={`Posibles duplicados (${duplicateLines.length})`}
        description="Ya hay un gasto cargado parecido en este período. Quedan destildados, pero podés tildarlos si en realidad son distintos."
        lines={duplicateLines}
        rowState={rowState}
        categories={categories}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        onOverrideChange={onOverrideChange}
      />
    </div>
  );
}
