import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { categoryBranch, categoryPath, orderedCategories } from '@/lib/categories';
import { errorMessage, type Product } from '@/lib/models';
import type { CategoryGroup } from '@/hooks/useCategoryGroups';

export default function TaxonomyAdmin({ categories, products, onChanged }: {
  categories: CategoryGroup[]; products: Product[]; onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [parent, setParent] = useState('');
  const [order, setOrder] = useState(0);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const reset = () => { setEditing(null); setLabel(''); setParent(''); setOrder(0); };
  const descendants = editing ? categoryBranch(editing, categories) : new Set<string>();
  const edit = (cat: CategoryGroup) => { setEditing(cat.id!); setLabel(cat.label); setParent(cat.parent_id ?? ''); setOrder(cat.sort_order); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('save_catalog_category', { p_id: editing, p_label: label, p_parent_id: parent || null, p_sort_order: order });
      if (error) throw new Error(error.message);
      await onChanged(); reset(); setMessage('Categoría guardada. Los productos conservan sus asociaciones.');
    } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  };
  const remove = async (cat: CategoryGroup) => {
    if (busy || !window.confirm(`¿Eliminar la categoría vacía «${categoryPath(cat.id!, categories)}»?`)) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('delete_catalog_category', { p_id: cat.id! });
      if (error) throw new Error(error.message);
      await onChanged(); if (editing === cat.id) reset(); setMessage('Categoría eliminada.');
    } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  };
  return <section className="space-y-4">
    <h2 className="text-xl font-bold">Categorías y subcategorías</h2>
    <p className="text-sm">La categoría principal organiza el producto. Las secciones relacionadas permiten mostrarlo en otros lugares sin duplicarlo.</p>
    {message && <p role="status" className="border rounded p-3 text-sm bg-background">{message}</p>}
    <form onSubmit={save} className="border rounded p-4 bg-background space-y-3">
      <h3 className="font-semibold">{editing ? 'Editar categoría' : 'Crear categoría'}</h3>
      <label className="block text-sm">Nombre<input aria-label="Nombre de categoría" required maxLength={120} value={label} onChange={e => setLabel(e.target.value)} className="block border rounded p-2 w-full" /></label>
      <label className="block text-sm">Dentro de<select aria-label="Categoría superior" value={parent} onChange={e => setParent(e.target.value)} className="block border rounded p-2 w-full bg-background"><option value="">Nivel principal</option>
        {orderedCategories(categories).filter(cat => !descendants.has(cat.id!)).map(cat => <option key={cat.id} value={cat.id}>{categoryPath(cat.id!, categories)}</option>)}
      </select></label>
      <label className="block text-sm">Orden entre categorías del mismo nivel<input aria-label="Orden de categoría" type="number" step="1" value={order} onChange={e => setOrder(Number(e.target.value))} className="block border rounded p-2 w-32" /></label>
      <div className="flex gap-4"><button disabled={busy} className="bg-primary text-white rounded px-4 py-2 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar categoría'}</button><button type="button" disabled={busy} onClick={reset}>Limpiar formulario</button></div>
    </form>
    <input type="search" aria-label="Buscar categorías" placeholder="Buscar por nombre o ruta…" value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded p-2 bg-background" />
    <div className="overflow-x-auto border rounded bg-background"><table className="w-full text-sm text-left"><thead><tr><th className="p-3">Ruta</th><th className="p-3">Orden</th><th className="p-3">Principal / relacionada</th><th className="p-3">Acciones</th></tr></thead>
      <tbody>{orderedCategories(categories).filter(cat => categoryPath(cat.id!, categories).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).map(cat => {
        const direct = products.flatMap(p => p.product_category_links.filter(link => link.category_id === cat.id));
        const children = categories.filter(child => child.parent_id === cat.id).length;
        return <tr key={cat.id} className="border-t"><td className="p-3">{categoryPath(cat.id!, categories)}{children > 0 && <span className="block text-xs text-muted-foreground">{children} subcategorías directas</span>}</td><td className="p-3">{cat.sort_order}</td><td className="p-3">{direct.filter(link => link.is_primary).length} / {direct.filter(link => !link.is_primary).length}</td><td className="p-3 whitespace-nowrap"><button type="button" disabled={busy} onClick={() => edit(cat)} className="text-primary mr-4">Editar</button><button type="button" disabled={busy || children > 0 || direct.length > 0} title={children || direct.length ? 'Mové primero los productos y subcategorías' : 'Eliminar categoría vacía'} onClick={() => void remove(cat)} className="text-destructive disabled:opacity-30">Eliminar</button></td></tr>;
      })}</tbody></table></div>
  </section>;
}
