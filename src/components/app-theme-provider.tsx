import { useEffect, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';

function ThemeChrome() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0A1A1A' : '#1F7A6C',
      );
  }, [resolvedTheme]);

  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="finanzapp-theme"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeChrome />
      {children}
    </ThemeProvider>
  );
}
