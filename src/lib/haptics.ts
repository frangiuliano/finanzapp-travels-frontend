function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Optional feedback must never affect the completed action.
  }
}

export const triggerSelectionHaptic = () => vibrate(8);
export const triggerSuccessHaptic = () => vibrate(12);
export const triggerDestructiveHaptic = () => vibrate([12, 35, 12]);
