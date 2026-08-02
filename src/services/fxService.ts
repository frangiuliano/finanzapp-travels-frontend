import api from './api';

export interface FxRateResponse {
  from: string;
  to: string;
  rate: number;
  capturedAt: string;
  providerEnabled: boolean;
}

export const fxService = {
  async getRate(from: string, to: string): Promise<FxRateResponse> {
    const params = new URLSearchParams({ from, to });
    const response = await api.get(`/fx/rate?${params.toString()}`);
    return response.data;
  },
};
