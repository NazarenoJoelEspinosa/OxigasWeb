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
    setProductoEditando(producto);
    setMostrarForm
