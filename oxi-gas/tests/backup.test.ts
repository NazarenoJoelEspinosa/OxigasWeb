import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { restoreSql, createBackupZip, crc32, type BackupTables } from '../src/lib/backup-format.ts';

test('respaldo restaura jerarquía, texto, asociaciones y precios en una transacción', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create table category_groups(id text primary key,label text,parent_id text references category_groups(id));
      create table products(id text primary key,name text,images jsonb);
      create table offers(id text primary key,name text,price numeric);
      create table product_category_links(product_id text references products(id),category_id text references category_groups(id),is_primary boolean,primary key(product_id,category_id));`);
    const data: BackupTables = {
      products: [{ id: 'p', name: "Disco O'Connor \\ corte", images: ['https://example.test/foto.webp'] }],
      category_groups: [{ id: 'child', label: 'Discos', parent_id: 'root' }, { id: 'root', label: 'Insumos', parent_id: null }],
      offers: [{ id: 'offer', name: 'Oferta', price: 1200 }],
      product_category_links: [{ product_id: 'p', category_id: 'child', is_primary: true }],
    };
    await db.exec(restoreSql(data));
    await db.exec("update products set name='Cambio'; update category_groups set parent_id=null; update offers set price=9; delete from product_category_links; insert into products values('new','Nuevo','[]');");
    await db.exec(restoreSql(data));
    assert.equal((await db.query('select name from products where id=\'p\'')).rows[0].name, data.products[0].name);
    assert.equal((await db.query('select parent_id from category_groups where id=\'child\'')).rows[0].parent_id, 'root');
    assert.equal((await db.query('select count(*)::int count from products')).rows[0].count, 2);
    assert.equal((await db.query('select count(*)::int count from product_category_links')).rows[0].count, 1);
    const broken = { ...data, offers: [{ id: 'offer', name: 'Incorrecto', price: 1 }], product_category_links: [{ product_id: 'p', category_id: 'missing', is_primary: true }] };
    await assert.rejects(db.exec(restoreSql(broken)));
    await db.exec('rollback;');
    assert.equal(Number((await db.query('select price from offers')).rows[0].price), 1200);
  } finally { await db.close(); }
});

test('ZIP conserva bytes, Unicode y CRC, y rechaza rutas fuera del respaldo', async () => {
  const bytes = new TextEncoder().encode('123456789');
  assert.equal(crc32(bytes), 0xcbf43926);
  const zip = new Uint8Array(await createBackupZip([{ name: 'imágenes/foto.webp', data: bytes }]).arrayBuffer());
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(new DataView(zip.buffer).getUint32(zip.length - 22, true), 0x06054b50);
  assert.throws(() => createBackupZip([{ name: '../fuera', data: bytes }]));
});
