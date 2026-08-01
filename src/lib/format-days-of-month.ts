export function formatDaysOfMonth(days: number[]): string {
  if (days.length === 0) return '—';
  return days.map((day) => `día ${day}`).join(', ');
}
