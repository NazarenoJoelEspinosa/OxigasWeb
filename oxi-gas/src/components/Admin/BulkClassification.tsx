import { useState } from 'react';
import { ClassificationFields } from './ClassificationFields';
import type { CategoryGroup } from '@/hooks/useCategoryGroups';
import { categoryPath } from '@/lib/categories';
import { supabase } from '@/lib/supabaseClient';
import { errorMessage } from '@/lib/models';

export default function BulkClassification({ ids, categories, onSaved, onCancel }: {
  ids: string[]; categories: CategoryGroup[]; onSaved: () => Promise<void>; onCancel: () => void;
}) {
  const [primary, setPrimary] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [setMain, setSetMain] = useState(false);
  const [mode, setMode] = useState('keep');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (busy || (!setMain && mode === 'keep')) return;
    const summary = `Aplicar a ${ids.length} productos seleccionados:\nPrincipal: ${setMain ? primary ? categoryPath(primary, categories) : 'Sin clasificar' : 'Conservar'}\nSecciones: ${mode === 'keep' ? 'Conservar' : mode === 'add' ? 'Agregar' : mode === 'replace' ? 'Reemplazar todas' : 'Quitar seleccionadas'}${mode !== 'keep' ? '\n' + related.map(id => categoryPath(id, categories)).join('\n') : ''}`;
    if (!window.confirm(summary)) return;
    setBusy(true); setError('');
    try {
      const { data, error } = await supabase.rpc('bulk_classify_products', { p_ids: ids, p_primary: setMain ? primary || null : null, p_related: related, p_set_primary: setMain, p_mode: mode });
      if (error) throw new Error(error.message);
      if (data !== ids.length) throw new Error('No se pudo confirmar el lote completo. Actualizá el catálogo antes de continuar.');
      await onSaved();
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  };
  return <section aria-label="Clasificación por lotes" className="bg-background border-2 border-primary rounded p-4 my-4 space-y-4">
    <h3 className="font-bold">Clasificar {ids.length} productos seleccionados</h3>
    <p className="text-sm">Se aplicará a toda la selección, incluso a productos de otras páginas.</p>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={setMain} onChange={e => setSetMain(e.target.checked)} />Cambiar categoría principal</label>
    <label className="block text-sm">Secciones relacionadas<select aria-label="Operación de secciones relacionadas" value={mode} onChange={e => setMode(e.target.value)} className="block border rounded p-2 bg-background"><option value="keep">Conservar las actuales</option><option value="add">Agregar las seleccionadas</option><option value="remove">Quitar las seleccionadas</option><option value="replace">Reemplazar todas por las seleccionadas</option></select></label>
    <ClassificationFields categories={categories} primary={setMain ? primary : ''} related={related} onPrimary={setPrimary} onRelated={setRelated} prefix="bulk" showPrimary={setMain} showRelated={mode !== 'keep'} />
    {mode === 'replace' && related.length === 0 && <p className="text-sm text-destructive">Esta operación quitará todas las secciones relacionadas; conservará la categoría principal.</p>}
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <div className="flex gap-4"><button type="button" disabled={busy || (!setMain && mode === 'keep')} onClick={() => void save()} className="bg-primary text-white px-4 py-2 rounded disabled:opacity-40">{busy ? 'Aplicando…' : 'Aplicar clasificación al lote'}</button><button type="button" disabled={busy} onClick={onCancel}>Cancelar lote</button></div>
  </section>;
}
