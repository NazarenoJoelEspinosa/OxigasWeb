import { supabase } from './supabaseClient';
import { readAllPages } from './pagination';
import { createBackupZip, restoreSql, type BackupTables } from './backup-format';

export async function downloadCatalogBackup(progress: (message: string) => void) {
  progress('Leyendo catálogo completo...');
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user.user) throw new Error('Volvé a iniciar sesión para descargar el respaldo.');
  const { data: admin, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', user.user.id).maybeSingle();
  if (adminError || !admin) throw new Error('Necesitás permisos de administrador.');
  const tables = {} as BackupTables;
  for (const table of ['products', 'offers', 'category_groups', 'product_category_links'] as const) {
    tables[table] = await readAllPages((from, to) => {
      const query = supabase.from(table).select('*');
      return (table === 'product_category_links' ? query.order('product_id').order('category_id') : query.order('id')).range(from, to);
    }) as Record<string, unknown>[];
  }
  const encode = (value: string) => new TextEncoder().encode(value);
  const files: { name: string; data: Uint8Array }[] = [];
  const inventory: { path: string; size: number; sha256: string }[] = [];
  let totalBytes = 0;
  const bucket = supabase.storage.from('product-images');
  const walk = async (prefix = ''): Promise<void> => {
    let offset = 0;
    while (true) {
      const { data: entries, error } = await bucket.list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error('No se pudo listar el almacenamiento: ' + error.message);
      if (!entries.length) break;
      for (const entry of entries) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (!entry.id) { await walk(path); continue; }
        progress(`Descargando imagen ${inventory.length + 1}: ${path}`);
        const { data, error: downloadError } = await bucket.download(path);
        if (downloadError || !data) throw new Error('No se pudo descargar ' + path + '. No se generó una copia incompleta.');
        totalBytes += data.size;
        if (totalBytes > 250 * 1024 * 1024) throw new Error('El respaldo supera 250 MB. Usá una copia mediante las herramientas de Supabase para evitar agotar la memoria del navegador.');
        const bytes = new Uint8Array(await data.arrayBuffer());
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
        files.push({ name: `imagenes/${path}`, data: bytes }); inventory.push({ path, size: data.size, sha256: hash });
      }
      offset += entries.length;
    }
  };
  await walk();
  const source = import.meta.env.VITE_SUPABASE_URL;
  const external = [...new Set([...tables.products.flatMap(row => Array.isArray(row.images) ? row.images.filter((image): image is string => typeof image === 'string') : []), ...tables.offers.flatMap(row => typeof row.image === 'string' && row.image ? [row.image] : [])])].filter(url => !url.startsWith(source + '/storage/v1/object/public/product-images/'));
  const manifest = { version: 1, created_at: new Date().toISOString(), source, bucket: 'product-images', counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])), images: inventory, external_images_not_included: external, scope: 'Catálogo y bucket product-images. No incluye usuarios, claves, políticas RLS ni configuración del proyecto.' };
  files.unshift({ name: 'catalogo.json', data: encode(JSON.stringify(tables, null, 2)) }, { name: 'manifest.json', data: encode(JSON.stringify(manifest, null, 2)) }, { name: 'restaurar.sql', data: encode(restoreSql(tables)) }, { name: 'LEEME.txt', data: encode(`RESPALDO OXI-GAS\n\nGuardalo en un lugar privado.\n\n1. Revisá manifest.json: cantidades, fecha e inventario SHA-256.\n2. La copia contiene productos (incluidos ocultos), categorías, asociaciones, ofertas y todos los archivos listados de product-images. Las imágenes externas solo se registran como enlaces.\n3. Para recuperar en el MISMO proyecto y con el mismo esquema, hacé primero otra copia, revisá restaurar.sql y ejecutalo en el SQL Editor de Supabase. Es una transacción: si falla, no quedan cambios parciales. Actualiza filas del respaldo y no elimina productos nuevos.\n4. Subí los archivos de imagen al bucket product-images conservando las carpetas y nombres indicados en manifest.json. Si seguís en el mismo proyecto las direcciones originales vuelven a funcionar.\n5. Verificá categorías, productos ocultos, ofertas, fotos y acceso de administrador.\n\nNo es un respaldo integral de Supabase. No incluye usuarios, contraseñas, permisos RLS, funciones SQL ni configuración. Para otro proyecto primero se necesitan las migraciones y hay que adaptar las URL de imágenes y las referencias a usuarios.\nLas lecturas se realizan en varias consultas: evitá editar el catálogo desde otro dispositivo durante la descarga.\n`) });
  progress('Preparando archivo ZIP...');
  const blob = createBackupZip(files);
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `oxigas-respaldo-${new Date().toISOString().slice(0, 10)}.zip`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { products: tables.products.length, images: inventory.length, external: external.length };
}
