/**
 * useCategoryGroups
 *
 * Lee los grupos de categorías desde la tabla `category_groups` de Supabase.
 * Si la tabla no existe todavía, devuelve los grupos hardcodeados como fallback.
 *
 * Estructura de la tabla (SQL para crear):
 * ──────────────────────────────────────────
 * create table category_groups (
 *   id        uuid primary key default gen_random_uuid(),
 *   label     text not null,
 *   icon      text not null default '📦',
 *   slugs     text[] not null default '{}',
 *   sort_order int not null default 0
 * );
 * -- Habilitar RLS y permitir lectura pública:
 * alter table category_groups enable row level security;
 * create policy "public read" on category_groups for select using (true);
 * create policy "auth write"  on category_groups for all using (auth.role() = 'authenticated');
 * ──────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type CategoryGroup = {
  id?: string;
  label: string;
  icon: string;
  slugs: string[];
  sort_order: number;
};

// Grupos por defecto (se usan si la tabla no existe o está vacía)
export const DEFAULT_GROUPS: CategoryGroup[] = [
  { label: 'Gases',                   icon: '🔵', slugs: ['gases', 'Gases', 'Gas comprimido', 'Gases comprimidos', 'Oxígeno', 'Acetileno', 'Argón', 'CO2'],                                                             sort_order: 0 },
  { label: 'Soldadura',               icon: '🔥', slugs: ['soldadura', 'Soldadura', 'Electrodos', 'Alambre MIG', 'Accesorios soldadura', 'Discos de corte'],                                                             sort_order: 1 },
  { label: 'Herramientas Manuales',   icon: '🔨', slugs: ['herramientas manuales', 'Herramientas manuales', 'Herramientas Manuales', 'manuales', 'Manuales', 'Llaves', 'Pinzas', 'Destornilladores'],                    sort_order: 2 },
  { label: 'Herramientas Eléctricas', icon: '⚡', slugs: ['herramientas electricas', 'Herramientas electricas', 'Herramientas Eléctricas', 'herramientas eléctricas', 'Eléctricas', 'Amoladoras', 'Taladros', 'Compresores'], sort_order: 3 },
  { label: 'Fijación y Cables',       icon: '🔩', slugs: ['fijacion', 'Fijación', 'Fijacion', 'cables', 'Cables', 'Tornillos', 'Bulones', 'Fijación y Cables'],                                                         sort_order: 4 },
  { label: 'Ofertas',                 icon: '⭐', slugs: ['ofertas', 'Ofertas', 'Promoción', 'Promo', 'Descuento', 'Oferta'],                                                                                             sort_order: 5 },
  { label: 'Otros',                   icon: '📦', slugs: ['otros', 'Otros', 'EPP', 'Seguridad', 'Lubricantes', 'Adhesivos'],                                                                                             sort_order: 6 },
];

type Status = 'loading' | 'ready' | 'error';

export function useCategoryGroups() {
  const [groups, setGroups] = useState<CategoryGroup[]>(DEFAULT_GROUPS);
  const [status, setStatus] = useState<Status>('loading');
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data, error } = await supabase
        .from('category_groups')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setGroups(data as CategoryGroup[]);
        setUsingFallback(false);
      } else {
        // Tabla vacía → sembrar con los defaults
        setGroups(DEFAULT_GROUPS);
        setUsingFallback(true);
      }
      setStatus('ready');
    } catch {
      // Tabla inexistente u otro error → usar fallback silenciosamente
      setGroups(DEFAULT_GROUPS);
      setUsingFallback(true);
      setStatus('ready');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { groups, status, usingFallback, reload: load };
}