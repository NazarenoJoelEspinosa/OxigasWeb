import { useState } from 'react';
export function CatalogBackup() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  return <div className="mb-6 border border-border rounded-xl p-4 space-y-2">
    <h2 className="font-semibold">Copia de seguridad del catálogo</h2>
    <p className="text-sm text-muted-foreground">Descargá datos, imágenes y guía de restauración. Evitá editar el catálogo durante la descarga. No incluye usuarios ni configuración de Supabase.</p>
    <button disabled={busy} className="rounded-lg border border-primary text-primary px-3 py-2 text-sm disabled:opacity-50" onClick={async () => {
      setBusy(true); setMessage('Preparando respaldo...');
      try { const { downloadCatalogBackup } = await import('@/lib/catalog-backup'); const result = await downloadCatalogBackup(setMessage); setMessage(`Descarga preparada: ${result.products} productos y ${result.images} imágenes.${result.external ? ` ${result.external} imágenes externas conservadas como enlaces.` : ''}`); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo descargar el respaldo.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Descargando...' : 'Descargar respaldo ZIP'}</button>
    {message && <p role="status" className="text-sm break-words">{message}</p>}
  </div>;
}
