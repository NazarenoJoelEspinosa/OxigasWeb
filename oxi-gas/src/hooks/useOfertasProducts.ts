/**
 * useOfertasProducts
 *
 * Lee productos reales de la tabla `products` donde category = 'Ofertas'.
 * Cuando el admin agrega un producto a la categoría "Ofertas", aparece
 * automáticamente en el carrusel de la home. No requiere carga manual.
 *
 * Requisitos en Supabase:
 *  - La tabla `products` debe tener RLS con lectura pública para visible = true.
 *  - El campo `price` debe estar cargado (el ProductForm ya lo exige cuando
 *    la categoría es "Ofertas").
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type OfertaProducto = {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  price?: number;
  images?: string[];
};

type Status = 'loading' | 'ready' | 'error';

export function useOfertasProducts() {
  const [products, setProducts] = useState<OfertaProducto[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, brand, price, images')
        .ilike('category', 'ofertas')  // case-insensitive: acepta "Ofertas", "ofertas", etc.
        .eq('visible', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts((data ?? []) as OfertaProducto[]);
      setStatus('ready');
    } catch {
      setProducts([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, status, reload: load };
}