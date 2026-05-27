import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGuard from '@/components/Admin/AuthGuard';
import ProductForm from '@/components/Admin/ProductForm';

type Product = {
  id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  images?: string[];
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      setMessage('Error al cargar productos: ' + error.message);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que querés eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) setMessage('Error al eliminar: ' + error.message);
    else fetchProducts();
  };

  const handleEdit = (p: Product) => { setEditing(p); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setShowForm(true); };

  return (
    <AuthGuard>
      <main className="p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <div>
            <button onClick={handleCreate} className="bg-primary text-white px-3 py-2 rounded">Nuevo producto</button>
          </div>
        </header>

        {message && <div className="mb-4 text-red-600">{message}</div>}

        {showForm && (
          <ProductForm
            product={editing}
            onSaved={() => { setShowForm(false); fetchProducts(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Código</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 align-top">{p.code}</td>
                  <td className="align-top">{p.name}</td>
                  <td className="align-top">{p.brand}</td>
                  <td className="align-top">{p.category}</td>
                  <td className="align-top">
                    <button onClick={() => handleEdit(p)} className="mr-2 text-primary underline">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </AuthGuard>
  );
}
