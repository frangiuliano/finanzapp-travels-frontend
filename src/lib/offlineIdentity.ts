export interface OfflineIdentity {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  activeBoardId?: string | null;
}

interface StoredOfflineIdentity extends OfflineIdentity {
  cachedAt: string;
}

const STORAGE_KEY = 'finanzapp-offline-identity';

/**
 * A cached snapshot older than this is not trusted for offline continuity —
 * matches the ballpark of the refresh token's own lifetime plus margin, so
 * we don't keep granting app access indefinitely to a device that hasn't
 * confirmed its session with the server in a long time.
 */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Persists only non-sensitive identity fields — never the access or refresh
 * token — so a cold app load can render an optimistic "known session" state
 * while offline, without weakening the memory-only token storage.
 */
export function saveOfflineIdentity(user: OfflineIdentity): void {
  try {
    const entry: StoredOfflineIdentity = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      activeBoardId: user.activeBoardId,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable (private mode, quota) — this cache is a
    // convenience for offline continuity, not a requirement.
  }
}

export function getOfflineIdentity(): OfflineIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredOfflineIdentity;
    const age = Date.now() - new Date(parsed.cachedAt).getTime();
    if (!Number.isFinite(age) || age > MAX_AGE_MS) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      username: parsed.username,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      emailVerified: parsed.emailVerified,
      activeBoardId: parsed.activeBoardId,
    };
  } catch {
    return null;
  }
}

export function clearOfflineIdentity(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
