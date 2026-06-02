/**
 * OffersAdmin
 *
 * Panel para crear, editar y eliminar ofertas destacadas.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_OFFERS, type FeaturedOffer } from '@/hooks/useFeaturedOffers';
import { Plus, Pencil, Trash2, Save, X, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function ensureTable(): Promise<boolean> {
  const { error } = await supabase.from('featured_offers').select('id').limit(1);
  return !error;
}

// ─── Form modal ───────────────────────────────────────────────────────────────

type OfferFormProps = {
  initial?: FeaturedOffer;
  onSave: (o: FeaturedOffer) => Promise<void>;
  onCancel: () => void;
};

const EMOJI_PRESETS = ['⭐', '🔵', '🔥', '⚡', '🔩', '📦', '💰', '🎁', '✨', '🌟', '🏆', '🎯'];

function OfferForm({ initial, onSave, onCancel }: OfferFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [discount, setDiscount] = useState(initial?.discount ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '⭐');
  const [image, setImage] = useState(initial?.image ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !discount.trim() || !description.trim()) {
      setErr('Todos los campos son requeridos.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onSave({ ...initial, title, discount, description, icon, image: image || undefined, sort_order: initial?.sort_order ?? 0 });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[hsl(var(--surface-1))] rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[hsl(var(--text-main))]">
            {initial?.id ? 'Editar oferta' : 'Nueva oferta'}
          </h3>
          <button type="button" onClick={onCancel} className="text-[hsl(var(--text-soft))] hover:text-[hsl(var(--text-main))]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[hsl(var(--text-main))]">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[hsl(var(--surface-3))] rounded-lg bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] focus:outline-none focus:border-primary"
              placeholder="Ej: Gases comprimidos en promoción"
            />
          </div>

          {/* Descuento */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[hsl(var(--text-main))]">Descuento</label>
            <input
              type="text"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-[hsl(var(--surface-3))] rounded-lg bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] focus:outline-none focus:border-primary"
              placeholder="Ej: 15%"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[hsl(var(--text-main))]">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[hsl(var(--surface-3))] rounded-lg bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] focus:outline-none focus:border-primary resize-none"
              placeholder="Descripción de la oferta"
              rows={3}
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[hsl(var(--text-main))]">URL de imagen (opcional)</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 border border-[hsl(var(--surface-3))] rounded-lg bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] focus:outline-none focus:border-primary"
              placeholder="Ej: https://ejemplo.com/imagen.jpg"
            />
            {image && (
              <div className="mt-2 p-2 rounded-lg overflow-hidden">
                <img src={image} alt="Vista previa" className="w-full h-32 object-cover rounded" />
              </div>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[hsl(var(--text-main))]">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    icon === e ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-[hsl(var(--surface-2))]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {err && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {err}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-[hsl(var(--surface-3))] text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OffersAdmin() {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<FeaturedOffer | null>(null);
  const [tableExists, setTableExists] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    const exists = await ensureTable();
    setTableExists(exists);

    if (!exists) {
      setOffers(DEFAULT_OFFERS.map((o, i) => ({ ...o, id: `default-${i}` })));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('featured_offers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      setOffers(DEFAULT_OFFERS.map((o, i) => ({ ...o, id: `default-${i}` })));
    } else {
      setOffers((data as FeaturedOffer[]) || DEFAULT_OFFERS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleSaveOffer = async (o: FeaturedOffer) => {
    try {
      if (o.id?.startsWith('default-')) {
        // Insertar nueva oferta
        const { error } = await supabase
          .from('featured_offers')
          .insert({ title: o.title, discount: o.discount, description: o.description, icon: o.icon, image: o.image || null, sort_order: offers.length });
        if (error) throw error;
        setMsg({ tipo: 'exito', texto: 'Oferta creada correctamente.' });
      } else if (o.id) {
        // Actualizar oferta existente
        const { error } = await supabase
          .from('featured_offers')
          .update({ title: o.title, discount: o.discount, description: o.description, icon: o.icon, image: o.image || null })
          .eq('id', o.id);
        if (error) throw error;
        setMsg({ tipo: 'exito', texto: 'Oferta actualizada correctamente.' });
      }
          .eq('id', o.id);
        if (error) throw error;
        setMsg({ tipo: 'exito', texto: 'Oferta actualizada correctamente.' });
      }
      setShowForm(false);
      setEditingOffer(null);
      setTimeout(() => loadOffers(), 500);
    } catch (e) {
      setMsg({ tipo: 'error', texto: (e as Error).message });
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('¿Eliminar esta oferta?')) return;
    try {
      const { error } = await supabase.from('featured_offers').delete().eq('id', id);
      if (error) throw error;
      setMsg({ tipo: 'exito', texto: 'Oferta eliminada correctamente.' });
      loadOffers();
    } catch (e) {
      setMsg({ tipo: 'error', texto: (e as Error).message });
    }
  };

  const handleReorder = async (offers: FeaturedOffer[]) => {
    try {
      const updates = offers.map((o, i) =>
        supabase.from('featured_offers').update({ sort_order: i }).eq('id', o.id!)
      );
      await Promise.all(updates);
      setOffers(offers);
      setMsg({ tipo: 'exito', texto: 'Orden actualizado.' });
    } catch (e) {
      setMsg({ tipo: 'error', texto: (e as Error).message });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[hsl(var(--text-main))]">Ofertas Destacadas</h2>
        <button
          type="button"
          onClick={() => { setEditingOffer(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} /> Nueva oferta
        </button>
      </div>

      {!tableExists && (
        <div className="p-4 rounded-lg bg-amber-100 border border-amber-400 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Tabla no creada en Supabase</p>
              <p className="text-sm text-amber-800 mt-1">La tabla `featured_offers` no existe. Se están usando las ofertas por defecto.</p>
              <p className="text-xs text-amber-700 mt-2 font-mono bg-amber-50 p-2 rounded mt-2">
                Ejecutar en Supabase SQL Editor:
              </p>
              <pre className="text-xs bg-amber-50 p-2 rounded mt-1 overflow-x-auto">
                {`create table featured_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  discount text not null,
  description text not null,
  icon text not null default '⭐',
  image text,
  sort_order int default 0,
  created_at timestamp default now()
);
alter table featured_offers enable row level security;
create policy "public read" on featured_offers for select using (true);
create policy "auth write" on featured_offers for all using (auth.role() = 'authenticated');`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${msg.tipo === 'exito' ? 'bg-green-100 border border-green-400 text-green-800' : 'bg-red-100 border border-red-400 text-red-800'}`}>
          {msg.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {msg.texto}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className="p-4 rounded-lg bg-[hsl(var(--surface-2))] border border-[hsl(var(--surface-3))] flex items-center gap-4 hover:border-primary/50 transition-colors"
            >
              <span className="text-3xl">{offer.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[hsl(var(--text-main))]">{offer.title}</h3>
                <p className="text-sm text-[hsl(var(--text-soft))]">{offer.description.substring(0, 60)}...</p>
                <p className="text-xs font-bold text-primary mt-1">Descuento: {offer.discount}</p>
              </div>

              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...offers];
                      [next[index], next[index - 1]] = [next[index - 1], next[index]];
                      handleReorder(next);
                    }}
                    className="p-2 hover:bg-[hsl(var(--surface-3))] rounded-lg transition-colors"
                    title="Subir"
                  >
                    <ChevronUp size={18} className="text-[hsl(var(--text-soft))]" />
                  </button>
                )}
                {index < offers.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...offers];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      handleReorder(next);
                    }}
                    className="p-2 hover:bg-[hsl(var(--surface-3))] rounded-lg transition-colors"
                    title="Bajar"
                  >
                    <ChevronDown size={18} className="text-[hsl(var(--text-soft))]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setEditingOffer(offer); setShowForm(true); }}
                  className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>

                {!offer.id?.startsWith('default-') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOffer(offer.id!)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <OfferForm
          initial={editingOffer || undefined}
          onSave={handleSaveOffer}
          onCancel={() => { setShowForm(false); setEditingOffer(null); }}
        />
      )}
    </div>
  );
}
