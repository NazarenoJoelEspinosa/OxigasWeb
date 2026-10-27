-- Categorías jerárquicas y clasificación múltiple. Conserva productos y grupos existentes.
begin;
alter table public.category_groups add column if not exists parent_id uuid
  references public.category_groups(id) on delete restrict;
create index if not exists oxigas_category_parent on public.category_groups(parent_id);
create table if not exists public.product_category_links (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.category_groups(id) on delete restrict,
  is_primary boolean not null default false,
  primary key(product_id, category_id)
);
create unique index if not exists oxigas_one_primary_category on public.product_category_links(product_id) where is_primary;
create index if not exists oxigas_category_products on public.product_category_links(category_id, product_id);
alter table public.product_category_links enable row level security;
revoke all on public.product_category_links from anon, authenticated;
grant select on public.product_category_links to anon, authenticated;
drop policy if exists oxigas_category_links_read on public.product_category_links;
create policy oxigas_category_links_read on public.product_category_links for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id = product_id));

-- Las escrituras se hacen con operaciones verificadas y transaccionales.
revoke insert, update, delete on public.category_groups from authenticated;

create or replace function public.oxigas_check_category_tree() returns trigger
language plpgsql set search_path = '' as $$
declare depth integer; cycle boolean;
begin
  if new.parent_id is null then return new; end if;
  with recursive ancestors as (
    select c.id, c.parent_id, array[c.id] as path from public.category_groups c where c.id = new.parent_id
    union all
    select c.id, c.parent_id, a.path || c.id from public.category_groups c join ancestors a on c.id = a.parent_id
      where not c.id = any(a.path) and cardinality(a.path) <= 20
  ) select max(cardinality(path)), coalesce(bool_or(id = new.id), false) into depth, cycle from ancestors;
  if new.parent_id = new.id or cycle then raise exception 'Una categoría no puede depender de sí misma ni de sus descendientes'; end if;
  if depth >= 20 then raise exception 'La jerarquía admite hasta 20 niveles'; end if;
  return new;
end $$;
drop trigger if exists oxigas_category_tree on public.category_groups;
create trigger oxigas_category_tree before insert or update of parent_id on public.category_groups
  for each row execute function public.oxigas_check_category_tree();

-- Asocia cada texto histórico a un nodo, respetando los grupos y alias existentes.
-- Nunca vuelve a clasificar productos que ya tienen categoría principal.
do $$
declare cat text; node uuid; parent uuid; product record; insumos uuid; discs uuid;
begin
  for cat in select distinct trim(category) from public.products where nullif(trim(category), '') is not null loop
    node := null; parent := null;
    select id into node from public.category_groups where lower(trim(label)) = lower(cat) order by (parent_id is null) desc, sort_order, id limit 1;
    if node is null then
      select g.id into parent from public.category_groups g where exists(select 1 from unnest(g.slugs) s where lower(trim(s)) = lower(cat)) order by g.sort_order, g.id limit 1;
      insert into public.category_groups(label, parent_id, slugs) values(cat, parent, array[cat]) returning id into node;
    end if;
    insert into public.product_category_links(product_id, category_id, is_primary)
      select p.id, node, true from public.products p where lower(trim(p.category)) = lower(cat)
      and not exists(select 1 from public.product_category_links l where l.product_id = p.id and l.is_primary)
      on conflict(product_id, category_id) do update set is_primary = true;
  end loop;
  select id into insumos from public.category_groups where parent_id is null and lower(label) = 'insumos' order by id limit 1;
  if insumos is null then insert into public.category_groups(label, slugs) values('Insumos', array['insumos']) returning id into insumos; end if;
  select id into discs from public.category_groups where parent_id = insumos and lower(label) = 'discos' order by id limit 1;
  if discs is null then insert into public.category_groups(label, parent_id) values('Discos', insumos) returning id into discs; end if;
  for cat in select unnest(array['Discos de corte','Discos de desbaste','Discos flap']) loop
    if not exists(select 1 from public.category_groups where parent_id = discs and lower(label) = lower(cat)) then
      insert into public.category_groups(label, parent_id) values(cat, discs);
    end if;
  end loop;
end $$;

create or replace function public.save_catalog_category(p_id uuid, p_label text, p_parent_id uuid, p_sort_order integer default 0) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  if nullif(trim(p_label), '') is null or length(trim(p_label)) > 120 then raise exception 'Nombre de categoría inválido'; end if;
  lock table public.category_groups in share row exclusive mode;
  if exists(select 1 from public.category_groups where parent_id is not distinct from p_parent_id and lower(trim(label)) = lower(trim(p_label)) and (p_id is null or id <> p_id)) then
    raise exception 'Ya existe una categoría con ese nombre en el mismo nivel';
  end if;
  if p_id is null then
    insert into public.category_groups(label, parent_id, sort_order) values(trim(p_label), p_parent_id, coalesce(p_sort_order, 0)) returning id into result;
  else
    update public.category_groups set label = trim(p_label), parent_id = p_parent_id, sort_order = coalesce(p_sort_order, 0) where id = p_id returning id into result;
    if result is null then raise exception 'La categoría ya no existe'; end if;
    update public.products p set category = trim(p_label), updated_at = now()
      where exists(select 1 from public.product_category_links l where l.product_id = p.id and l.category_id = p_id and l.is_primary);
  end if;
  return result;
end $$;

