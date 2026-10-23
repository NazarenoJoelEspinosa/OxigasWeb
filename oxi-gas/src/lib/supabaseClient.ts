import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const supabaseConfigured = Boolean(url && key && /^https?:\/\/[^\s/]+\/?$/.test(url));
// App no monta las páginas sin configuración; no hay consultas al dominio alternativo.
export const supabase = createClient<Database>(
  supabaseConfigured ? url! : 'https://unconfigured.invalid',
  supabaseConfigured ? key! : 'unconfigured',
  {
    auth: { persistSession: supabaseConfigured, detectSessionInUrl: supabaseConfigured, autoRefreshToken: supabaseConfigured },
    global: { fetch: (input, init) => {
      const timeout = AbortSignal.timeout(15000);
      return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
    } },
  },
);
