import { Link } from 'wouter';
export default function NotFound() {
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
    <div className="max-w-md text-center space-y-5"><p className="font-bold text-primary">404</p><h1 className="text-2xl font-bold">No encontramos esta página</h1>
    <p>Puede que el enlace haya cambiado. Podés volver al inicio o explorar la tienda.</p>
    <div className="flex justify-center gap-5"><Link href="/">Volver al inicio</Link><Link href="/productos" className="text-primary font-semibold">Ir a la tienda</Link></div></div>
  </main>;
}
