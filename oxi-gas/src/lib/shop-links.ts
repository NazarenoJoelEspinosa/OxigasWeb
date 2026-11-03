export function productUrl(code: string): string {
  return new URL(`${import.meta.env.BASE_URL}producto/${encodeURIComponent(code)}`, window.location.origin).href;
}

export function brandPath(brand: string): string {
  return `${import.meta.env.BASE_URL}productos?marca=${encodeURIComponent(brand)}`;
}
