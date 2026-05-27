import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) {
        setLocation('/admin/login');
        return;
      }

      // Check admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Not an admin
        await supabase.auth.signOut();
        setLocation('/admin/login');
        return;
      }

      if (mounted) setLoading(false);
    };

    check();
    return () => { mounted = false; };
  }, [setLocation]);

  if (loading) return <div className="p-6">Verificando sesión...</div>;
  return <>{children}</>;
}
