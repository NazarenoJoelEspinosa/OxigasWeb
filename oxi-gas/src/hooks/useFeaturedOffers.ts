/**
 * useFeaturedOffers
 *
 * Lee las ofertas destacadas desde la tabla `featured_offers` de Supabase.
 *
 * Estructura de la tabla (SQL para crear):
 * ──────────────────────────────────────────
 * create table featured_offers (
 *   id        uuid primary key default gen_random_uuid(),
 *   title     text not null,
 *   discount  text not null,
 *   description text not null,
 *   icon      text not null default '⭐',
 *   image     text,
 *   sort_order int not null default 0,
 *   created_at timestamp default now()
 * );
 * alter table featured_offers enable row level security;
 * create policy "public read" on featured_offers for select using (true);
 * create policy "auth write"  on featured_offers for all using (auth.role() = 'authenticated');
 * ──────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type FeaturedOffer = {
  id?: string;
  title: string;
  discount: string;
  description: string;
  icon: string;
  image?: string;
  sort_order: number;
};

// Ofertas por defecto (se usan si la tabla no existe o está vacía)
export const DEFAULT_OFFERS: FeaturedOffer[] = [
  { title: 'Gases comprimidos en promoción', discount: '15%', description: 'Cilindros de oxígeno, acetileno y argón con descuentos especiales para compras al por mayor.', icon: '🔵', sort_order: 0 },
  { title: 'Herramientas Bosch', discount: '20%', description: 'Amoladoras, taladros y herramientas eléctricas de marcas líderes en promoción limitada.', icon: '⚡', sort_order: 1 },
  { title: 'Accesorios de soldadura', discount: '25%', description: 'Electrodos, alambre MIG y accesorios variados con descuentos exclusivos.', icon: '🔥', sort_order: 2 },
];

type Status = 'loading' | 'ready' | 'error';

export function useFeaturedOffers() {
  const [offers, setOffers] = useState<FeaturedOffer[]>(DEFAULT_OFFERS);
  const [status, setStatus] = useState<Status>('loading');
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data, error } = await supabase
        .from('featured_offers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setOffers(data as FeaturedOffer[]);
        setUsingFallback(false);
      } else {
        setOffers(DEFAULT_OFFERS);
        setUsingFallback(true);
      }
      setStatus('ready');
    } catch {
      setOffers(DEFAULT_OFFERS);
      setUsingFallback(true);
      setStatus('ready');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { offers, status, usingFallback, reload: load };
}
