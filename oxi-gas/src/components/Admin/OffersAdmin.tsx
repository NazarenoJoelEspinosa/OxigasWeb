import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useOffers, type Offer, OFFERS_TABLE_SQL } from '@/hooks/useOffers';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';

// ─── Setup SQL panel ──────────────────────────────────────────────────────────

function SetupPanel() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(OFFERS_TABLE_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="p-5 rounded-xl bg-amber-50 border border-amber-300">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-900">Tabla no encontrada en Supabase</p>
          <p className="text-sm text-amber-800 mt-1">
            Ejecutá este SQL en el <strong>SQL Editor</strong> de tu proyecto Supabase para habilitar las ofertas:
          </p>
        </div>
      </div>
      <div className="relative">
        <pre className="text-xs bg-white border border-amber-200 rounded-lg p-4 overflow-x-auto text-gray-800 whitespace-pre-wrap">
          {OFFERS_TABLE_SQL}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold transition-colors"
        >
          <Copy size={12} />
          {copied ? '¡Copiado!' : 'Copiar SQL'}
        </button>
      </div>
    </div>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────────

type FormProps = {
  initial?: Offer | null;
  onSave: (o: Partial<Offer>) => Promise<void>;
  onCancel: () => void;
};

function OfferForm({ initial, onSave, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState<string>(initial?.price != null ? String(initial.price) : '');
  const [originalPrice, setOriginalPrice] = useState<string>(initial?.original_price != null ? String(initial.original_price) : '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [productCode, setProductCode] = useState(initial?.product_code ?? '');
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr('El nombre es obligatorio.'); return; }
    setSaving(true);
    setErr('');
    try {
      await onSave({
        name: name.trim(),
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        price: price !== '' ? Number(price) : undefined,
        original_price: originalPrice !== '' ? Number(originalPrice) : undefined,
        image: image.trim() || undefined,
        product_code: productCode.trim() || undefined,
        visible,
      });
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--surface-1))] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--surface-3))]">
          <h3 className="text-xl font-bold text-[hsl(var(--text-main))]">
            {initial?.id ? 'Editar oferta' : 'Nueva oferta'}
          </h3>
          <button type="button" onClick={onCancel} className="text-[hsl(var(--text-soft))] hover:text-[hsl(var(--text-main))]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Amoladora Bosch 115mm"
              className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">Marca</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej: Bosch"
                className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">
                Código de producto
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Ej: BOSCH001"
                className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {productCode.trim() && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              El producto con código <strong>{productCode}</strong> se ocultará del catálogo mientras esta oferta esté activa.
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí la oferta..."
              rows={3}
              className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">Precio de oferta</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej: 15000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">Precio original</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Ej: 18000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[hsl(var(--text-main))]">URL de imagen</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-[hsl(var(--surface-3))] rounded-xl bg-[hsl(var(--surface-0))] text-[hsl(var(--text-main))] text-sm focus:outline-none focus:border-primary"
            />
            {image && (
              <div className="mt-2 rounded-xl overflow-hidden border border-[hsl(var(--surface-3))] bg-[hsl(var(--surface-2))] h-32 flex items-center justify-center">
                <img src={image} alt="Preview" className="h-full w-full object-contain p-2" />
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setVisible(!visible)}
              className={`relative w-10 h-6 rounded-full transition-colors ${visible ? 'bg-primary' : 'bg-[hsl(var(--surface-3))]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${visible ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm font-semibold text-[hsl(var(--text-main))]">
              {visible ? 'Visible en el sitio' : 'Oculta (no se muestra)'}
            </span>
          </label>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--surface-3))] text-[hsl(var(--text-main))] hover:bg-[hsl(var(--surface-2))] transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Guardar oferta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OffersAdmin() {
  const { offers, status, reload } = useOffers(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async (data: Partial<Offer>) => {
    if (editing?.id) {
      const { error } = await supabase.from('offers').update(data).eq('id', editing.id);
      if (error) throw error;
      notify(true, 'Oferta actualizada correctamente.');
    } else {
      const { error } = await supabase.from('offers').insert({ ...data, sort_order: offers.length });
      if (error) throw error;
      notify(true, 'Oferta creada correctamente.');
    }
    setShowForm(false);
    setEditing(null);
    reload();
  };

  const handleDelete = async (offer: Offer) => {
    if (!window.confirm(`¿Eliminar la oferta "${offer.name}"?`)) return;
    const { error } = await supabase.from('offers').delete().eq('id', offer.id);
    if (error) { notify(false, error.message); return; }
    notify(true, 'Oferta eliminada.');
    reload();
  };

  const handleToggleVisible = async (offer: Offer) => {
    const { error } = await supabase.from('offers').update({ visible: !offer.visible }).eq('id', offer.id);
    if (error) { notify(false, error.message); return; }
    reload();
  };

  const handleReorder = async (list: Offer[]) => {
    await Promise.all(
      list.map((o, i) => supabase.from('offers').update({ sort_order: i }).eq('id', o.id))
    );
    reload();
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...offers];
    [next[i], next[i - 1]] = [next[i - 1], next[i]];
    handleReorder(next);
  };

  const moveDown = (i: number) => {
    if (i === offers.length - 1) return;
    const next = [...offers];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    handleReorder(next);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

  if (status === 'no-table') return <SetupPanel />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text-main))]">Ofertas</h2>
          <p className="text-sm text-[hsl(var(--text-soft))] mt-0.5">
            Las ofertas aparecen en el carrusel de la home y en la página /ofertas.
            Si cargás un código de producto, ese producto se oculta del catálogo mientras la oferta esté activa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-colors shrink-0"
        >
          <Plus size={16} /> Nueva oferta
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      {status === 'loading' ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-[hsl(var(--text-soft))] border border-dashed border-[hsl(var(--surface-3))] rounded-2xl">
          <p className="text-lg font-semibold text-[hsl(var(--text-main))]">No hay ofertas cargadas</p>
          <p className="text-sm mt-1">Creá tu primera oferta con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => (
            <div
              key={offer.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                offer.visible
                  ? 'bg-[hsl(var(--surface-1))] border-[hsl(var(--surface-3))] hover:border-primary/40'
                  : 'bg-[hsl(var(--surface-2))]/50 border-[hsl(var(--surface-3))]/50 opacity-60'
              }`}
            >
              {/* Imagen */}
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--surface-3))] overflow-hidden shrink-0 flex items-center justify-center">
                {offer.image
                  ? <img src={offer.image} alt={offer.name} className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl">🏷️</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[hsl(var(--text-main))] truncate">{offer.name}</p>
                  {offer.product_code && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-mono shrink-0">
                      código: {offer.product_code}
                    </span>
                  )}
                  {!offer.visible && (
                    <span className="text-[10px] font-bold bg-[hsl(var(--surface-3))] text-[hsl(var(--text-soft))] px-2 py-0.5 rounded-full shrink-0">
                      oculta
                    </span>
                  )}
                </div>
                {offer.brand && <p className="text-xs text-[hsl(var(--text-soft))]">{offer.brand}</p>}
                {offer.description && (
                  <p className="text-xs text-[hsl(var(--text-soft))] truncate mt-0.5">{offer.description}</p>
                )}
              </div>

              {/* Precio */}
              <div className="text-right shrink-0">
                {offer.price != null && (
                  <p className="font-bold text-primary text-sm">{formatPrice(offer.price)}</p>
                )}
                {offer.original_price != null && (
                  <p className="text-xs text-[hsl(var(--text-soft))] line-through">{formatPrice(offer.original_price)}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-2))] disabled:opacity-30 transition-colors" title="Subir">
                  <ChevronUp size={16} className="text-[hsl(var(--text-soft))]" />
                </button>
                <button type="button" onClick={() => moveDown(i)} disabled={i === offers.length - 1}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-2))] disabled:opacity-30 transition-colors" title="Bajar">
                  <ChevronDown size={16} className="text-[hsl(var(--text-soft))]" />
                </button>
                <button type="button" onClick={() => handleToggleVisible(offer)}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors" title={offer.visible ? 'Ocultar' : 'Mostrar'}>
                  {offer.visible
                    ? <Eye size={16} className="text-primary" />
                    : <EyeOff size={16} className="text-[hsl(var(--text-soft))]" />
                  }
                </button>
                <button type="button" onClick={() => { setEditing(offer); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Editar">
                  <Pencil size={16} className="text-primary" />
                </button>
                <button type="button" onClick={() => handleDelete(offer)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <OfferForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