create or replace function public.delete_catalog_category(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  lock table public.category_groups in share row exclusive mode;
  if exists(select 1 from public.category_groups where parent_id = p_id) or exists(select 1 from public.product_category_links where category_id = p_id) then
    raise exception 'Mové primero las subcategorías y los productos asociados';
  end if;
  delete from public.category_groups where id = p_id;
  if not found then raise exception 'La categoría ya no existe'; end if;
end $$;

-- Helper interno. Nunca se concede ejecución a clientes.
create or replace function public.oxigas_classify_products(p_ids uuid[], p_primary uuid, p_related uuid[], p_set_primary boolean, p_mode text) returns integer
language plpgsql security definer set search_path = '' as $$
declare ids uuid[]; related uuid[]; total integer;
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  if p_ids is null or cardinality(p_ids) < 1 or cardinality(p_ids) > 500 or array_position(p_ids, null) is not null then raise exception 'Seleccioná entre 1 y 500 productos'; end if;
  select array_agg(distinct x) into ids from unnest(p_ids) x;
  select coalesce(array_agg(distinct x), '{}'::uuid[]) into related from unnest(coalesce(p_related, '{}')) x;
  if cardinality(related) > 200 or array_position(related, null) is not null then raise exception 'Secciones relacionadas inválidas'; end if;
  if p_mode is null or p_mode not in ('keep','add','replace','remove') then raise exception 'Operación de secciones inválida'; end if;
  if p_primary is not null and not exists(select 1 from public.category_groups where id = p_primary) then raise exception 'La categoría principal no existe'; end if;
  if (select count(*) from public.category_groups where id = any(related)) <> cardinality(related) then raise exception 'Una sección relacionada ya no existe'; end if;
  -- Orden de bloqueo consistente para lotes concurrentes.
  perform id from public.products where id = any(ids) order by id for update;
  select count(*) into total from public.products where id = any(ids);
  if total <> cardinality(ids) then raise exception 'Un producto ya no existe; no se modificó el lote'; end if;
  if p_set_primary then
    delete from public.product_category_links where product_id = any(ids) and is_primary;
    if p_primary is not null then
      insert into public.product_category_links(product_id, category_id, is_primary) select x, p_primary, true from unnest(ids) x
        on conflict(product_id, category_id) do update set is_primary = true;
    end if;
    update public.products set category = (select label from public.category_groups where id = p_primary), updated_at = now() where id = any(ids);
  end if;
  if p_mode = 'replace' then delete from public.product_category_links where product_id = any(ids) and not is_primary; end if;
  if p_mode = 'remove' then delete from public.product_category_links where product_id = any(ids) and not is_primary and category_id = any(related); end if;
  if p_mode in ('add','replace') then
    insert into public.product_category_links(product_id, category_id, is_primary)
      select p, c, false from unnest(ids) p cross join unnest(related) c on conflict do nothing;
  end if;
  return total;
end $$;

create or replace function public.bulk_classify_products(p_ids uuid[], p_primary uuid default null, p_related uuid[] default '{}', p_set_primary boolean default false, p_mode text default 'keep') returns integer
language plpgsql security definer set search_path = '' as $$
begin
  return public.oxigas_classify_products(p_ids, p_primary, p_related, p_set_primary, p_mode);
end $$;

create or replace function public.save_catalog_product(p_product jsonb, p_primary uuid default null, p_related uuid[] default '{}') returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid; editing uuid;
begin
  if not public.is_oxigas_admin() then raise exception 'Administrador requerido' using errcode = '42501'; end if;
  if p_product is null or jsonb_typeof(p_product) <> 'object' or nullif(trim(p_product->>'code'), '') is null or nullif(trim(p_product->>'name'), '') is null then raise exception 'Completá código y nombre'; end if;
  editing := nullif(p_product->>'id', '')::uuid;
  if editing is null then
    insert into public.products(code, name, description, brand, price, visible, images, custom_fields, created_by)
      values(trim(p_product->>'code'), trim(p_product->>'name'), p_product->>'description', p_product->>'brand', (p_product->>'price')::numeric,
      coalesce((p_product->>'visible')::boolean, true), coalesce(p_product->'images', '[]'), coalesce(p_product->'custom_fields', '[]'), auth.uid()) returning id into result;
  else
    update public.products set code = trim(p_product->>'code'), name = trim(p_product->>'name'), description = p_product->>'description',
      brand = p_product->>'brand', price = (p_product->>'price')::numeric, visible = coalesce((p_product->>'visible')::boolean, true),
      images = coalesce(p_product->'images', '[]'), custom_fields = coalesce(p_product->'custom_fields', '[]'), updated_at = now()
      where id = editing returning id into result;
    if result is null then raise exception 'El producto ya no existe'; end if;
  end if;
  perform public.oxigas_classify_products(array[result], p_primary, p_related, true, 'replace');
  return result;
end $$;

revoke all on function public.oxigas_check_category_tree(), public.oxigas_classify_products(uuid[],uuid,uuid[],boolean,text) from public, anon, authenticated;
revoke all on function public.save_catalog_category(uuid,text,uuid,integer), public.delete_catalog_category(uuid), public.bulk_classify_products(uuid[],uuid,uuid[],boolean,text), public.save_catalog_product(jsonb,uuid,uuid[]) from public, anon, authenticated;
grant execute on function public.save_catalog_category(uuid,text,uuid,integer), public.delete_catalog_category(uuid), public.bulk_classify_products(uuid[],uuid,uuid[],boolean,text), public.save_catalog_product(jsonb,uuid,uuid[]) to authenticated;
notify pgrst, 'reload schema';
commit;
