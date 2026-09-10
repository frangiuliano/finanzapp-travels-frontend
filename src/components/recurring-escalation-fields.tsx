import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecurringEscalationFormState } from '@/lib/recurring-escalation';
import type { RecurringEscalationType } from '@/types/recurring-expense';

interface RecurringEscalationFieldsProps {
  value: RecurringEscalationFormState;
  onChange: (value: RecurringEscalationFormState) => void;
  disabled?: boolean;
  currency?: string;
  idPrefix?: string;
}

export function RecurringEscalationFields({
  value,
  onChange,
  disabled,
  currency,
  idPrefix = 'recurring-escalation',
}: RecurringEscalationFieldsProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${idPrefix}-enabled`}
          checked={value.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, enabled: checked === true })
          }
          disabled={disabled}
        />
        <Label htmlFor={`${idPrefix}-enabled`} className="text-sm">
          Aumenta cada cierto tiempo
        </Label>
      </div>
      {value.enabled ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Tipo de aumento
            </Label>
            <Select
              value={value.type}
              onValueChange={(type) =>
                onChange({ ...value, type: type as RecurringEscalationType })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">
                  Monto fijo{currency ? ` (${currency})` : ' ($)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {value.type === 'percent' ? '% de aumento' : 'Monto de aumento'}
              </Label>
              <Input
                inputMode="decimal"
                placeholder={value.type === 'percent' ? '15' : '5000'}
                value={value.value}
                onChange={(e) => onChange({ ...value, value: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Cada cuántos meses
              </Label>
              <Input
                inputMode="numeric"
                placeholder="3"
                value={value.frequencyMonths}
                onChange={(e) =>
                  onChange({ ...value, frequencyMonths: e.target.value })
                }
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se aplica sobre el restante proyectado de los próximos meses. Cuando
            tengas el monto real, corregilo desde "Gastos fijos".
          </p>
        </div>
      ) : null}
    </div>
  );
}
