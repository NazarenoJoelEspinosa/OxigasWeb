import { Switch, Route, Router as WouterRouter } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Productos from "@/pages/Productos";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/productos" component={Productos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Limpia la barra final del BASE_URL para que wouter funcione correctamente
  // en GitHub Pages (ej: "/oxi-gas" en vez de "/oxi-gas/")
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "";

  return (
    <TooltipProvider>
      <WouterRouter base={base}>
        <Router />
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
