import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMensaje, setInfoMensaje] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError('Credenciales incorrectas. Verificá tu correo y contraseña.'); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const usuario = sessionData?.session?.user;
      if (usuario) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users').select('role').eq('user_id', usuario.id).single();
        if (adminError || !adminData) {
          await supabase.auth.signOut();
          setError('Tu cuenta no tiene permisos de administrador.');
          return;
        }
      }
      setLocation('/admin/dashboard');
    } catch (err) {
      setError('Ocurrió un error inesperado. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const handleEnlaceMagico = async () => {
    if (!email) { setError('Ingresá tu correo electrónico primero.'); return; }
    setCargando(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) setError('Error al enviar el enlace: ' + otpError.message);
      else setInfoMensaje('Se envió un enlace mágico a tu correo. Revisá tu bandeja de entrada.');
    } finally { setCargando(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-8 border border-border">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresá con tu cuenta de administrador</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="admin@ejemplo.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tu contraseña" required />
          </div>
          {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
          {infoMensaje && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{infoMensaje}</div>}
          <button type="submit" disabled={cargando}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">¿Olvidaste tu contraseña?</p>
          <button type="button" onClick={handleEnlaceMagico} disabled={cargando}
            className="text-sm text-primary hover:underline disabled:opacity-50">
            Enviar enlace mágico al correo
          </button>
        </div>
      </div>
    </main>
  );
}
