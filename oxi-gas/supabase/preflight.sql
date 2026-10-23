-- Sólo lectura. Ejecutar en SQL Editor antes de la migración y conservar los resultados.
select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where schemaname in ('public','storage') order by schemaname, tablename, policyname;
select table_name, column_name, data_type, udt_name from information_schema.columns
where table_schema = 'public' and table_name in ('products','offers','category_groups','admin_users')
order by table_name, ordinal_position;
select code, count(*) from public.products group by code having count(*) > 1;
select id, code, name, price from public.products
where code is null or trim(code) = '' or name is null or trim(name) = '' or price < 0 or price::text in ('NaN','Infinity','-Infinity');
select user_id, role from public.admin_users;
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'product-images';
