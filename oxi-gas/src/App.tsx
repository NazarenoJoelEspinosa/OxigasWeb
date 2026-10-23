import { lazy, Suspense } from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { supabaseConfigured } from '@/lib/supabaseClient';
import { WHATSAPP_URL } from '@/config/constants';
import Home from "@/pages/Home";
const Productos = lazy(() => import("@/pages/Productos"));
const Ofertas = lazy(() => import("@/pages/Ofertas"));
import NotFound from "@/pages/NotFound";
const AdminLogin = lazy(() => import("@/pages/Admin/Login"));
const AdminDashboard = lazy(() => import("@/pages/Admin/Dashboard"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/productos" component={Productos} />
      <Route path="/ofertas" component={Ofertas} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { CartProvider } from '@/context/CartContext';

function App() {
  if (!supabaseConfigured) return <main className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
    <div className="max-w-lg text-center space-y-4"><h1 className="text-2xl font-bold">Estamos preparando la tienda</h1>
    <p>El catálogo no está disponible en este momento. Podés consultarnos por WhatsApp.</p>
    <a className="inline-block rounded-lg bg-primary text-white px-5 py-3" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
    {import.meta.env.DEV && <p role="alert">Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.</p>}</div></main>;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '';
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={base}>
              <Suspense fallback={<p role="status" className="p-12 text-center">Cargando...</p>}><Router /></Suspense>
            </WouterRouter>
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;