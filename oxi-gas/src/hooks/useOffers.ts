import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { offerSchema, isMissingTable, type Offer } from '@/lib/models';
import { readAllPages } from '@/lib/pagination';
import type { OfferRow } from '@/lib/database.types';
export type { Offer } from '@/lib/models';
type Status = 'loading' | 'ready' | 'error' | 'no-table';
export function useOffers(onlyVisible = true) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const current = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    setStatus('loading');
    try {
      const rows = await readAllPages<OfferRow>((from, to) => {
        let query = supabase.from('offers').select('*').order('sort_order').order('id').range(from, to);
        if (onlyVisible) query = query.eq('visible', true);
        return query.abortSignal(controller.signal);
      });
      if (!controller.signal.aborted) { setOffers(rows.map(row => offerSchema.parse(row))); setStatus('ready'); }
    } catch (error) {
      if (!controller.signal.aborted) { setOffers([]); setStatus(isMissingTable(error) ? 'no-table' : 'error'); }
    }
  }, [onlyVisible]);
  useEffect(() => { void load(); return () => current.current?.abort(); }, [load]);
  return { offers, status, reload: load };
}
