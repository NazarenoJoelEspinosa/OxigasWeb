-- La tabla heredada conserva sus datos y su lectura pública existente.
-- Sus escrituras requieren pertenecer a admin_users, igual que el catálogo actual.
begin;
do $$
begin
  if to_regclass('public.featured_offers') is not null then
    alter table public.featured_offers enable row level security;
    if exists (select 1 from pg_policies where schemaname = 'public'
      and tablename = 'featured_offers' and policyname = 'auth write') then
      alter policy "auth write" on public.featured_offers
        using ((select public.is_oxigas_admin()))
        with check ((select public.is_oxigas_admin()));
    else
      create policy "auth write" on public.featured_offers for all to public
        using ((select public.is_oxigas_admin()))
        with check ((select public.is_oxigas_admin()));
    end if;
  end if;
end $$;
commit;
