import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatProductName } from '@/lib/format';
import { productSchema, type Product } from '@/lib/models';

const featuredCodes = ['06013960H1', 'TPL710-8', 'STARMIG-180I'];

export function FeaturedMachines() {
  const [machines, setMachines] = useState<Product[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase.from('products').select('id,code,name,brand,images')
          .eq('visible', true).in('code', featuredCodes).abortSignal(controller.signal);
        if (error || controller.signal.aborted) return;
        const products = (data ?? []).map(p => productSchema.parse(p));
        setMachines(featuredCodes.flatMap(code => products.filter(p => p.code === code && p.images.length > 0)));
      } catch { /* El acceso general a la tienda sigue disponible. */ }
    }
    void load();
    return () => controller.abort();
  }, []);
  return (
    <section id="maquinas" className="py-14 sm:py-20 bg-[hsl(var(--surface-1))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">MÁQUINAS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Máquinas destacadas</h2>
            <p className="mt-3 text-[hsl(var(--text-soft))]">Conocé los modelos del catálogo y agregalos a tu cotización.</p>
          </div>
          <Link href="/productos?categoria=Herramientas%20El%C3%A9ctricas" className="inline-flex items-center gap-2 text-primary font-semibold py-3">Ver herramientas eléctricas<ArrowRight size={18} /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {machines.map(machine => <Link key={machine.code} href={`/producto/${encodeURIComponent(machine.code)}`}
            className="group flex flex-col rounded-2xl border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-0))] overflow-hidden hover:border-primary transition-colors">
            <div className="h-56 sm:h-64 bg-white"><img src={machine.images[0]} alt={formatProductName(machine.name)} loading="lazy" className="w-full h-full object-contain p-6" /></div>
            <div className="p-5 flex flex-1 flex-col">
              {machine.brand && <p className="text-sm font-semibold text-primary mb-2">{machine.brand}</p>}
              <h3 className="text-xl font-bold mb-5">{formatProductName(machine.name)}</h3>
              <span className="mt-auto inline-flex items-center gap-2 text-primary font-semibold">Ver producto<ArrowRight size={18} /></span>
            </div>
          </Link>)}
        </div>
      </div>
    </section>
  );
}
