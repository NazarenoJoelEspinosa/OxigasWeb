export async function readAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ;) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    if (!batch.length) return rows;
    rows.push(...batch);
    // Avanzar por filas reales: el servidor puede imponer un límite inferior.
    from += batch.length;
  }
}
