import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Producto = {
  id?: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  images?: string[];
};

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
  const [categoria, setCategoria] = useState(producto?.category ?? '');
  const [imagenesActuales, setImagenesActuales] = useState<string[]>(producto?.images ?? []);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0] ?? null;
    setArchivoImagen(archivo);
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => setPrevisualizacion(lector.result as string);
      lector.readAsDataURL(archivo);
    } else setPrevisualizacion(null);
  };

  const subirImagen = async (): Promise<string | null> => {
    if (!archivoImagen) return null;
    const ext = archivoImagen.name.split('.').pop();
    const ruta = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images').upload(ruta, archivoImagen, { upsert: false });
    if (uploadError) { setError('Error al subir la imagen: ' + uploadError.message); return null; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(ruta);
    return data.publicUrl;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      let urlNueva: string | null = null;
      if (archivoImagen) { urlNueva = await subirImagen(); if (!urlNueva) { setGuardando(false); return; } }
      const imagenesFinal = urlNueva ? [...imagenesActuales, urlNueva] : imagenesActuales;
      const datos = { code: codigo.trim(), name: nombre.trim(), description: descripcion.trim(),
        brand: marca.trim(), category: categoria.trim(), images: imagenesFinal };
      if (producto?.id) {
        const { error: e } = await supabase.from('products').update(datos).eq('id', producto.id);
        if (e) { setError('Error al actualizar: ' + e.message); return; }
      } else {
        const { error: e } = await supabase.from('products').insert(datos);
        if (e) { setError('Error al crear: ' + e.message); return; }
      }
      alGuardar();
    } catch (err) {
      setError('Error inesperado al guardar.');
    } finally { setGuardando(false); }
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
              placeholder="Ej: Soldadora 200A" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Descripción del producto..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <input value={marca} onChange={(e) => setMarca(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Bosch, DeWalt..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Soldadura, Gases..." />
          </div>
        </div>
        {imagenesActuales.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Imágenes actuales</label>
            <div className="flex flex-wrap gap-3">
              {imagenesActuales.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Imagen ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => setImagenesActuales(prev => prev.filter(i => i !== url))}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Imagen del producto</label>
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputFileRef.current?.click()}>
            {previsualizacion ? (
              <div className="flex flex-col items-center gap-2">
                <img src={previsualizacion} alt="Previsualización" className="w-24 h-24 object-cover rounded-lg" />
                <span className="text-xs text-muted-foreground">{archivoImagen?.name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Clic para seleccionar imagen (JPG, PNG, WEBP)</p>
            )}
          </div>
          <input ref={inputFileRef} type="file" accept="image/*" onChange={handleSeleccionArchivo} className="hidden" />
        </div>
        {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={guardando}
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
