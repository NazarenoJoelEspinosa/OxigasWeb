export function restoredPath(base: string, route: string | null): string | null {
  if (!route || !route.startsWith('/') || route.startsWith('//') || route.includes(String.fromCharCode(92)) || /[\u0000-\u001f\u007f]/.test(route)) return null;
  const prefix = base.replace(/\/$/, '');
  const origin = 'https://local.invalid';
  const target = new URL(prefix + route, origin);
  if (target.origin !== origin || (prefix && !target.pathname.startsWith(prefix + '/'))) return null;
  return target.pathname + target.search + target.hash;
}
