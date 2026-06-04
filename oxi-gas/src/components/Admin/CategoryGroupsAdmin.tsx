/**
 * CategoryGroupsAdmin
 *
 * Panel para crear, editar y eliminar grupos de categorías del sidebar de Productos.
 * Guarda en la tabla `category_groups` de Supabase.
 *
 * Insertar este componente dentro de AdminDashboard como pestaña "Categorías".
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_GROUPS, type CategoryGroup } from '@/hooks/useCategoryGroups';
import { Plus, Pencil, Trash2, Save, X, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function ensureTable(): Promise<boolean> {
  const { error } = await supabase.from('category_groups').select('id').limit(1);
  return !error;
}

// ─── Form modal ───────────────────────────────────────────────────────────────

type GroupFormProps = {
  initial?: CategoryGroup;
  totalGroups: number;
  onSave: (g: CategoryGroup) => Promise<void>;
  onCancel: () => void;
};

const EMOJI_PRESETS = ['🔵','🔥','🔨','⚡','🔩','📦','🛠','🔧','⚙️','🪛','🔌','🧰','🪚','🪝','🧲','💡','🛡','🏭'];

function GroupForm({ initial, totalGroups, onSave, onCancel }: GroupFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '📦');
  const [slugInput, setSlugInput] = useState('');
  const [slugs, setSlugs] = useState<string[]>(initial?.slugs ?? []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const addSlug = () => {
    const val = slugInput.trim();
    if (!val) return;
    if (!slugs.includes(val)) setSlugs(prev => [...prev, val]);
    setSlugInput('');
  };

  const removeSlug = (s: string) => setSlugs(prev => prev.filter(x => x !== s));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSlug(); }
  };

  const submit = async () => {
    if (!label.trim()) { setErr('El nombre del grupo es obligatorio.'); return; }
    setSaving(true);
    setErr('');
    await onSave({
      ...initial,
      label: label.trim(),
      icon,
      slugs,
      sort_order: initial?.sort_order ?? totalGroups,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-base">{initial?.id ? 'Editar grupo' : 'Nuevo grupo'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nombre del grupo *</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Gases, Soldadura..."
              className="w-full h-10 px-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>

          {/* Ícono */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ícono (emoji)</label>
            <div className="flex gap-2 items-center flex-wrap">
              {EMOJI_PRESETS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${icon === e ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'}`}
                >
                  {e}
                </button>
              ))}
              <input
                value={icon}
                onChange={e => setIcon(e.target.value)}
                maxLength={4}
                placeholder="✏️"
                className="w-16 h-9 text-center border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Seleccioná uno o escribí tu propio emoji.</p>
          </div>

          {/* Slugs */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Categorías de Supabase que pertenecen a este grupo
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Escribí el valor exacto del campo <code className="bg-muted px-1 rounded text-[10px]">category</code> tal como aparece en tu base de datos. Es case-sensitive.
            </p>
            <div className="flex gap-2">
              <input
                value={slugInput}
                onChange={e => setSlugInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: gases, Soldadura, Electrodos..."
                className="flex-1 h-9 px-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
              <button
                type="button"
                onClick={addSlug}
                className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {slugs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {slugs.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                    {s}
                    <button onClick={() => removeSlug(s)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {err && (
            <p className="text-destructive text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />{err}
            </p>
          )}
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancel}
            className="h-10 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CategoryGroupsAdmin() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(false);
  const [editing, setEditing] = useState<CategoryGroup | null | 'new'>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const notify = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const ok = await ensureTable();
    setTableExists(ok);
    if (ok) {
      const { data } = await supabase
        .from('category_groups').select('*').order('sort_order', { ascending: true });
      setGroups((data ?? []) as CategoryGroup[]);
    } else {
      // Mostrar defaults de solo lectura
      setGroups(DEFAULT_GROUPS.map((g, i) => ({ ...g, id: `default-${i}` })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (g: CategoryGroup) => {
    if (!tableExists) { notify('err', 'La tabla no existe todavía. Creala primero (ver instrucciones abajo).'); return; }
    if (g.id) {
      const { error } = await supabase.from('category_groups').update({ label: g.label, icon: g.icon, slugs: g.slugs, sort_order: g.sort_order }).eq('id', g.id);
      if (error) { notify('err', error.message); return; }
    } else {
      const { error } = await supabase.from('category_groups').insert({ label: g.label, icon: g.icon, slugs: g.slugs, sort_order: g.sort_order });
      if (error) { notify('err', error.message); return; }
    }
    notify('ok', `Grupo "${g.label}" guardado.`);
    setEditing(null);
    load();
  };

  const handleDelete = async (g: CategoryGroup) => {
    if (!tableExists) return;
    if (!window.confirm(`¿Eliminar el grupo "${g.label}"? Los productos no se borran, solo deja de aparecer el grupo.`)) return;
    const { error } = await supabase.from('category_groups').delete().eq('id', g.id!);
    if (error) { notify('err', error.message); return; }
    notify('ok', `Grupo "${g.label}" eliminado.`);
    load();
  };

  const moveGroup = async (idx: number, dir: -1 | 1) => {
    if (!tableExists) return;
    const next = [...groups];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((g, i) => supabase.from('category_groups').update({ sort_order: i }).eq('id', g.id!));
    await Promise.all(updates);
    load();
  };

  const seedDefaults = async () => {
    if (!tableExists) { notify('err', 'La tabla no existe todavía.'); return; }
    for (const [i, g] of DEFAULT_GROUPS.entries()) {
      await supabase.from('category_groups').insert({ label: g.label, icon: g.icon, slugs: g.slugs, sort_order: i });
    }
    notify('ok', 'Grupos por defecto insertados.');
    load();
  };

  const resetToDefaults = async () => {
    if (!tableExists) { notify('err', 'La tabla no existe todavía.'); return; }
    if (!window.confirm('¿Restaurar todos los grupos a los valores predeterminados? Se borrarán los grupos actuales.')) return;
    const ids = groups.map((g) => g.id).filter(Boolean) as string[];
    if (ids.length > 0) {
      await supabase.from('category_groups').delete().in('id', ids);
    }
    for (const [i, g] of DEFAULT_GROUPS.entries()) {
      await supabase.from('category_groups').insert({ label: g.label, icon: g.icon, slugs: g.slugs, sort_order: i });
    }
    notify('ok', 'Grupos restaurados a los valores predeterminados.');
    load();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-destructive text-white'}`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Grupos de categorías</h2>
          <p className="text-sm text-muted-foreground">
            Estos grupos aparecen en el sidebar de la página de Productos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tableExists && groups.length === 0 && (
            <button
              onClick={seedDefaults}
              className="h-9 px-4 border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Cargar defaults
            </button>
          )}
          {tableExists && groups.length > 0 && (
            <button
              onClick={resetToDefaults}
              className="h-9 px-4 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restaurar defaults
            </button>
          )}
          <button
            onClick={() => setEditing('new')}
            disabled={!tableExists}
            title={!tableExists ? 'Creá la tabla primero' : ''}
            className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nuevo grupo
          </button>
        </div>
      </div>

      {/* Alerta: tabla no existe */}
      {!tableExists && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> La tabla <code>category_groups</code> no existe en Supabase todavía.</p>
          <p>Creala con este SQL en el Editor de Supabase y luego recargá:</p>
          <pre className="bg-amber-100 rounded-lg p-3 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{`create table category_groups (
  id        uuid primary key default gen_random_uuid(),
  label     text not null,
  icon      text not null default '📦',
  slugs     text[] not null default '{}',
  sort_order int not null default 0
);
alter table category_groups enable row level security;
create policy "public read"
  on category_groups for select using (true);
create policy "auth write"
  on category_groups for all
  using (auth.role() = 'authenticated');`}</pre>
          <button onClick={load} className="mt-1 text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {/* Lista de grupos */}
      {loading ? (
        <div className="flex items-center gap-3 py-12 justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">Cargando grupos...</span>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {groups.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No hay grupos. Hacé clic en "Nuevo grupo" o "Cargar defaults".
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((g, i) => (
                <li key={g.id ?? i} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  {/* Ícono */}
                  <span className="text-2xl mt-0.5 select-none">{g.icon}</span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{g.label}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {g.slugs.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Sin slugs</span>
                      ) : (
                        g.slugs.map(s => (
                          <span key={s} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s}</span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    {tableExists && (
                      <>
                        <button onClick={() => moveGroup(i, -1)} disabled={i === 0}
                          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors" title="Subir">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveGroup(i, 1)} disabled={i === groups.length - 1}
                          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors" title="Bajar">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => setEditing(g)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {tableExists && (
                      <button onClick={() => handleDelete(g)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Nota: los defaults siguen funcionando */}
      {!tableExists && !loading && (
        <p className="text-xs text-muted-foreground">
          💡 Mientras la tabla no exista, la página de Productos usa los grupos hardcodeados en <code>Productos.tsx</code>. Funcionan igual, solo no son editables desde el admin.
        </p>
      )}

      {/* Modal form */}
      {editing !== null && (
        <GroupForm
          initial={editing === 'new' ? undefined : editing}
          totalGroups={groups.length}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}