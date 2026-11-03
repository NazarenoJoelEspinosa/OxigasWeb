const encoder = new TextEncoder();
export type BackupTables = Record<'products' | 'offers' | 'category_groups' | 'product_category_links', Record<string, unknown>[]>;

/** Restauración transaccional sobre el mismo esquema; nunca borra productos nuevos. */
export function restoreSql(tables: BackupTables): string {
  const literal = (value: unknown) => "'" + JSON.stringify(value).replace(/'/g, "''") + "'::jsonb";
  const statements = ['-- Restaurar en el MISMO proyecto con su esquema actual. Revisar antes de ejecutar.', 'begin;'];
  const upsert = (table: keyof BackupTables, rows: Record<string, unknown>[], keys: string[]) => {
    if (!rows.length) return;
    const columns = Object.keys(rows[0]).filter(column => !keys.includes(column));
    if (![...columns, ...keys].every(column => /^[a-z_]+$/.test(column))) throw new Error('Columna inválida en respaldo');
    statements.push(`insert into public.${table} select * from jsonb_populate_recordset(null::public.${table}, ${literal(rows)}) on conflict (${keys.join(',')}) ${columns.length ? 'do update set ' + columns.map(column => `${column}=excluded.${column}`).join(',') : 'do nothing'};`);
  };
  upsert('category_groups', tables.category_groups.map(row => ({ ...row, parent_id: null })), ['id']);
  if (tables.category_groups.length) statements.push(`update public.category_groups target set parent_id=source.parent_id from jsonb_populate_recordset(null::public.category_groups, ${literal(tables.category_groups)}) source where target.id=source.id;`);
  upsert('products', tables.products, ['id']);
  upsert('offers', tables.offers, ['id']);
  if (tables.products.length) statements.push(`delete from public.product_category_links where product_id in (select id from jsonb_populate_recordset(null::public.products, ${literal(tables.products)}));`);
  upsert('product_category_links', tables.product_category_links, ['product_id', 'category_id']);
  statements.push('commit;');
  return statements.join('\n\n');
}

const crcTable = Array.from({ length: 256 }, (_, index) => { let value = index; for (let n = 0; n < 8; n++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; return value >>> 0; });
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function createBackupZip(files: { name: string; data: Uint8Array }[]): Blob {
  const parts: BlobPart[] = [], central: BlobPart[] = [];
  let offset = 0, centralSize = 0;
  if (files.length > 65535) throw new Error('Demasiados archivos para este respaldo');
  for (const file of files) {
    if (file.name.startsWith('/') || file.name.split('/').some(part => part === '..') || file.name.includes('\\')) throw new Error('Ruta de archivo insegura');
    const name = encoder.encode(file.name);
    const data = new Uint8Array(file.data).buffer;
    if (offset + data.byteLength > 0xffffffff) throw new Error('El respaldo supera 4 GB');
    const crc = crc32(file.data);
    const local = new ArrayBuffer(30), l = new DataView(local);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint32(14, crc, true); l.setUint32(18, data.byteLength, true); l.setUint32(22, data.byteLength, true); l.setUint16(26, name.length, true);
    parts.push(local, name.buffer, data);
    const header = new ArrayBuffer(46), c = new DataView(header);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true); c.setUint32(16, crc, true); c.setUint32(20, data.byteLength, true); c.setUint32(24, data.byteLength, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
    central.push(header, name.buffer); centralSize += 46 + name.length;
    offset += 30 + name.length + data.byteLength;
  }
  const end = new ArrayBuffer(22), e = new DataView(end);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}
