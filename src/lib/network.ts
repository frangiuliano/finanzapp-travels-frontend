import { AxiosError } from 'axios';

/**
 * True only when the server explicitly rejected the credentials/token (a
 * real 401). Network failures, timeouts, and 5xx responses are NOT proof
 * the session is invalid, so callers should treat them as inconclusive
 * rather than forcing a logout.
 */
export function isDefiniteAuthFailure(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 401;
}
