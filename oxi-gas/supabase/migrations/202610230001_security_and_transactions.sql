-- Revisar y probar en una copia de la base antes de aplicar. Operación transaccional.
-- Sustituye las políticas de estas cuatro tablas; no modifica otras tablas.
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin', created_at timestamptz default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), code text not null, name text not null,
  description text, brand text, category text, price numeric, visible boolean not null default true,
  images jsonb default '[]', custom_fields jsonb default '[]', metadata jsonb default '{}',
  created_by uuid references auth.users(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(), product_code text, name text not null,
  description text, brand text, price numeric, original_price numeric, image text,
  visible boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz default now()
);
create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(), label text not null, icon text not null default '📦',
  slugs text[] not null default '{}', sort_order integer not null default 0
);

-- La membresía en admin_users otorga administración, como en el panel existente.
-- Sólo un operador de la base puede otorgarla; ningún cliente puede autoasignársela.
create or replace function public.is_oxigas_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_oxigas_admin() from public;
grant execute on function public.is_oxigas_admin() to anon, authenticated;

do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('admin_users','products','offers','category_groups')
  loop execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename); end loop;
end $$;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.category_groups enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create policy oxigas_own_membership on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.products, public.offers, public.category_groups from anon, authenticated;
grant select on public.products, public.offers, public.category_groups to anon, authenticated;
grant insert, update, delete on public.products, public.offers, public.category_groups to authenticated;
create policy oxigas_products_read on public.products for select to anon, authenticated
  using (visible = true or (select public.is_oxigas_admin()));
create policy oxigas_offers_read on public.offers for select to anon, authenticated
  using (visible = true or (select public.is_oxigas_admin()));
create policy oxigas_groups_read on public.category_groups for select to anon, authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['products','offers','category_groups'] loop
    execute format('create policy oxigas_admin_insert on public.%I for insert to authenticated with check ((select public.is_oxigas_admin()))', t);
    execute format('create policy oxigas_admin_update on public.%I for update to authenticated using ((select public.is_oxigas_admin())) with check ((select public.is_oxigas_admin()))', t);
    execute format('create policy oxigas_admin_delete on public.%I for delete to authenticated using ((select public.is_oxigas_admin()))', t);
  end loop;
end $$;

-- Si existen códigos repetidos, aborta toda la migración: resolverlos antes de volver a intentar.
create unique index if not exists oxigas_products_code_unique on public.products(code);
create index if not exists oxigas_visible_products on public.products(visible, id);
create index if not exists oxigas_visible_offers on public.offers(visible, sort_order, id);

-- NOT VALID conserva filas históricas; las nuevas escrituras sí deben cumplir los controles.
do $$
begin
  if not exists(select 1 from pg_constraint where conname = 'oxigas_product_values' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint oxigas_product_values
      check (length(trim(code)) > 0 and length(trim(name)) > 0 and (price is null or (price >= 0 and price::text not in ('NaN','Infinity','-Infinity')))) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname = 'oxigas_offer_values' and conrelid = 'public.offers'::regclass) then
    alter table public.offers add constraint oxigas_offer_values
      check (length(trim(name)) > 0 and (price is null or (price >= 0 and price::text not in ('NaN','Infinity','-Infinity')))
        and (original_price is null or (original_price >= 0 and original_price::text not in ('NaN','Infinity','-Infinity')))) not valid;
  end if;
end $$;

create or replace function public.replace_category_groups("groups" jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  if "groups" is null or jsonb_typeof("groups") <> 'array' or jsonb_array_length("groups") > 500 then
    raise exception 'Lista de grupos inválida';
  end if;
  lock table public.category_groups in exclusive mode;
  delete from public.category_groups;
  insert into public.category_groups(label, icon, slugs, sort_order)
    select nullif(trim(x.label), ''), coalesce(x.icon, '📦'), coalesce(x.slugs, '{}'), coalesce(x.sort_order, 0)
    from jsonb_to_recordset("groups") as x(label text, icon text, slugs text[], sort_order integer);
end $$;

create or replace function public.reorder_category_groups(ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  lock table public.category_groups in exclusive mode;
  if ids is null or cardinality(ids) <> (select count(*) from public.category_groups)
    or cardinality(ids) <> (select count(distinct id) from unnest(ids) id)
    or exists(select 1 from unnest(ids) id where not exists(select 1 from public.category_groups g where g.id = id))
  then raise exception 'La lista cambió; recargá antes de ordenar'; end if;
  update public.category_groups g set sort_order = x.position - 1
    from unnest(ids) with ordinality as x(id, position) where g.id = x.id;
end $$;

create or replace function public.reorder_offers(ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  lock table public.offers in exclusive mode;
  if ids is null or cardinality(ids) <> (select count(*) from public.offers)
    or cardinality(ids) <> (select count(distinct id) from unnest(ids) id)
    or exists(select 1 from unnest(ids) id where not exists(select 1 from public.offers o where o.id = id))
  then raise exception 'La lista cambió; recargá antes de ordenar'; end if;
  update public.offers o set sort_order = x.position - 1
    from unnest(ids) with ordinality as x(id, position) where o.id = x.id;
end $$;

revoke all on function public.replace_category_groups(jsonb), public.reorder_category_groups(uuid[]), public.reorder_offers(uuid[]) from public;
grant execute on function public.replace_category_groups(jsonb), public.reorder_category_groups(uuid[]), public.reorder_offers(uuid[]) to authenticated;

-- Storage: las políticas restrictivas bloquean escrituras ajenas incluso si existe otra permisiva.
-- No cambia políticas de otros buckets, ni elimina imágenes existentes.
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists oxigas_images_insert_guard on storage.objects';
    execute 'drop policy if exists oxigas_images_update_guard on storage.objects';
    execute 'drop policy if exists oxigas_images_delete_guard on storage.objects';
    execute 'drop policy if exists oxigas_images_admin on storage.objects';
    execute 'create policy oxigas_images_insert_guard on storage.objects as restrictive for insert to public with check (bucket_id <> ''product-images'' or (select public.is_oxigas_admin()))';
    execute 'create policy oxigas_images_update_guard on storage.objects as restrictive for update to public using (bucket_id <> ''product-images'' or (select public.is_oxigas_admin())) with check (bucket_id <> ''product-images'' or (select public.is_oxigas_admin()))';
    execute 'create policy oxigas_images_delete_guard on storage.objects as restrictive for delete to public using (bucket_id <> ''product-images'' or (select public.is_oxigas_admin()))';
    execute 'create policy oxigas_images_admin on storage.objects for all to authenticated using (bucket_id = ''product-images'' and (select public.is_oxigas_admin())) with check (bucket_id = ''product-images'' and (select public.is_oxigas_admin()))';
  end if;
  if to_regclass('storage.buckets') is not null then
    execute 'update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array[''image/jpeg'',''image/png'',''image/webp''] where id = ''product-images''';
  end if;
end $$;

commit;
