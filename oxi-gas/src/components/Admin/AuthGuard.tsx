import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'error'>('checking');
  const [request, setRequest] = useState(0);
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
        if (!user) { setLocation('/admin/login'); return; }
        const { data, error } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
        if (!active || run !== generation) return;
        if (error) throw error;
        if (!data) { setLocation('/admin/login'); return; }
        setStatus('allowed');
      } catch { if (active && run === generation) setStatus('error'); }
    };
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      generation++; clearTimeout(timer); setStatus('checking');
      if (!session) { setLocation('/admin/login'); return; }
      // Ejecutar fuera del callback de auth para no bloquear su procesamiento interno.
      timer = setTimeout(() => { void verify(); }, 0);
    });
    return () => { active = false; generation++; clearTimeout(timer); data.subscription.unsubscribe(); };
  }, [setLocation, request]);
  if (status === 'error') return <main className="min-h-screen flex items-center justify-center text-center"><div role="alert" className="space-y-4"><p>No pudimos verificar tus permisos.</p><button className="text-primary underline" onClick={() => setRequest(n => n + 1)}>Reintentar</button></div></main>;
  if (status === 'checking') return <main className="min-h-screen flex items-center justify-center"><p role="status">Verificando sesión...</p></main>;
  return <>{children}</>;
}
