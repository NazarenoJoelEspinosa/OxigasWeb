import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL: permisos, transacciones, orden y Storage', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create schema storage; create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon, authenticated;
      grant all on storage.objects to anon, authenticated;
      create policy old_broad_storage on storage.objects for all using (true) with check (true);
      insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');`);
    const migration = await readFile(new URL('../supabase/migrations/202610230001_security_and_transactions.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // Idempotencia.
    await db.exec(`create table public.featured_offers(id uuid primary key default gen_random_uuid(), name text);
      grant all on public.featured_offers to anon, authenticated;
      alter table public.featured_offers enable row level security;
      create policy "public read" on public.featured_offers for select using (true);
      create policy "auth write" on public.featured_offers for all to authenticated using (true) with check (true);
      insert into public.featured_offers(name) values ('Histórica');`);
    const legacyMigration = await readFile(new URL('../supabase/migrations/202610270001_legacy_featured_offers_permissions.sql', import.meta.url), 'utf8');
    await db.exec(legacyMigration);
    await db.exec(legacyMigration);
    await db.exec(`insert into public.admin_users values ('11111111-1111-1111-1111-111111111111','admin');
      insert into public.products(code,name,visible) values ('A','Visible',true),('B','Oculto',false);
      insert into public.offers(name,visible) values ('Visible',true),('Oculta',false);
      insert into public.category_groups(label) values ('Original');`);
    const become = async (role, uid = '') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
      await db.exec('set role ' + role);
    };
    await t.test('visitante sólo lee productos y ofertas visibles', async () => {
      await become('anon');
      assert.equal((await db.query('select * from public.products')).rows.length, 1);
      assert.equal((await db.query('select * from public.offers')).rows.length, 1);
      await assert.rejects(db.exec("insert into public.products(code,name) values ('X','X')"));
    });
    await t.test('usuario común no escribe ni puede convertirse en administrador', async () => {
      await become('authenticated', '22222222-2222-2222-2222-222222222222');
      await assert.rejects(db.exec("insert into public.offers(name) values ('Ataque')"));
      await assert.rejects(db.exec("insert into public.admin_users values ('22222222-2222-2222-2222-222222222222','admin')"));
      await assert.rejects(db.query('select public.replace_category_groups($1::jsonb)', ['[]']));
      assert.equal((await db.query("update public.products set name='Ataque' returning *")).rows.length, 0);
      assert.equal((await db.query('delete from public.offers returning *')).rows.length, 0);
      await assert.rejects(db.query('select public.reorder_offers($1::uuid[])', [[]]));
    });
    await t.test('tabla heredada: usuario común y visitante no escriben, conservan lectura y datos', async () => {
      for (const [role, uid] of [['anon', ''], ['authenticated', '22222222-2222-2222-2222-222222222222']]) {
        await become(role, uid);
        assert.deepEqual((await db.query('select name from public.featured_offers')).rows, [{ name: 'Histórica' }]);
        await assert.rejects(db.exec("insert into public.featured_offers(name) values ('No autorizado')"));
        assert.equal((await db.query("update public.featured_offers set name='No autorizado' returning *")).rows.length, 0);
        assert.equal((await db.query('delete from public.featured_offers returning *')).rows.length, 0);
      }
      await become('authenticated', '22222222-2222-2222-2222-222222222222');
    });
    await t.test('Storage bloquea escritura común pese a una política amplia anterior', async () => {
      await assert.rejects(db.exec("insert into storage.objects(bucket_id) values ('product-images')"));
      await db.exec("insert into storage.objects(bucket_id) values ('otro-bucket')");
    });
    await t.test('administrador puede leer ocultos y editar', async () => {
      await become('authenticated', '11111111-1111-1111-1111-111111111111');
      assert.equal((await db.query('select * from public.products')).rows.length, 2);
      await db.exec("insert into public.offers(name) values ('Nueva'); insert into storage.objects(bucket_id) values ('product-images')");
      await db.exec("insert into public.featured_offers(name) values ('Administrada')");
      assert.equal((await db.query("update public.featured_offers set name='Editada' where name='Administrada' returning *")).rows.length, 1);
      assert.equal((await db.query("delete from public.featured_offers where name='Editada' returning *")).rows.length, 1);
      await assert.rejects(db.exec("insert into public.products(code,name,price) values ('NEG','Precio negativo',-1)"));
      await assert.rejects(db.exec("insert into public.offers(name,price) values ('Inválida','NaN'::numeric)"));
    });
    await t.test('restauración inválida revierte el borrado y conserva grupos anteriores', async () => {
      await assert.rejects(db.query('select public.replace_category_groups($1::jsonb)', [JSON.stringify([{ label: '   ' }])]));
      assert.deepEqual((await db.query('select label from public.category_groups')).rows, [{ label: 'Original' }]);
    });
    await t.test('restaurar y reordenar funcionan; listas inválidas no modifican datos', async () => {
      await db.query('select public.replace_category_groups($1::jsonb)', [JSON.stringify([{ label: 'Uno' }, { label: 'Dos' }])]);
      const ids = (await db.query('select id from public.category_groups order by label')).rows.map(r => r.id);
      await db.query('select public.reorder_category_groups($1::uuid[])', [ids]);
      await assert.rejects(db.query('select public.reorder_category_groups($1::uuid[])', [[ids[0], ids[0]]]));
      assert.deepEqual((await db.query('select id from public.category_groups order by sort_order')).rows.map(r => r.id), ids);
      const offers = (await db.query('select id from public.offers order by name')).rows.map(r => r.id);
      await db.query('select public.reorder_offers($1::uuid[])', [offers]);
      assert.deepEqual((await db.query('select id from public.offers order by sort_order')).rows.map(r => r.id), offers);
    });
  } finally { await db.close(); }
});
