import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'error'>('checking');
  const [request, setRequest] = useState(0);
  const verifiedUser = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout>;
    const verify = async () => {
      const run = ++generation;
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!active || run !== generation) return;
        if (authError) throw authError;
        if (!user) { verifiedUser.current = null; setStatus('checking'); setLocation('/admin/login'); return; }
        if (verifiedUser.current && verifiedUser.current !== user.id) { verifiedUser.current = null; setStatus('checking'); }
        const { data, error } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
        if (!active || run !== generation) return;
        if (error) throw error;
        if (!data) { verifiedUser.current = null; setStatus('checking'); setLocation('/admin/login'); return; }
        verifiedUser.current = user.id;
        setStatus('allowed');
      } catch { if (active && run === generation) setStatus('error'); }
    };
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      generation++; clearTimeout(timer);
      if (!session) { verifiedUser.current = null; setStatus('checking'); setLocation('/admin/login'); return; }
      // Supabase puede emitir SIGNED_IN al volver a la pestaña o renovar el token.
      // Revalidar al mismo administrador no debe desmontar sus formularios.
      if (verifiedUser.current !== session.user.id) { verifiedUser.current = null; setStatus('checking'); }
      else setStatus(current => current === 'allowed' ? current : 'checking');
      // Ejecutar fuera del callback de auth para no bloquear su procesamiento interno.
      timer = setTimeout(() => { void verify(); }, 0);
    });
    return () => { active = false; generation++; clearTimeout(timer); data.subscription.unsubscribe(); };
  }, [setLocation, request]);
  if (status === 'error') return <main className="min-h-screen flex items-center justify-center text-center"><div role="alert" className="space-y-4"><p>No pudimos verificar tus permisos.</p><button className="text-primary underline" onClick={() => setRequest(n => n + 1)}>Reintentar</button></div></main>;
  if (status === 'checking') return <main className="min-h-screen flex items-center justify-center"><p role="status">Verificando sesión...</p></main>;
  return <>{children}</>;
}
