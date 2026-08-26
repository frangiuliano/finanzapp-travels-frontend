import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Search, WalletCards } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FALLBACK_PAYMENT_METHOD_INSTITUTIONS } from '@/constants/payment-method-institutions';
import { cn } from '@/lib/utils';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import type { PaymentMethodInstitution } from '@/types/payment-method';

let institutionsCache: PaymentMethodInstitution[] | undefined;

interface PaymentMethodInstitutionFieldProps {
  value: string;
  institutionCode?: string;
  onChange: (institutionCode: string | undefined, value: string) => void;
  disabled?: boolean;
  idPrefix: string;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim();
}

export function PaymentMethodInstitutionField({
  value,
  institutionCode,
  onChange,
  disabled = false,
  idPrefix,
}: PaymentMethodInstitutionFieldProps) {
  const [institutions, setInstitutions] = useState(
    () => institutionsCache ?? FALLBACK_PAYMENT_METHOD_INSTITUTIONS,
  );
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = normalizeSearch(query);
  const filteredInstitutions = useMemo(
    () =>
      institutions.filter((institution) => {
        if (!normalizedQuery) return true;
        return normalizeSearch(
          [institution.displayName, institution.legalName]
            .filter(Boolean)
            .join(' '),
        ).includes(normalizedQuery);
      }),
    [institutions, normalizedQuery],
  );

  useEffect(() => {
    if (institutionsCache) return;

    let stale = false;
    void paymentMethodsService
      .getInstitutions()
      .then(({ institutions: loadedInstitutions }) => {
        institutionsCache = loadedInstitutions;
        if (!stale) setInstitutions(loadedInstitutions);
      })
      .catch(() => {
        // The bundled catalog keeps this field usable while offline.
      });

    return () => {
      stale = true;
    };
  }, []);

  const selectInstitution = (institution: PaymentMethodInstitution) => {
    setQuery(institution.displayName);
    onChange(institution.code, institution.displayName);
    setIsOpen(false);
  };

  const chooseCustomInstitution = () => {
    const customName = query.trim();
    if (!customName) return;
    setQuery(customName);
    onChange(undefined, customName);
    setIsOpen(false);
  };

  return (
    <div
      className="relative space-y-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Label htmlFor={`${idPrefix}-institution`}>
        Banco o billetera emisora (opcional)
      </Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${idPrefix}-institution`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${idPrefix}-institution-listbox`}
          aria-activedescendant={
            isOpen && filteredInstitutions[activeIndex]
              ? `${idPrefix}-institution-${filteredInstitutions[activeIndex].code}`
              : undefined
          }
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value.slice(0, 80));
            onChange(undefined, '');
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIsOpen(true);
              if (filteredInstitutions.length > 0) {
                setActiveIndex((current) =>
                  Math.min(current + 1, filteredInstitutions.length - 1),
                );
              }
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' && isOpen) {
              event.preventDefault();
              const institution = filteredInstitutions[activeIndex];
              if (institution) selectInstitution(institution);
              else chooseCustomInstitution();
            } else if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Buscá por nombre, por ejemplo Galicia"
          maxLength={80}
          autoComplete="off"
          disabled={disabled}
          className="pl-9"
        />
      </div>

      {isOpen ? (
        <div
          id={`${idPrefix}-institution-listbox`}
          role="listbox"
          className="glass-surface glass-surface-card absolute z-[var(--z-popover)] max-h-64 w-full overflow-y-auto rounded-md border p-1 shadow-md"
        >
          {filteredInstitutions.map((institution, index) => {
            const selected = institution.code === institutionCode;
            const InstitutionIcon =
              institution.type === 'bank' ? Building2 : WalletCards;
            return (
              <button
                key={institution.code}
                id={`${idPrefix}-institution-${institution.code}`}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectInstitution(institution)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent focus:bg-accent',
                  index === activeIndex && 'bg-accent',
                )}
              >
                <InstitutionIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {institution.displayName}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {institution.type === 'bank' ? 'Banco' : 'Billetera'}
                </span>
                {selected ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}

          {normalizedQuery ? (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={chooseCustomInstitution}
              className="w-full rounded-sm border-t px-2 py-2 text-left text-sm text-muted-foreground outline-none hover:bg-accent focus:bg-accent"
            >
              Usar “{query.trim()}” como otra institución
            </button>
          ) : (
            <p className="border-t px-2 py-2 text-xs text-muted-foreground">
              Si no aparece, escribí su nombre para agregarla como otra
              institución.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
