import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('Error al iniciar sesión: ' + error.message);
      } else {
        // Redirect to dashboard
        setLocation('/admin/dashboard');
      }
    } catch (err) {
      setMessage('Error inesperado. Revisá la consola.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setMessage('Error enviando link: ' + error.message);
      else setMessage('Se ha enviado un enlace mágico a tu correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[hsl(var(--surface-2))] p-4">
      <div className="w-full max-w-md bg-[hsl(var(--surface-1))] rounded-2xl p-6 border border-[hsl(var(--surface-3))]">
        <h1 className="text-2xl font-bold mb-4">Acceso de administrador</h1>
        <p className="text-sm text-[hsl(var(--text-soft))] mb-4">Ingresá con tu cuenta de administrador.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              placeholder="admin@ejemplo.com"
              aria-label="Correo electrónico"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              placeholder="Tu contraseña"
              aria-label="Contraseña"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded">
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>

            <button type="button" onClick={handleMagicLink} disabled={loading} className="text-sm text-primary underline">
              Enviar enlace mágico
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm text-[hsl(var(--text-soft))]">{message}</p>}
      </div>
    </main>
  );
}
