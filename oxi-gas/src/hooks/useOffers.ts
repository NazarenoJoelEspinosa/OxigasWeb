import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Offer = {
  id: string;
  product_code?: string;
  name: string;
  description?: string;
  brand?: string;
  price?: number;
  original_price?: number;
  image?: string;
  visible: boolean;
  sort_order: number;
  created_at?: string;
};

type Status = 'loading' | 'ready' | 'error' | 'no-table';

export function useOffers(onlyVisible = true) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      let query = supabase
        .from('offers')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (onlyVisible) {
        query = (query as any).eq('visible', true);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setStatus('no-table');
        } else {
          setStatus('error');
        }
        setOffers([]);
        return;
      }

      setOffers((data ?? []) as Offer[]);
      setStatus('ready');
    } catch {
      setOffers([]);
      setStatus('error');
    }
  }, [onlyVisible]);

  useEffect(() => { load(); }, [load]);

  return { offers, status, reload: load };
}

export const OFFERS_TABLE_SQL = `
create table offers (
  id            uuid primary key default gen_random_uuid(),
  product_code  text,
  name          text not null,
  description   text,
  brand         text,
  price         numeric,
  original_price numeric,
  image         text,
  visible       boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamp default now()
);

alter table offers enable row level security;

create policy "public read"
  on offers for select using (true);

create policy "auth write"
  on offers for all using (auth.role() = 'authenticated');
`.trim();
