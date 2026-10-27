import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { categoryBranch, categoryKey, categoryPath, orderedCategories, primaryCategoryPath } from '@/lib/categories';
import { errorMessage, type Product } from '@/lib/models';
import type { CategoryGroup } from '@/hooks/useCategoryGroups';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

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
  const [viewing, setViewing] = useState<string | null>(null);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<'related' | 'primary'>('related');
  const [addSearch, setAddSearch] = useState('');
  const [addSelection, setAddSelection] = useState<Set<string>>(new Set());
  const viewingTrigger = useRef<HTMLButtonElement | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const viewedCategory = categories.find(cat => cat.id === viewing);
  const branch = viewing ? includeChildren ? categoryBranch(viewing, categories) : new Set([viewing]) : new Set<string>();
  const categoryProducts = products.filter(product => product.product_category_links.some(link => branch.has(link.category_id)));
  const miniProducts = categoryProducts.filter(product => `${product.name} ${product.code} ${product.brand ?? ''}`.toLocaleLowerCase('es').includes(productSearch.toLocaleLowerCase('es')));
  const candidates = products.filter(product => !product.product_category_links.some(link => link.category_id === viewing && (addMode === 'related' || link.is_primary)));
  const matchingCandidates = candidates.filter(product => categoryKey(`${product.name} ${product.code} ${product.brand ?? ''}`).includes(categoryKey(addSearch)));
  const startAdding = () => { setAdding(true); setAddMode('related'); setAddSearch(''); setAddSelection(new Set()); setMessage(''); };
  const addProducts = async () => {
    if (busy || !viewing || addSelection.size === 0 || addSelection.size > 500) return;
    const selected = products.filter(product => addSelection.has(product.id));
    if (!window.confirm(`Agregar ${selected.length} productos a ${categoryPath(viewing, categories)}:\n${selected.map(product => product.code + ' · ' + product.name).join('\n')}\n\n${addMode === 'primary' ? 'Esta será su categoría principal y reemplazará la anterior. Las otras secciones se conservan.' : 'Se agregará como sección relacionada. Las categorías principales se conservan.'}`)) return;
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.rpc('bulk_classify_products', {
        p_ids: [...addSelection], p_primary: addMode === 'primary' ? viewing : null,
        p_set_primary: addMode === 'primary', p_related: addMode === 'related' ? [viewing] : [],
        p_mode: addMode === 'related' ? 'add' : 'keep',
      });
      if (error) throw new Error(error.message);
      if (data !== addSelection.size) throw new Error('No se pudo confirmar el lote completo. Actualizá la lista.');
      await onChanged(); setAdding(false); setAddSelection(new Set()); setProductSearch('');
      setMessage(`${data} ${data === 1 ? 'producto agregado' : 'productos agregados'} a la categoría. No se crearon copias.`);
    } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  };
  const reset = () => { setEditing(null); setLabel(''); setParent(''); setOrder(0); };
  const descendants = editing ? categoryBranch(editing, categories) : new Set<string>();
  const edit = (cat: CategoryGroup) => { setEditing(cat.id!); setLabel(cat.label); setParent(cat.parent_id ?? ''); setOrder(cat.sort_order); nameInput.current?.focus(); };
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
  const removeProduct = async (product: Product) => {
    if (busy || !viewing) return;
    const links = product.product_category_links.filter(link => branch.has(link.category_id));
    const removesPrimary = links.some(link => link.is_primary);
    const description = links.map(link => categoryPath(link.category_id, categories)).join('\n');
    if (!window.confirm(`Quitar «${product.name}» de:\n${description}\n\n${removesPrimary ? 'Quedará sin categoría principal. Podés asignarle otra desde Productos.' : 'Conservará su categoría principal.'}\nEl producto y sus fotos se conservan; las otras secciones no cambian.`)) return;
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.rpc('bulk_classify_products', {
        p_ids: [product.id], p_primary: null, p_set_primary: removesPrimary,
        p_related: links.filter(link => !link.is_primary).map(link => link.category_id), p_mode: 'remove',
      });
      if (error) throw new Error(error.message);
      if (data !== 1) throw new Error('No se pudo confirmar el cambio. Actualizá la lista.');
      await onChanged(); setMessage('Asociación quitada. El producto sigue en el catálogo.');
    } catch (error) { setMessage(errorMessage(error)); } finally { setBusy(false); }
  };
  return <section className="space-y-4">
    <h2 className="text-xl font-bold">Categorías y subcategorías</h2>
    <p className="text-sm">La categoría principal organiza el producto. Las secciones relacionadas permiten mostrarlo en otros lugares sin duplicarlo.</p>
    {message && <p role="status" className="border rounded p-3 text-sm bg-background">{message}</p>}
    <form onSubmit={save} className="border rounded p-4 bg-background space-y-3">
      <h3 className="font-semibold">{editing ? 'Editar categoría' : 'Crear categoría'}</h3>
      <label className="block text-sm">Nombre<input ref={nameInput} aria-label="Nombre de categoría" required maxLength={120} value={label} onChange={e => setLabel(e.target.value)} className="block border rounded p-2 w-full" /></label>
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
        const ids = categoryBranch(cat.id!, categories);
        const count = products.filter(p => p.product_category_links.some(link => ids.has(link.category_id))).length;
        return <tr key={cat.id} className="border-t"><td className="p-3">{categoryPath(cat.id!, categories)}{children > 0 && <span className="block text-xs text-muted-foreground">{children} subcategorías directas</span>}</td><td className="p-3">{cat.sort_order}</td><td className="p-3">{direct.filter(link => link.is_primary).length} / {direct.filter(link => !link.is_primary).length}</td><td className="p-3 whitespace-nowrap"><button type="button" disabled={busy} aria-label={`Ver productos de ${categoryPath(cat.id!, categories)}`} onClick={event => { viewingTrigger.current = event.currentTarget; setViewing(cat.id!); setIncludeChildren(true); setProductSearch(''); setMessage(''); }} className="text-primary mr-4">Ver productos ({count})</button><button type="button" disabled={busy} onClick={() => edit(cat)} className="text-primary mr-4">Editar</button><button type="button" disabled={busy || children > 0 || direct.length > 0} title={children || direct.length ? 'Mové primero los productos y subcategorías' : 'Eliminar categoría vacía'} onClick={() => void remove(cat)} className="text-destructive disabled:opacity-30">Eliminar</button></td></tr>;
      })}</tbody></table></div>
    <Sheet open={Boolean(viewedCategory)} onOpenChange={open => { if (!open) { setViewing(null); setAdding(false); setAddSelection(new Set()); } }}>
    {viewedCategory && <SheetContent onCloseAutoFocus={event => { event.preventDefault(); viewingTrigger.current?.focus(); }} className="w-full sm:max-w-2xl flex flex-col gap-3">
      <SheetHeader className="text-left pr-5"><SheetTitle>Productos de {categoryPath(viewedCategory.id!, categories)} ({categoryProducts.length})</SheetTitle><SheetDescription>Agregá productos del catálogo o quitá las asociaciones que no correspondan.</SheetDescription></SheetHeader>
      {message && <p role="status" className="text-sm border rounded p-2">{message}</p>}
      {adding ? <section aria-label="Agregar productos a la categoría" className="flex-1 min-h-0 flex flex-col gap-3">
        <h3 className="font-semibold text-sm">Agregar productos existentes</h3>
        <label className="text-sm">Cómo agregarlos<select aria-label="Tipo de asociación al agregar" value={addMode} disabled={busy} onChange={event => { setAddMode(event.target.value as 'related' | 'primary'); setAddSelection(new Set()); }} className="block w-full border rounded p-2 bg-background mt-1">
          <option value="related">Como sección relacionada (conservar principal)</option>
          <option value="primary">Como categoría principal (reemplazar anterior)</option>
        </select></label>
        <input type="search" aria-label="Buscar productos para agregar" value={addSearch} disabled={busy} onChange={event => setAddSearch(event.target.value)} placeholder="Nombre, código o marca…" className="w-full border rounded p-2 text-sm" />
        <div className="flex flex-wrap gap-3 text-xs items-center"><strong>{addSelection.size} seleccionados</strong><button type="button" disabled={busy || matchingCandidates.length > 500} onClick={() => setAddSelection(new Set(matchingCandidates.map(product => product.id)))} className="text-primary disabled:opacity-40">Seleccionar resultados ({matchingCandidates.length})</button><button type="button" disabled={busy} onClick={() => setAddSelection(new Set())} className="text-primary">Quitar selección</button></div>
        <ul className="flex-1 min-h-0 overflow-y-auto divide-y">{matchingCandidates.map(product => <li key={product.id}>
          <label className="flex items-center gap-3 py-3 cursor-pointer">
            <input type="checkbox" aria-label={`Agregar ${product.code}`} disabled={busy} checked={addSelection.has(product.id)} onChange={event => setAddSelection(current => { const next = new Set(current); if (event.target.checked) next.add(product.id); else next.delete(product.id); return next; })} />
            {product.images[0] && <img src={product.images[0]} alt="" className="w-10 h-10 object-contain rounded border" />}
            <span className="min-w-0"><span className="block text-sm font-semibold">{product.name}</span><span className="block text-xs text-muted-foreground">{product.code} · {product.brand || 'Sin marca'}{product.visible ? '' : ' · Oculto'}</span><span className="block text-xs">Principal: {primaryCategoryPath(product, categories)}</span></span>
          </label>
        </li>)}</ul>
        {matchingCandidates.length === 0 && <p className="text-sm text-muted-foreground">No hay productos disponibles para esta búsqueda y tipo de asociación.</p>}
        <div className="flex flex-wrap gap-3 border-t pt-3"><button type="button" disabled={busy || addSelection.size === 0 || addSelection.size > 500} onClick={() => void addProducts()} className="bg-primary text-white rounded px-4 py-2 text-sm disabled:opacity-40">{busy ? 'Agregando…' : `Agregar ${addSelection.size} ${addSelection.size === 1 ? 'producto' : 'productos'}`}</button><button type="button" disabled={busy} onClick={() => { setAdding(false); setAddSelection(new Set()); setMessage(''); }} className="text-sm">Cancelar agregado</button></div>
      </section> : <>
      <button type="button" disabled={busy} onClick={startAdding} className="self-start bg-primary text-white rounded px-4 py-2 text-sm disabled:opacity-40">Agregar productos</button>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={includeChildren} onChange={e => setIncludeChildren(e.target.checked)} />Incluir subcategorías</label>
      <p className="text-xs text-muted-foreground">Cada producto aparece una vez. Quitar elimina sus asociaciones dentro de esta sección{includeChildren ? ' y sus subcategorías' : ''}; conserva el producto y las otras secciones.</p>
      <input type="search" aria-label="Buscar dentro de esta categoría" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Nombre, código o marca…" className="w-full border rounded p-2 text-sm" />
      <ul className="flex-1 min-h-0 overflow-y-auto divide-y">{miniProducts.map(product => <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
        {product.images[0] ? <img src={product.images[0]} alt="" className="w-12 h-12 object-contain rounded border" /> : <span className="w-12 h-12 flex items-center justify-center rounded border text-xs">Sin foto</span>}
        <div className="flex-1 min-w-40"><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.code} · {product.brand || 'Sin marca'}</p>
          {product.product_category_links.filter(link => branch.has(link.category_id)).map(link => <p key={link.category_id} className="text-xs">{link.is_primary ? 'Principal' : 'Relacionada'}: {categoryPath(link.category_id, categories)}</p>)}
        </div>
        <button type="button" disabled={busy} aria-label={`Quitar ${product.code} de esta categoría`} onClick={() => void removeProduct(product)} className="text-destructive text-xs border rounded px-3 py-2 disabled:opacity-40">Quitar de esta categoría</button>
      </li>)}</ul>
      {miniProducts.length === 0 && <p className="text-sm text-muted-foreground">No hay productos para esta selección.</p>}
      </>}
    </SheetContent>}
    </Sheet>
  </section>;
}
