import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutIntegrationSettings } from './shortcut-integration-settings';
import { shortcutIntegrationsService } from '@/services/shortcutIntegrationsService';

vi.mock('@/services/shortcutIntegrationsService', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/services/shortcutIntegrationsService')
    >();
  return {
    ...original,
    shortcutIntegrationsService: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      revoke: vi.fn(),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const service = vi.mocked(shortcutIntegrationsService);

describe('ShortcutIntegrationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.list.mockResolvedValue([]);
  });

  it('permite crear una conexión en modo adaptativo', async () => {
    service.create.mockResolvedValue({
      id: 'integration-1',
      name: 'Mi iPhone',
      mode: 'adaptive',
      tokenPrefix: 'fsa_abcdef12',
      token: 'fsa_full-secret-token',
    });
    const user = userEvent.setup();
    render(<ShortcutIntegrationSettings />);

    await screen.findByText('Todavía no conectaste ningún iPhone.');
    await user.click(
      screen.getByRole('button', { name: /Rápido adaptativo/i }),
    );
    await user.click(screen.getByRole('button', { name: /Conectar iPhone/i }));

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        name: 'Mi iPhone',
        mode: 'adaptive',
      }),
    );
    expect(
      await screen.findByDisplayValue('fsa_full-secret-token'),
    ).toBeVisible();
  });
});
