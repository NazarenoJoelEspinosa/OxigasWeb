export function productUrl(code: string): string {
  const url = new URL(`${import.meta.env.BASE_URL}productos`, window.location.origin);
  url.searchParams.set('producto', code);
  return url.href;
}

export function brandPath(brand: string): string {
  return `${import.meta.env.BASE_URL}productos?marca=${encodeURIComponent(brand)}`;
}
