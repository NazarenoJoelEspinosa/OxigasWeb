/** Grupos públicos con alternativa local si la tabla aún no está configurada. */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isMissingTable } from '@/lib/models';
import { readAllPages } from '@/lib/pagination';
import { z } from 'zod';
const groupSchema = z.object({ id: z.string(), label: z.string(), icon: z.string(), slugs: z.array(z.string()), sort_order: z.number(), parent_id: z.string().nullable().optional() });

export type CategoryGroup = {
  id?: string;
  label: string;
  icon: string;
  slugs: string[];
  sort_order: number;
  parent_id?: string | null;
};

// Grupos por defecto (se usan si la tabla no existe o está vacía).
// "Ofertas" NO está aquí — tiene su propia sección independiente en la home.
export const DEFAULT_GROUPS: CategoryGroup[] = [
  {
    label: 'Gases', icon: '🔵',
    slugs: [
      'gases', 'Gases', 'Gas', 'gas',
      'Gas comprimido', 'gas comprimido',
      'Gases comprimidos', 'gases comprimidos',
      'Gas envasado', 'gas envasado',
      'Oxígeno', 'oxigeno', 'Oxigeno',
      'Acetileno', 'acetileno',
      'Argón', 'argon', 'Argon',
      'CO2', 'co2',
    ],
    sort_order: 0,
  },
  {
    label: 'Soldadura', icon: '🔥',
    slugs: [
      'soldadura', 'Soldadura',
      'Electrodos', 'electrodos',
      'Alambre MIG', 'alambre mig', 'Alambre', 'alambre',
      'Accesorios soldadura', 'accesorios soldadura',
      'Discos de corte', 'discos de corte',
      'Discos', 'discos',
      'Soldadura autógena', 'soldadura autogena',
    ],
    sort_order: 1,
  },
  {
    label: 'Herramientas Manuales', icon: '🔨',
    slugs: [
      'herramientas manuales', 'Herramientas manuales', 'Herramientas Manuales',
      'herramientas', 'Herramientas',
      'Llaves', 'llaves',
      'Pinzas', 'pinzas',
      'Destornilladores', 'destornilladores',
      'Martillos', 'martillos',
      'Herramientas de corte', 'herramientas de corte',
    ],
    sort_order: 2,
  },
  {
    label: 'Herramientas Eléctricas', icon: '⚡',
    slugs: [
      'herramientas electricas', 'Herramientas electricas',
      'herramientas eléctricas', 'Herramientas eléctricas', 'Herramientas Eléctricas',
      'Amoladoras', 'amoladoras',
      'Taladros', 'taladros',
      'Compresores', 'compresores',
    ],
    sort_order: 3,
  },
  {
    label: 'Fijación y Cables', icon: '🔩',
    slugs: [
      'fijacion', 'Fijación', 'Fijacion', 'fijación',
      'cables', 'Cables',
      'Tornillos', 'tornillos',
      'Bulones', 'bulones',
      'Fijación y Cables', 'fijación y cables',
      'Anclajes', 'anclajes',
    ],
    sort_order: 4,
  },
  {
    label: 'Seguridad', icon: '🦺',
    slugs: [
      'seguridad', 'Seguridad',
      'Seguridad Industrial', 'seguridad industrial',
      'EPP', 'epp',
      'Seguridad Industrial (EPP)',
      'Casco', 'casco', 'Guantes', 'guantes', 'Lentes', 'lentes',
    ],
    sort_order: 5,
  },
  {
    label: 'Insumos', icon: '🏭',
    slugs: [
      'insumos', 'Insumos',
      'Insumos Industriales', 'insumos industriales',
      'Insumos y Mantenimiento', 'insumos y mantenimiento',
      'Mantenimiento', 'mantenimiento',
      'Lubricantes', 'lubricantes',
      'Adhesivos', 'adhesivos',
      'Industrial', 'industrial',
    ],
    sort_order: 6,
  },
  {
    label: 'Otros', icon: '📦',
    slugs: ['otros', 'Otros'],
    sort_order: 7,
  },
];

type Status = 'loading' | 'ready' | 'error';

export function useCategoryGroups(includeOffers = false) {
  const [groups, setGroups] = useState<CategoryGroup[]>(DEFAULT_GROUPS);
  const [status, setStatus] = useState<Status>('loading');
  const [usingFallback, setUsingFallback] = useState(false);

  const current = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    setStatus('loading');
    try {
      const rows = await readAllPages((from, to) => supabase.from('category_groups').select('*').order('sort_order').order('id').range(from, to).abortSignal(controller.signal));
      if (controller.signal.aborted) return;
      const data = rows.map(row => groupSchema.parse(row));
      if (data.length > 0) {
        // Filtrar "Ofertas" por si existe en la DB — tiene su propia sección
        const sinOfertas = (data as CategoryGroup[]).filter(
          (g) => includeOffers || g.label.toLowerCase() !== 'ofertas'
        );
        setGroups(sinOfertas);
        setUsingFallback(false);
      } else {
        setGroups(DEFAULT_GROUPS);
        setUsingFallback(true);
      }
      setStatus('ready');
    } catch (error) {
      if (controller.signal.aborted) return;
      setGroups(DEFAULT_GROUPS);
      setUsingFallback(true);
      setStatus(isMissingTable(error) ? 'ready' : 'error');
    }
  }, [includeOffers]);

  useEffect(() => { void load(); return () => current.current?.abort(); }, [load]);

  return { groups, status, usingFallback, reload: load };
}
