import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { stableCustomFields, errorMessage, type CustomField, type Product } from '@/lib/models';
import { useCategoryGroups } from '@/hooks/useCategoryGroups';
import { ClassificationFields } from './ClassificationFields';

export type { CustomField } from '@/lib/models';
export type Producto = Partial<Product> & Pick<Product, 'code' | 'name'>;

interface ProductFormProps {
  producto?: Producto | null;
  alGuardar: () => void;
  alCancelar: () => void;
}

export default function ProductForm({ producto, alGuardar, alCancelar }: ProductFormProps) {
  const [codigo, setCodigo] = useState(producto?.code ?? '');
  const [nombre, setNombre] = useState(producto?.name ?? '');
  const [descripcion, setDescripcion] = useState(producto?.description ?? '');
  const [marca, setMarca] = useState(producto?.brand ?? '');
  const { groups: taxonomy, status: taxonomyStatus, usingFallback } = useCategoryGroups(true);
  const [primary, setPrimary] = useState(producto?.product_category_links?.find(link => link.is_primary)?.category_id ?? '');
  const [related, setRelated] = useState(producto?.product_category_links?.filter(link => !link.is_primary).map(link => link.category_id) ?? []);
  const categoria = taxonomy.find(cat => cat.id === primary)?.label ?? '';
  const [precio, setPrecio] = useState(producto?.price ?? '');
  const [visible, setVisible] = useState(producto?.visible ?? true);
  const [imagenesActuales, setImagenesActuales] = useState<string[]>(
    Array.isArray(producto?.images)
      ? producto.images.filter(
        (img): img is string => typeof img === 'string'
      )
      : []
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(producto?.custom_fields ?? []);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    if (archivo && (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024)) {
      setError('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.');
      e.target.value = ''; return;
    }
    setError(null);
    setArchivoImagen(archivo);
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => setPrevisualizacion(lector.result as string);
      lector.readAsDataURL(archivo);
    } else setPrevisualizacion(null);
  };

  const subirImagen = async (): Promise<string | null> => {
    if (!archivoImagen) return null;
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[archivoImagen.type];
    const ruta = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images').upload(ruta, archivoImagen, { upsert: false });
    if (uploadError) { setError('Error al subir la imagen: ' + uploadError.message); return null; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(ruta);
    return data.publicUrl;
  };

  const agregarCampo = () => {
    setCustomFields(prev => [...prev, { key: `campo_${crypto.randomUUID()}`, label: '', placeholder: '' }]);
  };

  const actualizarCampo = (index: number, field: Partial<CustomField>) => {
    setCustomFields(prev => prev.map((c, i) => i === index ? { ...c, ...field } : c));
  };

  const eliminarCampo = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError(null);
    let uploadedPath: string | null = null;
    let committed = false;
    try {
      if (!codigo.trim() || !nombre.trim()) throw new Error('Completá el código y el nombre.');
      if (taxonomyStatus !== 'ready' || usingFallback) throw new Error('Esperá a que se carguen las categorías antes de guardar.');
      if (precio !== '' && (!Number.isFinite(Number(precio)) || Number(precio) < 0)) throw new Error('El precio debe ser un número mayor o igual a cero.');
      stableCustomFields(customFields);
      let urlNueva: string | null = null;
      if (archivoImagen) { urlNueva = await subirImagen(); if (!urlNueva) return; uploadedPath = new URL(urlNueva).pathname.split('/product-images/')[1] ?? null; }


      const imagenesSeguras = Array.isArray(imagenesActuales)
        ? imagenesActuales.filter(i => typeof i === 'string')
        : [];

      const imagenesFinal = urlNueva
        ? [...imagenesSeguras, urlNueva]
        : imagenesSeguras;
      const camposLimpios = stableCustomFields(customFields);
      const datos = {
        code: codigo.trim(), name: nombre.trim(), description: descripcion.trim(),
        brand: marca.trim(), category: categoria.trim(),
        price: categoria.trim().toLowerCase() === 'ofertas' && precio !== '' ? Number(precio) : null,
        visible: visible,
        images: imagenesFinal, custom_fields: camposLimpios,
      };
      const { data: savedId, error: saveError } = await supabase.rpc('save_catalog_product', {
        p_product: { ...datos, ...(producto?.id ? { id: producto.id } : {}) },
        p_primary: primary || null, p_related: related,
      });
      if (saveError) throw new Error('Error al guardar: ' + saveError.message);
      if (!savedId) throw new Error('No se pudo confirmar el guardado.');
      committed = true;
      alGuardar();
    } catch (err: unknown) {
      setError(errorMessage(err));
     } finally {
      if (uploadedPath && !committed) {
        const { error: cleanupError } = await supabase.storage.from('product-images').remove([decodeURIComponent(uploadedPath)]);
        if (cleanupError) console.error('No se pudo limpiar la imagen pendiente:', cleanupError.message);
      }
      setGuardando(false);
    }
  };

  return (
    <div className="mb-6 bg-background border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">{producto?.id ? '✏️ Editar producto' : '➕ Nuevo producto'}</h2>
      <form onSubmit={handleGuardar} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código <span className="text-destructive">*</span></label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: OXI-001" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre <span className="text-destructive">*</span></label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Tornillo Madera FIXER" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción del producto</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Descripción detallada del producto. Se mostrará en la página de productos..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            {descripcion.length} caracteres
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <input value={marca} onChange={(e) => setMarca(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: BOSCH, FIXER..." />
          </div>
          {categoria.toLowerCase() === 'ofertas' && (
            <div>
              <label className="block text-sm font-medium mb-1">Precio (solo para ofertas)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ej: 1500.00"
              />
            </div>
          )}
        </div>
        <ClassificationFields categories={taxonomy} primary={primary} related={related} onPrimary={setPrimary} onRelated={setRelated} />
        <p className="text-xs text-muted-foreground">Creá y organizá las categorías desde la pestaña Categorías. Seleccionar una subcategoría incluye automáticamente sus niveles superiores en la tienda.</p>
        {(taxonomyStatus !== 'ready' || usingFallback) && <p role="alert" className="text-destructive text-sm">No se cargaron las categorías. No guardes hasta recuperar la conexión.</p>}
        {/* Campos variables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-medium">Campos que completa el cliente</label>
              <p className="text-xs text-muted-foreground">Para productos con medidas variables (tornillos, correas, gases, etc.)</p>
            </div>
            <button type="button" onClick={agregarCampo}
              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors font-medium">
              + Agregar campo
            </button>
          </div>
          {customFields.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">Sin campos variables — el cliente solo ingresa cantidad.</p>
          )}
          <div className="space-y-2">
            {customFields.map((campo, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 bg-muted/40 rounded-lg border border-border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Etiqueta <span className="text-destructive">*</span></label>
                    <input value={campo.label} onChange={(e) => actualizarCampo(idx, { label: e.target.value })}
                      className="w-full px-2 py-1.5 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Ej: Diámetro" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Ejemplo para el cliente</label>
                    <input value={campo.placeholder ?? ''} onChange={(e) => actualizarCampo(idx, { placeholder: e.target.value })}
                      className="w-full px-2 py-1.5 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Ej: 4 mm" />
                  </div>
                </div>
                <button type="button" onClick={() => eliminarCampo(idx)} aria-label={`Quitar campo ${campo.label || idx + 1}`}
                  className="mt-5 text-destructive hover:bg-destructive/10 rounded p-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {imagenesActuales.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Imágenes actuales</label>
            <div className="flex flex-wrap gap-3">
              {imagenesActuales.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Imagen ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => setImagenesActuales(prev => prev.filter(i => i !== url))} aria-label={`Quitar imagen ${idx + 1}`}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Imagen del producto</label>
          <button type="button" aria-label="Seleccionar imagen del producto" className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputFileRef.current?.click()}>
            {previsualizacion ? (
              <div className="flex flex-col items-center gap-2">
                <img src={previsualizacion} alt="Previsualización" className="w-24 h-24 object-cover rounded-lg" />
                <span className="text-xs text-muted-foreground">{archivoImagen?.name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Clic para seleccionar imagen (JPG, PNG, WEBP)</p>
            )}
          </button>
          <input ref={inputFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSeleccionArchivo} className="hidden" />
        </div>
        {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={guardando || taxonomyStatus !== 'ready' || usingFallback}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {guardando ? 'Guardando...' : (producto?.id ? 'Guardar cambios' : 'Crear producto')}
          </button>
          <button type="button" onClick={alCancelar} disabled={guardando}
            className="px-5 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
