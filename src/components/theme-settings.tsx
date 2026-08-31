import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>
          Elegí cómo querés ver FinanzApp en este dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset aria-describedby="theme-help">
          <legend className="sr-only">Tema de la aplicación</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Oscuro', icon: Moon },
              { value: 'system', label: 'Sistema', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <label key={value} className="relative cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="appearance"
                  value={value}
                  checked={(theme ?? 'light') === value}
                  onChange={() => setTheme(value)}
                />
                <span className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm text-muted-foreground peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-semibold peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </span>
              </label>
            ))}
          </div>
          <p id="theme-help" className="mt-3 text-sm text-muted-foreground">
            Sistema sigue el modo claro u oscuro de tu dispositivo. Tu elección
            se guarda automáticamente.
          </p>
        </fieldset>
      </CardContent>
    </Card>
  );
}
