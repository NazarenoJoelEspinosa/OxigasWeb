/**
 * useOfertasProducts
 *
 * Lee productos reales de la tabla `products` donde category = 'Ofertas'.
 *
 * Flujo de administración:
 *  1. El admin crea/edita un producto en el Dashboard.
 *  2. Elige categoría "Ofertas" y carga el precio.
 *  3. El carrusel de la home se actualiza automáticamente.
 *
 * No se requiere tabla adicional ni carga manual de promociones.
 *
 * Requisitos en Supabase:
 *  - Tabla `products` con RLS: select público para visible = true.
 *  - Campo `price` (float) cargado para los productos en oferta.
 *  - Campo `visible` (boolean) en true para que aparezcan.
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
        // ilike = case-insensitive: acepta "Ofertas", "ofertas", "OFERTAS", etc.
        .ilike('category', 'ofertas')
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