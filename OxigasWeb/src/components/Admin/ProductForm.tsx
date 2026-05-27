import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  product?: any;
  onSaved: () => void;
  onCancel: () => void;
};

export default function ProductForm({ product, onSaved, onCancel }: Props) {
  const [code, setCode] = useState(product?.code ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadImage = async (): Promise<string | null> => {
    if (!file) return null;
    const filePath = `product-images/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(filePath, file);
    if (error) {
      setMessage('Error al subir imagen: ' + error.message);
      return null;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let uploadedUrl: string | null = null;
      if (file) uploadedUrl = await uploadImage();
      const imagesToSave = uploadedUrl ? [...images, uploadedUrl] : images;

      if (product) {
        const { error } = await supabase.from('products').update({ code, name, description, brand, category, images: imagesToSave }).eq('id', product.id);
        if (error) setMessage('Error al actualizar: ' + error.message);
        else onSaved();
      } else {
        const { error } = await supabase.from('products').insert({ code, name, description, brand, category, images: imagesToSave });
        if (error) setMessage('Error al crear: ' + error.message);
        else onSaved();
      }
    } catch (err) {
      setMessage('Error inesperado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded">
      <h2 className="font-semibold mb-2">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs">Código</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-xs">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-xs">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs">Marca</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs">Categoría</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div>
          <label className="block text-xs">Imagen</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        {message && <div className="text-red-600">{message}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-primary text-white px-3 py-2 rounded">{loading ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onCancel} className="px-3 py-2 border rounded">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
