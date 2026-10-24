import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link, useLocation } from 'wouter';
import { loadProducts } from '@/lib/catalog';
import AuthGuard from '@/components/Admin/AuthGuard';
import ProductForm, { type Producto } from '@/components/Admin/ProductForm';
import CategoryGroupsAdmin from '@/components/Admin/CategoryGroupsAdmin';
import OffersAdmin from '@/components/Admin/OffersAdmin';

type Tab = 'productos' | 'categorias' | 'ofertas';

function DashboardContent() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('productos');

  // ── Productos ──────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [order, setOrder] = useState('name');
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => setPage(1), [busqueda, visibility, categoryFilter, order]);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const toggleVisible = async (product: Producto) => {
    if (busyId || !product.id) return;
    setBusyId(product.id);
    try {
      const visible = product.visible !== true;
      const { error } = await supabase.from('products').update({ visible }).eq('id', product.id).select('id').single();
      if (error) throw error;
      setProductos(current => current.map(item => item.id === product.id ? { ...item, visible } : item));
      mostrarNotificacion('exito', visible ? 'Producto visible en la tienda.' : 'Producto oculto de la tienda.');
    } catch { mostrarNotificacion('error', 'No se pudo cambiar la visibilidad. Intentá nuevamente.'); }
    finally { setBusyId(null); }
  };
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarNotificacion = (tipo: 'exito' | 'error', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarProductos = async () => {
    setCargando(true); setLoadError(false);
    try { setProductos(await loadProducts(undefined, false)); }
    catch { setLoadError(true); mostrarNotificacion('error', 'No pudimos cargar los productos. Intentá de nuevo.'); }
    setCargando(false);
  };

  useEffect(() => { cargarProductos(); }, []);

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro que querés eliminar "${nombre}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id).select('id').single();
    if (error) mostrarNotificacion('error', 'Error al eliminar: ' + error.message);
    else { mostrarNotificacion('exito', `"${nombre}" eliminado correctamente.`); cargarProductos(); }
  };

  const handleEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardado = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
    mostrarNotificacion('exito', productoEditando?.id ? 'Producto actualizado.' : 'Producto creado.');
    cargarProductos();
  };

  const productosFiltrados = productos.filter((p) => {
    const terms = normalize(busqueda).trim().split(/\s+/).filter(Boolean);
    const haystack = normalize([p.name, p.code, p.brand, p.category].join(' '));
    return terms.every(term => haystack.includes(term)) &&
      (!categoryFilter || p.category === categoryFilter) &&
      (visibility === 'all' || (visibility === 'visible' ? p.visible === true : p.visible !== true));
  }).sort((a, b) => (order === 'code' ? a.code : a.name).localeCompare(order === 'code' ? b.code : b.name, 'es', { numeric: true }));
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / 12));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = productosFiltrados.slice((currentPage - 1) * 12, currentPage * 12);
  const categories = [...new Set(productos.map(p => p.category).filter((v): v is string => Boolean(v)))].sort((a,b) => a.localeCompare(b, 'es'));
  const clearFilters = () => { setBusqueda(''); setVisibility('all'); setCategoryFilter(''); setPage(1); };

  // ── Tabs UI ────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'productos',  label: 'Productos',   badge: productos.length },
    { id: 'categorias', label: 'Categorías' },
    { id: 'ofertas',    label: 'Ofertas' },
  ];

  return (
    <>
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <header className="bg-background border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div>
              <h1 className="font-bold text-base">Panel de Administración</h1>
              <p className="text-xs text-muted-foreground">OxigasWeb</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
                ← Ver sitio
              </Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); setLocation('/admin/login'); }}
                className="text-sm text-destructive hover:underline"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Pestañas */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Notificación global */}
          {notificacion && (
            <div role="status" className={`mb-4 p-3 rounded-lg text-sm border ${
              notificacion.tipo === 'exito'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              {notificacion.mensaje}
            </div>
          )}

          {/* ── TAB: Productos ── */}
          {tab === 'productos' && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-5" aria-label="Resumen del catálogo">
                {[['Total', productos.length], ['Visibles', productos.filter(p => p.visible === true).length], ['Ocultos', productos.filter(p => p.visible !== true).length]].map(([label, count]) => <div key={label} className="rounded-xl bg-background border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{cargando || loadError ? '—' : count}</p></div>)}
              </div>
              {mostrarFormulario && (
                <ProductForm
                  key={productoEditando?.id ?? 'new'}
                  producto={productoEditando}
                  alGuardar={handleGuardado}
                  alCancelar={() => { setMostrarFormulario(false); setProductoEditando(null); }}
                />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Productos</h2>
                  <p className="text-sm text-muted-foreground">
                    {cargando ? 'Cargando...' : `${productosFiltrados.length} de ${productos.length} producto${productos.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="search"
                    aria-label="Buscar productos en administración"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, código, marca..."
                    className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64 bg-background"
                  />
                  {!mostrarFormulario && (
                    <button
                      onClick={() => { setProductoEditando(null); setMostrarFormulario(true); }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-primary/90 transition-colors"
                    >
                      + Nuevo producto
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <label className="text-sm">Estado<select aria-label="Filtrar por estado" value={visibility} onChange={e => setVisibility(e.target.value)} className="block border rounded-lg p-2 bg-background"><option value="all">Todos</option><option value="visible">Visibles</option><option value="hidden">Ocultos</option></select></label>
                <label className="text-sm">Categoría<select aria-label="Filtrar por categoría" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="block border rounded-lg p-2 bg-background max-w-full"><option value="">Todas</option>{categories.map(cat => <option key={cat}>{cat}</option>)}</select></label>
                <label className="text-sm">Ordenar<select aria-label="Ordenar productos" value={order} onChange={e => setOrder(e.target.value)} className="block border rounded-lg p-2 bg-background"><option value="name">Nombre</option><option value="code">Código</option></select></label>
                <button type="button" onClick={clearFilters} className="text-primary text-sm underline self-end py-2">Limpiar filtros</button>
              </div>
              {loadError && <div role="alert" className="rounded-xl border p-5 mb-4 bg-background">No pudimos actualizar el catálogo. <button onClick={() => void cargarProductos()} className="text-primary underline">Reintentar</button></div>}
              <div className="bg-background border border-border rounded-xl overflow-hidden">
                {cargando ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground font-medium">
                      {busqueda || visibility !== 'all' || categoryFilter ? 'No se encontraron productos.' : 'No hay productos cargados aún.'}
                    </p>
                  </div>
                ) : (
                  <><div className="md:hidden divide-y">
                    {pageProducts.map(product => <article key={product.id} className="p-4 space-y-2">
                      <div className="flex gap-3">{product.images?.[0] && <img src={product.images[0]} alt="" className="w-14 h-14 object-contain rounded border" />}<div className="min-w-0"><h3 className="font-semibold break-words">{product.name}</h3><p className="text-xs text-muted-foreground break-all">{product.code} · {product.brand || 'Sin marca'}</p></div></div>
                      <p className="text-xs text-muted-foreground">{product.category || 'Sin categoría'} · {product.visible === true ? 'Visible' : 'Oculto'}</p>
                      <div className="flex flex-wrap gap-4"><button onClick={() => handleEditar(product)} className="text-primary text-sm py-2">Editar</button><button disabled={busyId !== null} onClick={() => void toggleVisible(product)} className="text-primary text-sm py-2 disabled:opacity-50">{product.visible === true ? 'Ocultar' : 'Mostrar'}</button><button onClick={() => void handleEliminar(product.id!, product.name)} className="text-destructive text-sm py-2">Eliminar</button></div>
                    </article>)}
                  </div><div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border text-left">
                          <th className="px-4 py-3 font-medium text-muted-foreground">Imagen</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Marca</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Categoría</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pageProducts.map((producto) => (
                          <tr key={producto.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              {producto.images?.[0] ? (
                                <img src={producto.images[0]} alt={producto.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{producto.code}</td>
                            <td className="px-4 py-3 font-medium">{producto.name}<span className={`block text-xs mt-1 ${producto.visible === true ? 'text-green-700' : 'text-muted-foreground'}`}>{producto.visible === true ? 'Visible' : 'Oculto'}</span></td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{producto.brand || '—'}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {producto.category
                                ? <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{producto.category}</span>
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleEditar(producto)}
                                className="text-primary hover:underline text-xs font-medium mr-2">Editar</button>
                              <button disabled={busyId !== null} onClick={() => void toggleVisible(producto)} className="text-primary text-xs mr-2 disabled:opacity-50">{producto.visible === true ? 'Ocultar' : 'Mostrar'}</button>
                              <button onClick={() => handleEliminar(producto.id!, producto.name)}
                                className="text-destructive hover:underline text-xs font-medium">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div></>
                )}
              </div>
              {!cargando && productosFiltrados.length > 0 && <nav aria-label="Páginas de administración" className="flex items-center justify-between gap-3 mt-4"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="border rounded-lg px-3 py-2 disabled:opacity-40">Anterior</button><span className="text-sm">Página {currentPage} de {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="border rounded-lg px-3 py-2 disabled:opacity-40">Siguiente</button></nav>}
            </>
          )}

          {/* ── TAB: Categorías ── */}
          {tab === 'categorias' && <CategoryGroupsAdmin />}

          {/* ── TAB: Ofertas ── */}
          {tab === 'ofertas' && <OffersAdmin />}
        </main>
      </div>
    </>
  );
}
export default function AdminDashboard() { return <AuthGuard><DashboardContent /></AuthGuard>; }
