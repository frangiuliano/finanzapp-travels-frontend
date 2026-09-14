import api from './api';

export type ShortcutCaptureMode = 'guided' | 'adaptive';

export interface ShortcutIntegration {
  id: string;
  name: string;
  tokenPrefix: string;
  mode: ShortcutCaptureMode;
  lastUsedAt?: string;
  createdAt?: string;
}

export interface CreatedShortcutIntegration extends ShortcutIntegration {
  token: string;
}

export function getShortcutCaptureBaseUrl(): string {
  const apiBase = String(api.defaults.baseURL ?? '/api').replace(/\/$/, '');
  return new URL(
    `${apiBase}/shortcut-capture`,
    window.location.origin,
  ).toString();
}

export const shortcutIntegrationsService = {
  async list(): Promise<ShortcutIntegration[]> {
    const response = await api.get('/shortcut-integrations');
    return response.data;
  },

  async create(input: {
    name: string;
    mode: ShortcutCaptureMode;
  }): Promise<CreatedShortcutIntegration> {
    const response = await api.post('/shortcut-integrations', input);
    return response.data;
  },

  async update(
    id: string,
    input: { name?: string; mode?: ShortcutCaptureMode },
  ): Promise<ShortcutIntegration> {
    const response = await api.patch(`/shortcut-integrations/${id}`, input);
    return response.data;
  },

  async revoke(id: string): Promise<void> {
    await api.delete(`/shortcut-integrations/${id}`);
  },
};
