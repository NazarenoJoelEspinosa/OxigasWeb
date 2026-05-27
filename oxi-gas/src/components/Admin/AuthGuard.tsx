import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let activo = true;
    const verificarSesion = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const usuario = sessionData?.session?.user;
        if (!usuario) {
          if (activo) setLocation('/admin/login');
          return;
        }
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', usuario.id)
          .single();
        if (error || !data) {
          await supabase.auth.signOut();
          if (activo) setLocation('/admin/login');
          return;
        }
        if (activo) { setAutorizado(true); setVerificando(false); }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        if (activo) setLocation('/admin/login');
      }
    };
    verificarSesion();
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (!sesion) setLocation('/admin/login');
    });
    return () => { activo = false; subscription.subscription.unsubscribe(); };
  }, [setLocation]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }
  if (!autorizado) return null;
  return <>{children}</>;
}
