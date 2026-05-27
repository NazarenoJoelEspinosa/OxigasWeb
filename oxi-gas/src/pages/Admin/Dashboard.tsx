import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';
import AuthGuard from '@/components/Admin/AuthGuard';
import ProductForm, { type Producto } from '@/components/Admin/ProductForm';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarNotificacion = (tipo: 'exito' | 'error', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarProductos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('products').select('*').order('created_at', { ascending: false });
    if (error) mostrarNotificacion('error', 'Error al cargar productos: ' + error.message);
    else setProductos(data as Producto[]);
    setCargando(false);
  };

  useEffect(() => { cargarProductos(); }, []);

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro que querés eliminar "${nombre}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) mostrarNotificacion('error', 'Error al eliminar: ' + error.message);
    else { mostrarNotificacion('exito', `"${nombre}" eliminado correctamente.`); cargarProductos(); }
  };

  const handleEditar = (producto: Producto) => {
    setProductoEditando(producto); setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardado = () => {
    setMostrarFormulario(false); setProductoEditando(null);
    mostrarNotificacion('exito', productoEditando?.id ? 'Producto actualizado.' : 'Producto creado.');
    cargarProductos();
  };

  const productosFiltrados = productos.filter((p) => {
    const t = busqueda.toLowerCase();
    return p.name?.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t) ||
      p.brand?.toLowerCase().includes(t) || p.category?.toLowerCase().includes(t);
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted">
        <header className="bg-background border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div>
              <h1 className="font-bold text-base">Panel de Administración</h1>
              <p className="text-xs text-muted-foreground">OxigasWeb</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">← Ver sitio</a>
              <button onClick={async () => { await supabase.auth.signOut(); setLocation('/admin/login'); }}
                className="text-sm text-destructive hover:underline">Cerrar sesión</button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {notificacion && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${notificacion.tipo === 'exito'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
              {notificacion.mensaje}
            </div>
          )}

          {mostrarFormulario && (
            <ProductForm producto={productoEditando}
              alGuardar={handleGuardado}
              alCancelar={() => { setMostrarFormulario(false); setProductoEditando(null); }} />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold">Productos</h2>
              <p className="text-sm text-muted-foreground">
                {cargando ? 'Cargando...' : `${productosFiltrados.length} de ${productos.length} producto${productos.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-2">
              <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, código, marca..."
                className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64" />
              {!mostrarFormulario && (
                <button onClick={() => { setProductoEditando(null); setMostrarFormulario(true); }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-primary/90 transition-colors">
                  + Nuevo producto
                </button>
              )}
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl overflow-hidden">
            {cargando ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Cargando productos...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground font-medium">
                  {busqueda ? 'No se encontraron productos.' : 'No hay productos cargados aún.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Imagen</th>
