import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('clasificación jerárquica: migración, permisos, ciclos y lotes atómicos', async t => {
  const db = new PGlite();
  const admin = '11111111-1111-1111-1111-111111111111';
  const common = '22222222-2222-2222-2222-222222222222';
  const missing = '99999999-9999-9999-9999-999999999999';
  const become = async (role, uid = '') => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]); await db.exec('set role ' + role); };
  const scalar = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0])[0];
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
      create schema storage; create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
      insert into auth.users values ('${admin}'),('${common}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610230001_security_and_transactions.sql', import.meta.url), 'utf8'));
    await db.exec(`insert into public.admin_users(user_id,role) values ('${admin}','admin');
      insert into public.category_groups(label,slugs) values ('Soldadura',array['discos']),('Insumos',array['insumos']);
      insert into public.products(code,name,category,visible) values ('D1','Disco de corte','discos',true),('H1','Oculto','discos',false),('U1','Sin clasificar',null,true);`);
    const migration = await readFile(new URL('../supabase/migrations/202610270002_category_hierarchy.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
    const product = await scalar("select id from public.products where code='D1'");
    const hidden = await scalar("select id from public.products where code='H1'");
    const supplies = await scalar("select id from public.category_groups where label='Insumos'");
    const welding = await scalar("select id from public.category_groups where label='Soldadura'");
    const cut = await scalar("select id from public.category_groups where label='Discos de corte'");
    await t.test('migra sin duplicar productos ni perder clasificación; no inventa asociaciones nuevas', async () => {
      assert.equal(await scalar('select count(*)::int from public.products'), 3);
      assert.equal(await scalar('select count(*)::int from public.product_category_links'), 2);
      assert.equal(await scalar('select count(*)::int from public.product_category_links where category_id=$1', [cut]), 0);
    });
    await t.test('visitante no ve asociaciones de productos ocultos ni puede escribir', async () => {
      await become('anon');
      assert.equal(await scalar('select count(*)::int from public.product_category_links'), 1);
      await assert.rejects(db.query('select public.bulk_classify_products($1::uuid[])', [[product]]));
      await assert.rejects(db.query('insert into public.product_category_links values ($1,$2,false)', [product, cut]));
      await become('authenticated', common);
      await assert.rejects(db.query('select public.save_catalog_category(null,$1,null,0)', ['Ataque']));
      await assert.rejects(db.query('select public.bulk_classify_products($1::uuid[],$2)', [[product],cut]));
      await assert.rejects(db.exec("update public.category_groups set label='Ataque'"));
      await become('authenticated', admin);
    });
    await t.test('lote asigna principal y sección relacionada sin duplicar el producto', async () => {
      assert.equal(await scalar('select public.bulk_classify_products($1::uuid[],$2,$3::uuid[],true,$4)', [[product,hidden], cut, [welding], 'add']), 2);
      assert.equal(await scalar('select count(*)::int from public.products'), 3);
      assert.equal(await scalar('select category from public.products where id=$1', [product]), 'Discos de corte');
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1', [product]), 2);
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1 and is_primary', [product]), 1);
    });
    await t.test('lote inválido y edición fallida revierten todo', async () => {
      await assert.rejects(db.query('select public.bulk_classify_products($1::uuid[],$2,$3::uuid[],true,$4)', [[product,missing], supplies, [], 'replace']));
      await assert.rejects(db.query('select public.bulk_classify_products($1::uuid[],$2,$3::uuid[],true,$4)', [[product], supplies, [missing], 'replace']));
      assert.equal(await scalar('select category from public.products where id=$1', [product]), 'Discos de corte');
      await assert.rejects(db.query('select public.save_catalog_product($1::jsonb,$2,$3::uuid[])', [JSON.stringify({ id: product, code:'D1',name:'No guardar',visible:true }), cut, [missing]]));
      assert.equal(await scalar('select name from public.products where id=$1', [product]), 'Disco de corte');
      await assert.rejects(db.query('select public.save_catalog_product($1::jsonb,$2)', [JSON.stringify({code:'FAIL',name:'No crear'}), missing]));
      assert.equal(await scalar("select count(*)::int from public.products where code='FAIL'"), 0);
    });
    await t.test('renombra y mueve sin perder asociaciones; bloquea ciclos y borrados con uso', async () => {
      await assert.rejects(db.query('select public.save_catalog_category($1,$2,$3,0)', [supplies,'Insumos',cut]));
      await assert.rejects(db.query('select public.delete_catalog_category($1)', [cut]));
      await assert.rejects(db.query('select public.delete_catalog_category($1)', [supplies]));
      await db.query('select public.save_catalog_category($1,$2,$3,5)', [cut,'Corte y tronzado',supplies]);
      assert.equal(await scalar('select category from public.products where id=$1', [product]), 'Corte y tronzado');
      assert.equal(await scalar('select count(*)::int from public.product_category_links where category_id=$1', [cut]), 2);
      await assert.rejects(db.query('select public.save_catalog_category(null,$1,$2,0)', ['CORTE Y TRONZADO',supplies]));
      const empty = await scalar('select public.save_catalog_category(null,$1,$2,0)', ['Vacía',supplies]);
      await db.query('select public.delete_catalog_category($1)', [empty]);
    });
    await t.test('quitar relaciones conserva principal; guardar producto confirma todo junto', async () => {
      await db.query('select public.bulk_classify_products($1::uuid[],null,$2::uuid[],false,$3)', [[product], [welding,cut], 'remove']);
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1', [product]), 1);
      const created = await scalar('select public.save_catalog_product($1::jsonb,$2,$3::uuid[])', [JSON.stringify({code:'NEW',name:'Nuevo',visible:true,images:[],custom_fields:[]}), cut, [welding,cut]]);
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1', [created]), 2);
      await db.query('select public.bulk_classify_products($1::uuid[],null,$2::uuid[],true,$3)', [[created], [], 'keep']);
      assert.equal(await scalar('select category from public.products where id=$1', [created]), null);
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1 and not is_primary', [created]), 1);
      await become('anon');
      assert.equal(await scalar('select count(*)::int from public.product_category_links where product_id=$1', [hidden]), 0);
    });
  } finally { await db.close(); }
});
