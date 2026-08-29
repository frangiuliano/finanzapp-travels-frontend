const PREFIX = 'finanzapp-cache';

/**
 * Generic localStorage cache for board-scoped reference data (categories,
 * payment methods, and similar lists) that lets a failed fetch fall back to
 * the last known list for that specific board instead of showing an empty
 * state — mirrors the pattern already used for the boards list itself.
 */
export function saveBoardScopedCache<T>(
  namespace: string,
  boardId: string,
  data: T,
): void {
  try {
    localStorage.setItem(
      `${PREFIX}:${namespace}:${boardId}`,
      JSON.stringify(data),
    );
  } catch {
    // localStorage unavailable (private mode, quota) — this cache is a
    // convenience for offline continuity, not a requirement.
  }
}

export function getBoardScopedCache<T>(
  namespace: string,
  boardId: string,
): T | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${namespace}:${boardId}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
