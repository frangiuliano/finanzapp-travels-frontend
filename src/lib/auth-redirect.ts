export function getSafeAuthRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/home';
  }

  return value;
}
